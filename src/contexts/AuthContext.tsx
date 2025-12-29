import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    try {
      // 1. Verify admin credentials against custom table (Case Insensitive via SQL)
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_admin_login', { p_username: username, p_password: password });

      if (verifyError) {
        console.error("RPC Error:", verifyError);
        return { success: false, error: 'Database verification failed. Please check connection.' };
      }

      if (!isValid) {
        return { success: false, error: 'Invalid username or password' };
      }

      // 2. Sync with Supabase Auth to get a valid session for RLS
      const email = `${username.toLowerCase()}@aust-mecha.admin`;
      
      // Attempt Sign In
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInData.session) {
        // Ensure role exists
        await supabase.rpc('assign_admin_role', { 
          p_user_id: signInData.user.id, 
          p_username: username 
        });
        setIsAdmin(true);
        return { success: true };
      }

      // If Sign In failed, check why
      if (signInError) {
        // If "Invalid login credentials", it usually means:
        // A) User doesn't exist yet (so we need to SignUp)
        // B) User exists but Email is not confirmed (Supabase setting)
        // C) Password mismatch (unlikely if RPC passed, unless they are out of sync)

        // Attempt Sign Up if user likely doesn't exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });

        if (signUpData.session) {
          await supabase.rpc('assign_admin_role', { 
            p_user_id: signUpData.user.id, 
            p_username: username 
          });
          setIsAdmin(true);
          return { success: true };
        }

        if (signUpError) {
          // If SignUp failed because "User already registered", but SignIn failed earlier,
          // it strongly suggests an "Email Not Confirmed" issue or password desync.
          if (signUpError.message.includes("already registered")) {
             return { 
               success: false, 
               error: 'Admin account exists but login failed. If using default Supabase settings, ensure "Confirm Email" is disabled or the user is verified.' 
             };
          }
          return { success: false, error: signUpError.message };
        }
        
        // If we signed up but got no session (waiting for email confirmation)
        if (signUpData.user && !signUpData.session) {
             return { success: false, error: 'Account created. Please verify your email if required by your Supabase project settings.' };
        }
      }

      return { success: false, error: signInError?.message || 'Authentication failed' };

    } catch (error: any) {
      console.error("Login Exception:", error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

