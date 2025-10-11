import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const { supabaseUrl, supabaseAnonKey } = config;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_URL_HERE')) {
      throw new Error(
        'Supabase URL and Anon Key are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
};

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient(), prop, receiver);
  },
});
