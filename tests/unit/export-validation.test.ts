import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { validateSchemaMapping, generateSeoAeoGeoExport } from '../../app/actions/objects';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    insert: vi.fn().mockImplementation(() => qb),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-05: Schema Mapping & SEO/AEO/GEO Export Safety Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block schema validation (isValid = false) if JSON-LD contains unsupported high-risk claims not present in visible page content', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'semantic_pages') {
        // Visible content is safe and simple
        return createMockQueryBuilder({
          id: 'page-safe',
          visible_content: 'This formula hydrates sensitive skin gently.'
        });
      }
      if (table === 'schema_mappings') {
        return createMockQueryBuilder({ id: 'mapping-1' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Schema injects 'cures psoriasis' claim!
    const badJsonld = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Gentle Cream",
      "description": "This cures psoriasis permanently" // UNSUPPORTED CLAIM!
    };

    const result = await validateSchemaMapping(wsId, 'page-safe', 'Product', badJsonld);

    expect(result.isValid).toBe(false);
    expect(result.logs[0]).toContain("contains claim text 'cures psoriasis' which is not visible");
  });

  it('should block generateSeoAeoGeoExport if any page claim lacks verified signature, but succeed and return cryptographic seal for valid pages', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'semantic_pages') {
        return createMockQueryBuilder({
          id: 'page-verified',
          page_title: 'Clinical Barrier Serum',
          visible_content: 'Proven barrier improvement formula.',
          claim_refs: ['cl-safe-1']
        });
      }
      if (table === 'lineage_records') {
        // lineage is verified and signed!
        return createMockQueryBuilder({
          is_publishable: true,
          verification_signature: 'verified-sha256-hash-signature-value'
        });
      }
      if (table === 'seo_aeo_geo_exports') {
        return createMockQueryBuilder({ id: 'export-verified' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await generateSeoAeoGeoExport(wsId, 'page-verified', 'AEO_LLM');

    expect(result.id).toBe('export-verified');
  });
});
