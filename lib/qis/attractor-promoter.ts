import { getAIProvider } from '../ai/ai-provider';
import { PatternAttractorSpec } from '../pattern-attractor/types';

export interface PromotionInput {
  scene_id: string;
  scene_name: string;
  normalized_question: string;
  cps_score: number;
  cluster_size: number;
  tco_entities: Array<{ slug: string; name: string; concept_type: string }>;
  evidence_requirements: string[];
  cta_policy: Record<string, any>;
  risk_level: string;
}

export interface PromotionResult {
  promoted: boolean;
  promotion_score: number;
  attractor_spec?: PatternAttractorSpec;
  rationale: string;
}

export class AttractorPromoter {
  /**
   * QIS Scene 및 TCO 분석 메타데이터를 사용하여 Pattern Attractor 후보 승격 심사를 진행하고 Spec을 생성합니다.
   */
  async evaluatePromotion(
    workspaceId: string,
    domainSlug: string,
    input: PromotionInput
  ): Promise<PromotionResult> {
    const ai = getAIProvider();

    // 1. Attractor Promotion Score 계산
    // 0~100점 척도로 계산
    const qisCpsPart = (input.cps_score || 50) * 0.25;
    // 클러스터 사이즈 크기별 가중치 (Max 100 가정)
    const clusterSizePart = Math.min(100, (input.cluster_size || 1) * 10) * 0.20;
    const tcoRepetitionPart = Math.min(10, input.tco_entities.length) * 10 * 0.15;
    const feasibilityPart = 75 * 0.15; // 기본 구현 가능성
    const evidencePart = (input.evidence_requirements.length > 0 ? 90 : 30) * 0.10;
    const ctaPart = (input.cta_policy?.primary ? 90 : 30) * 0.10;
    const strategicPart = 80 * 0.05;

    const computedScore = parseFloat(
      (qisCpsPart + clusterSizePart + tcoRepetitionPart + feasibilityPart + evidencePart + ctaPart + strategicPart).toFixed(2)
    );

    // 승격 조건: 68점 이상
    const isPromoted = computedScore >= 68.0;

    if (!isPromoted) {
      return {
        promoted: false,
        promotion_score: computedScore,
        rationale: `Promotion Score (${computedScore}) did not meet the standard threshold of 68.0.`
      };
    }

    const prompt = `You are a Pattern Attractor Promotion Agent.
A QIS Scene has been approved for promotion to a Pattern Attractor.
Your job is to generate a comprehensive PatternAttractorSpec following the standard format (10 sections).

Inputs:
- Scene ID: "${input.scene_id}"
- Scene Name: "${input.scene_name}"
- Query Pattern: "${input.normalized_question}"
- Risk Level: "${input.risk_level}"
- TCO Concepts Linked: ${JSON.stringify(input.tco_entities)}
- Evidence Needed: ${JSON.stringify(input.evidence_requirements)}
- CTA Policy: ${JSON.stringify(input.cta_policy)}
- Computed Promotion Score: ${computedScore}

Generate a PatternAttractorSpec matching the standard types:
- trigger_state: user_question_patterns, context_requirements (domain/TCOs), risk_state, intent_state, missing_context
- concept_state: required_concepts, allowed_concepts, forbidden_concepts
- evidence_anchor: required_sources, evidence_visibility_rule, claim_strength_limit
- vibe_signature: L0_core_affect, L1_expressive_style, L2_motivational_affordance, L3_social_appraisal, avoid_vibe
- action_policy: allowed_actions, blocked_actions, cta_policy (primary, secondary, blocked), safety_policy
- media_soliton_rule: core_proposition, evidence_anchor, cta_vector, channel_adaptation_rules for homepage, answer_card, chatbot, cardnews, ad, sales_script, llm_txt
- target_state: cognitive, affective, motivational, behavioral
- metrics: Key KPIs to track performance
- failure_modes: Under what conditions does this fail?
- recomposition_rule: if_failed_then rules

Return JSON matching the schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        id: { type: "STRING" },
        version: { type: "STRING" },
        status: { type: "STRING", enum: ["draft", "active", "deprecated"] },
        type: { type: "ARRAY", items: { type: "STRING" } },
        scope: { type: "STRING", enum: ["domain", "brand"] },
        natural_definition: { type: "STRING" },
        trigger_state: {
          type: "OBJECT",
          properties: {
            user_question_patterns: { type: "ARRAY", items: { type: "STRING" } },
            context_requirements: { type: "ARRAY", items: { type: "STRING" } },
            risk_state: {
              type: "OBJECT",
              properties: { level: { type: "STRING", enum: ["low", "medium", "high", "uncertain"] } },
              required: ["level"]
            },
            intent_state: { type: "ARRAY", items: { type: "STRING" } },
            missing_context: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["user_question_patterns", "context_requirements", "risk_state", "intent_state", "missing_context"]
        },
        concept_state: {
          type: "OBJECT",
          properties: {
            required_concepts: { type: "ARRAY", items: { type: "STRING" } },
            allowed_concepts: { type: "ARRAY", items: { type: "STRING" } },
            forbidden_concepts: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["required_concepts", "allowed_concepts", "forbidden_concepts"]
        },
        evidence_anchor: {
          type: "OBJECT",
          properties: {
            required_sources: { type: "ARRAY", items: { type: "STRING" } },
            evidence_visibility_rule: { type: "STRING" },
            claim_strength_limit: { type: "STRING", enum: ["none", "limited", "supported", "strong"] }
          },
          required: ["required_sources", "evidence_visibility_rule", "claim_strength_limit"]
        },
        vibe_signature: {
          type: "OBJECT",
          properties: {
            L0_core_affect: {
              type: "OBJECT",
              properties: {
                valence: { type: "STRING" },
                arousal: { type: "STRING", enum: ["low", "medium", "high"] },
                control: { type: "STRING", enum: ["low", "medium", "high"] }
              },
              required: ["valence", "arousal", "control"]
            },
            L1_expressive_style: {
              type: "OBJECT",
              properties: {
                warmth_style: { type: "STRING", enum: ["low", "medium", "high"] },
                precision: { type: "STRING", enum: ["low", "medium", "high"] },
                energy: { type: "STRING", enum: ["low", "medium", "high"] },
                sophistication: { type: "STRING", enum: ["low", "medium", "high"] },
                novelty: { type: "STRING", enum: ["low", "medium", "high"] },
                intimacy: { type: "STRING", enum: ["low", "medium", "high"] },
                authenticity: { type: "STRING", enum: ["low", "medium", "high"] }
              },
              required: ["warmth_style", "precision", "energy", "sophistication", "novelty", "intimacy", "authenticity"]
            },
            L2_motivational_affordance: {
              type: "OBJECT",
              properties: {
                autonomy_support: { type: "STRING", enum: ["low", "medium", "high"] },
                competence_support: { type: "STRING", enum: ["low", "medium", "high"] },
                relatedness_support: { type: "STRING", enum: ["low", "medium", "high"] },
                promotion_frame: { type: "STRING", enum: ["low", "medium", "high"] },
                prevention_frame: { type: "STRING", enum: ["low", "medium", "high"] }
              },
              required: ["autonomy_support", "competence_support", "relatedness_support", "promotion_frame", "prevention_frame"]
            },
            L3_social_appraisal: {
              type: "OBJECT",
              properties: {
                warmth: { type: "STRING", enum: ["low", "medium", "high"] },
                competence: { type: "STRING", enum: ["low", "medium", "high"] },
                trust: { type: "STRING", enum: ["low", "medium", "high"] },
                fairness: { type: "STRING", enum: ["low", "medium", "high"] },
                agency: { type: "STRING", enum: ["low", "medium", "high"] }
              },
              required: ["warmth", "competence", "trust", "fairness", "agency"]
            },
            avoid_vibe: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["L0_core_affect", "L1_expressive_style", "L2_motivational_affordance", "L3_social_appraisal", "avoid_vibe"]
        },
        action_policy: {
          type: "OBJECT",
          properties: {
            allowed_actions: { type: "ARRAY", items: { type: "STRING" } },
            blocked_actions: { type: "ARRAY", items: { type: "STRING" } },
            cta_policy: {
              type: "OBJECT",
              properties: {
                primary: { type: "STRING" },
                secondary: { type: "ARRAY", items: { type: "STRING" } },
                blocked: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["primary", "secondary", "blocked"]
            },
            safety_policy: {
              type: "OBJECT",
              properties: {
                boundary_notes: { type: "ARRAY", items: { type: "STRING" } },
                escalation_conditions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["boundary_notes", "escalation_conditions"]
            }
          },
          required: ["allowed_actions", "blocked_actions", "cta_policy", "safety_policy"]
        },
        media_soliton_rule: {
          type: "OBJECT",
          properties: {
            core_proposition: { type: "STRING" },
            evidence_anchor: { type: "STRING" },
            cta_vector: { type: "STRING" },
            channel_adaptation_rules: {
              type: "OBJECT",
              properties: {
                homepage: { type: "STRING" },
                answer_card: { type: "STRING" },
                chatbot: { type: "STRING" },
                cardnews: { type: "STRING" },
                ad: { type: "STRING" },
                sales_script: { type: "STRING" },
                llm_txt: { type: "STRING" }
              },
              required: ["homepage", "answer_card", "chatbot", "cardnews", "ad", "sales_script", "llm_txt"]
            }
          },
          required: ["core_proposition", "evidence_anchor", "cta_vector", "channel_adaptation_rules"]
        },
        target_state: {
          type: "OBJECT",
          properties: {
            cognitive: { type: "ARRAY", items: { type: "STRING" } },
            affective: { type: "ARRAY", items: { type: "STRING" } },
            motivational: { type: "ARRAY", items: { type: "STRING" } },
            behavioral: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["cognitive", "affective", "motivational", "behavioral"]
        },
        metrics: { type: "OBJECT" },
        failure_modes: { type: "ARRAY", items: { type: "STRING" } },
        recomposition_rule: {
          type: "OBJECT",
          properties: {
            if_failed_then: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["if_failed_then"]
        }
      },
      required: [
        "id", "version", "status", "type", "scope", "natural_definition",
        "trigger_state", "concept_state", "evidence_anchor", "vibe_signature",
        "action_policy", "media_soliton_rule", "target_state", "metrics",
        "failure_modes", "recomposition_rule"
      ]
    };

    try {
      const spec = await ai.generateStructuredOutput<PatternAttractorSpec>(prompt, schema, { temperature: 0.1 });
      return {
        promoted: true,
        promotion_score: computedScore,
        attractor_spec: {
          ...spec,
          domain: { id: domainSlug, name: domainSlug }
        },
        rationale: `Promotion Score (${computedScore}) exceeded threshold of 68.0. Attractor spec successfully compiled.`
      };
    } catch (err) {
      console.error("[AttractorPromoter] Spec compilation failed, returning promotion without spec object", err);
      return {
        promoted: true,
        promotion_score: computedScore,
        rationale: `Promotion Score exceeded 68.0, but spec compilation failed due to LLM error: ${err}`
      };
    }
  }
}
