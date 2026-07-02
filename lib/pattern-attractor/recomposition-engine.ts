import { getSupabaseAdminClient } from '../supabase';
import { RunReceiptLogger } from './run-receipt-logger';

export interface RecompositionTask {
  attractor_id: string;
  task_type: 'update_concept_boundary' | 'add_evidence_anchor' | 'rewrite_cta' | 'change_vibe_signature' | 'add_followup_question' | 'regenerate_media_soliton';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reason: string;
}

export class RecompositionEngine {
  // Evaluates realized pattern strength based on Run-Receipts
  async evaluatePatternStrength(
    attractorId: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    strength: number;
    trend: 'improving' | 'stable' | 'declining';
    weak_dimensions: string[];
  }> {
    const metrics = await RunReceiptLogger.aggregateMetrics(attractorId, period);
    
    // Fit score + Vibe score + Policy score + 10x CTR
    const strength = parseFloat(
      (
        (metrics.avg_fit_score * 0.3) +
        (metrics.avg_vibe_score * 0.3) +
        (metrics.avg_policy_score * 0.3) +
        ((metrics.ctr * 100) * 0.1)
      ).toFixed(2)
    );

    const weak_dimensions: string[] = [];
    if (metrics.avg_fit_score < 70) weak_dimensions.push('fit_accuracy');
    if (metrics.avg_vibe_score < 70) weak_dimensions.push('vibe_alignment');
    if (metrics.avg_policy_score < 80) weak_dimensions.push('policy_compliance');
    if (metrics.ctr < 0.05) weak_dimensions.push('cta_conversion');

    // Default stable trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (strength > 80) trend = 'improving';
    else if (strength < 50) trend = 'declining';

    return {
      strength,
      trend,
      weak_dimensions
    };
  }

  // Generates automatic recomposition tasks from logged receipts
  async generateRecompositionTasks(
    attractorId: string,
    receipts: any[]
  ): Promise<RecompositionTask[]> {
    const tasks: RecompositionTask[] = [];
    if (receipts.length === 0) return [];

    let fitSum = 0;
    let vibeSum = 0;
    let policySum = 0;
    let totalCtaCount = 0;
    let clickedCtaCount = 0;
    const gapCounts: Record<string, number> = {};

    receipts.forEach((r) => {
      fitSum += r.attractor_fit_score || 0;
      vibeSum += r.vibe_alignment_score || 0;
      policySum += r.policy_compliance_score || 0;
      
      const shown = Array.isArray(r.cta_shown) ? r.cta_shown.length : 0;
      const clicked = Array.isArray(r.cta_clicked) ? r.cta_clicked.length : 0;
      totalCtaCount += shown;
      clickedCtaCount += clicked;

      const gaps = r.detected_gaps || [];
      gaps.forEach((g: string) => {
        gapCounts[g] = (gapCounts[g] || 0) + 1;
      });
    });

    const len = receipts.length;
    const avgFit = fitSum / len;
    const avgVibe = vibeSum / len;
    const avgPolicy = policySum / len;
    const ctr = totalCtaCount > 0 ? clickedCtaCount / totalCtaCount : 0;

    // Build tasks based on metrics
    if (avgFit < 65) {
      tasks.push({
        attractor_id: attractorId,
        task_type: 'update_concept_boundary',
        severity: 'high',
        description: 'TCO 개념 바운더리 조건 및 활성화 임계값을 수정하세요.',
        reason: `평균 적합도 점수(${avgFit.toFixed(1)})가 임계치(65)보다 낮습니다.`
      });
    }

    if (avgVibe < 70) {
      tasks.push({
        attractor_id: attractorId,
        task_type: 'change_vibe_signature',
        severity: 'medium',
        description: 'L0-L3 Vibe spec 가이드를 보정하거나 다채널 Soliton 카피를 수정하세요.',
        reason: `평균 Vibe 정렬도 점수(${avgVibe.toFixed(1)})가 낮습니다.`
      });
    }

    if (avgPolicy < 85) {
      tasks.push({
        attractor_id: attractorId,
        task_type: 'rewrite_cta',
        severity: 'critical',
        description: '안전 정책 위반 카피와 무리한 CTA 링크를 긴급 전면 수정하세요.',
        reason: `안전/정책 준수 수준(${avgPolicy.toFixed(1)})이 낮아 에스컬레이션 리스크가 있습니다.`
      });
    }

    if (ctr < 0.03 && len >= 5) {
      tasks.push({
        attractor_id: attractorId,
        task_type: 'rewrite_cta',
        severity: 'medium',
        description: 'CTA 유도 문구를 자율성을 보장하는 안심형(Low-pressure)으로 재설계하세요.',
        reason: `전환율(CTR: ${(ctr * 100).toFixed(1)}%)이 너무 낮습니다.`
      });
    }

    return tasks;
  }

  // Recalibrate OLS weights (wraps existing OLS learning)
  static async recalibrateWeights(workspaceId: string): Promise<any> {
    const supabase = getSupabaseAdminClient();
    const { SignalPerformanceTracker } = await import('../signal-collection/signal-performance-tracker');
    return SignalPerformanceTracker.learnWeights(workspaceId);
  }
}
