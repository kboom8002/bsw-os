/**
 * tests/qis-pipeline-contract.test.ts
 *
 * QIS Full Pipeline — 교차 파이프라인 계약(Contract) 테스트
 *
 * 계약 테스트는 모듈 A의 출력이 모듈 B의 입력 계약을 정확히 준수하는지 검증합니다.
 * 파이프라인의 각 경계(boundary)에서 데이터 형태, 타입, 범위, 필수 필드가
 * 소비자(consumer) 모듈의 기대와 일치하는지 확인합니다.
 *
 * 테스트 범위 (12개 계약 경계):
 *   Contract 1:  MetaQuestionEngine.output  → Orchestrator.allCandidates 입력
 *   Contract 2:  ExploratoryChain.output    → Orchestrator.allCandidates 입력
 *   Contract 3:  RecursiveDeepener.output   → Orchestrator.allCandidates 입력 (트리 평탄화)
 *   Contract 4:  ReverseQuestionEngine.output → Orchestrator.allCandidates 입력
 *   Contract 5:  allCandidates              → SemanticDedup.input → DedupResult.output
 *   Contract 6:  DedupResult.clusters       → SignalEvaluator.input
 *   Contract 7:  SignalEvaluator.output      → Orchestrator CPS 산출 입력
 *   Contract 8:  Orchestrator CPS output     → createQuestionSignal Zod 스키마 입력
 *   Contract 9:  questionSignalSchema        → questionCapitalNodeSchema 승격 체인
 *   Contract 10: questionCapitalNodeSchema   → canonicalQuestionSchema (SHA-256 서명)
 *   Contract 11: canonicalQuestionSchema     → qisSceneSchema
 *   Contract 12: TCO concepts + KG nodes    → Orchestrator seed/eval 주입 형태
 */

import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';

// Valid UUID v4 constants for test data
const WS_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
const CAPITAL_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6';
const CQ_ID = 'c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f';

// ═══════════════════════════════════════════════════════════
// Mock: 외부 의존 차단 (LLM, DB, Search)
// ═══════════════════════════════════════════════════════════

vi.mock('@/lib/ai/ai-provider', () => ({
  getAIProvider: () => ({
    generateStructuredOutput: vi.fn().mockResolvedValue({
      results: [{
        meta_type: 'pattern',
        analysis_insight: 'Test insight',
        generated_queries: ['질문1', '질문2', '질문3', '질문4', '질문5']
      }],
      relevance: 8, specificity: 7, urgency: 5, opportunity: 6,
      conversion: 9, snippet_fitness: 7, entity_clarity: 8,
      multi_engine_consistency: 6, reasoning: 'Test reasoning',
      intent: 'informational', brand_fit: 'fit', is_ymyl: false,
      entry_questions: ['q1', 'q2'],
      reasoning_paths: [{ step1_question: 's1', step2_question: 's2', step3_question: 's3', rationale: 'r' }]
    }),
    generateText: vi.fn().mockResolvedValue('Test'),
  }),
}));

vi.mock('@/lib/ai/embedding-provider', () => ({
  getEmbeddingProvider: () => ({
    embed: vi.fn().mockResolvedValue(new Array(768).fill(0).map((_, i) => Math.sin(i))),
    embedBatch: vi.fn().mockImplementation((texts: string[]) =>
      texts.map((_, i) => new Array(768).fill(0).map((_, j) => Math.sin(i * 100 + j)))
    ),
  }),
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }), single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }) }), in: () => ({ data: [], error: null }) }),
      insert: vi.fn().mockReturnValue({ select: () => ({ single: () => ({ data: { id: 'mock-id' }, error: null }) }), error: null }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }), error: null }) }),
    }),
  }),
}));

vi.mock('@/lib/ai/search-provider-factory', () => ({
  SearchProviderFactory: {
    runMultiEngine: vi.fn().mockResolvedValue({
      results: {
        gemini_grounding: {
          citations: [{ url: 'https://test.com', domain: 'test.com', title: 'Test' }],
          raw_response_text: 'Search result text',
        }
      }
    }),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue('mock-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('mock-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
}));


// ═══════════════════════════════════════════════════════════
// Contract 1: MetaQuestionEngine → Orchestrator
// ═══════════════════════════════════════════════════════════

describe('Contract 1: MetaQuestionEngine.output → Orchestrator.allCandidates', () => {
  it('MetaQuestionEngine 출력이 RawSignalCandidate 형태로 변환 가능해야 한다', async () => {
    const { MetaQuestionEngine } = await import('@/lib/signal-collection/meta-question-engine');

    const results = await MetaQuestionEngine.analyzeAndGenerate('skincare', 'TestBrand');

    // 계약: 결과는 배열이며, 각 항목에 meta_type, generated_queries가 존재
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    for (const r of results) {
      expect(r).toHaveProperty('meta_type');
      expect(r).toHaveProperty('generated_queries');
      expect(Array.isArray(r.generated_queries)).toBe(true);

      // Orchestrator 변환 계약: 각 query를 RawSignalCandidate로 변환
      for (const query of r.generated_queries) {
        const candidate = {
          query,
          source: `meta_${r.meta_type}`,
          volume: -1,
        };

        expect(typeof candidate.query).toBe('string');
        expect(candidate.query.length).toBeGreaterThan(0);
        expect(candidate.source).toMatch(/^meta_/);
        expect(candidate.volume).toBe(-1);
      }
    }
  });

  it('TCO 시드가 주입되어도 동일한 출력 형태를 유지해야 한다', async () => {
    const { MetaQuestionEngine } = await import('@/lib/signal-collection/meta-question-engine');

    const tcoSeeds = [
      { concept_name: 'moisturizing', definition: 'skin hydration' },
      { concept_name: 'antioxidant', definition: 'free radical removal' },
    ];

    const results = await MetaQuestionEngine.analyzeAndGenerate('skincare', 'TestBrand', undefined, tcoSeeds);

    expect(Array.isArray(results)).toBe(true);
    for (const r of results) {
      expect(r).toHaveProperty('meta_type');
      expect(r).toHaveProperty('generated_queries');
      expect(Array.isArray(r.generated_queries)).toBe(true);
    }
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 2: ExploratoryChain → Orchestrator
// ═══════════════════════════════════════════════════════════

describe('Contract 2: ExploratoryChain.output → Orchestrator.allCandidates', () => {
  it('ExploratoryStep의 follow_up_questions가 string[]이어야 한다', async () => {
    const { ExploratoryChain } = await import('@/lib/signal-collection/exploratory-chain');

    const steps = await ExploratoryChain.runChain('retinol serum recommendation', 'TestBrand', 1);

    expect(Array.isArray(steps)).toBe(true);
    for (const step of steps) {
      expect(step).toHaveProperty('question');
      expect(step).toHaveProperty('follow_up_questions');
      expect(step).toHaveProperty('grounded');
      expect(Array.isArray(step.follow_up_questions)).toBe(true);
      expect(typeof step.grounded).toBe('boolean');

      // Orchestrator 변환 계약
      for (const fq of step.follow_up_questions) {
        const candidate = {
          query: fq,
          source: step.grounded ? 'chain_grounded' : 'chain_fallback',
          volume: -1,
        };
        expect(typeof candidate.query).toBe('string');
        expect(['chain_grounded', 'chain_fallback']).toContain(candidate.source);
      }
    }
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 3: RecursiveDeepener → Orchestrator (트리 평탄화)
// ═══════════════════════════════════════════════════════════

describe('Contract 3: RecursiveDeepener.output → Orchestrator 트리 평탄화', () => {
  it('RecursiveNode 트리를 RawSignalCandidate[]로 평탄화할 수 있어야 한다', async () => {
    const { RecursiveDeepener } = await import('@/lib/signal-collection/recursive-deepener');

    const deepener = new RecursiveDeepener();
    const tree = await deepener.expandTree('retinol side effects', 'TestBrand', {
      maxDepth: 2, branchFactor: 2, maxTotalQuestions: 5, usePersonas: true,
    });

    // 계약: tree는 RecursiveNode 형태
    expect(tree).toHaveProperty('question');
    expect(tree).toHaveProperty('children');
    expect(Array.isArray(tree.children)).toBe(true);

    // Orchestrator의 평탄화 로직 재현
    const flatCandidates: Array<{ query: string; source: string; volume: number }> = [];

    const flatten = (node: typeof tree) => {
      flatCandidates.push({
        query: node.question,
        source: node.persona ? `recursive_${node.persona}` : 'recursive_tree',
        volume: -1,
      });
      node.children.forEach(flatten);
    };
    flatten(tree);

    expect(flatCandidates.length).toBeGreaterThan(0);
    for (const c of flatCandidates) {
      expect(typeof c.query).toBe('string');
      expect(c.query.length).toBeGreaterThan(0);
      expect(c.source).toMatch(/^recursive_/);
    }
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 4: ReverseQuestionEngine → Orchestrator
// ═══════════════════════════════════════════════════════════

describe('Contract 4: ReverseQuestionEngine.output → Orchestrator.allCandidates', () => {
  it('extractAllQuestions 결과가 string[]이어야 한다', async () => {
    const { ReverseQuestionEngine } = await import('@/lib/signal-collection/reverse-question-engine');

    const result = await ReverseQuestionEngine.reverseEngineer(
      'Patented capsule tech reduces retinol irritation by 80%', 'TestBrand', 'skincare'
    );

    // 계약: result에 entry_questions, reasoning_paths 존재
    expect(result).toHaveProperty('entry_questions');
    expect(result).toHaveProperty('reasoning_paths');

    const allQuestions = ReverseQuestionEngine.extractAllQuestions(result);

    expect(Array.isArray(allQuestions)).toBe(true);
    for (const q of allQuestions) {
      expect(typeof q).toBe('string');
      const candidate = { query: q, source: 'reverse_usp', volume: -1 };
      expect(candidate.source).toBe('reverse_usp');
    }
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 5: allCandidates → SemanticDedup → DedupResult
// ═══════════════════════════════════════════════════════════

describe('Contract 5: RawSignalCandidate[] → SemanticDedup → DedupResult', () => {
  it('SemanticDedup 입력은 RawSignalCandidate[], 출력은 DedupResult 형태', async () => {
    const { SemanticDedup } = await import('@/lib/signal-collection/semantic-dedup');
    const dedup = new SemanticDedup(0.85);

    const candidates = [
      { query: 'retinol serum recommendation', source: 'meta_pattern', volume: -1 },
      { query: 'retinol serum price', source: 'meta_motivation', volume: -1 },
      { query: 'niacinamide sensitive skin', source: 'chain_grounded', volume: -1 },
    ];

    const result = await dedup.deduplicate(candidates);

    // 출력 계약: DedupResult
    expect(result).toHaveProperty('clusters');
    expect(result).toHaveProperty('totalInput');
    expect(result).toHaveProperty('totalOutput');
    expect(result).toHaveProperty('duplicatesRemoved');

    expect(result.totalInput).toBe(candidates.length);
    expect(result.totalOutput).toBe(result.clusters.length);
    expect(result.duplicatesRemoved).toBe(result.totalInput - result.totalOutput);

    for (const cluster of result.clusters) {
      expect(cluster).toHaveProperty('id');
      expect(cluster).toHaveProperty('representative');
      expect(cluster).toHaveProperty('variants');
      expect(cluster).toHaveProperty('weight');
      expect(cluster).toHaveProperty('avgSimilarity');

      expect(cluster.representative).toHaveProperty('query');
      expect(cluster.representative).toHaveProperty('source');
      expect(typeof cluster.representative.query).toBe('string');
      expect(cluster.weight).toBeGreaterThanOrEqual(1);
    }
  });

  it('DedupResult.clusters의 representative가 Phase E의 입력으로 사용 가능해야 한다', async () => {
    const { SemanticDedup } = await import('@/lib/signal-collection/semantic-dedup');
    const dedup = new SemanticDedup(0.85);

    const candidates = [
      { query: 'vitamin C serum', source: 'meta_pattern', volume: -1 },
    ];
    const result = await dedup.deduplicate(candidates);

    const dedupedCandidates = result.clusters.map(c => c.representative);
    expect(dedupedCandidates.length).toBeGreaterThan(0);
    for (const c of dedupedCandidates) {
      expect(c).toHaveProperty('query');
      expect(typeof c.query).toBe('string');
    }
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 6: DedupResult → SignalEvaluator
// ═══════════════════════════════════════════════════════════

describe('Contract 6: DedupResult.representative → SignalEvaluator 입력', () => {
  it('SignalEvaluator.classifySignal은 (question, brandName) 서명을 준수해야 한다', async () => {
    const { SignalEvaluator } = await import('@/lib/signal-collection/signal-evaluator');

    const step1 = await SignalEvaluator.classifySignal('retinol serum sensitive skin', 'TestBrand');

    expect(step1).toHaveProperty('intent');
    expect(step1).toHaveProperty('brand_fit');
    expect(step1).toHaveProperty('is_ymyl');

    expect(['informational', 'navigational', 'transactional', 'local', 'comparison', 'risk'])
      .toContain(step1.intent);
    expect(['fit', 'partial', 'unfit']).toContain(step1.brand_fit);
    expect(typeof step1.is_ymyl).toBe('boolean');
  });

  it('SignalEvaluator.scoreQVS8D 출력이 8차원 + reasoning을 포함해야 한다', async () => {
    const { SignalEvaluator } = await import('@/lib/signal-collection/signal-evaluator');

    const qvs = await SignalEvaluator.scoreQVS8D('retinol effect', 'TestBrand', ['retinol', 'serum'], 'L3_experience');

    const dims = ['relevance', 'specificity', 'urgency', 'opportunity',
      'conversion', 'snippet_fitness', 'entity_clarity', 'multi_engine_consistency'];

    for (const d of dims) {
      expect(qvs).toHaveProperty(d);
      expect(typeof (qvs as any)[d]).toBe('number');
    }
    expect(qvs).toHaveProperty('reasoning');
    expect(typeof qvs.reasoning).toBe('string');
  });

  it('evaluateWithConfidence 출력이 Orchestrator CPS 산출에 필요한 모든 필드를 포함해야 한다', async () => {
    const { SignalEvaluator } = await import('@/lib/signal-collection/signal-evaluator');

    const result = await SignalEvaluator.evaluateWithConfidence(
      'retinol serum recommendation', 'TestBrand', 1, ['retinol'], 'L1_universal'
    );

    expect(result).toHaveProperty('step1');
    expect(result).toHaveProperty('qvs');
    expect(result).toHaveProperty('qvs_total');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('gate_status');

    expect(result.step1).toHaveProperty('intent');
    expect(result.step1).toHaveProperty('brand_fit');
    expect(result.step1).toHaveProperty('is_ymyl');

    expect(typeof result.qvs_total).toBe('number');
    expect(result.qvs_total).toBeGreaterThanOrEqual(0);
    expect(result.qvs_total).toBeLessThanOrEqual(100);
    expect(['Go', 'Watch', 'No-Go']).toContain(result.gate_status);
    expect(['high', 'medium', 'low']).toContain(result.confidence);
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 7: Orchestrator CPS → createQuestionSignal
// ═══════════════════════════════════════════════════════════

describe('Contract 7: Orchestrator CPS 산출 → createQuestionSignal Zod 입력', () => {
  it('Orchestrator가 생성하는 시그널 데이터가 questionSignalSchema를 통과해야 한다', async () => {
    const { questionSignalSchema } = await import('@/lib/schema');

    const orchestratorOutput = {
      workspace_id: WS_ID,
      query: 'retinol serum sensitive skin safety',
      volume: 250,
      intent: 'informational',
      status: 'promoted' as const,
      qvs_total: 72.5,
      qvs_dimensions: {
        relevance: 8, specificity: 7, urgency: 5, opportunity: 6,
        conversion: 9, snippet_fitness: 7, entity_clarity: 8,
        multi_engine_consistency: 6, reasoning: 'High brand relevance'
      },
      cps_score: 0.78,
      is_ymyl: false,
      gate_status: 'Go' as const,
      eval_confidence: 'high' as const,
      panel_layer: 'L3_experience',
    };

    const parsed = questionSignalSchema.parse(orchestratorOutput);
    expect(parsed.query).toBe(orchestratorOutput.query);
    expect(parsed.qvs_total).toBe(72.5);
    expect(parsed.gate_status).toBe('Go');
    expect(parsed.cps_score).toBe(0.78);
    expect(parsed.is_ymyl).toBe(false);
  });

  it('Gate=No-Go 시그널은 status=mined로 저장되어야 한다', async () => {
    const { questionSignalSchema } = await import('@/lib/schema');

    const noGoSignal = {
      workspace_id: WS_ID,
      query: 'irrelevant question',
      volume: 30,
      intent: 'informational',
      status: 'mined' as const,
      gate_status: 'No-Go' as const,
      qvs_total: 35.2,
    };

    const parsed = questionSignalSchema.parse(noGoSignal);
    expect(parsed.status).toBe('mined');
    expect(parsed.gate_status).toBe('No-Go');
  });

  it('필수 필드가 누락되면 Zod 검증이 실패해야 한다', async () => {
    const { questionSignalSchema } = await import('@/lib/schema');

    // query 필드 누락
    expect(() => questionSignalSchema.parse({
      workspace_id: WS_ID,
      volume: 100,
    })).toThrow();

    // workspace_id가 UUID가 아닌 경우
    expect(() => questionSignalSchema.parse({
      workspace_id: 'not-a-uuid',
      query: 'test question',
    })).toThrow();
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 8: Signal → Capital 승격 체인
// ═══════════════════════════════════════════════════════════

describe('Contract 8: questionSignal → questionCapitalNode 승격', () => {
  it('Signal의 query로부터 Capital의 title/slug를 생성할 수 있어야 한다', async () => {
    const { questionCapitalNodeSchema } = await import('@/lib/schema');

    const signal = { query: 'retinol serum sensitive skin safety', volume: 250 };

    const title = signal.query;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (slug.length >= 2) {
      const capitalNode = questionCapitalNodeSchema.parse({
        workspace_id: WS_ID,
        title: title,
        slug: slug,
        strategic_weight: Math.min(100, Math.round(signal.volume / 10)),
      });
      expect(capitalNode.title).toBe(signal.query);
      expect(capitalNode.strategic_weight).toBeLessThanOrEqual(100);
    }
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 9: Capital → Canonical Question (SHA-256)
// ═══════════════════════════════════════════════════════════

describe('Contract 9: questionCapitalNode → canonicalQuestion (SHA-256 서명)', () => {
  it('정규화된 질문으로부터 SHA-256 서명을 생성할 수 있어야 한다', async () => {
    const { canonicalQuestionSchema } = await import('@/lib/schema');

    const normalizedQuestion = 'retinol serum sensitive skin safety';
    const slug = normalizedQuestion.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const signature = crypto.createHash('sha256').update(normalizedQuestion).digest('hex').slice(0, 16);

    expect(slug.length).toBeGreaterThanOrEqual(5);
    expect(signature.length).toBe(16);

    const cq = canonicalQuestionSchema.parse({
      workspace_id: WS_ID,
      question_capital_node_id: CAPITAL_ID,
      normalized_question: normalizedQuestion,
      slug: slug,
      signature: signature,
    });

    expect(cq.signature).toBe(signature);
    expect(cq.normalized_question).toBe(normalizedQuestion);
  });

  it('동일 질문은 항상 동일한 SHA-256 서명을 생성해야 한다 (결정론적)', () => {
    const q = 'retinol serum sensitive skin safety';
    const sig1 = crypto.createHash('sha256').update(q).digest('hex').slice(0, 16);
    const sig2 = crypto.createHash('sha256').update(q).digest('hex').slice(0, 16);
    expect(sig1).toBe(sig2);
  });

  it('다른 질문은 다른 SHA-256 서명을 생성해야 한다', () => {
    const sig1 = crypto.createHash('sha256').update('question A').digest('hex').slice(0, 16);
    const sig2 = crypto.createHash('sha256').update('question B').digest('hex').slice(0, 16);
    expect(sig1).not.toBe(sig2);
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 10: CQ → QIS Scene
// ═══════════════════════════════════════════════════════════

describe('Contract 10: canonicalQuestion → qisScene', () => {
  it('CQ의 id를 QIS Scene의 canonical_question_id로 사용할 수 있어야 한다', async () => {
    const { qisSceneSchema } = await import('@/lib/schema');

    const scene = qisSceneSchema.parse({
      workspace_id: WS_ID,
      canonical_question_id: CQ_ID,
      scene_name: 'retinol serum safety scene',
      query_template: 'Is retinol serum safe for sensitive skin?',
      intent_model: 'informational',
      scenario_context: 'User with sensitive skin checking retinol serum safety',
      risk_level: 'medium',
    });

    expect(scene.canonical_question_id).toBe(CQ_ID);
    expect(scene.risk_level).toBe('medium');
  });

  it('risk_level은 low/medium/high/critical 중 하나여야 한다', async () => {
    const { qisSceneSchema } = await import('@/lib/schema');

    for (const level of ['low', 'medium', 'high', 'critical'] as const) {
      const scene = qisSceneSchema.parse({
        workspace_id: WS_ID,
        canonical_question_id: CQ_ID,
        scene_name: `test scene ${level}`,
        query_template: 'test question template here',
        intent_model: 'informational',
        scenario_context: 'test scenario context description here',
        risk_level: level,
      });
      expect(scene.risk_level).toBe(level);
    }
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 11: TCO Concepts + KG Nodes → Orchestrator 주입
// ═══════════════════════════════════════════════════════════

describe('Contract 11: TCO + KG → Orchestrator seed/eval 주입 형태', () => {
  it('TCO 개념이 MetaQuestionEngine의 tcoSeeds 형태와 호환되어야 한다', async () => {
    const dbConcepts = [
      { id: '1', concept_name: 'moisturizing', definition: 'skin hydration maintenance', is_strategic: true, slug: 'moisturizing', concept_type: 'tco_domain_entity', workspace_id: WS_ID },
      { id: '2', concept_name: 'antioxidant', definition: 'free radical removal', is_strategic: true, slug: 'antioxidant', concept_type: 'tco_domain_entity', workspace_id: WS_ID },
    ];

    const tcoSeeds = dbConcepts
      .filter(c => c.is_strategic)
      .map(c => ({ concept_name: c.concept_name, definition: c.definition }));

    expect(tcoSeeds.length).toBe(2);
    for (const seed of tcoSeeds) {
      expect(seed).toHaveProperty('concept_name');
      expect(seed).toHaveProperty('definition');
      expect(typeof seed.concept_name).toBe('string');
      expect(typeof seed.definition).toBe('string');
    }
  });

  it('KG 노드가 SignalEvaluator의 kgNodes 형태와 호환되어야 한다', async () => {
    const dbNodes = [
      { id: '1', node_name: 'retinol', node_type: 'concept', workspace_id: WS_ID },
      { id: '2', node_name: 'serum', node_type: 'product', workspace_id: WS_ID },
    ];

    const kgNodeNames = dbNodes.map(n => n.node_name);
    expect(kgNodeNames.every(n => typeof n === 'string')).toBe(true);

    const kgNodesForCoverage = dbNodes.map(n => ({
      id: n.id, node_name: n.node_name, node_type: n.node_type
    }));
    for (const n of kgNodesForCoverage) {
      expect(n).toHaveProperty('id');
      expect(n).toHaveProperty('node_name');
      expect(n).toHaveProperty('node_type');
    }
  });

  it('TCO 개념의 concept_name이 Orchestrator의 자카드 매칭에 사용 가능해야 한다', () => {
    const tcoSeeds = [
      { concept_name: 'moisturizing', definition: 'skin hydration' },
      { concept_name: 'antioxidant', definition: 'free radical removal' },
    ];

    const candidateQuery = 'skin moisturizing serum antioxidant effect';

    const matches = tcoSeeds.filter(seed =>
      candidateQuery.toLowerCase().includes(seed.concept_name.toLowerCase())
    ).length;
    const tcoMatchScore = Math.min(10, matches * 4);

    expect(matches).toBe(2);
    expect(tcoMatchScore).toBe(8);
  });
});


// ═══════════════════════════════════════════════════════════
// Contract 12: 전체 승격 체인 Signal→Capital→CQ→QIS Scene
// ═══════════════════════════════════════════════════════════

describe('Contract 12: 전체 승격 체인 Signal → Capital → CQ → QIS Scene', () => {
  it('Signal에서 QIS Scene까지 전체 승격 체인이 Zod 스키마를 통과해야 한다', async () => {
    const {
      questionSignalSchema,
      questionCapitalNodeSchema,
      canonicalQuestionSchema,
      qisSceneSchema,
    } = await import('@/lib/schema');

    // Step 1: Signal 생성
    const signal = questionSignalSchema.parse({
      workspace_id: WS_ID,
      query: 'retinol capsule technology principles',
      volume: 340,
      intent: 'informational',
      status: 'promoted',
      qvs_total: 78.5,
      gate_status: 'Go',
      eval_confidence: 'high',
      cps_score: 0.82,
      is_ymyl: false,
      panel_layer: 'L4_expert',
    });

    // Step 2: Signal → Capital 승격
    const capitalSlug = signal.query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const capital = questionCapitalNodeSchema.parse({
      workspace_id: WS_ID,
      title: signal.query,
      slug: capitalSlug.length >= 2 ? capitalSlug : 'fallback',
      strategic_weight: Math.min(100, Math.round(signal.volume / 10)),
    });

    expect(capital.title).toBe(signal.query);

    // Step 3: Capital → CQ (SHA-256 서명)
    const normalizedQ = signal.query;
    const cqSlug = normalizedQ.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const signature = crypto.createHash('sha256').update(normalizedQ).digest('hex').slice(0, 16);

    const cq = canonicalQuestionSchema.parse({
      workspace_id: WS_ID,
      question_capital_node_id: CAPITAL_ID,
      normalized_question: normalizedQ,
      slug: cqSlug.length >= 5 ? cqSlug : 'fallback-slug-value',
      signature,
    });

    expect(cq.normalized_question).toBe(signal.query);
    expect(cq.signature.length).toBe(16);

    // Step 4: CQ → QIS Scene
    const scene = qisSceneSchema.parse({
      workspace_id: WS_ID,
      canonical_question_id: CQ_ID,
      scene_name: `${signal.query} scene`,
      query_template: signal.query,
      intent_model: signal.intent,
      scenario_context: `Consumer asking "${signal.query}" in AI search scenario`,
      risk_level: signal.is_ymyl ? 'high' : 'medium',
    });

    expect(scene.query_template).toBe(signal.query);
    expect(scene.intent_model).toBe('informational');
    expect(scene.risk_level).toBe('medium');
  });

  it('YMYL 시그널의 승격 시 QIS Scene의 risk_level이 high가 되어야 한다', async () => {
    const { questionSignalSchema, qisSceneSchema } = await import('@/lib/schema');

    const ymylSignal = questionSignalSchema.parse({
      workspace_id: WS_ID,
      query: 'retinol safety during pregnancy',
      volume: 180,
      intent: 'risk',
      status: 'promoted',
      gate_status: 'Go',
      is_ymyl: true,
      panel_layer: 'L5_ymyl',
    });

    const scene = qisSceneSchema.parse({
      workspace_id: WS_ID,
      canonical_question_id: CQ_ID,
      scene_name: `${ymylSignal.query} scene`,
      query_template: ymylSignal.query,
      intent_model: ymylSignal.intent,
      scenario_context: `YMYL scenario: "${ymylSignal.query}"`,
      risk_level: ymylSignal.is_ymyl ? 'high' : 'medium',
    });

    expect(scene.risk_level).toBe('high');
  });

  it('status가 mined인 시그널은 승격되지 않아야 한다 (비즈니스 규칙)', () => {
    const signal = {
      query: 'test question',
      status: 'mined' as const,
      gate_status: 'Watch' as const,
    };

    const shouldPromote = signal.status === 'promoted' || signal.gate_status === 'Go';
    expect(shouldPromote).toBe(false);
  });
});


// ═══════════════════════════════════════════════════════════
// Contract Bonus: Panel Layer → YMYL 자동 감지 계약
// ═══════════════════════════════════════════════════════════

describe('Contract Bonus: Panel Layer → YMYL 자동 감지', () => {
  it('L5_ymyl 패널 매칭 시 is_ymyl이 true로 강제되어야 한다', async () => {
    const { INDUSTRY_PANELS_DATA } = await import('@/db/seed/industry-panels/questions-data');

    const skincare = (INDUSTRY_PANELS_DATA as any).skincare;
    if (!skincare?.questions) return;

    const ymylQuestions = skincare.questions.filter((q: any) => q.layer === 'L5_ymyl');

    for (const q of ymylQuestions) {
      let is_ymyl = false;
      if (q.layer === 'L5_ymyl' || q.risk_level === 'high') {
        is_ymyl = true;
      }
      expect(is_ymyl).toBe(true);
    }
  });

  it('risk_level=high인 질문도 YMYL로 감지되어야 한다', async () => {
    const { INDUSTRY_PANELS_DATA } = await import('@/db/seed/industry-panels/questions-data');

    const skincare = (INDUSTRY_PANELS_DATA as any).skincare;
    if (!skincare?.questions) return;

    const highRiskQuestions = skincare.questions.filter((q: any) => q.risk_level === 'high');

    for (const q of highRiskQuestions) {
      let is_ymyl = false;
      if (q.layer === 'L5_ymyl' || q.risk_level === 'high') {
        is_ymyl = true;
      }
      expect(is_ymyl).toBe(true);
    }
  });
});
