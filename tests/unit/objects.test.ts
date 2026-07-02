import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createRepresentationObject, 
  evaluateObjectReadiness, 
  validateSurfaceContract, 
  composeSemanticPage, 
  generateSeoAeoGeoExport,
  validateSchemaMapping
} from '../../app/actions/objects';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

// Mock Supabase admin client and permissions checks to isolate logic
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue('test-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
  getWorkspaceRole: vi.fn().mockResolvedValue('admin'),
}));

// Chainable and Thenable Supabase Query Builder mock
const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    // Thenable support to handle promise resolutions natively
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('Object / Surface / Website Module Tests (AG-B4)', () => {
  const mockWorkspaceId = 'e2fa0fcd-99b3-46bc-81bf-4b216fb0ffcf';
  
  // Strictly Valid RFC4122 v4 UUID Mocks
  const qisUuid = '11111111-1111-4111-a111-111111111111';
  const claimUuid = '22222222-2222-4222-a222-222222222222';
  const conceptUuid = '33333333-3333-4333-a333-333333333333';
  const objectUuid = '44444444-4444-4444-a444-444444444444';
  const contractUuid = '55555555-5555-4555-a555-555555555555';
  const pageUuid = '66666666-6666-4666-a666-666666666666';

  const operationalTruthUuid = '00000000-0000-4000-a000-000000000002';
  const sectionUuid = '00000000-0000-4000-a000-000000000003';
  const exportUuid = '00000000-0000-4000-a000-000000000004';
  const schemaMappingUuid = '00000000-0000-4000-a000-000000000005';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Traceability chains on Representation Objects', () => {
    it('should preserve and carry references to QIS scenes, claim nodes, and TCO concepts', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockReturnValue(createMockQueryBuilder({
        object_name: 'Active Niacinamide formula percentage',
        slug: 'active-niacinamide',
        object_type: 'ingredient',
        qis_refs: [qisUuid],
        claim_refs: [claimUuid],
        concept_refs: [conceptUuid]
      }));

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await createRepresentationObject(mockWorkspaceId, {
        object_name: 'Active Niacinamide formula percentage',
        slug: 'active-niacinamide',
        object_type: 'ingredient',
        qis_refs: [qisUuid],
        claim_refs: [claimUuid],
        concept_refs: [conceptUuid],
        raw_properties: {},
        readiness_status: 'draft'
      });

      expect(mockFrom).toHaveBeenCalledWith('representation_objects');
      expect(result.qis_refs[0]).toBe(qisUuid);
      expect(result.claim_refs[0]).toBe(claimUuid);
      expect(result.concept_refs[0]).toBe(conceptUuid);
    });
  });

  describe('Object Readiness Gate (Claims lineage safety checks)', () => {
    it('should block object readiness if a mapped claim lacks a publishable lineage signature', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'representation_objects') {
          return createMockQueryBuilder({ object_name: 'Niacinamide spec', claim_refs: [claimUuid], evidence_refs: ['ev-1'] });
        }
        if (table === 'claim_nodes') {
          return createMockQueryBuilder({ id: claimUuid, claim_summary: 'Claims eczema cures', operational_truth_id: operationalTruthUuid });
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder({ id: operationalTruthUuid, risk_level: 'critical' });
        }
        if (table === 'lineage_records') {
          // is_publishable is FALSE (blocks safety)
          return createMockQueryBuilder({ is_publishable: false, evidence_item_id: null });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateObjectReadiness(mockWorkspaceId, objectUuid);

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed_safety');
      expect(result.blockers[0]).toContain('fails safety gate lineage');
    });
  });

  describe('Surface Validation Gate (Visual layout rules checks)', () => {
    it('should block surface contract validation if a mapped object links to high-risk scenes but required_blocks lacks safety_boundary', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'surface_contracts') {
          // Contract lacks safety_boundary in required_blocks!
          return createMockQueryBuilder({ contract_name: 'Product Details', allowed_objects: [objectUuid], required_blocks: ['clinical_evidence'] });
        }
        if (table === 'representation_objects') {
          return createMockQueryBuilder({ object_name: 'Niacinamide spec', qis_refs: [qisUuid] });
        }
        if (table === 'qis_scenes') {
          // RISK IS HIGH
          return createMockQueryBuilder({ scene_name: 'Skincare redness user query', risk_level: 'high' });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await validateSurfaceContract(mockWorkspaceId, contractUuid);

      expect(result.success).toBe(false);
      expect(result.blockers[0]).toContain('lacks a mandatory "safety_boundary" required block');
    });
  });

  describe('Visible Pages Pre-rendering & Compositions', () => {
    it('should compose a semantic page and inherit visible facts from valid allowed objects', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'surface_contracts') {
          return createMockQueryBuilder({ is_valid: true, allowed_objects: [objectUuid], required_blocks: ['clinical_evidence'] });
        }
        if (table === 'representation_objects') {
          return createMockQueryBuilder({ id: objectUuid, object_name: 'Niacinamide', raw_properties: { concentration: '5%' } });
        }
        if (table === 'semantic_pages') {
          return createMockQueryBuilder({ id: pageUuid, page_title: 'Title', slug: 'slug', visible_content: 'composed niacinamide facts' });
        }
        if (table === 'page_sections') {
          return createMockQueryBuilder({ id: sectionUuid });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await composeSemanticPage(mockWorkspaceId, contractUuid, {
        page_title: 'Niacinamide specs details',
        slug: 'products/niacinamide-specs'
      });

      expect(mockFrom).toHaveBeenCalledWith('semantic_pages');
      expect(result.id).toBe(pageUuid);
    });
  });

  describe('SEO/AEO Safety Checkpoints (Export gates)', () => {
    it('should block SEO/AEO export generation if mapped page claims fail lineage checks', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'semantic_pages') {
          return createMockQueryBuilder({ page_title: 'Page', visible_content: 'text', claim_refs: [claimUuid] });
        }
        if (table === 'lineage_records') {
          // Claim is NOT publishable!
          return createMockQueryBuilder({ is_publishable: false, verification_signature: null });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await expect(generateSeoAeoGeoExport(mockWorkspaceId, pageUuid, 'SEO'))
        .rejects.toThrow('SAFETY VIOLATION BLOCK');
    });

    it('should successfully export structured AI-readable markdown (AEO) if lineages pass', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'semantic_pages') {
          return createMockQueryBuilder({ page_title: 'Page', visible_content: 'visible specs', claim_refs: [claimUuid] });
        }
        if (table === 'lineage_records') {
          return createMockQueryBuilder({ is_publishable: true, verification_signature: 'sha256-verified-sig' });
        }
        if (table === 'seo_aeo_geo_exports') {
          return createMockQueryBuilder({ id: exportUuid, rendered_payload: '# AI-Readable Specs' });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await generateSeoAeoGeoExport(mockWorkspaceId, pageUuid, 'AEO_LLM');

      expect(result.id).toBe(exportUuid);
    });
  });

  describe('Google JSON-LD Mapping Checker', () => {
    it('should invalidate schema mapping if JSON-LD contains unsupported claims not visible in visible content text', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'semantic_pages') {
          // Page lacks any references to eczema cures
          return createMockQueryBuilder({ visible_content: 'visible skincare specifications' });
        }
        if (table === 'schema_mappings') {
          return createMockQueryBuilder({ id: schemaMappingUuid });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const badJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "claim": " eczema cures " // Mismatched claim!
      };

      const result = await validateSchemaMapping(mockWorkspaceId, pageUuid, 'Product', badJsonLd);

      expect(result.isValid).toBe(false);
      expect(result.logs[0]).toContain('is not visible in page content');
    });
  });
});
