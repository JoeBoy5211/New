import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { performGoogleOAuth } from '@/lib/googleAuth';
import { NEW_USER_WINDOW_MS } from '@/constants/app';
import {
  ensureProfileForUser,
  avatarUrlFromAuthUser,
  fetchProfileByUserId,
  updateProfileName as updateProfileNameInDb,
} from '@/services/profiles';
import type { ClientProfile } from '@/types/domain';

export type { ClientProfile } from '@/types/domain';

interface AuthContextValue {
  user: User | null;
  profile: ClientProfile | null;
  session: Session | null;
  isLoading: boolean;
  isNewUser: boolean;
  needsOnboarding: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message: string }>;
  updateName: (name: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isPlaceholderName(profile: ClientProfile | null): boolean {
  if (!profile) return false;
  return !!profile.phone && profile.name === profile.phone;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchProfile = async (userId: string, authUser?: User | null) => {
    const existing = await fetchProfileByUserId(userId);
    // OAuth users may lack a row — create from auth metadata.
    let p = existing ?? (await ensureProfileForUser(userId));

    // Backfill: rows created before the Google avatar was synced (or by a
    // DB trigger with no avatar) stay null forever unless we copy the live
    // Google photo from the auth metadata into `profiles.avatar_url`.
    if (p && !p.avatar_url) {
      const userForAvatar =
        authUser ??
        (await supabase.auth.getUser()).data.user ??
        null;
      const googleAvatar = avatarUrlFromAuthUser(userForAvatar);
      if (googleAvatar) {
        try {
          await supabase
            .from('profiles')
            .update({ avatar_url: googleAvatar })
            .eq('user_id', userId);
          p = { ...p, avatar_url: googleAvatar };
        } catch {
          // Best-effort: the live metadata fallback in screens still shows
          // the Google photo even if this update fails (e.g. offline).
        }
      }
    }

    setProfile(p);
    // Brand-new phone signups have name = phone (set by the handle_new_user trigger)
    if (p && isPlaceholderName(p)) {
      setIsNewUser(true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id, currentSession.user);
        } else {
          setProfile(null);
          setIsNewUser(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) void fetchProfile(existing.user.id, existing.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOtp = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: 'sms', shouldCreateUser: true },
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Verification code sent to your phone.' };
    } catch {
      return { success: false, message: 'Could not send the code. Please try again.' };
    }
  };

  const markNewIfRecent = (createdAt: string | undefined) => {
    if (!createdAt) return;
    const createdAgo = Date.now() - new Date(createdAt).getTime();
    if (createdAgo < NEW_USER_WINDOW_MS) setIsNewUser(true);
  };

  const verifyOtp = async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) return { success: false, message: error.message };
      if (data.user) {
        markNewIfRecent(data.user.created_at);
        await fetchProfile(data.user.id, data.user);
      }
      return { success: true, message: 'You are signed in.' };
    } catch {
      return { success: false, message: 'Invalid or expired code. Please try again.' };
    }
  };

  const signInWithGoogle = async () => {
    const result = await performGoogleOAuth();
    if (result.success) {
      const {
        data: { user: googleUser },
      } = await supabase.auth.getUser();
      if (googleUser) {
        markNewIfRecent(googleUser.created_at);
        await fetchProfile(googleUser.id, googleUser);
      }
    }
    return result;
  };

  const updateName = async (name: string) => {
    if (!user) return { success: false, message: 'You are not signed in.' };
    try {
      await updateProfileNameInDb(user.id, name);
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'Could not update profile.',
      };
    }
    await fetchProfile(user.id, user);
    setIsNewUser(false);
    return { success: true, message: 'Profile updated!' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsNewUser(false);
  };

  // A profile needs a real display name when it is missing, blank, or still
  // the phone-number placeholder from the signup trigger. Derived from the
  // profile row itself (not the in-memory isNewUser flag) so it survives
  // app restarts, and covers both phone and Google signups.
  const needsOnboarding =
    !!profile &&
    (!profile.name ||
      profile.name.trim().length < 2 ||
      isPlaceholderName(profile));

  const value: AuthContextValue = {
    user,
    profile,
    session,
    isLoading,
    isNewUser,
    needsOnboarding,
    sendOtp,
    verifyOtp,
    signInWithGoogle,
    updateName,
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
