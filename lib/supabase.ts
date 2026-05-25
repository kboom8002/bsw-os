import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env, validateServerSecrets } from './env';

/**
 * Standard browser-safe or server-safe public client.
 * Uses the anonymous public key. Subject to RLS policies.
 */
export function getSupabaseClient() {
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * High-privilege, server-only admin client.
 * Uses the service_role key to bypass Row-Level Security (RLS).
 * MUST NEVER be called on the client side or in a client component.
 */
export function getSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY ERROR: getSupabaseAdminClient was invoked on the client browser. Operation aborted.');
  }

  validateServerSecrets();

  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    // If not in production, fallback to a mock admin client for testing scenarios
    if (process.env.NODE_ENV !== 'production') {
      return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, 'mock-admin-service-key-for-dev', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Admin client creation failed.');
  }

  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}
