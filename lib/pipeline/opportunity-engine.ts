/**
 * lib/pipeline/opportunity-engine.ts
 * 
 * PRD §M3 및 SDD §7.4 규격을 완전 반영한 Opportunity Engine.
 * 7대 양의 차원과 3대 음의 차원(감점 요인)을 복합적으로 연산하여
 * 최종 질문의 우선순위 점수를 산출합니다.
 */

import { getSupabaseAdminClient } from '../supabase';

export interface OpportunityScoreInput {
  cqId: string;
  normalizedQuestion: string;
  volume?: number;
  intent?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  evidenceReadinessRatio?: number; // 0.0 ~ 1.0 (가용 증거 비율)
  hasDirectCta?: boolean;
  isDuplicate?: boolean;
  daysSinceLastUpdate?: number;
}

export interface OpportunityScoreBreakdown {
  demand: number;              // 1. 수요 (GSC 볼륨 등)
  businessRelevance: number;   // 2. 비즈니스 연관도
  rightToAnswer: number;       // 3. 답변 적격성 (전문성)
  evidenceReadiness: number;   // 4. 근거 준비도
  differentiation: number;     // 5. 차별성
  actionPotential: number;     // 6. 행동 전환 가능성
  reusePotential: number;      // 7. 재사용성 (채널 다각화)
  
  policyRisk: number;          // 8. 정책 위험도 (감점)
  duplicationRisk: number;     // 9. 중복 문서 위험도 (감점)
  freshnessRisk: number;       // 10. 정보 최신성 위험도 (감점)
  
  totalScore: number;
  estimateType: 'HEURISTIC' | 'CALIBRATED';
}

export class OpportunityEngine {

  /**
   * 질문의 10대 차원 종합 우선순위 스코어(Opportunity Score) 산출
   */
  public static calculateOpportunityScore(input: OpportunityScoreInput, externalData?: any): OpportunityScoreBreakdown {
    // 1. Demand (0 ~ 100)
    const volume = input.volume || 0;
    const demand = volume > 0 
      ? Math.min(100, Math.round(Math.log10(volume + 1) * 25))
      : 30;

    // 2. Business Relevance (0 ~ 100)
    // 브랜드 키워드 및 업종 핵심 컨셉 일치성
    let businessRelevance = 60;
    if (externalData?.hasConceptMatch) businessRelevance += 20;
    if (externalData?.isStrategicConcept) businessRelevance += 20;

    // 3. Right to Answer (0 ~ 100)
    // 자격 증명 가능 여부 및 도메인 성숙도
    let rightToAnswer = 50;
    if (input.riskLevel === 'low') rightToAnswer = 90;
    else if (input.riskLevel === 'medium') rightToAnswer = 75;
    else if (externalData?.isExpertVerified) rightToAnswer = 95;

    // 4. Evidence Readiness (0 ~ 100)
    // 실측 데이터 가용 비중 (PRD §M3-4)
    const evidenceReadiness = Math.round((input.evidenceReadinessRatio ?? 0.0) * 100);

    // 5. Differentiation (0 ~ 100)
    // 타사 대비 고유한 팩트 보유 여부
    const differentiation = externalData?.hasUniqueFact ? 90 : 50;

    // 6. Action Potential (0 ~ 100)
    // CTA 활성화 및 링크 존재 여부
    const actionPotential = input.hasDirectCta ? 95 : 60;

    // 7. Reuse Potential (0 ~ 100)
    // 7대 채널 배포 유연성
    const reusePotential = input.intent === 'comparison' || input.intent === 'transactional' ? 90 : 70;

    // 8. Policy Risk (0 ~ -100 감점)
    // YMYL 및 규제 위반 위험도
    let policyRisk = 0;
    if (input.riskLevel === 'critical') policyRisk = -80;
    else if (input.riskLevel === 'high') policyRisk = -40;
    else if (input.riskLevel === 'medium') policyRisk = -15;

    // 9. Duplication Risk (0 ~ -100 감점)
    // Thin Page 생성 방지 감점 요인
    const duplicationRisk = input.isDuplicate ? -70 : 0;

    // 10. Freshness Risk (0 ~ -100 감점)
    // 팩트의 만료 주기 위험성
    const days = input.daysSinceLastUpdate ?? 0;
    let freshnessRisk = 0;
    if (days > 180) freshnessRisk = -50;
    else if (days > 90) freshnessRisk = -20;

    // 최종 결합 공식: 7대 양의 차원 가중 평균 - 3대 음의 차원 감점 반영
    const positiveSum = 
      demand * 0.20 + 
      businessRelevance * 0.15 + 
      rightToAnswer * 0.15 + 
      evidenceReadiness * 0.15 + 
      differentiation * 0.10 + 
      actionPotential * 0.15 + 
      reusePotential * 0.10;

    const penaltySum = policyRisk + duplicationRisk + freshnessRisk;
    
    // 최종 점수 0 ~ 100 제한 클램프
    const totalScore = Math.max(0, Math.min(100, Math.round(positiveSum + penaltySum)));

    return {
      demand,
      businessRelevance,
      rightToAnswer,
      evidenceReadiness,
      differentiation,
      actionPotential,
      reusePotential,
      policyRisk,
      duplicationRisk,
      freshnessRisk,
      totalScore,
      estimateType: volume > 0 ? 'CALIBRATED' : 'HEURISTIC'
    };
  }

  /**
   * Supabase 데이터베이스에 산출된 Opportunity 스코어 기록
   */
  public static async saveScoreToDb(workspaceId: string, score: OpportunityScoreBreakdown & { cqId: string }): Promise<void> {
    const supabase = getSupabaseAdminClient();
    try {
      await supabase
        .from('canonical_questions')
        .update({
          opportunity_score: score.totalScore,
          opportunity_breakdown: {
            demand: score.demand,
            business_relevance: score.businessRelevance,
            right_to_answer: score.rightToAnswer,
            evidence_readiness: score.evidenceReadiness,
            differentiation: score.differentiation,
            action_potential: score.actionPotential,
            reuse_potential: score.reusePotential,
            policy_risk: score.policyRisk,
            duplication_risk: score.duplicationRisk,
            freshness_risk: score.freshnessRisk,
            estimate_type: score.estimateType
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', score.cqId)
        .eq('workspace_id', workspaceId);
      
      console.log(`[OpportunityEngine] Saved opportunity score ${score.totalScore} for CQ ${score.cqId}`);
    } catch (err: any) {
      console.warn('[OpportunityEngine] Failed to save score to DB:', err.message);
    }
  }
}
