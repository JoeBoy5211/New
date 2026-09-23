import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function isolatedClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function postgrestMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o['message'] === 'string' && o['message']) parts.push(o['message'] as string);
    if (typeof o['details'] === 'string' && o['details']) parts.push(o['details'] as string);
    if (typeof o['hint'] === 'string' && o['hint']) parts.push(`Hint: ${o['hint'] as string}`);
    if (typeof o['code'] === 'string' && o['code']) parts.push(`(${(o['code'] as string)})`);
    if (parts.length > 0) return parts.join(' ');
  }
  return 'Something went wrong. Please try again.';
}

export type CreateAdminResult = { userId: string; mode: 'created' | 'promoted' };

/**
 * Create a new admin Auth user (with password) without disturbing the current
 * admin session, then grant the admin role.
 *
 * Implementation notes (Supabase anon-key constraints):
 * - Auth user creation uses an isolated client (persistSession: false) so the
 *   current admin stays signed in.
 * - `profiles` + default `customer` role are auto-created by the
 *   `handle_new_user` DB trigger from the signup metadata (name).
 * - The admin role is granted with the *primary* (signed-in admin) client,
 *   which RLS allows via "Admins can manage roles".
 * - Supabase cannot set another user's password with the anon key, so
 *   passwords are set once at creation; later changes go through a secure
 *   reset-email link (see useSendPasswordReset) or the service_role script.
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }): Promise<CreateAdminResult> => {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanName) throw new Error('Please enter a full name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Please enter a valid email address.');
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');

      const isolated = isolatedClient();
      const { data, error } = await isolated.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name: cleanName } },
      });
      if (error) {
        // Supabase returns "User already registered" for duplicates.
        if (/already (registered|exists|in use)/i.test(error.message)) {
          const promoted = await promoteExistingByEmail(cleanEmail);
          if (promoted) return promoted;
          const err = new Error(
            'An account with this email already exists. They were NOT given admin access automatically — ask them to confirm their email, then promote them from the table below.'
          );
          (err as Error & { code?: string }).code = 'EXISTS';
          throw err;
        }
        throw new Error(error.message);
      }

      // Duplicate-email protection: Supabase may return a user with zero
      // identities instead of an error (anti-enumeration).
      const identities = (data.user as unknown as { identities?: unknown[] } | null)?.identities;
      if (data.user && Array.isArray(identities) && identities.length === 0) {
        const promoted = await promoteExistingByEmail(cleanEmail);
        if (promoted) return promoted;
        const err = new Error('An account with this email already exists. Promote them from the table below instead.');
        (err as Error & { code?: string }).code = 'EXISTS';
        throw err;
      }

      if (!data.user) {
        // Email-confirmation projects can return no user here; the Auth row
        // usually still exists — try to promote by email lookup.
        const promoted = await promoteExistingByEmail(cleanEmail);
        if (promoted) return promoted;
        throw new Error(
          'Account created but still needs email confirmation. Ask the new admin to confirm via the email link, then grant the role from the table below if it is missing.'
        );
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: 'admin' });
      if (roleError) {
        // 23505 = already has the role → treat as success.
        if ((roleError as { code?: string }).code !== '23505') throw new Error(roleError.message);
      }
      return { userId: data.user.id, mode: 'created' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'all'] });
    },
  });
}

async function promoteExistingByEmail(email: string): Promise<CreateAdminResult | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id')
    .ilike('email', email)
    .maybeSingle();
  if (error || !profile) return null;
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: profile.user_id, role: 'admin' });
  if (roleError && (roleError as { code?: string }).code !== '23505') throw new Error(roleError.message);
  return { userId: profile.user_id, mode: 'promoted' };
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const clean = email.trim();
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw new Error(error.message);
    },
  });
}

export function useRemoveAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'all'] });
    },
  });
}
