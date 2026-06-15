import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TDD-02: Supabase Service Role Boundary Security Tests', () => {
  const originalWindow = typeof window !== 'undefined' ? window : undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalWindow) {
      global.window = originalWindow as any;
    } else {
      // @ts-ignore
      delete global.window;
    }
  });

  it('should throw a critical security error when getSupabaseAdminClient is invoked inside browser context', async () => {
    // Define dummy window object to simulate browser context
    global.window = {} as any;

    const { getSupabaseAdminClient } = await import('../../lib/supabase');

    expect(() => getSupabaseAdminClient()).toThrow(
      'CRITICAL SECURITY ERROR: getSupabaseAdminClient was invoked on the client browser. Operation aborted.'
    );
  }, 10000);

  it('should confirm zero occurrences of admin client imports inside next.js use client components', () => {
    const appDir = path.resolve(__dirname, '../../app');

    const scanForClientLeaks = (dir: string): string[] => {
      const leaks: string[] = [];
      if (!fs.existsSync(dir)) return leaks;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          leaks.push(...scanForClientLeaks(filePath));
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // Scrutinize client component declarations for server admin leakage
          if (content.includes('"use client"') && content.includes('getSupabaseAdminClient')) {
            leaks.push(filePath);
          }
        }
      }
      return leaks;
    };

    const leaks = scanForClientLeaks(appDir);
    expect(leaks.length).toBe(0); // Zero leaks allowed!
  });
});
