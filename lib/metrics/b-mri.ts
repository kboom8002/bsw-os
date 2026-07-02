import { getSupabaseAdminClient } from '../supabase';
import { calculateVolatilityAndConfidence } from './confidence-volatility';

// ─────────────────────────────────────────────
// B-MRI 결과 인터페이스
// ─────────────────────────────────────────────
export interface BMriResult {
  value: number;
  components: {
    AAS: number;
    OCR: number;
    BSF: number;
    QTC: number;
    GCTR: number;
    ARS: number;
    competitivePositionScore: number;
    confidencePenalty: number;
    volatilityPenalty: number;
  };
}

// ─────────────────────────────────────────────
// 순수 함수: B-MRI 계산 (하위 호환성 보장)
// ─────────────────────────────────────────────
export function computeBMRI(
  AAS: number,
  OCR: number,
  BSF: number,
  QTC: number,
  GCTR: number,
  ARS: number,
  competitorAas: number,
  confidencePenalty: number,
  volatilityPenalty: number
): BMriResult {
  // Competitive_Position_Score = max(0, target_AAS/100 - competitor_AAS/100 + 0.5) * 100
  // Or in percentage scale: max(0, AAS - competitorAas + 50)
  const targetAAS = AAS;
  const competitivePositionScore = Math.max(0, targetAAS - competitorAas + 50);

  // B-MRI Formula:
  // 0.20*AAS + 0.15*OCR + 0.20*BSF + 0.15*QTC + 0.15*GCTR + 0.10*ARS + 0.05*Competitive_Position_Score - confidence_penalty - volatility_penalty
  // Note: All inputs are in 0-100 scale (percentages), penalties are also scaled appropriately.
  // Wait, confidence_penalty = (1-confidence)*0.10. Since confidence is e.g. 0.95, penalty is 0.005.
  // Wait! In 100-based scale, penalty would be scaled by 100: penalty * 100.
  // Let's make sure the output fits the standard 0-100 percentage range.
  const bMriRaw = 
    (0.20 * AAS) + 
    (0.15 * OCR) + 
    (0.20 * BSF) + 
    (0.15 * QTC) + 
    (0.15 * GCTR) + 
    (0.10 * ARS) + 
    (0.05 * competitivePositionScore) - 
    (confidencePenalty * 100) - 
    (volatilityPenalty * 100);

  const value = Number(Math.max(0, Math.min(100, bMriRaw)).toFixed(2));

  return {
    value,
    components: {
      AAS,
      OCR,
      BSF,
      QTC,
      GCTR,
      ARS,
      competitivePositionScore: Number(competitivePositionScore.toFixed(2)),
      confidencePenalty,
      volatilityPenalty
    }
  };
}

// ─────────────────────────────────────────────
// DB 연동 B-MRI 측정 엔진
// ─────────────────────────────────────────────
export class BMriEngine {
  private supabase = getSupabaseAdminClient();

  /**
   * DB에서 모든 컴포넌트를 측정하여 B-MRI를 계산한다.
   */
  async computeFromDB(workspaceId: string, brandKeyword: string): Promise<BMriResult> {
    // 1. 개별 컴포넌트 측정
    const [AAS, OCR, BSF, QTC, GCTR, ARS] = await Promise.all([
      this.measureAAS(workspaceId, brandKeyword),
      this.measureOCR(workspaceId),
      this.measureBSF(workspaceId, brandKeyword),
      this.measureQTC(workspaceId),
      this.measureGCTR(workspaceId),
      this.measureARS(workspaceId),
    ]);

    // 2. 경쟁사 AAS — 현재는 기본값 50 사용
    const competitorAas = 50;

    // 3. 신뢰도 및 변동성 패널티 계산
    // 최신 observation run ID를 가져와서 패널티 산출
    const { data: latestRun } = await this.supabase
      .from('ai_observation_runs')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('run_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentRunId = latestRun?.id || workspaceId;
    const penalties = await calculateVolatilityAndConfidence(workspaceId, currentRunId, ARS);

    // 4. 순수 함수에 위임하여 최종 B-MRI 산출
    return computeBMRI(
      AAS, OCR, BSF, QTC, GCTR, ARS,
      competitorAas,
      penalties.confidencePenalty,
      penalties.volatilityPenalty
    );
  }

  // ─── AAS (AI Awareness Score) ──────────────
  // probe_runs 응답 텍스트에서 브랜드 키워드 언급 비율 * 100
  private async measureAAS(workspaceId: string, brandKeyword: string): Promise<number> {
    const { data: runs } = await this.supabase
      .from('probe_runs')
      .select('raw_response_text')
      .eq('workspace_id', workspaceId);

    if (!runs || runs.length === 0) return 0;

    const keyword = brandKeyword.toLowerCase();
    const mentionCount = runs.filter(
      r => (r.raw_response_text || '').toLowerCase().includes(keyword)
    ).length;

    return Number(((mentionCount / runs.length) * 100).toFixed(2));
  }

  // ─── OCR (Organic Citation Rate) ──────────
  // probe_runs 인용(citations)에서 브랜드 도메인 매칭 비율 * 100
  private async measureOCR(workspaceId: string, brandDomains?: string[]): Promise<number> {
    // 브랜드 도메인이 제공되지 않으면 workspaces 테이블에서 조회
    let domains = brandDomains;
    if (!domains || domains.length === 0) {
      const { data: ws } = await this.supabase
        .from('workspaces')
        .select('domain')
        .eq('id', workspaceId)
        .single();

      if (ws?.domain) {
        domains = [ws.domain];
      }
    }

    if (!domains || domains.length === 0) return 0;

    const { data: runs } = await this.supabase
      .from('probe_runs')
      .select('citations')
      .eq('workspace_id', workspaceId);

    if (!runs || runs.length === 0) return 0;

    const lowerDomains = domains.map(d => d.toLowerCase());
    let totalCitations = 0;
    let matchedCitations = 0;

    for (const run of runs) {
      const citations = (run.citations || []) as string[];
      totalCitations += citations.length;
      matchedCitations += citations.filter(c =>
        lowerDomains.some(d => (c || '').toLowerCase().includes(d))
      ).length;
    }

    if (totalCitations === 0) return 0;
    return Number(((matchedCitations / totalCitations) * 100).toFixed(2));
  }

  // ─── BSF (Brand Strength Fidelity) ────────
  // concept_fidelity_snapshots가 있으면 brand_concept_fidelity * 100 사용,
  // 없으면 probe_runs에서 긍정적/강한 멘션 비율로 산출
  private async measureBSF(workspaceId: string, brandKeyword: string): Promise<number> {
    // concept_fidelity_snapshots에 데이터가 있는지 먼저 확인
    const { data: cfSnap } = await this.supabase
      .from('concept_fidelity_snapshots')
      .select('brand_concept_fidelity')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cfSnap?.brand_concept_fidelity != null) {
      return Number((Number(cfSnap.brand_concept_fidelity) * 100).toFixed(2));
    }

    // 폴백: probe_runs 응답에서 긍정적 멘션 비율 계산
    const { data: runs } = await this.supabase
      .from('probe_runs')
      .select('raw_response_text')
      .eq('workspace_id', workspaceId);

    if (!runs || runs.length === 0) return 0;

    const keyword = brandKeyword.toLowerCase();
    const positiveIndicators = ['추천', '우수', 'excellent', 'best', 'top', 'leading', 'trusted', 'reliable', 'strong'];

    const strongMentionCount = runs.filter(r => {
      const text = (r.raw_response_text || '').toLowerCase();
      if (!text.includes(keyword)) return false;
      return positiveIndicators.some(ind => text.includes(ind));
    }).length;

    return Number(((strongMentionCount / runs.length) * 100).toFixed(2));
  }

  // ─── QTC (Question Topic Coverage) ────────
  // canonical_questions 수와 qis_scenes 수 기반 커버리지 점수
  private async measureQTC(workspaceId: string): Promise<number> {
    const { count: cqCount } = await this.supabase
      .from('canonical_questions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const { count: sceneCount } = await this.supabase
      .from('qis_scenes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    return Math.min(100, ((cqCount || 0) * 5) + ((sceneCount || 0) * 10));
  }

  // ─── GCTR (Golden Content Transfer Rate) ──
  // surface_contracts 수와 schema_mappings 수 기반 전달률 점수
  private async measureGCTR(workspaceId: string): Promise<number> {
    const { count: surfaceCount } = await this.supabase
      .from('surface_contracts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const { count: schemaCount } = await this.supabase
      .from('schema_mappings')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    return Math.min(100, ((surfaceCount || 0) * 8) + ((schemaCount || 0) * 12));
  }

  // ─── ARS (AI Reflection Score) ────────────
  // entity_reflection_snapshots의 최신 aepi_score 사용, 없으면 기본값 50
  private async measureARS(workspaceId: string): Promise<number> {
    const { data: snap } = await this.supabase
      .from('entity_reflection_snapshots')
      .select('aepi_score')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (snap?.aepi_score != null) {
      return Number(snap.aepi_score);
    }

    // 데이터 미존재 시 기본 폴백 값
    return 50;
  }
}
