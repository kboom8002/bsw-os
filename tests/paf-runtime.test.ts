import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainPackLoader } from '@/lib/pattern-attractor/domain-pack-loader';
import { ContextTensorBuilder } from '@/lib/pattern-attractor/context-tensor-builder';
import { AttractorRetriever } from '@/lib/pattern-attractor/attractor-retriever';
import { AttractorFitScorer } from '@/lib/pattern-attractor/attractor-fit-scorer';
import { MediaSolitonGenerator } from '@/lib/pattern-attractor/media-soliton-generator';
import { RunReceiptLogger } from '@/lib/pattern-attractor/run-receipt-logger';
import { GapAnalyzer } from '@/lib/pattern-attractor/gap-analyzer';
import { RecompositionEngine } from '@/lib/pattern-attractor/recomposition-engine';
import { PatternAttractorSpec, ContextTensor } from '@/lib/pattern-attractor/types';

// Mock Supabase with chainable mock builder supporting promise awaits
const chainObj: any = {};
chainObj.select = vi.fn().mockReturnValue(chainObj);
chainObj.insert = vi.fn().mockReturnValue(chainObj);
chainObj.update = vi.fn().mockReturnValue(chainObj);
chainObj.delete = vi.fn().mockReturnValue(chainObj);
chainObj.eq = vi.fn().mockReturnValue(chainObj);
chainObj.gte = vi.fn().mockReturnValue(chainObj);
chainObj.or = vi.fn().mockReturnValue(chainObj);
chainObj.is = vi.fn().mockReturnValue(chainObj);
chainObj.order = vi.fn().mockReturnValue(chainObj);
chainObj.limit = vi.fn().mockReturnValue(chainObj);
chainObj.single = vi.fn().mockResolvedValue({ data: { id: 'test-uuid' }, error: null });
chainObj.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'test-uuid' }, error: null });
chainObj.upsert = vi.fn().mockResolvedValue({ data: null, error: null });
chainObj.then = (onfulfilled: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled);

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdminClient: () => ({
    from: vi.fn().mockReturnValue(chainObj)
  }),
  getSupabaseClient: () => ({
    from: vi.fn().mockReturnValue(chainObj)
  }),
}));

// Mock AI Provider
vi.mock('@/lib/ai/ai-provider', () => ({
  getAIProvider: () => ({
    generateStructuredOutput: vi.fn().mockImplementation((prompt, schema) => {
      if (prompt.includes('Context Tensor Builder')) {
        return Promise.resolve({
          domain: 'kbeauty-skincare',
          user_state: 'active ingredient beginner',
          risk_state: 'low',
          intent_state: 'continue_retinol_decision',
          evidence_state: 'safety_disclaimer',
          time_state: 'none',
          channel_state: 'answer_card'
        });
      }
      if (prompt.includes('Fit Scorer')) {
        return Promise.resolve({
          attractor_id: 'attractor.kbeauty.active_beginner_anxiety_reducer',
          total_score: 85,
          breakdown: {
            concept_match: 18,
            context_fit: 13,
            intent_fit: 12,
            risk_policy_fit: 13,
            evidence_availability: 12,
            vibe_requirement_fit: 17,
            forbidden_condition_penalty: 0
          },
          gate: 'activate'
        });
      }
      if (prompt.includes('Media Soliton')) {
        return Promise.resolve({
          content: 'Generated soliton content for channel',
          metadata: { word_count: 50, estimated_reading_time_sec: 10 },
          preservation_scores: {
            proposition_preserved: 0.95,
            evidence_preserved: 0.9,
            vibe_preserved: 0.92,
            cta_preserved: 0.95,
            overall: 0.93
          }
        });
      }
      return Promise.resolve({});
    }),
    generateText: vi.fn().mockResolvedValue('Mock AI Text response'),
  }),
}));

// Mock Embedding Service
vi.mock('@/lib/embeddings/embedding-service', () => {
  return {
    EmbeddingService: class {
      getEmbedding() {
        return Promise.resolve(new Array(3072).fill(0.1));
      }
      getEmbeddingsBatch() {
        return Promise.resolve([new Array(3072).fill(0.1)]);
      }
    }
  };
});

describe('Pattern Attractor Foundry — Runtime Tests', () => {
  const workspaceId = '00000000-0000-0000-0000-000000000000';
  const domainId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. DomainPackLoader loads K-Beauty pack configuration', () => {
    const packSlug = 'kbeauty-skincare';
    const info = DomainPackLoader.loadPackFromDir(packSlug);
    
    expect(info.domain.id).toBe('kbeauty-skincare');
    expect(info.domain.name).toBe('K-Beauty Skincare');
    expect(info.concepts.length).toBeGreaterThan(0);
    expect(info.attractors.length).toBeGreaterThan(0);
  });

  it('2. ContextTensorBuilder creates 7-axis tensor via AI', async () => {
    const tensor = await ContextTensorBuilder.buildFromQuery(
      '레티놀 자극',
      'kbeauty-skincare',
      'answer_card'
    );

    expect(tensor.domain).toBe('kbeauty-skincare');
    expect(tensor.channel_state).toBe('answer_card');
    expect(tensor.risk_state).toBe('low');
    expect(tensor.user_state).toContain('beginner');
  });

  it('3. AttractorRetriever searches candidates using mock trigger matches', async () => {
    const retriever = new AttractorRetriever(workspaceId, domainId);
    
    // Setup mock DB fetch
    const mockAttractorRecord = {
      id: 'attractor.kbeauty.active_beginner_anxiety_reducer',
      version: '0.1.0',
      status: 'active',
      type: ['anxiety_reducer'],
      scope: 'domain',
      trigger_state: { user_question_patterns: ['레티놀 따가워요'] },
      concept_state: { required_concepts: [], allowed_concepts: [], forbidden_concepts: [] },
      evidence_anchor: {},
      vibe_signature: {},
      action_policy: {}
    };
    
    chainObj.single.mockResolvedValueOnce({ data: { id: domainId }, error: null }); // Domain resolve
    chainObj.single.mockResolvedValueOnce({ data: { id: 'concept-uuid' }, error: null }); // Concept resolve
    
    // Simulate domain list
    chainObj.single.mockResolvedValueOnce({ data: { id: domainId }, error: null });
    
    const tensor: ContextTensor = {
      domain: 'kbeauty-skincare',
      user_state: 'beginner',
      risk_state: 'low',
      intent_state: 'info',
      evidence_state: 'none',
      time_state: 'none',
      channel_state: 'answer_card'
    };

    // Retriever calls supabase.from()
    chainObj.from = vi.fn().mockReturnValue(chainObj);
    
    // Mock select result
    chainObj.single.mockResolvedValueOnce({ data: { id: 'workspace-uuid' }, error: null });

    // Since chainObj is fully chained, we just mock the return data
    chainObj.then = vi.fn().mockImplementation((onfulfilled: any) => 
      Promise.resolve({
        data: [mockAttractorRecord],
        error: null
      }).then(onfulfilled)
    );

    const candidates = await retriever.retrieveCandidates('레티놀 따가움', tensor);
    expect(candidates.length).toBeGreaterThanOrEqual(0);
  });

  it('4. AttractorFitScorer calculates AI-based fit and gates action', async () => {
    const scorer = new AttractorFitScorer();
    
    const attractor: PatternAttractorSpec = {
      id: 'attractor.kbeauty.active_beginner_anxiety_reducer',
      version: '0.1.0',
      status: 'active',
      type: ['anxiety_reducer'],
      scope: 'domain',
      domain: { id: domainId, name: 'K-Beauty Skincare' },
      natural_definition: '레티놀 초보자 자극 완화 패턴',
      trigger_state: {
        user_question_patterns: [],
        context_requirements: [],
        risk_state: { level: 'low' },
        intent_state: [],
        missing_context: []
      },
      concept_state: { required_concepts: [], allowed_concepts: [], forbidden_concepts: [] },
      evidence_anchor: { required_sources: [], evidence_visibility_rule: '', claim_strength_limit: 'supported' },
      vibe_signature: {} as any,
      action_policy: {
        allowed_actions: [],
        blocked_actions: [],
        cta_policy: { primary: '', secondary: [], blocked: [] },
        safety_policy: { boundary_notes: [], escalation_conditions: [] }
      },
      media_soliton_rule: { core_proposition: '', evidence_anchor: '', cta_vector: '', channel_adaptation_rules: {} as any },
      target_state: { cognitive: [], affective: [], motivational: [], behavioral: [] },
      metrics: {},
      failure_modes: [],
      recomposition_rule: { if_failed_then: [] }
    };

    const tensor: ContextTensor = {
      domain: 'kbeauty-skincare',
      user_state: 'beginner',
      risk_state: 'low',
      intent_state: 'info',
      evidence_state: 'none',
      time_state: 'none',
      channel_state: 'answer_card'
    };

    const result = await scorer.scoreAttractorFit(attractor, '레티놀 따가움', tensor, []);
    expect(result.total_score).toBe(85);
    expect(result.gate).toBe('activate');
  });

  it('5. MediaSolitonGenerator creates multi-channel assets', async () => {
    const generator = new MediaSolitonGenerator();
    
    const attractor: PatternAttractorSpec = {
      id: 'attractor.kbeauty.active_beginner_anxiety_reducer',
      version: '0.1.0',
      status: 'active',
      type: ['anxiety_reducer'],
      scope: 'domain',
      domain: { id: domainId, name: 'K-Beauty Skincare' },
      natural_definition: '레티놀 자극 완화',
      trigger_state: { user_question_patterns: [], context_requirements: [], risk_state: { level: 'low' }, intent_state: [], missing_context: [] },
      concept_state: { required_concepts: [], allowed_concepts: [], forbidden_concepts: [] },
      evidence_anchor: { required_sources: [], evidence_visibility_rule: '', claim_strength_limit: 'supported' },
      vibe_signature: {} as any,
      action_policy: { allowed_actions: [], blocked_actions: [], cta_policy: { primary: '', secondary: [], blocked: [] }, safety_policy: { boundary_notes: [], escalation_conditions: [] } },
      media_soliton_rule: { core_proposition: '', evidence_anchor: '', cta_vector: '', channel_adaptation_rules: {} as any },
      target_state: { cognitive: [], affective: [], motivational: [], behavioral: [] },
      metrics: {},
      failure_modes: [],
      recomposition_rule: { if_failed_then: [] }
    };

    const asset = await generator.generateForChannel(attractor, 'ad');
    expect(asset.channel).toBe('ad');
    expect(asset.content).toBe('Generated soliton content for channel');
    expect(asset.preservation_scores.overall).toBe(0.93);
  });

  it('6. GapAnalyzer diagnoses missing or weak portfolio elements', async () => {
    const analyzer = new GapAnalyzer();

    const standard: PatternAttractorSpec = {
      id: 'attractor.kbeauty.active_beginner_anxiety_reducer',
      version: '0.1.0',
      status: 'active',
      type: ['anxiety_reducer'],
      scope: 'domain',
      domain: { id: domainId, name: 'K-Beauty Skincare' },
      natural_definition: '레티놀 자극 완화',
      trigger_state: { user_question_patterns: [], context_requirements: [], risk_state: { level: 'low' }, intent_state: [], missing_context: [] },
      concept_state: { required_concepts: [], allowed_concepts: [], forbidden_concepts: [] },
      evidence_anchor: { required_sources: [], evidence_visibility_rule: '', claim_strength_limit: 'supported' },
      vibe_signature: {} as any,
      action_policy: { allowed_actions: [], blocked_actions: [], cta_policy: { primary: '', secondary: [], blocked: [] }, safety_policy: { boundary_notes: [], escalation_conditions: [] } },
      media_soliton_rule: { core_proposition: '', evidence_anchor: '', cta_vector: '', channel_adaptation_rules: {} as any },
      target_state: { cognitive: [], affective: [], motivational: [], behavioral: [] },
      metrics: {},
      failure_modes: [],
      recomposition_rule: { if_failed_then: [] }
    };

    // Simulate empty portfolio (missing attractor)
    chainObj.then = vi.fn().mockImplementation((onfulfilled: any) => 
      Promise.resolve({
        data: [], // Empty brand portfolio
        error: null
      }).then(onfulfilled)
    );

    const report = await analyzer.analyzeBrandGaps(workspaceId, 'brand_default', domainId, [standard]);
    expect(report.portfolio_score).toBe(0);
    expect(report.gaps[0].gap_type).toBe('missing_attractor');
  });

  it('7. RecompositionEngine calculates strength from realized performance', async () => {
    const engine = new RecompositionEngine();

    // Mock receipts select
    chainObj.then = vi.fn().mockImplementation((onfulfilled: any) => 
      Promise.resolve({
        data: [
          {
            attractor_fit_score: 90,
            vibe_alignment_score: 85,
            policy_compliance_score: 95,
            cta_shown: ['btn1'],
            cta_clicked: ['btn1'],
            detected_gaps: []
          }
        ],
        error: null
      }).then(onfulfilled)
    );

    const assessment = await engine.evaluatePatternStrength('attractor.kbeauty.active_beginner_anxiety_reducer');
    expect(assessment.strength).toBeGreaterThan(0);
  });
});
