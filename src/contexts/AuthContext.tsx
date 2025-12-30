import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const adminEmailForUsername = (username: string) => `${username.trim().toLowerCase()}@aust-mecha.admin`;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = async (currentUser: User) => {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: currentUser.id,
        _role: "admin",
      });

      if (error) throw error;
      setIsAdmin(Boolean(data));
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // IMPORTANT: keep this callback synchronous (avoid deadlocks)
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => {
          checkAdminRole(nextSession.user);
          setIsLoading(false);
        }, 0);
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        if (existingSession?.user) {
          setTimeout(() => {
            checkAdminRole(existingSession.user);
            setIsLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
        setIsLoading(false);
      });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const adminLogin: AuthContextType["adminLogin"] = async (username, password) => {
    try {
      setIsLoading(true);

      // 1) Verify credentials against the database (no hardcoded secrets)
      const { data: valid, error: verifyError } = await supabase.rpc("verify_admin_login", {
        p_username: username,
        p_password: password,
      });

      if (verifyError) throw verifyError;
      if (!valid) return { success: false, error: "Invalid username or password" };

      const email = adminEmailForUsername(username);
      const redirectUrl = `${window.location.origin}/#/admin/dashboard`;

      // 2) Ensure the admin has an authenticated session (sign-in or sign-up)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      let nextUser: User | null = signInData.session?.user ?? null;

      if (!nextUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { username },
          },
        });

        if (signUpError) {
          // If already registered, try sign-in once more (common case)
          if (signUpError.message?.toLowerCase().includes("already")) {
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (retryError) return { success: false, error: retryError.message };
            nextUser = retryData.session?.user ?? null;
          } else {
            return { success: false, error: signUpError.message };
          }
        } else {
          nextUser = signUpData.session?.user ?? null;
        }
      }

      if (!nextUser) return { success: false, error: "Could not start admin session" };

      // 3) Assign admin role in the database so RLS allows reading registrations
      const { error: assignError } = await supabase.rpc("assign_admin_role", {
        p_user_id: nextUser.id,
        p_username: username,
      });
      if (assignError) throw assignError;

      // 4) Refresh role in client state
      await checkAdminRole(nextUser);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const value = useMemo(
    () => ({ user, session, isAdmin, isLoading, adminLogin, logout }),
    [user, session, isAdmin, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
