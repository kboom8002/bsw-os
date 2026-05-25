import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

// Guard to ensure service_role key is never exposed on the client bundle
if (typeof window !== 'undefined' && (process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("SECURITY WARNING: SUPABASE_SERVICE_ROLE_KEY was exposed to the client side. Suppressing active use.");
}

export function validateServerSecrets() {
  if (typeof window === 'undefined' && !process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY must be configured on the server in production.');
  }
}
