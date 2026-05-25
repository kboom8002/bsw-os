import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('BSW-OS Environment Variables Validation Tests (TDD-02)', () => {
  const originalEnv = { ...process.env };
  const originalWindow = typeof window !== 'undefined' ? window : undefined;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (originalWindow) {
      global.window = originalWindow as any;
    } else {
      // @ts-ignore
      delete global.window;
    }
    vi.restoreAllMocks();
  });

  it('should parse environment variables successfully when valid', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key-string';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-string';

    const { env } = await import('../../lib/env');

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example-supabase.co');
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('valid-anon-key-string');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('valid-service-role-key-string');
  });

  it('should throw validation error when NEXT_PUBLIC_SUPABASE_URL is invalid URL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key-string';

    await expect(import('../../lib/env')).rejects.toThrow();
  });

  it('should trigger console.error if SUPABASE_SERVICE_ROLE_KEY is exposed on client (window defined)', async () => {
    global.window = {} as any;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'leaked-key';

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../lib/env');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SECURITY WARNING: SUPABASE_SERVICE_ROLE_KEY was exposed')
    );
  });

  it('should fail validateServerSecrets in production if SUPABASE_SERVICE_ROLE_KEY is missing on server', async () => {
    // @ts-ignore
    delete global.window;

    (process.env as any).NODE_ENV = 'production';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { validateServerSecrets } = await import('../../lib/env');

    expect(() => validateServerSecrets()).toThrow(
      'CRITICAL SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY must be configured on the server in production.'
    );
  });

  it('should pass validateServerSecrets in production if SUPABASE_SERVICE_ROLE_KEY is present on server', async () => {
    // @ts-ignore
    delete global.window;

    (process.env as any).NODE_ENV = 'production';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'present-key';

    const { validateServerSecrets } = await import('../../lib/env');

    expect(() => validateServerSecrets()).not.toThrow();
  });
});
