import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'guest' | 'customer' | 'vendor' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  userRole: UserRole;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'vendor';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileData) {
      setProfile(profileData as UserProfile);
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (roleData && roleData.length > 0) {
      // Priority: admin > vendor > customer
      const roles = roleData.map(r => r.role);
      if (roles.includes('admin')) {
        setUserRole('admin');
      } else if (roles.includes('vendor')) {
        setUserRole('vendor');
      } else if (roles.includes('customer')) {
        setUserRole('customer');
      } else {
        setUserRole('guest');
      }
    } else {
      setUserRole('guest');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchUserRole(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(async () => {
            await fetchProfile(currentSession.user.id);
            await fetchUserRole(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole('guest');
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id);
        fetchUserRole(existingSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id);
        await fetchUserRole(data.user.id);
      }

      return { success: true, message: 'Login successful!' };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: data.name,
            phone: data.phone,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Registration failed. Please try again.' };
      }

      // If the user wants to be a vendor, add the vendor role
      if (data.role === 'vendor') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'vendor' });
        
        if (roleError) {
          console.error('Error adding vendor role:', roleError);
        }
      }

      // Update profile with phone if provided
      if (data.phone) {
        await supabase
          .from('profiles')
          .update({ phone: data.phone, name: data.name })
          .eq('user_id', authData.user.id);
      }

      return { 
        success: true, 
        message: 'Registration successful! Please check your email to verify your account.' 
      };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setUserRole('guest');
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userRole,
    refreshProfile,
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
