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

  // 1. Hardcoded Admin Credentials (Bypassing database check)
  const ADMIN_USERNAME = 'Roman860';
  const ADMIN_PASSWORD = 'roman207';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user);
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (currentUser: User) => {
    try {
      // 2. Client-side role check based on email pattern
      if (currentUser.email?.includes('aust-mecha.admin')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    try {
      // 3. Direct credentials check (No RPC call)
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
         return { success: false, error: 'Invalid username or password' };
      }

      // 4. Create a specific email for the admin session
      const email = `${username.toLowerCase()}@aust-mecha.admin`;
      
      // Attempt to Sign In
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInData.session) {
        setIsAdmin(true);
        return { success: true };
      }

      // If Sign In fails (first time), attempt to Sign Up
      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });

        if (signUpData.session) {
          setIsAdmin(true);
          return { success: true };
        }
        
        // Handle "User already registered" edge case
        if (signUpError?.message.includes("already registered")) {
           // This means the user exists but login failed (possibly due to network or sync issues).
           // Since we already verified the hardcoded credentials above, we return an error 
           // instructing the user to try again.
           return { success: false, error: "Account exists but login failed. Please refresh and try again." };
        }

        return { success: false, error: signUpError?.message || signInError.message };
      }

      return { success: false, error: 'Authentication failed' };

    } catch (error: any) {
      console.error("Login Error:", error);
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
