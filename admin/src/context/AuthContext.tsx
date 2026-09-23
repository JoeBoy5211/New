import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface AdminProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: AdminProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateSession = async (currentSession: Session | null) => {
    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    if (currentSession?.user) {
      try {
        // Confirm the signed-in user actually has the admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentSession.user.id);

        const hasAdminRole = roles?.some((r) => r.role === 'admin') ?? false;
        setIsAdmin(hasAdminRole);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();

        if (profileData) setProfile(profileData as AdminProfile);
        else setProfile(null);
      } catch {
        setIsAdmin(false);
        setProfile(null);
      }
    } else {
      setIsAdmin(false);
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        await hydrateSession(currentSession);
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      hydrateSession(existing).finally(() => setIsLoading(false));
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      if (!data.user) return { success: false, message: 'Login failed. Please try again.' };

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      const hasAdminRole = roles?.some((r) => r.role === 'admin') ?? false;
      if (!hasAdminRole) {
        await supabase.auth.signOut();
        return { success: false, message: 'This account does not have admin access.' };
      }

      return { success: true, message: 'Login successful!' };
    } catch {
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}