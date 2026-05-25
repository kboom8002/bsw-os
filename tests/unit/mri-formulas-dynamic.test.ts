import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeBMRI } from '../../lib/metrics/b-mri';
import { computeDMRI } from '../../lib/metrics/d-mri';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error: null })),
    single: vi.fn().mockImplementation(async () => ({ data, error: null })),
    then: vi.fn().mockImplementation((resolve) => resolve({ data, count, error: null }))
  };
  return qb;
};

describe('AEO/GEO Phase 2: Dynamic B-MRI & D-MRI Formulas', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compute exact B-MRI values based on specification formula', () => {
    // Spec B-MRI components:
    // AAS=80, OCR=75, BSF=90, QTC=85, GCTR=70, ARS=82
    // competitorAas=25
    // confidencePenalty=0.005, volatilityPenalty=0.01 (expressed as raw numbers)
    const result = computeBMRI(80, 75, 90, 85, 70, 82, 25, 0.005, 0.01);
    expect(result.value).toBe(80.45);
  });

  it('should compute dynamic 12-component D-MRI from Supabase mock datasets', async () => {
    // Setup Supabase queries mock to represent typical MVP state
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'brand_operational_truths') {
        return createMockQueryBuilder([
          { review_status: 'approved' },
          { review_status: 'draft' }
        ]);
      }
      if (table === 'brand_strategic_truths') {
        return createMockQueryBuilder([{ id: 'str-1' }]);
      }
      if (table === 'brand_operational_truth_evidence') {
        return createMockQueryBuilder([{ operational_truth_id: 'op-1' }]);
      }
      if (table === 'boundary_rules') {
        return createMockQueryBuilder([{ id: 'bound-1' }]);
      }
      if (table === 'brand_operational_truth_boundaries') {
        return createMockQueryBuilder([{ operational_truth_id: 'op-1' }]);
      }
      if (table === 'canonical_questions') {
        return createMockQueryBuilder([{ question_capital_node_id: 'node-1' }]);
      }
      if (table === 'qis_scenes') {
        return createMockQueryBuilder([{ canonical_question_id: 'cq-1' }]);
      }
      if (table === 'brand_ontology_nodes') {
        return createMockQueryBuilder([{ id: 'node-1' }]);
      }
      if (table === 'brand_ontology_edges') {
        return createMockQueryBuilder([{ id: 'edge-1' }]);
      }
      if (table === 'claim_nodes') {
        return createMockQueryBuilder([{ id: 'claim-1' }]);
      }
      if (table === 'lineage_records') {
        return createMockQueryBuilder([{ claim_node_id: 'claim-1' }]);
      }
      if (table === 'representation_objects') {
        return createMockQueryBuilder([{ readiness_status: 'ready' }]);
      }
      if (table === 'surface_contracts') {
        return createMockQueryBuilder([{ is_valid: true }]);
      }
      if (table === 'schema_mappings') {
        return createMockQueryBuilder([{ is_valid: true }]);
      }
      if (table === 'semantic_pages') {
        return createMockQueryBuilder([{ id: 'page-1' }]);
      }
      if (table === 'seo_aeo_geo_exports') {
        return createMockQueryBuilder([{ semantic_page_id: 'page-1' }]);
      }
      if (table === 'vibe_alignment_snapshots') {
        return createMockQueryBuilder([{ vpa: 95.00 }]);
      }
      if (table === 'persona_eval_runs') {
        return createMockQueryBuilder([{ evaluation_metrics: { pmri: 90.00 } }]);
      }
      if (table === 'probe_panels') {
        return createMockQueryBuilder([{ id: 'panel-1', is_locked: true }]);
      }
      if (table === 'probe_questions') {
        // Return 8 mock probe questions
        return createMockQueryBuilder([], 8);
      }
      if (table === 'rca_cases') {
        return createMockQueryBuilder([{ id: 'rca-1' }]);
      }
      if (table === 'patch_tickets') {
        return createMockQueryBuilder([{ id: 'patch-1' }]);
      }
      if (table === 'retest_runs') {
        return createMockQueryBuilder([{ id: 'retest-1' }]);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const dMri = await computeDMRI(workspaceId);
    expect(dMri).toBeDefined();
    expect(dMri.value).toBeGreaterThan(0);
    expect(dMri.components.truthReadiness).toBe(0.85); // (1.0 + 0.7) / 2
    expect(dMri.components.evidenceReadiness).toBe(0.5);
    expect(dMri.components.fixItTraceability).toBe(1.0); // RCA, patch, and retest all exist
  });
});
