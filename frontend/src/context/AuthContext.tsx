import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'guest' | 'customer' | 'vendor' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
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

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'vendor';
  businessName?: string;
  cuisineType?: string;
  location?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (data) setProfile(data as UserProfile);
  };

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (data && data.length > 0) {
      const roles = data.map((r) => r.role);
      if (roles.includes('admin')) setUserRole('admin');
      else if (roles.includes('vendor')) setUserRole('vendor');
      else if (roles.includes('customer')) setUserRole('customer');
      else setUserRole('guest');
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setTimeout(async () => {
          await fetchProfile(currentSession.user.id);
          await fetchUserRole(currentSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setUserRole('guest');
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchProfile(existing.user.id);
        fetchUserRole(existing.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
        await fetchUserRole(data.user.id);
      }
      return { success: true, message: 'Login successful!' };
    } catch {
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: data.name,
            phone: data.phone,
            business_name: data.businessName,
            cuisine_type: data.cuisineType,
            location: data.location,
          },
        },
      });
      if (error) return { success: false, message: error.message };
      if (!authData.user) return { success: false, message: 'Registration failed. Please try again.' };

      // Email confirmation required -> defer DB writes to first login (ensureVendorSetup)
      if (!authData.session) {
        return {
          success: true,
          message: 'Registration successful! Please check your email to verify, then sign in.',
        };
      }

      if (data.role === 'vendor') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'vendor' });
        if (roleError) console.error('Error adding vendor role:', roleError);
      }

      if (data.phone || data.name) {
        await supabase.from('profiles').update({ phone: data.phone, name: data.name }).eq('user_id', authData.user.id);
      }

      if (data.role === 'vendor') {
        const { data: existing } = await supabase
          .from('caterers')
          .select('id')
          .eq('vendor_id', authData.user.id)
          .maybeSingle();
        if (!existing) {
          const { error: catererError } = await supabase.from('caterers').insert({
            vendor_id: authData.user.id,
            name: data.businessName?.trim() || data.name,
            location: data.location?.trim() || null,
            cuisines: data.cuisineType?.trim() ? [data.cuisineType.trim()] : [],
            contact_phone: data.phone || null,
            contact_email: data.email,
            is_approved: false,
            is_pending: true,
          });
          if (catererError) console.error('Error creating caterer row:', catererError);
        }
      }

      return { success: true, message: 'Registration successful! Your application is now pending approval.' };
    } catch {
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

  return (
    <AuthContext.Provider
      value={{ user, profile, session, isLoading, login, register, logout, isAuthenticated: !!user, userRole, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
