import { describe, it, expect, vi } from 'vitest';
import { SignalOrchestrator } from '@/lib/signal-collection/orchestrator';
import { QisContentGenerator } from '@/lib/qis/content-generator';

// Mock AI provider
vi.mock('@/lib/ai/ai-provider', () => ({
  getAIProvider: () => ({
    generateStructuredOutput: vi.fn().mockImplementation((prompt) => {
      if (prompt.includes('Intent Model') || prompt.includes('AEO') || prompt.includes('QVS')) {
        // Content generator / Evaluator mock output
        return Promise.resolve({
          answer_text: '피부 건강을 위해 나이아신아마이드 세럼을 사용하는 것은 피부 장벽 강화에 매우 유용합니다. 반드시 일정한 주기로 사용하세요.',
          confidence_score: 0.95,
          reasoning: 'Met all guidelines including must_include.',
          intent: 'informational',
          brand_fit: 'fit',
          is_ymyl: false,
          relevance: 8, specificity: 7, urgency: 5, opportunity: 6,
          conversion: 9, snippet_fitness: 7, entity_clarity: 8,
          multi_engine_consistency: 6
        });
      }
      // MetaQuestionEngine mock output
      return Promise.resolve({
        results: [{
          meta_type: 'pattern',
          analysis_insight: 'Test insight',
          generated_queries: ['질문1', '질문2']
        }],
        relevance: 8, specificity: 7, urgency: 5, opportunity: 6,
        conversion: 9, snippet_fitness: 7, entity_clarity: 8,
        multi_engine_consistency: 6, reasoning: 'Test reasoning',
        intent: 'informational', brand_fit: 'fit', is_ymyl: false,
        entry_questions: ['q1', 'q2'],
        reasoning_paths: []
      });
    }),
    generateText: vi.fn().mockResolvedValue('Test text'),
  }),
}));

// Mock embedding provider
vi.mock('@/lib/ai/embedding-provider', () => ({
  getEmbeddingProvider: () => ({
    embed: vi.fn().mockResolvedValue(new Array(768).fill(0)),
    embedBatch: vi.fn().mockImplementation((texts: string[]) => texts.map(() => new Array(768).fill(0))),
  }),
}));

// Mock Search provider factory
vi.mock('@/lib/ai/search-provider-factory', () => ({
  SearchProviderFactory: {
    getProvider: () => ({
      search: vi.fn().mockResolvedValue({
        raw_response_text: 'Mock search grounded result.',
        citations: []
      })
    })
  }
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const chainObj: any = {};
  chainObj.select = vi.fn().mockReturnValue(chainObj);
  chainObj.insert = vi.fn().mockReturnValue(chainObj);
  chainObj.update = vi.fn().mockReturnValue(chainObj);
  chainObj.eq = vi.fn().mockReturnValue(chainObj);
  chainObj.order = vi.fn().mockReturnValue(chainObj);
  chainObj.limit = vi.fn().mockReturnValue(chainObj);
  chainObj.single = vi.fn().mockResolvedValue({
    data: { id: 'mock-id', title: 'mock title' },
    error: null
  });
  chainObj.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = vi.fn().mockReturnValue(chainObj);

  return {
    getSupabaseAdminClient: () => ({
      from: mockFrom
    })
  };
});

describe('QIS Hub Mode & Content Generator Tests', () => {
  describe('SignalOrchestrator Hub Mode', () => {
    it('should run runFullPipeline in brand-agnostic (hub) mode without throwing', async () => {
      const workspaceId = 'test-workspace-id';
      // brandName is undefined to simulate Hub Mode
      const result = await SignalOrchestrator.runFullPipeline(
        workspaceId,
        'skincare',
        undefined,
        {
          repeatEval: 1,
          tcoConceptSeeds: [{ concept_name: '보습', definition: 'Moisturizing' }],
          kgNodes: [{ id: '1', node_name: '세라마이드', node_type: 'ingredient' }]
        }
      );

      expect(result).toBeDefined();
      expect(result.totalGenerated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('QisContentGenerator Answer Card Generation', () => {
    it('should draft an AEO/GEO answer card conforming to constraints', async () => {
      const params = {
        query: '나이아신아마이드 부작용은?',
        intentModel: 'informational',
        scenarioContext: '소비자가 성분의 안전성을 의심하는 맥락',
        mustInclude: ['피부 장벽 강화'],
        mustNotDo: ['부작용 전혀 없음'],
        claims: ['나이아신아마이드는 피지 조절과 피부 장벽 개선에 도움을 줍니다.'],
        riskLevel: 'medium'
      };

      const result = await QisContentGenerator.generateAnswerCard(params);
      expect(result).toBeDefined();
      expect(result.answerText).toContain('피부 장벽 강화');
      expect(result.answerText).not.toContain('부작용 전혀 없음');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });
});
