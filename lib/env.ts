import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  HUB_API_URL: z.string().url().default('https://aihompy.vercel.app'),
  HUB_API_KEY: z.string().optional(),
  QIS_API_KEY_HASH: z.string().optional(),
  BSW_WORKSPACE_ID: z.string().optional(),
  /** true이면 인증 없이 데모 모드로 작동 */
  DEMO_MODE: z.string().optional(),
  /** true이면 Hub 없이 단독 모드로 QIS 파이프라인 작동 */
  STANDALONE_MODE: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  HUB_API_URL: process.env.HUB_API_URL,
  HUB_API_KEY: process.env.HUB_API_KEY,
  QIS_API_KEY_HASH: process.env.QIS_API_KEY_HASH,
  BSW_WORKSPACE_ID: process.env.BSW_WORKSPACE_ID,
  DEMO_MODE: process.env.DEMO_MODE,
  STANDALONE_MODE: process.env.STANDALONE_MODE,
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
