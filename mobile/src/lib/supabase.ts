import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env, isEnvConfigured } from '@/config/env';
import type { Database } from '@/types/database';

// Placeholders keep module evaluation crash-free in misconfigured builds
// (supabase-js throws on empty URL at createClient time). App.tsx renders a
// config-error screen and never uses this client when env is missing.
const SUPABASE_URL = isEnvConfigured()
  ? env.supabaseUrl
  : 'https://missing-config.supabase.co';
const SUPABASE_ANON_KEY = isEnvConfigured() ? env.supabaseAnonKey : 'missing-config-key';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});