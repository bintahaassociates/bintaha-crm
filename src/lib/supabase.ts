import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

let client: SupabaseClient | null = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
} catch (err) {
  console.error('Supabase client initialization failed, running in offline mode:', err);
  client = null;
}

function safeProxy(): SupabaseClient {
  if (client) return client;
  return new Proxy({} as SupabaseClient, {
    get() {
      return () => Promise.resolve({ data: null, error: { message: 'Offline mode' } });
    },
  });
}

export const supabase = safeProxy();
export const isSupabaseConfigured = Boolean(client);
