import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn((url: string, key: string, options?: any) => {
      return { url, key, options, role: key.includes('service') || key.includes('admin') ? 'admin' : 'anon' };
    }),
  };
});

describe('BSW-OS Supabase Client Factory Tests (TDD-02)', () => {
  const originalWindow = typeof window !== 'undefined' ? window : undefined;
  const originalEnv = { ...process.env };

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

  it('should create an anonymous client successfully', async () => {
    const { getSupabaseClient } = await import('../../lib/supabase');
    const client = getSupabaseClient() as any;

    expect(client.role).toBe('anon');
    expect(client.url).toBeDefined();
  });

  it('should throw critical security error when getSupabaseAdminClient is invoked in browser', async () => {
    global.window = {} as any;

    const { getSupabaseAdminClient } = await import('../../lib/supabase');

    expect(() => getSupabaseAdminClient()).toThrow(
      'CRITICAL SECURITY ERROR: getSupabaseAdminClient was invoked on the client browser. Operation aborted.'
    );
  });

  it('should fallback to mock admin key in development if service key is missing', async () => {
    // @ts-ignore
    delete global.window;
    (process.env as any).NODE_ENV = 'development';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { getSupabaseAdminClient } = await import('../../lib/supabase');
    const client = getSupabaseAdminClient() as any;

    expect(client.role).toBe('admin');
    expect(client.key).toBe('mock-admin-service-key-for-dev');
  });

  it('should throw error in production if service key is missing', async () => {
    // @ts-ignore
    delete global.window;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { getSupabaseAdminClient } = await import('../../lib/supabase');

    expect(() => getSupabaseAdminClient()).toThrow();
  });

  it('should create an admin client successfully in production if key is present', async () => {
    // @ts-ignore
    delete global.window;
    (process.env as any).NODE_ENV = 'production';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'prod-service-role-key';

    const { getSupabaseAdminClient } = await import('../../lib/supabase');
    const client = getSupabaseAdminClient() as any;

    expect(client.role).toBe('admin');
    expect(client.key).toBe('prod-service-role-key');
  });
});
