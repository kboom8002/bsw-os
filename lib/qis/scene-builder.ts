/**
 * lib/qis/scene-builder.ts
 * 
 * 결정론적 QIS Scene Builder.
 * 대표 질문(CQ)과 매칭되는 Vertical Pack 정책/Attractor 자산을 결합하여
 * 실행 가능한 QIS Scene 정책 명세를 구축하고, 준비도(readiness_score)를 객관적으로 산출합니다.
 */

import { getAIProvider } from '../ai/ai-provider';
import { ContextTensorBuilder } from '../pattern-attractor/context-tensor-builder';
import { DomainPackLoader } from '../pattern-attractor/domain-pack-loader';

export interface SceneBuilderInput {
  id: string;
  normalized_question: string;
  primary_intent?: string;
  risk_level?: string;
  constraints?: string[];
  evidence_need?: string[];
}

export interface QisSceneResult {
  scene_name: string;
  intent_model: {
    primary_intent: string;
    secondary_intents: string[];
  };
  context_tensor: Record<string, any>;
  evidence_requirements: string[];
  risk_policy: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    blocked_claims: string[];
    required_disclaimers: string[];
    verification_required: string[];
  };
  answer_policy: {
    short_answer_rule: string;
    detail_structure: string[];
    comparison_required: boolean;
    safe_phrasing: string[];
  };
  cta_policy: {
    primary: string;
    secondary: string[];
    blocked: string[];
  };
  must_do: string[];
  must_not_do: string[];
  output_targets: string[];
  readiness_score: number;
  matched_attractor_id: string | null;
}

export class SceneBuilder {

  /**
   * 대표 질문(CQ)을 바탕으로 실행 가능한 QIS Scene 정책 명세를 구축합니다.
   * [v2.0] Rule Engine (Vertical Pack 정책 로드) + LLM 보강 하이브리드 엔진 적용.
   */
  async buildScene(
    workspaceId: string,
    domainId: string, // 'kbeauty-skincare' 또는 'jeju-context-travel' 등의 슬러그
    cq: SceneBuilderInput
  ): Promise<QisSceneResult> {
    const ai = getAIProvider();

    // 1. 기존 ContextTensorBuilder를 활용하여 7축 텐서 기초 빌드
    const basicTensor = await ContextTensorBuilder.buildFromQuery(
      cq.normalized_question,
      domainId,
      'answer_card'
    );

    // 2. [Stage 1] Vertical Pack 정책 파일 로드 (결정론적)
    let packPolicies: any = null;
    let matchedAttractor: any = null;

    try {
      const pack = DomainPackLoader.loadPackFromDir(domainId);
      packPolicies = pack.policies;
      
      // 쿼리 매칭을 통해 가장 부합하는 Attractor 탐색 (키워드 매칭 우선)
      const queryLower = cq.normalized_question.toLowerCase();
      let bestScore = -1;
      
      for (const attr of pack.attractors) {
        const patterns = attr.trigger_state?.user_question_patterns || [];
        for (const pattern of patterns) {
          const patLower = pattern.toLowerCase();
          // 단순 substring 매칭으로 유사성 스코어 임시 산출
          let score = 0;
          if (queryLower.includes(patLower) || patLower.includes(queryLower)) {
            score += 50;
          }
          const words = patLower.split(/\s+/);
          const matchedWords = words.filter((w: string) => queryLower.includes(w)).length;
          score += (matchedWords / words.length) * 50;

          if (score > bestScore && score > 30) {
            bestScore = score;
            matchedAttractor = attr;
          }
        }
      }
    } catch (err) {
      console.warn(`[SceneBuilder] Failed to load Vertical Pack "${domainId}" standard policies. Using stubs.`, (err as Error).message);
    }

    // 3. [Stage 2] AI Provider를 통한 must_do, must_not_do 및 세부 정책 생성 (LLM 보강)
    const prompt = `당신은 QIS Scene Builder Agent입니다.
대표 질문(CQ)을 바탕으로 실행 가능한 최종 QIS Scene 정책 명세를 작성하십시오.
규칙 기반 정책 가이드라인과 매칭된 Attractor 정보를 참고하여 논리적으로 채워 넣되, 
반드시 스키마 양식을 만족하는 JSON 객체만을 출력하십시오.

대표 질문 상세:
- 질문: "${cq.normalized_question}"
- 기본 의도: "${cq.primary_intent || 'unknown'}"
- 초기 위험 수준: "${cq.risk_level || 'medium'}"
- 제약 조건: ${JSON.stringify(cq.constraints || [])}
- 필수 실측 힌트: ${JSON.stringify(cq.evidence_need || [])}
- 매칭된 Attractor 정책: ${JSON.stringify(matchedAttractor || '없음')}
- 웹팩 allowed/blocked 정책: ${JSON.stringify(packPolicies || '없음')}

출력 규칙:
1. cta_policy, risk_policy는 웹팩 정책을 최우선적으로 상속받으십시오.
2. must_do, must_not_do에는 이 질문에 답변할 때 반드시 지켜야 할 운영 기준 및 금지 사항을 명시하십시오.

반드시 지정된 JSON 스키마를 따르십시오.`;

    const schema = {
      type: "OBJECT",
      properties: {
        scene_name: { type: "STRING" },
        intent_model: {
          type: "OBJECT",
          properties: {
            primary_intent: { type: "STRING" },
            secondary_intents: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["primary_intent", "secondary_intents"]
        },
        evidence_requirements: { type: "ARRAY", items: { type: "STRING" } },
        risk_policy: {
          type: "OBJECT",
          properties: {
            risk_level: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
            blocked_claims: { type: "ARRAY", items: { type: "STRING" } },
            required_disclaimers: { type: "ARRAY", items: { type: "STRING" } },
            verification_required: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["risk_level", "blocked_claims", "required_disclaimers", "verification_required"]
        },
        answer_policy: {
          type: "OBJECT",
          properties: {
            short_answer_rule: { type: "STRING" },
            detail_structure: { type: "ARRAY", items: { type: "STRING" } },
            comparison_required: { type: "BOOLEAN" },
            safe_phrasing: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["short_answer_rule", "detail_structure", "comparison_required", "safe_phrasing"]
        },
        cta_policy: {
          type: "OBJECT",
          properties: {
            primary: { type: "STRING" },
            secondary: { type: "ARRAY", items: { type: "STRING" } },
            blocked: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["primary", "secondary", "blocked"]
        },
        must_do: { type: "ARRAY", items: { type: "STRING" } },
        must_not_do: { type: "ARRAY", items: { type: "STRING" } },
        output_targets: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: [
        "scene_name", "intent_model", "evidence_requirements", "risk_policy",
        "answer_policy", "cta_policy", "must_do", "must_not_do", "output_targets"
      ]
    };

    let llmResult: any;
    try {
      llmResult = await ai.generateStructuredOutput<any>(prompt, schema, { temperature: 0.1 });
    } catch (err) {
      console.error("[SceneBuilder] LLM generation failed, using deterministic fallback", err);
      // Fallback
      llmResult = {
        scene_name: `${cq.normalized_question.slice(0, 30)} Scene`,
        intent_model: { primary_intent: cq.primary_intent || 'informational', secondary_intents: [] },
        evidence_requirements: cq.evidence_need || [],
        risk_policy: {
          risk_level: (cq.risk_level as any) || 'medium',
          blocked_claims: [],
          required_disclaimers: [],
          verification_required: []
        },
        answer_policy: {
          short_answer_rule: 'Direct answer to user query.',
          detail_structure: ['Direct answer', 'Supporting details'],
          comparison_required: false,
          safe_phrasing: []
        },
        cta_policy: {
          primary: packPolicies?.cta_policy?.primary || 'open_map',
          secondary: packPolicies?.cta_policy?.secondary || [],
          blocked: packPolicies?.cta_policy?.blocked || []
        },
        must_do: [],
        must_not_do: [],
        output_targets: ['answer_card']
      };
    }

    // 4. [Stage 3] 결정론적 readiness_score 스코어링 산출 (체크리스트 기반)
    const readinessScore = this.calculateReadinessScore(llmResult, matchedAttractor, packPolicies);

    return {
      ...llmResult,
      context_tensor: basicTensor,
      readiness_score: readinessScore,
      matched_attractor_id: matchedAttractor ? matchedAttractor.id : null
    } as QisSceneResult;
  }

  /**
   * 결정론적 준비도 점수 산출 공식 (readiness_score)
   */
  private calculateReadinessScore(scene: any, matchedAttractor: any, packPolicies: any): number {
    let score = 0;

    // 1. 매칭된 표준 Attractor 존재 여부 (25점)
    if (matchedAttractor) score += 25;

    // 2. 가용 근거 요구사항 정의 여부 (20점)
    if (scene.evidence_requirements && scene.evidence_requirements.length > 0) {
      score += 20;
    }

    // 3. CTA 정책 완비도 (15점)
    if (scene.cta_policy?.primary) {
      score += 15;
    }

    // 4. 금지 행위 및 권장 행위 상세 정의 여부 (20점)
    if (scene.must_do?.length >= 2) score += 10;
    if (scene.must_not_do?.length >= 1) score += 10;

    // 5. 웹팩 글로벌 정책 일치성 상속 여부 (20점)
    if (packPolicies) {
      const matchAllowed = scene.must_do.some((d: string) => 
        packPolicies.allowed_actions.some((a: string) => d.includes(a) || a.includes(d))
      );
      const matchBlocked = scene.must_not_do.some((d: string) => 
        packPolicies.blocked_actions.some((b: string) => d.includes(b) || b.includes(d))
      );
      if (matchAllowed || matchBlocked) {
        score += 20;
      } else {
        score += 10; // 부분 상속
      }
    }

    return Math.min(100, score);
  }
}
