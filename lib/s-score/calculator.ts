import { getSupabaseAdminClient } from '../supabase';

interface SScoreDimensions {
  completeness: number;  // 25% weight
  visibility: number;    // 30% weight
  opportunity: number;   // 25% weight
  readiness: number;     // 20% weight
}

export interface SScoreResult {
  total_score: number;
  dimensions: SScoreDimensions;
  canonical_question_id: string;
  calculated_at: string;
}

export class SScoreCalculator {
  /**
   * DB 기반 S-Score 계산.
   * workspaceId와 questionId(canonical_question_id)를 기반으로
   * 실제 데이터에서 각 차원 점수를 산출한다.
   */
  static async calculateFromDB(
    workspaceId: string,
    questionId: string
  ): Promise<SScoreResult> {
    const supabase = getSupabaseAdminClient();

    // ── Completeness (25%): 해당 CQ에 매핑된 콘텐츠 자산 완성도 ──
    // 1) CQ → QIS 씬 조회
    const { data: qisScenes } = await supabase
      .from('qis_scenes')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('canonical_question_id', questionId);

    const qisIds = (qisScenes ?? []).map((s) => s.id);

    // 2) QIS 씬을 참조하는 representation_objects 수 집계
    let objCount = 0;
    if (qisIds.length > 0) {
      const { data: objects } = await supabase
        .from('representation_objects')
        .select('id')
        .eq('workspace_id', workspaceId)
        .overlaps('qis_refs', qisIds);

      objCount = objects?.length ?? 0;
    }

    // 3) 워크스페이스의 evidence 건수 (CQ와 연결된 operational truth 기준)
    const { data: truthEvidence } = await supabase
      .from('brand_operational_truth_evidence')
      .select('operational_truth_id, evidence_item_id');

    const evidenceCount = truthEvidence?.length ?? 0;

    const completeness = Math.min(100, (objCount * 15) + (evidenceCount * 20));

    // ── Visibility (30%): 해당 CQ 관련 프로브에서 브랜드 언급 비율 ──
    // probe_runs를 probe_questions 경유로 조회
    const { data: probeRuns } = await supabase
      .from('probe_runs')
      .select('id, raw_response_text, probe_question_id')
      .eq('workspace_id', workspaceId);

    const totalRuns = probeRuns?.length ?? 0;
    const meaningfulRuns = totalRuns > 0
      ? (probeRuns ?? []).filter((r) => (r.raw_response_text?.length ?? 0) > 100).length
      : 0;

    const visibility = totalRuns > 0
      ? Math.round((meaningfulRuns / totalRuns) * 100)
      : 0;

    // ── Opportunity (25%): 미커버 영역 = 기회 ──
    const opportunity = Math.max(0, 100 - visibility);

    // ── Readiness (20%): 시맨틱 페이지·스키마 존재 여부 ──
    // 1) CQ와 연결된 surface_contracts 수
    let surfaceCount = 0;
    if (qisIds.length > 0) {
      const { data: surfaces } = await supabase
        .from('surface_contracts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .overlaps('qis_refs', qisIds);

      surfaceCount = surfaces?.length ?? 0;
    }

    // 2) 워크스페이스에 schema_mappings 존재 여부
    const { data: schemas } = await supabase
      .from('schema_mappings')
      .select('id')
      .eq('workspace_id', workspaceId)
      .limit(1);

    const hasSchema = (schemas?.length ?? 0) > 0;

    const readiness = Math.min(100, (surfaceCount * 25) + (hasSchema ? 50 : 0));

    // ── 종합 점수 산출 ──
    const total_score = Math.round(
      (completeness * 0.25) +
      (visibility * 0.30) +
      (opportunity * 0.25) +
      (readiness * 0.20)
    );

    return {
      total_score,
      dimensions: {
        completeness,
        visibility,
        opportunity,
        readiness,
      },
      canonical_question_id: questionId,
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * @deprecated 목(mock) 데이터 기반 계산. calculateFromDB()를 사용할 것.
   * Calculates the S-Score for a Canonical Question.
   * Note: In a real environment, this would fetch data from DB. 
   * Here we mock the inputs for the demo.
   */
  static calculate(
    questionId: string, 
    mockData?: Partial<SScoreDimensions>
  ): SScoreResult {
    
    // Default mock calculation if data is not fully provided
    const completeness = mockData?.completeness ?? Math.floor(Math.random() * 40) + 60; // 60-100
    const visibility = mockData?.visibility ?? Math.floor(Math.random() * 50) + 30; // 30-80
    const opportunity = mockData?.opportunity ?? Math.floor(Math.random() * 60) + 40; // 40-100
    const readiness = mockData?.readiness ?? Math.floor(Math.random() * 100); // 0-100

    const total_score = Math.round(
      (completeness * 0.25) +
      (visibility * 0.30) +
      (opportunity * 0.25) +
      (readiness * 0.20)
    );

    return {
      total_score,
      dimensions: {
        completeness,
        visibility,
        opportunity,
        readiness
      },
      canonical_question_id: questionId,
      calculated_at: new Date().toISOString()
    };
  }

  /**
   * Calculates S-Score and determines if the strategic_weight should be auto-boosted.
   */
  static evaluateStrategicWeightAction(scoreResult: SScoreResult, currentWeight: number): number {
    // Auto-boost weight if S-Score is low but opportunity is high
    if (scoreResult.total_score < 40 && scoreResult.dimensions.opportunity > 70) {
      return Math.min(100, currentWeight + 20); 
    }
    return currentWeight;
  }
}
