import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
  type CookieMethodsServer,
} from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

export interface ServerClientContext {
  req?: IncomingMessage;
  res?: ServerResponse;
  cookies?: CookieMethodsServer;
}

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  );
}

export function createClient(context?: ServerClientContext) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Publishable/Anon key environment variables.');
  }

  const cookies: CookieMethodsServer = context?.cookies ?? {
    getAll() {
      const cookieHeader = context?.req?.headers?.cookie ?? '';
      return parseCookieHeader(cookieHeader).map((cookie) => ({
        name: cookie.name,
        value: cookie.value ?? '',
      }));
    },
    setAll(cookiesToSet, headers) {
      if (!context?.res) return;

      const serialized = cookiesToSet.map(({ name, value, options }) =>
        serializeCookieHeader(name, value, options)
      );

      if (serialized.length > 0) {
        const existing = context.res.getHeader('Set-Cookie');
        const nextCookies = Array.isArray(existing)
          ? [...existing.map(String), ...serialized]
          : existing
          ? [String(existing), ...serialized]
          : serialized;
        context.res.setHeader('Set-Cookie', nextCookies);
      }

      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          context.res?.setHeader(key, value);
        });
      }
    },
  };

  return createServerClient(supabaseUrl, supabaseKey, { cookies });
}

export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  return createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
