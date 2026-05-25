import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runBrandTruthExtractor } from '../../lib/ai/truth_extractor';
import { upsertOperationalTruth } from '../../app/actions/truth';
import { createCanonicalQuestion, createQisScene } from '../../app/actions/semantic';
import { createVibeSpec, createVibeRatingEvent } from '../../app/actions/persona';
import { createProbePanel, startObservationRun, computeMetricSnapshot } from '../../app/actions/observatory';
import { createRcaCase } from '../../app/actions/fixit';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => resolve({ data, error })
  };
  return qb;
};

describe('BSW-OS Trace-Loop Full Integration Tests (TDD-06)', () => {
  // RFC4122 v4 UUIDs
  const mockWorkspaceId = 'e2fa0fcd-99b3-46bc-81bf-4b216fb0ffcf';
  const mockAgentRunId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0001';
  const mockObservedTruthId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0002';
  const mockOperationalTruthId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0003';
  const mockCanonicalQuestionId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0004';
  const mockQisSceneId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0005';
  const mockVibeSpecId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0006';
  const mockRatingEventId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0007';
  const mockRepresentationObjectId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0008';
  const mockProbePanelId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0009';
  const mockObservationRunId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0010';
  const mockMetricSnapshotId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0011';
  const mockRcaCaseId = 'd3b07384-d113-4ec6-a5d7-ec5e1e0a0012';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
  });

  it('should successfully execute the full semantic trace-loop pipeline', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'agent_runs') {
        return createMockQueryBuilder({ id: mockAgentRunId, status: 'draft' });
      }
      if (table === 'brand_observed_truths') {
        return createMockQueryBuilder({ id: mockObservedTruthId, observed_claim: 'Contains 10% clinical Niacinamide' });
      }
      if (table === 'brand_operational_truths') {
        return createMockQueryBuilder({ id: mockOperationalTruthId, claim: 'Contains 10% Niacinamide formula', risk_level: 'low' });
      }
      if (table === 'canonical_questions') {
        const qb = createMockQueryBuilder();
        qb.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        qb.single = vi.fn().mockResolvedValue({ data: { id: mockCanonicalQuestionId, normalized_question: 'Is niacinamide safe?' }, error: null });
        return qb;
      }
      if (table === 'qis_scenes') {
        return createMockQueryBuilder({ id: mockQisSceneId, scene_name: 'Niacinamide routine query intent' });
      }
      if (table === 'vibe_specs') {
        return createMockQueryBuilder({ id: mockVibeSpecId, vibe_name: 'Clinical Trust Vibe', target_vector: { clinical: 80, warm: 10, luxury: 10 } });
      }
      if (table === 'evidence_items') {
        return createMockQueryBuilder({ id: 'd3b07384-d113-4ec6-a5d7-ec5e1e0a9999', is_verified: true });
      }
      if (table === 'vibe_rating_events') {
        const qb = createMockQueryBuilder({ id: mockRatingEventId, target_id: mockRepresentationObjectId, target_type: 'page', rating_scores: { clinical: 80, warm: 10, luxury: 10 } });
        qb.then = (resolve: any) => resolve({ data: [{ rating_scores: { clinical: 80, warm: 10, luxury: 10 } }], error: null });
        return qb;
      }
      if (table === 'probe_runs') {
        const qb = createMockQueryBuilder();
        qb.then = (resolve: any) => resolve({
          data: [{ id: 'probe-run-111', raw_response_text: 'Contains BSW Brand and 10% clinical Niacinamide' }],
          error: null
        });
        return qb;
      }
      if (table === 'response_judgments') {
        const qb = createMockQueryBuilder();
        qb.then = (resolve: any) => resolve({
          data: [{
            is_citation_found: true,
            brand_semantic_fidelity_score: 95,
            question_territory_covered: true,
            geo_concept_transferred: true
          }],
          error: null
        });
        return qb;
      }
      if (table === 'probe_panels') {
        return createMockQueryBuilder({ id: mockProbePanelId, status: 'frozen', is_locked: true });
      }
      if (table === 'ai_observation_runs') {
        return createMockQueryBuilder({ id: mockObservationRunId, status: 'completed' });
      }
      if (table === 'metric_snapshots') {
        return createMockQueryBuilder({ id: mockMetricSnapshotId, average_response_score: 88.50 });
      }
      if (table === 'rca_cases') {
        return createMockQueryBuilder({ id: mockRcaCaseId, status: 'open' });
      }
      return createMockQueryBuilder({});
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // 1. AI Agent Run: Observed Claim Extraction
    const agentResult = await runBrandTruthExtractor(mockWorkspaceId, {
      sourceText: 'This skincare brand has active 10% Niacinamide serum.',
      sourceDomain: 'skincare-brand.com',
    });
    expect(agentResult.agentRunId).toBe(mockAgentRunId);

    // 2. MeaningOps: Create Brand Operational Truth
    const operTruth = await upsertOperationalTruth(mockWorkspaceId, {
      claim: 'Contains 10% Niacinamide formula',
      risk_level: 'low',
      confidence_score: 95.0
    });
    expect(operTruth.id).toBe(mockOperationalTruthId);

    // 3. Semantic Core: Establish Canonical Question & QIS Scene
    const cq = await createCanonicalQuestion(mockWorkspaceId, {
      normalized_question: 'Is niacinamide safe?',
      slug: 'is-niacinamide-safe',
      signature: 'niacinamide-sig-1'
    });
    expect(cq.id).toBe(mockCanonicalQuestionId);

    const scene = await createQisScene(mockWorkspaceId, {
      scene_name: 'Niacinamide routine query intent',
      query_template: 'Is niacinamide safe for sensitive skin?',
      intent_model: 'informational',
      scenario_context: 'General User Skincare Intent',
      risk_level: 'low',
      canonical_question_id: mockCanonicalQuestionId
    });
    expect(scene.id).toBe(mockQisSceneId);

    // 4. Vibe OS: Record Brand Vibe Spec & Rating
    const vibe = await createVibeSpec(mockWorkspaceId, {
      vibe_name: 'Clinical Trust Vibe',
      slug: 'clinical-trust-vibe',
      target_vector: { clinical: 80, warm: 10, luxury: 10 }
    });
    expect(vibe.id).toBe(mockVibeSpecId);

    const rating = await createVibeRatingEvent(mockWorkspaceId, {
      vibe_spec_id: mockVibeSpecId,
      target_id: mockRepresentationObjectId,
      target_type: 'page',
      rating_scores: { clinical: 80, warm: 10, luxury: 10 },
      evidence_item_id: 'd3b07384-d113-4ec6-a5d7-ec5e1e0a9999' // ?ÑÏùò??UUID
    });
    expect(rating.id).toBe(mockRatingEventId);

    // 5. Observatory: Freeze Panel & Observe
    const panel = await createProbePanel(mockWorkspaceId, {
      panel_name: 'Niacinamide Core Panel',
      slug: 'niacinamide-core-panel',
      version: 1
    });
    expect(panel.id).toBe(mockProbePanelId);

    const run = await startObservationRun(mockWorkspaceId, mockProbePanelId, 'Niacinamide Core Observation Run');
    expect(run.id).toBe(mockObservationRunId);

    const metrics = await computeMetricSnapshot(mockWorkspaceId, mockObservationRunId);
    expect(metrics).toBeInstanceOf(Array);
    expect(metrics.length).toBeGreaterThan(0);
    const metric = metrics[0];
    expect(metric.id).toBe(mockMetricSnapshotId);

    // 6. Fix-It: low score RCA mapping
    const rca = await createRcaCase(mockWorkspaceId, {
      metric_snapshot_id: metric.id,
      metric_name: 'ARS',
      metric_value: 88.50,
      cause_hypothesis: 'Lacking brand semantic alignment on retainer surface terms.',
      risk_level: 'medium'
    });
    expect(rca.id).toBe(mockRcaCaseId);
  });
});
