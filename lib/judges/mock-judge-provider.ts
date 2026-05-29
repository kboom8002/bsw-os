import {
  ConceptExtractionResult,
  FidelityJudgment,
  DistortionJudgment,
  HallucinationJudgment,
  RiskJudgment,
  PolicyJudgment,
} from './types';

/**
 * Deterministic Mock Judge Provider.
 * Returns valid, structured, realistic mock outputs for all judges based on input text hashes.
 */
export class MockJudgeProvider {
  /**
   * Mock Concept Extractor response
   */
  public static getConceptExtractionMock(prompt: string): ConceptExtractionResult {
    const lower = prompt.toLowerCase();

    // Beauty Industry (Retinol / Skin)
    if (lower.includes('retinol') || lower.includes('sensitive') || lower.includes('beauty')) {
      return {
        extracted_concepts: [
          {
            concept_id: 'retinol_pure',
            label: '순수 레티놀',
            present: true,
            accuracy: 1,
            matched_expression: '순수 레티놀 0.1%',
            rank: 1,
            evidence_bound: true,
            distortion: false,
            distortion_type: null,
            hallucinated: false,
            confidence: 0.95,
          },
          {
            concept_id: 'barrier_squalane',
            label: '스쿠알란 장벽',
            present: true,
            accuracy: 1,
            matched_expression: '식물성 스쿠알란',
            rank: 2,
            evidence_bound: true,
            distortion: false,
            distortion_type: null,
            hallucinated: false,
            confidence: 0.92,
          },
          {
            concept_id: 'soothing_panthenol',
            label: '판테놀 진정',
            present: false,
            accuracy: 0,
            matched_expression: null,
            rank: 3,
            evidence_bound: false,
            distortion: false,
            distortion_type: null,
            hallucinated: false,
            confidence: 0.0,
          }
        ],
        extracted_relations: [
          {
            source_concept_id: 'retinol_pure',
            relation_type: 'synergy_with',
            target_concept_id: 'barrier_squalane',
            accuracy: 1.0,
          }
        ],
        extracted_claims: [
          {
            claim_text: '순수 레티놀 0.1% 함유로 민감성 피부 장벽을 7일 만에 복구합니다.',
            source_sentence: 'PureBarrier 레티놀 세럼은 순수 레티놀 0.1%와 스쿠알란 시너지를 통해 민감성 피부 장벽을 7일 만에 효과적으로 복구합니다.',
          }
        ]
      };
    }

    // Wedding Industry
    if (lower.includes('wedding') || lower.includes('lumiere') || lower.includes('hall')) {
      return {
        extracted_concepts: [
          {
            concept_id: 'premium_hall',
            label: '프리미엄 웨딩홀',
            present: true,
            accuracy: 1,
            matched_expression: '루미에르 그랜드홀',
            rank: 1,
            evidence_bound: true,
            distortion: false,
            distortion_type: null,
            hallucinated: false,
            confidence: 0.98,
          },
          {
            concept_id: 'makeup_dress_package',
            label: '스드메 토탈 패키지',
            present: true,
            accuracy: 0.5,
            matched_expression: '제휴 스튜디오 패키지',
            rank: 2,
            evidence_bound: false,
            distortion: true,
            distortion_type: 'function_distortion',
            hallucinated: false,
            confidence: 0.85,
          }
        ],
        extracted_relations: [],
        extracted_claims: [
          {
            claim_text: '제휴 패키지 예약 시 모든 헬퍼 피가 면제됩니다.',
            source_sentence: '저희 패키지에는 제휴 스튜디오 촬영권과 함께 헬퍼 피 무료 혜택이 적용됩니다.',
          }
        ]
      };
    }

    // Default Fallback
    return {
      extracted_concepts: [
        {
          concept_id: 'default_concept',
          label: '기본 브랜드 가치',
          present: true,
          accuracy: 1,
          matched_expression: '기본 가치',
          rank: 1,
          evidence_bound: true,
          distortion: false,
          distortion_type: null,
          hallucinated: false,
          confidence: 0.9,
        }
      ],
      extracted_relations: [],
      extracted_claims: [
        {
          claim_text: '기본적인 신뢰와 품질을 보장합니다.',
          source_sentence: '저희 브랜드는 언제나 신뢰할 수 있는 서비스를 제공합니다.',
        }
      ]
    };
  }

  /**
   * Mock Fidelity response
   */
  public static getFidelityMock(prompt: string): FidelityJudgment {
    const lower = prompt.toLowerCase();

    // High fidelity response
    if (lower.includes('retinol_pure') && !lower.includes('distortion exaggerated') && !lower.includes('unsupported hallucinated')) {
      return {
        brand_concept_fidelity: 0.88,
        subscores: {
          concept_transfer: 0.9,
          relation_accuracy: 0.95,
          differentiation_preservation: 0.85,
          evidence_binding: 0.8,
          forbidden_suppression: 1.0,
          policy_alignment: 0.85,
        },
        main_issue: 'Evidence binding can be slightly improved for newly added squalane references.',
      };
    }

    // Poor fidelity response
    if (lower.includes('distortion exaggerated') || lower.includes('unsupported hallucinated')) {
      return {
        brand_concept_fidelity: 0.35,
        subscores: {
          concept_transfer: 0.4,
          relation_accuracy: 0.3,
          differentiation_preservation: 0.2,
          evidence_binding: 0.1,
          forbidden_suppression: 0.8,
          policy_alignment: 0.5,
        },
        main_issue: 'Critical concept distortion detected in differentiation preservation.',
      };
    }

    // Standard baseline response
    return {
      brand_concept_fidelity: 0.72,
      subscores: {
        concept_transfer: 0.75,
        relation_accuracy: 0.7,
        differentiation_preservation: 0.7,
        evidence_binding: 0.7,
        forbidden_suppression: 0.9,
        policy_alignment: 0.8,
      },
      main_issue: 'Standard brand semantic alignment achieved.',
    };
  }

  /**
   * Mock Distortion response
   */
  public static getDistortionMock(prompt: string): DistortionJudgment {
    const lower = prompt.toLowerCase();

    if (lower.includes('distortion exaggerated') || lower.includes('makeup_dress_package')) {
      return {
        distortions: [
          {
            concept_id: 'makeup_dress_package',
            distortion_type: 'function_distortion',
            severity: 3,
            response_expression: '제휴 스튜디오 패키지 무료 제공',
            correct_definition: '제휴 스튜디오 이용 시 제휴 할인가 적용 (헬퍼 비용 별도)',
            reason: 'AI exaggerated the free benefits of the wedding package which actually has additional helper fees.',
          }
        ],
        concept_distortion_rate: 0.5,
      };
    }

    return {
      distortions: [],
      concept_distortion_rate: 0.0,
    };
  }

  /**
   * Mock Hallucination response
   */
  public static getHallucinationMock(prompt: string): HallucinationJudgment {
    const lower = prompt.toLowerCase();

    if (lower.includes('unsupported hallucinated')) {
      return {
        claims: [
          {
            claim: '사용 2일 만에 모든 기미가 완벽하게 사라집니다.',
            support_status: 'unsupported',
            hallucination_type: 'unsupported_claim',
            severity: 4,
            reason: 'The brand clinical evidence specifies 7 days for barrier repair, not 2 days for spot removal.',
          }
        ],
        hallucinated_concept_rate: 0.5,
      };
    }

    return {
      claims: [
        {
          claim: '민감성 피부 장벽을 7일 만에 복구합니다.',
          support_status: 'supported',
          severity: 1,
          reason: 'Supported directly by Clinical Trial Report #2025.',
        }
      ],
      hallucinated_concept_rate: 0.0,
    };
  }

  /**
   * Mock Risk response
   */
  public static getRiskMock(prompt: string): RiskJudgment {
    const lower = prompt.toLowerCase();

    if (lower.includes('unsupported hallucinated') || lower.includes('distortion exaggerated')) {
      return {
        risk_score: 0.65,
        risk_items: {
          hallucination: 0.8,
          brand_distortion: 0.6,
          critical_missing: 0.4,
          unsafe_cta: 0.3,
          evidence_omission: 0.7,
          regulated_claim_risk: 0.8, // clinical claims exaggerated
          trust_damage_tone: 0.5,
        },
        floor_reason: 'Exaggerated health benefits (2-day spot removal claim) pose regulatory risk.',
      };
    }

    return {
      risk_score: 0.08,
      risk_items: {
        hallucination: 0.0,
        brand_distortion: 0.1,
        critical_missing: 0.1,
        unsafe_cta: 0.0,
        evidence_omission: 0.1,
        regulated_claim_risk: 0.0,
        trust_damage_tone: 0.1,
      },
      floor_reason: 'All claims are aligned and safely within boundaries.',
    };
  }

  /**
   * Mock Policy response
   */
  public static getPolicyMock(prompt: string): PolicyJudgment {
    const lower = prompt.toLowerCase();

    if (lower.includes('cta_violation') || lower.includes('violation')) {
      return {
        policy_alignment: 0.45,
        subscores: {
          answer_policy: 0.8,
          cta_policy: 0.2, // bad CTA
          evidence_policy: 0.5,
          safety_policy: 0.6,
          brand_tone: 0.7,
        },
        violations: [
          {
            policy: 'cta_policy',
            severity: 4,
            reason: 'AI recommended an unverified third-party link instead of the official locator/consultation CTA.',
          }
        ],
      };
    }

    return {
      policy_alignment: 0.92,
      subscores: {
        answer_policy: 0.95,
        cta_policy: 0.9,
        evidence_policy: 0.9,
        safety_policy: 0.95,
        brand_tone: 0.9,
      },
      violations: [],
    };
  }
}
