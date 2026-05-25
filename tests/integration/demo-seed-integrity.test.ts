import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seedCore } from '../../db/seed/demo-core';
import { seedFullDemo } from '../../db/seed/demo-full';
import { seedKBeauty } from '../../db/seed/domains/k-beauty';
import { seedConvenience } from '../../db/seed/domains/convenience-retail';
import { seedWedding } from '../../db/seed/domains/wedding';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = () => {
  const upsertedRows: any[] = [];
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation((payload) => {
      if (Array.isArray(payload)) {
        upsertedRows.push(...payload);
      } else {
        upsertedRows.push(payload);
      }
      return qb;
    }),
    insert: vi.fn().mockImplementation((payload) => {
      if (Array.isArray(payload)) {
        upsertedRows.push(...payload);
      } else {
        upsertedRows.push(payload);
      }
      return qb;
    }),
    single: vi.fn().mockImplementation(async () => {
      const lastRow = upsertedRows[upsertedRows.length - 1];
      return { 
        data: { 
          id: "seeded-id-12345", 
          name: "Mocked Component", 
          slug: "mocked-slug", 
          ...lastRow 
        }, 
        error: null 
      };
    }),
    then: (resolve: any) => {
      resolve({ data: upsertedRows, count: upsertedRows.length, error: null });
    }
  };
  return { qb, upsertedRows };
};

describe('TDD-10: Demo Database Seeding Integrity Validation', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const domainId = '00000000-0000-4000-a000-000000000002';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ensure the idempotent seeder correctly populates core workspace and 3 domain skeletons', async () => {
    const { qb, upsertedRows } = createMockQueryBuilder();
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => qb),
    } as any);

    await seedCore();

    // Verify workspace exists with correct slug
    const workspacesSeeded = upsertedRows.filter(r => r.slug === 'demo-brand-semantic-lab');
    expect(workspacesSeeded.length).toBe(1);
    expect(workspacesSeeded[0].name).toBe('Demo Brand Semantic Lab');

    // Verify 3 domains are seeded
    const domainSlugs = upsertedRows.map(r => r.slug);
    expect(domainSlugs).toContain('k-beauty-skincare');
    expect(domainSlugs).toContain('convenience-retail');
    expect(domainSlugs).toContain('wedding-services');
  });

  it('should verify the K-Beauty seeder introduces the PureBarrier brand and high-risk safety boundaries', async () => {
    const { qb, upsertedRows } = createMockQueryBuilder();
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => qb),
    } as any);

    await seedKBeauty(workspaceId, domainId);

    // Verify PureBarrier brand exists
    const brandTruth = upsertedRows.find(r => r.brand_name === 'PureBarrier');
    expect(brandTruth).toBeDefined();

    // Verify YMYL high-risk safety boundaries exist (retinol warning disclaimers)
    const boundaries = upsertedRows.filter(r => r.boundary_name && r.boundary_name.toLowerCase().includes('safety'));
    expect(boundaries.length).toBeGreaterThan(0);
    expect(boundaries[0].safety_disclaimers[0]).toContain('daily');

    // Verify expected layers are seeded for K-Beauty
    const exLayer = upsertedRows.find(r => r.must_include && r.must_include.includes('Ceramide NP'));
    expect(exLayer).toBeDefined();
    expect(exLayer.must_not_do).toContain('eczema cure');
  });

  it('should verify the Convenience Retail seeder introduces the Quick25 brand and geo-locator action intent', async () => {
    const { qb, upsertedRows } = createMockQueryBuilder();
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => qb),
    } as any);

    await seedConvenience(workspaceId, domainId);

    // Verify Quick25 brand
    const brandTruth = upsertedRows.find(r => r.brand_name === 'Quick25');
    expect(brandTruth).toBeDefined();

    // Verify local intent QIS scene for store locator menu combo
    const qisScene = upsertedRows.find(r => r.intent_model === 'navigational' || r.intent_context === 'local');
    expect(qisScene).toBeDefined();
    expect(qisScene.scene_name).toContain('combination');

    // Verify expected layers are seeded for Convenience Retail
    const exLayer = upsertedRows.find(r => r.must_include && r.must_include.includes('Quick25'));
    expect(exLayer).toBeDefined();
    expect(exLayer.must_not_do).toContain('lowest price guarantee');
  });

  it('should verify the Wedding Services seeder introduces Lumiere Hall and all 4 vendor categories', async () => {
    const { qb, upsertedRows } = createMockQueryBuilder();
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => qb),
    } as any);

    await seedWedding(workspaceId, domainId);

    // Verify Lumiere Hall brand
    const brandTruth = upsertedRows.find(r => r.brand_name === 'Lumiere Hall');
    expect(brandTruth).toBeDefined();

    // Verify KG Node contains all 4 required categories (wedding_hall, studio, dress, makeup)
    const kgNode = upsertedRows.find(r => r.node_label && r.node_label.includes('Lumiere Hall'));
    expect(kgNode).toBeDefined();
    expect(kgNode.attributes.categories).toContain('wedding_hall');
    expect(kgNode.attributes.categories).toContain('studio');
    expect(kgNode.attributes.categories).toContain('dress');
    expect(kgNode.attributes.categories).toContain('makeup');

    // Verify expected layers are seeded for Wedding
    const exLayer = upsertedRows.find(r => r.must_include && r.must_include.includes('Lumiere Hall'));
    expect(exLayer).toBeDefined();
    expect(exLayer.must_not_do).toContain('guaranteed reservation');
  });
});
