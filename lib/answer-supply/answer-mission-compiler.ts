/**
 * lib/answer-supply/answer-mission-compiler.ts
 * 
 * Combines Canonical Question, QIS Scene, TCO entities, Evidence, and Policies into an Answer Mission.
 * Includes Supabase integration with automatic fallback simulation if database tables are missing.
 */

import { getSupabaseAdminClient } from '../supabase';

export interface AnswerMission {
  id: string;
  workspaceId: string;
  questionId: string;
  sceneId: string;
  verticalId: string;
  tenantId?: string;
  question: {
    id: string;
    normalizedQuestion: string;
    slug: string;
    primaryIntent: string;
    riskLevel: string;
  };
  scene: {
    id: string;
    sceneName: string;
    scenarioContext: string;
    sceneType: string;
    riskLevel: string;
  };
  searchIntent: string;
  answerGoal: string;
  directAnswerContract: {
    maxCharacters?: number;
    requiredTone?: string;
    coreMessage?: string;
  };
  surfaceContract: {
    allowedChannels: string[];
    requiredSections?: string[];
  };
  structuredDataContract: {
    schemaType: string;
    primaryFields: string[];
  };
  evidenceContract: {
    requiredEvidenceTypes: string[];
    minimumConfidenceScore?: number;
    requireVerification: boolean;
  };
  internalLinkContract: {
    conceptRefs: string[];
    targetEntitySlug?: string;
    anchorTextPattern?: string;
  };
  decisionCriteria: string[];
  requiredClaims: string[];
  requiredEvidence: string[];
  allowedStrength: string;
  mustInclude: string[];
  mustNotInclude: string[];
  warnings: string[];
  ctaPolicy: {
    primaryCtaText?: string;
    ctaUrlPattern?: string;
    requiredDisclosures?: string[];
  };
  expiry: string;
  createdAt: string;
}

export class AnswerMissionCompiler {
  /**
   * Compiles an AnswerMission from the provided Canonical Question ID and QIS Scene ID.
   */
  async compile(workspaceId: string, questionId: string, sceneId: string): Promise<AnswerMission> {
    const supabase = getSupabaseAdminClient();

    let canonicalQuestion: any = null;
    let qisScene: any = null;
    let tcoEntities: any[] = [];
    let evidenceItems: any[] = [];
    let boundaryRules: any[] = [];

    let isDbSimulated = false;

    try {
      // 1. Fetch Canonical Question
      const { data: cq, error: cqError } = await supabase
        .from('canonical_questions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('id', questionId)
        .maybeSingle();

      if (cqError || !cq) {
        throw new Error(cqError ? cqError.message : 'Canonical question not found');
      }
      canonicalQuestion = cq;

      // 2. Fetch QIS Scene
      const { data: scene, error: sceneError } = await supabase
        .from('qis_scenes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('id', sceneId)
        .maybeSingle();

      if (sceneError || !scene) {
        throw new Error(sceneError ? sceneError.message : 'QIS scene not found');
      }
      qisScene = scene;

      // 3. Fetch TCO Concepts linked to question or scene
      const conceptIds: string[] = [
        ...(canonicalQuestion.linked_tco_entities || []),
        ...(canonicalQuestion.requiredConceptIds || []),
        ...(qisScene.context_tensor?.tco_refs || [])
      ].filter(Boolean);

      if (conceptIds.length > 0) {
        const { data: concepts, error: conceptError } = await supabase
          .from('tco_concepts')
          .select('*')
          .in('id', conceptIds);
        
        if (!conceptError && concepts) {
          tcoEntities = concepts;
        }
      }

      // 4. Fetch Evidence items linked or required
      const evidenceNeedTypes: string[] = canonicalQuestion.evidence_need || [];
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (!evidenceError && evidence) {
        evidenceItems = evidence.filter(e => 
          evidenceNeedTypes.includes(e.evidence_type) || 
          (canonicalQuestion.evidenceIds || []).includes(e.id)
        );
      }

      // 5. Fetch active Boundary Rules
      const { data: boundaries, error: boundaryError } = await supabase
        .from('boundary_rules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true);

      if (!boundaryError && boundaries) {
        boundaryRules = boundaries;
      }

    } catch (dbError) {
      console.warn(`[AnswerMissionCompiler] DB query failed or table missing. Switching to simulation mode. Details: ${(dbError as Error).message}`);
      isDbSimulated = true;
      
      // Construct simulated objects for fallback
      canonicalQuestion = {
        id: questionId,
        normalized_question: '제주도 독채 풀빌라 3인 가족 기준 추천과 소아 동반 정책은 어떻게 되나요?',
        slug: 'jeju-pool-villa-3person-family-kids-policy',
        signature: 'sim-signature-12345',
        primary_intent: 'informational',
        risk_level: 'low',
        linked_tco_entities: ['concept-villa', 'concept-kidspolicy'],
        evidence_need: ['manual_verify', 'certificate'],
        variants: ['제주 풀빌라 소아동반 정책', '제주도 3인 가족 펜션 추천'],
        user_context: { persona_hints: ['가족 여행객', '소아 동반'], journey_stage: 'research' }
      };

      qisScene = {
        id: sceneId,
        scene_name: '제주 독채 펜션 가족 여행 scene',
        scenario_context: '아이와 함께 머물 수 있는 프라이빗한 독채 풀빌라를 찾는 3인 가족의 검색 여정',
        scene_type: 'factoid',
        risk_level: 'low',
        must_include: ['소아 동반 가능 여부', '개별 수영장 온수 여부'],
        must_not_do: ['허위 광고 문구 사용', '의학적 치유 효능 언급 금지'],
        confidence_score: 0.85
      };

      tcoEntities = [
        { id: 'concept-villa', concept_name: '독채 풀빌라', slug: 'pool-villa', definition: '개별 독채 건물 전체를 대여하고 전용 수영장을 구비한 고급 숙박 시설' },
        { id: 'concept-kidspolicy', concept_name: '소아 동반 정책', slug: 'kids-policy', definition: '만 12세 이하 소아에 대한 객실 인원 가산 및 추가 비용 부과 기준' }
      ];

      evidenceItems = [
        { id: 'ev-1', title: 'A펜션 소아 요금 기준표', content: '만 3세 이하 무료, 3세 초과 7세 이하 1인당 15,000원 추가', evidence_type: 'manual_verify', is_verified: true }
      ];

      boundaryRules = [
        { id: 'rule-1', rule_name: '과장광고 방지 룰', forbidden_terms: ['최고', '최초', '100% 만족'], required_disclosures: ['현지 사정에 따라 요금이 변경될 수 있습니다.'], risk_level: 'medium' }
      ];
    }

    // Combine parameters into an AnswerMission
    const allowedStrength = canonicalQuestion.risk_level === 'critical' || canonicalQuestion.risk_level === 'high'
      ? 'disclaimer_only'
      : evidenceItems.length > 0 ? 'substantiated' : 'neutral';

    // Collect forbidden terms and disclosures from boundary rules
    const mustNotInclude = [...(qisScene.must_not_do || [])];
    const warnings = [...(qisScene.warnings || [])];
    
    for (const rule of boundaryRules) {
      if (rule.forbidden_terms) {
        mustNotInclude.push(...rule.forbidden_terms);
      }
      if (rule.required_disclosures) {
        warnings.push(...rule.required_disclosures);
      }
    }

    const missionId = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90); // default 90 days expiry

    const mission: AnswerMission = {
      id: missionId,
      workspaceId,
      questionId,
      sceneId,
      verticalId: canonicalQuestion.domain_id || 'default-vertical',
      tenantId: canonicalQuestion.tenant_id || undefined,
      question: {
        id: canonicalQuestion.id,
        normalizedQuestion: canonicalQuestion.normalized_question,
        slug: canonicalQuestion.slug,
        primaryIntent: canonicalQuestion.primary_intent || 'informational',
        riskLevel: canonicalQuestion.risk_level || 'low'
      },
      scene: {
        id: qisScene.id,
        sceneName: qisScene.scene_name,
        scenarioContext: qisScene.scenario_context,
        sceneType: qisScene.scene_type || 'factoid',
        riskLevel: qisScene.risk_level || 'low'
      },
      searchIntent: canonicalQuestion.primary_intent || 'informational',
      answerGoal: `Provide a structured direct answer addressing '${canonicalQuestion.normalized_question}' verified by evidence and aligned with brand guidelines.`,
      directAnswerContract: {
        maxCharacters: 250,
        requiredTone: 'neutral_professional',
        coreMessage: qisScene.scenario_context
      },
      surfaceContract: {
        allowedChannels: ['homepage', 'answer_card', 'chatbot', 'cardnews', 'ad', 'sales_script', 'llm_txt'],
        requiredSections: ['H1', 'direct_answer', 'proof', 'routines', 'cautions', 'references']
      },
      structuredDataContract: {
        schemaType: canonicalQuestion.risk_level === 'critical' ? 'Article' : 'FAQPage',
        primaryFields: ['question', 'answerText', 'author', 'publisher']
      },
      evidenceContract: {
        requiredEvidenceTypes: canonicalQuestion.evidence_need || ['manual_verify'],
        minimumConfidenceScore: 0.70,
        requireVerification: true
      },
      internalLinkContract: {
        conceptRefs: tcoEntities.map(t => t.slug),
        targetEntitySlug: canonicalQuestion.slug,
        anchorTextPattern: canonicalQuestion.normalized_question.substring(0, 15)
      },
      decisionCriteria: tcoEntities.map(t => `${t.concept_name}: ${t.definition}`),
      requiredClaims: tcoEntities.map(t => `The tenant conforms to ${t.concept_name} standards.`),
      requiredEvidence: evidenceItems.map(e => `[${e.evidence_type}] ${e.title}: ${e.content}`),
      allowedStrength,
      mustInclude: [...(qisScene.must_include || []), ...(canonicalQuestion.variants || []).slice(0, 2)],
      mustNotInclude,
      warnings,
      ctaPolicy: {
        primaryCtaText: '자세히 알아보기',
        ctaUrlPattern: `/answers/${canonicalQuestion.slug}`,
        requiredDisclosures: warnings
      },
      expiry: expiryDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    // Save to Database if table exists
    if (!isDbSimulated) {
      try {
        const { error: insertError } = await supabase
          .from('answer_missions')
          .insert({
            id: mission.id,
            workspace_id: workspaceId,
            question_id: questionId,
            scene_id: sceneId,
            compiled_payload: mission,
            created_at: mission.createdAt
          });
        
        if (insertError) {
          console.warn(`[AnswerMissionCompiler] Could not insert compiled mission to 'answer_missions' table: ${insertError.message}`);
        } else {
          console.log(`[AnswerMissionCompiler] AnswerMission ${mission.id} successfully written to database.`);
        }
      } catch (err) {
        console.warn(`[AnswerMissionCompiler] db write error: ${(err as Error).message}`);
      }
    }

    return mission;
  }
}
