/** Data-access for `profiles` — pure Supabase calls, no React. */
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/database';
import type { ClientProfile } from '@/types/domain';

export async function fetchProfileByUserId(
  userId: string,
): Promise<ClientProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as ClientProfile | null) ?? null;
}

function displayNameFromAuthUser(authUser: User): string {
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const metaName =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    (authUser.email ? authUser.email.split('@')[0] : 'New user');
  return metaName;
}

/**
 * Google photo for a Supabase auth user.
 * Supabase's Google provider stores it as `user_metadata.picture`
 * (and some projects also see `avatar_url`). Phone users return null.
 * Upgrades Google's default `=s96-c` thumbnail to `=s256-c` for a crisp avatar.
 */
export function avatarUrlFromAuthUser(
  authUser: User | null | undefined,
): string | null {
  if (!authUser) return null;
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const raw =
    (meta.picture as string | undefined) ??
    (meta.avatar_url as string | undefined) ??
    null;
  if (typeof raw !== 'string' || raw.length === 0) return null;
  return raw.replace(/=s\d+-c$/, '=s256-c');
}

/**
 * OAuth (Google) users may not have a profile row if the
 * handle_new_user trigger only covers phone signups — create one
 * from the auth metadata so sign-in works regardless.
 */
export async function ensureProfileForUser(
  userId: string,
): Promise<ClientProfile | null> {
  const existing = await fetchProfileByUserId(userId);
  if (existing) return existing;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== userId) return null;

  const insert: TablesInsert<'profiles'> = {
    user_id: userId,
    name: displayNameFromAuthUser(authUser),
    email: authUser.email ?? '',
    phone: authUser.phone ?? null,
    avatar_url: avatarUrlFromAuthUser(authUser),
  };
  const { data: created } = await supabase
    .from('profiles')
    .insert(insert)
    .select('*')
    .maybeSingle();
  return (created as ClientProfile | null) ?? null;
}

export async function updateProfileName(
  userId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('user_id', userId);
  if (error) throw error;
}
