import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { composeSemanticPage } from '../../app/actions/objects';

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

describe('TDD-05: Semantic Page Composition & Fact Inheritance Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block page composition (DEPENDENCY BLOCK) if Surface Contract is invalid', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'surface_contracts') {
        // Contract is NOT valid!
        return createMockQueryBuilder({
          id: 'con-invalid',
          is_valid: false,
          allowed_objects: ['obj-1'],
          required_blocks: []
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    await expect(
      composeSemanticPage(wsId, 'con-invalid', {
        page_title: 'Unsafe Page',
        slug: 'products/unsafe-page'
      })
    ).rejects.toThrow('DEPENDENCY BLOCK');
  });

  it('should successfully compose semantic page and preserve source object refs inside page sections', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockPageRecord = {
      id: '00000000-0000-4000-a000-000000000101',
      page_title: 'Barrier Protection Serum',
      slug: 'products/barrier-protection-serum',
      visible_content: 'Visible Factual Specs: composed from contract.',
      object_refs: ['00000000-0000-4000-a000-000000000102'],
      qis_refs: ['00000000-0000-4000-a000-000000000103'],
      claim_refs: ['00000000-0000-4000-a000-000000000104'],
      concept_refs: ['00000000-0000-4000-a000-000000000105']
    };

    const mockSectionInsert = createMockQueryBuilder({ id: '00000000-0000-4000-a000-000000000106' });

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'surface_contracts') {
        return createMockQueryBuilder({
          id: '00000000-0000-4000-a000-000000000107',
          is_valid: true,
          allowed_objects: ['00000000-0000-4000-a000-000000000102'],
          required_blocks: ['header', 'features']
        });
      }
      if (table === 'representation_objects') {
        return createMockQueryBuilder({
          id: '00000000-0000-4000-a000-000000000102',
          object_name: 'Barrier Cream Facts',
          raw_properties: { ph: '5.5' },
          qis_refs: ['00000000-0000-4000-a000-000000000103'],
          claim_refs: ['00000000-0000-4000-a000-000000000104'],
          concept_refs: ['00000000-0000-4000-a000-000000000105']
        });
      }
      if (table === 'semantic_pages') {
        return createMockQueryBuilder(mockPageRecord);
      }
      if (table === 'page_sections') {
        return mockSectionInsert;
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const page = await composeSemanticPage(wsId, '00000000-0000-4000-a000-000000000107', {
      page_title: 'Barrier Protection Serum',
      slug: 'products/barrier-protection-serum'
    });

    expect(page.id).toBe('00000000-0000-4000-a000-000000000101');
    expect(page.object_refs).toContain('00000000-0000-4000-a000-000000000102');

    // Section insert inherits source refs
    expect(mockSectionInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        section_title: 'Clinical Specifications & Formulations',
        source_artifact_refs: expect.objectContaining({
          objectRefs: ['00000000-0000-4000-a000-000000000102'],
          claimRefs: ['00000000-0000-4000-a000-000000000104']
        })
      })
    );
  });
});
