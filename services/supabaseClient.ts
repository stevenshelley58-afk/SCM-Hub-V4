import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

if (!config.supabaseUrl || !config.supabaseAnonKey || config.supabaseUrl.includes('YOUR_URL_HERE')) {
  throw new Error("Supabase URL and Anon Key are not configured in config.ts. Please update them.");
}

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
