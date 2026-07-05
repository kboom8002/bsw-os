import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CQCanonicalizer } from '../../lib/qis/cq-canonicalizer';
import { SceneBuilder } from '../../lib/qis/scene-builder';
import { TcoDistiller } from '../../lib/qis/tco-distiller';
import { AttractorPromoter } from '../../lib/qis/attractor-promoter';
import { getAIProvider } from '../../lib/ai/ai-provider';

// Mock AI Provider to bypass real LLM API calls and provide controlled outputs
vi.mock('../../lib/ai/ai-provider', () => {
  const mockAI = {
    generateStructuredOutput: vi.fn(),
    generateText: vi.fn().mockResolvedValue('Mock text response')
  };
  return {
    getAIProvider: () => mockAI
  };
});

describe('QPA-OS Engine Layer Unit Tests (Phase 1)', () => {
  const mockWorkspaceId = 'e2fa0fcd-99b3-46bc-81bf-4b216fb0ffcf';
  const mockDomainId = 'local-smb';
  const aiMock = getAIProvider();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. CQCanonicalizer Tests', () => {
    it('should canonicalize cluster signals into a structured Canonical Question spec', async () => {
      const canonicalizer = new CQCanonicalizer();
      
      const mockResult = {
        canonical_question: '제주공항 근처에서 주차가 편리한 카페는 어디인가요?',
        variants: ['제주 공항 근처 카페 주차', '제주공항 주차장 카페'],
        primary_intent: 'local',
        user_context: {
          persona_hints: ['family_traveler'],
          journey_stage: 'decision'
        },
        constraints: ['near_airport', 'parking_required'],
        evidence_need: ['parking_capacity', 'official_parking_rules'],
        risk_level: 'low',
        preferred_answer_type: ['direct_answer', 'map_link'],
        linked_tco_entities: ['constraint.parking_required'],
        cps_score: 78.5
      };

      vi.mocked(aiMock.generateStructuredOutput).mockResolvedValueOnce(mockResult);

      const result = await canonicalizer.canonicalizeCluster(mockWorkspaceId, mockDomainId, {
        representative_question: '제주공항 근처 카페 주차',
        variants: ['제주공항 근처에서 주차가 편한 카페는 어디인가요?'],
        dominant_intents: ['local']
      });

      expect(result.canonical_question).toBe('제주공항 근처에서 주차가 편리한 카페는 어디인가요?');
      expect(result.primary_intent).toBe('local');
      expect(result.risk_level).toBe('low');
      expect(result.cps_score).toBe(78.5);
      expect(result.user_context.journey_stage).toBe('decision');
    });
  });

  describe('2. SceneBuilder Tests', () => {
    it('should generate a structured QIS Scene specification with policies', async () => {
      const builder = new SceneBuilder();

      const mockTensor = {
        domain: mockDomainId,
        user_state: 'family_traveler',
        risk_state: 'medium',
        intent_state: 'local',
        evidence_state: 'parking_info',
        time_state: 'none',
        channel_state: 'answer_card'
      };

      const mockResult = {
        scene_name: '제주공항 주차 카페 Scene',
        intent_model: {
          primary_intent: 'local',
          secondary_intents: ['comparison']
        },
        evidence_requirements: ['official_answer', 'parking_photo'],
        risk_policy: {
          risk_level: 'medium',
          blocked_claims: ['주차 무료 보장'],
          required_disclaimers: ['혼잡도에 따라 주차가 제한될 수 있습니다.'],
          verification_required: ['parking_fee_changes']
        },
        answer_policy: {
          short_answer_rule: '주차가 제공되는 카페 및 주차 대수를 기재할 것.',
          detail_structure: ['Direct answer', 'Parking Fee Info', 'Map Location'],
          comparison_required: true,
          safe_phrasing: ['주차 공간 협소 가능성 언급']
        },
        cta_policy: {
          primary: 'open_map',
          secondary: ['call_business'],
          blocked: ['direct_payment']
        },
        must_do: ['공식 주차 정보 매핑'],
        must_not_do: ['주차 가능 여부를 단정하지 말 것'],
        output_targets: ['answer_card', 'chatbot'],
        readiness_score: 85
      };

      vi.mocked(aiMock.generateStructuredOutput)
        .mockResolvedValueOnce(mockTensor)
        .mockResolvedValueOnce(mockResult);

      const result = await builder.buildScene(mockWorkspaceId, mockDomainId, {
        id: 'cq-1',
        normalized_question: '제주공항 근처에서 주차가 편리한 카페는 어디인가요?',
        primary_intent: 'local',
        risk_level: 'medium'
      });

      expect(result.scene_name).toBe('제주공항 주차 카페 Scene');
      expect(result.evidence_requirements).toContain('official_answer');
      expect(result.risk_policy.risk_level).toBe('medium');
      expect(result.cta_policy.primary).toBe('open_map');
      expect(result.readiness_score).toBe(85);
      expect(result.context_tensor).toBeDefined();
    });
  });

  describe('3. TcoDistiller Tests', () => {
    it('should distill new TCO Concepts and match existing database concepts', async () => {
      const distiller = new TcoDistiller();

      const mockResult = {
        entities: [
          {
            proposed_id: 'constraint.parking_required',
            concept_name: '주차 필요',
            entity_type: 'constraint',
            definition: '차량 방문으로 인한 주차장 구비 요건',
            aliases: ['주차가능', '주차장'],
            activation_condition: { keywords: ['주차', '차로'] },
            boundary: { limit_by: 'parking_spots' },
            evidence_requirement: ['parking_info'],
            risk_vector: { overclaim_parking: 'medium' },
            action_policy: { cta: 'open_map' },
            novelty: 'existing_matched',
            confidence: 0.92
          }
        ]
      };

      vi.mocked(aiMock.generateStructuredOutput).mockResolvedValueOnce(mockResult);

      const existing = [
        {
          id: 'existing-uuid-1',
          concept_name: '주차 필요',
          slug: 'constraint.parking_required',
          definition: '차량 방문으로 인한 주차장 구비 요건'
        }
      ];

      const results = await distiller.distillEntities(
        mockWorkspaceId,
        {
          scene_name: '제주공항 주차 카페 Scene',
          normalized_question: '제주공항 근처에서 주차가 편리한 카페는 어디인가요?',
          evidence_requirements: ['parking_info'],
          risk_policy: {},
          cta_policy: {}
        },
        existing
      );

      expect(results.length).toBe(1);
      expect(results[0].id).toBe('existing-uuid-1'); // Correctly matched and bound
      expect(results[0].novelty).toBe('existing_matched');
      expect(results[0].concept_name).toBe('주차 필요');
    });
  });

  describe('4. AttractorPromoter Tests', () => {
    it('should evaluate promotion based on score thresholds and compile spec', async () => {
      const promoter = new AttractorPromoter();

      const mockSpec = {
        id: 'attractor.local.parking_easy_cafe',
        version: '0.1.0',
        status: 'draft',
        type: ['comparison_anchor', 'trust'],
        scope: 'domain',
        natural_definition: '주차 편리성 카페 안내 패턴',
        trigger_state: {
          user_question_patterns: ['주차 편한 카페'],
          context_requirements: ['constraint.parking_required'],
          risk_state: { level: 'medium' },
          intent_state: ['visit_decision'],
          missing_context: []
        },
        concept_state: {
          required_concepts: ['constraint.parking_required'],
          allowed_concepts: [],
          forbidden_concepts: []
        },
        evidence_anchor: {
          required_sources: ['official_answer'],
          evidence_visibility_rule: 'always',
          claim_strength_limit: 'supported'
        },
        vibe_signature: {
          L0_core_affect: { valence: 'positive', arousal: 'low', control: 'high' },
          L1_expressive_style: { warmth_style: 'medium', precision: 'high', energy: 'low', sophistication: 'medium', novelty: 'low', intimacy: 'medium', authenticity: 'high' },
          L2_motivational_affordance: { autonomy_support: 'high', competence_support: 'medium', relatedness_support: 'low', promotion_frame: 'medium', prevention_frame: 'low' },
          L3_social_appraisal: { warmth: 'medium', competence: 'high', trust: 'high', fairness: 'medium', agency: 'medium' },
          avoid_vibe: []
        },
        action_policy: {
          allowed_actions: ['show_map'],
          blocked_actions: [],
          cta_policy: { primary: 'open_map', secondary: [], blocked: [] },
          safety_policy: { boundary_notes: [], escalation_conditions: [] }
        },
        media_soliton_rule: {
          core_proposition: '공식 답변과 사진으로 주차를 확인한 뒤 방문하세요.',
          evidence_anchor: 'map_parking_info',
          cta_vector: 'map_link',
          channel_adaptation_rules: {
            homepage: '주차가 간편한 로컬 카페 모음',
            answer_card: '주차 가능한 카페 목록',
            chatbot: '주차가 편리한 곳을 추천해드릴게요.',
            cardnews: '주차하기 좋은 카페 리스트',
            ad: '주차 편한 로컬 카페 추천',
            sales_script: '차량 방문이신가요?',
            llm_txt: 'Parking availability specifications.'
          }
        },
        target_state: { cognitive: [], affective: [], motivational: [], behavioral: [] },
        metrics: {},
        failure_modes: [],
        recomposition_rule: { if_failed_then: [] }
      };

      vi.mocked(aiMock.generateStructuredOutput).mockResolvedValueOnce(mockSpec);

      const result = await promoter.evaluatePromotion(mockWorkspaceId, mockDomainId, {
        scene_id: 'scene-1',
        scene_name: '제주공항 주차 카페 Scene',
        normalized_question: '제주공항 근처에서 주차가 편리한 카페는 어디인가요?',
        cps_score: 82.0,
        cluster_size: 8,
        tco_entities: [{ slug: 'constraint.parking_required', name: '주차 필요', concept_type: 'constraint' }],
        evidence_requirements: ['parking_info'],
        cta_policy: { primary: 'open_map' },
        risk_level: 'medium'
      });

      expect(result.promoted).toBe(true);
      expect(result.promotion_score).toBeGreaterThanOrEqual(68.0);
      expect(result.attractor_spec).toBeDefined();
      expect(result.attractor_spec?.id).toBe('attractor.local.parking_easy_cafe');
    });
  });
});
