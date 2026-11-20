import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    '';

  const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : undefined) ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Publishable/Anon key environment variables.');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
