type EnvRecord = Record<string, string | undefined>;

const resolveEnv = (): EnvRecord => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env as EnvRecord;
  }

  if (typeof process !== 'undefined' && (process as any).env) {
    return (process as any).env as EnvRecord;
  }

  return {};
};

const env = resolveEnv();

const supabaseUrl =
  env.VITE_SUPABASE_URL ??
  env.NEXT_PUBLIC_SUPABASE_URL ??
  env.SUPABASE_URL;

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ??
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  env.SUPABASE_ANON_KEY;

export const config = {
  supabaseUrl,
  supabaseAnonKey,
};
