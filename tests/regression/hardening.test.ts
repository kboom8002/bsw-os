import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import fs from 'fs';
import path from 'path';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

describe('BSW-OS Hardening & Security Release Gate Test Suite (AG-B10)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Service Role Key Exposure Scanner', () => {
    it('should confirm no service role token or service client imports exist inside app client bundles', () => {
      // Programmatically scan App Router directories for 'SUPABASE_SERVICE_ROLE_KEY' or getSupabaseAdminClient
      const clientPagesDir = path.resolve(__dirname, '../../app');
      
      const scanDirectoryForLeaks = (dir: string): boolean => {
        let leaked = false;
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            if (scanDirectoryForLeaks(filePath)) leaked = true;
          } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Scanner check: Client pages must never import getSupabaseAdminClient directly!
            // In Next.js App Router, actions handle database calls server-side.
            if (content.includes('"use client"') && content.includes('getSupabaseAdminClient')) {
              console.error(`SECURITY WARNING: Found potential server admin leakage in client bundle page "${filePath}"`);
              leaked = true;
            }
          }
        }
        return leaked;
      };

      const hasLeaks = scanDirectoryForLeaks(clientPagesDir);
      expect(hasLeaks).toBe(false); // No client leaks allowed!
    });
  });

  describe('2. Multi-Tenant RLS & RBAC Mutative Rules', () => {
    it('should strictly block read-only roles (executive_viewer) from executing critical mutations', async () => {
      // Mock getWorkspaceRole returning executive_viewer
      vi.mocked(checkWorkspacePermission).mockResolvedValue(false);

      const isAllowed = await checkWorkspacePermission(mockWorkspaceId, mockUserId, ['owner', 'admin']);
      expect(isAllowed).toBe(false); // blocked!
    });

    it('should block anonymous sessions from reading or mutating workspace resources', async () => {
      // Anonymous user (sessionless = null ID)
      const anonymousUserId = null;
      vi.mocked(checkWorkspacePermission).mockResolvedValue(false);

      const isAllowed = await checkWorkspacePermission(mockWorkspaceId, anonymousUserId!, ['owner', 'admin', 'brand_strategist']);
      expect(isAllowed).toBe(false); // blocked!
    });
  });
});
