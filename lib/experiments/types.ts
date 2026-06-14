/**
 * lib/experiments/types.ts  (확장판)
 *
 * 3-Tier 측정 체계 타입 추가:
 *   HeartbeatResult  (Tier 1)
 *   WeeklyScanResult (Tier 2)
 *   ProxyValidation  (교차 검증)
 * 기존 ExperimentComparison 유지.
 */

// ─────────────────────────────────────────
// 기존 (하위 호환 유지)
// ─────────────────────────────────────────
export interface ExperimentComparison {
  experimentId: string;
  baseline: any;
  intervention: any;
  improvements: {
    metric: string;
    baseline_value: number;
    intervention_value: number;
    absolute_improvement: number;
    relative_improvement: number;
  }[];
  risk_reduction: number;
  summary: string;
}

// ─────────────────────────────────────────
// Tier 1: Heartbeat Pulse (일간 경량 측정)
// ─────────────────────────────────────────

export interface SentinelResult {
  question_id: string;
  question_text: string;
  engine_name: string;
  /** M1-lite: 개념 전달 여부 */
  concept_transferred: boolean;
  /** M9-lite: 위험 감지 여부 */
  risk_detected: boolean;
  /** 브랜드 언급 여부 */
  brand_mentioned: boolean;
  raw_response_text: string;
  latency_ms: number;
}

export type ChangeSeverity = 'none' | 'minor' | 'significant' | 'critical';

export interface HeartbeatResult {
  timestamp: string;
  workspace_id: string;
  panel_id: string;
  engine_used: string;

  /** Sentinel 5개 결과 */
  sentinels: SentinelResult[];

  /** 경량 지표 */
  aas_lite: number;            // 5개 질문 브랜드 언급률 (0~100)
  bsf_lite: number;            // 5개 질문 충실도 평균 (0~100)
  risk_flag: boolean;          // YMYL 질문에서 위험 탐지 여부
  competitor_shift: boolean;   // 경쟁사 비교 질문에서 변동 탐지
  preemption_alert: boolean;   // 선점 질문에서 경쟁자 출현 탐지

  /** 변동 탐지 */
  change_detected: boolean;
  change_severity: ChangeSeverity;
  change_details?: string;

  /** 에스컬레이션 권고 */
  recommend_weekly_scan: boolean;
  recommend_full_run: boolean;

  /** API 호출 횟수 */
  api_calls_used: number;
}

// ─────────────────────────────────────────
// Tier 2: Weekly Scan (주간 표준 측정)
// ─────────────────────────────────────────

export interface EngineMetrics {
  aas: number;
  bsf: number;
  m1_concept_transfer: number;
  m3_fidelity: number;
  m4_distortion: number;
  m6_hallucination: number;
}

export type TrendDirection = 'rising' | 'stable' | 'falling';

export interface WeeklyScanResult {
  timestamp: string;
  workspace_id: string;
  panel_id: string;
  engines_used: string[];

  /** 엔진별 핵심 지표 */
  engine_results: Record<string, EngineMetrics>;

  /** Cross-Engine 비교 */
  cross_engine: {
    brand_mention_agreement: number;
    concept_consensus: number;
    max_divergence_question: string;
    citation_overlap: number;
  };

  /** 주간 트렌드 */
  trend: {
    aas_trend: TrendDirection;
    bsf_trend: TrendDirection;
    anomaly_count: number;
  };

  /** 에스컬레이션 */
  recommend_full_run: boolean;
  recommend_fix_it: boolean;

  /** API 호출 횟수 */
  api_calls_used: number;
}

// ─────────────────────────────────────────
// Proxy 정확도 교차 검증
// ─────────────────────────────────────────

export interface ProxyValidation {
  /** Tier 1 ↔ Tier 3 상관 */
  heartbeat_vs_full: {
    aas_correlation: number;          // 목표: ≥ 0.85
    change_detection_recall: number;  // 목표: ≥ 0.90
    false_alarm_rate: number;         // 목표: ≤ 0.15
  };

  /** Tier 2 ↔ Tier 3 상관 */
  weekly_vs_full: {
    m1_correlation: number;           // 목표: ≥ 0.90
    m3_correlation: number;           // 목표: ≥ 0.90
    m4_correlation: number;           // 목표: ≥ 0.85
    m6_correlation: number;           // 목표: ≥ 0.85
  };

  evaluated_at: string;
  sample_size: number;
  is_valid: boolean;  // 모든 목표 달성 여부
}

// ─────────────────────────────────────────
// 에스컬레이션 결정
// ─────────────────────────────────────────

export type EscalationDecision =
  | { tier: 1; reason: 'no_change' }
  | { tier: 2; reason: 'significant_change' | 'scheduled_weekly' }
  | { tier: 3; reason: 'critical_change' | 'anomaly_detected' | 'scheduled_monthly' };

// EscalationEngine의 결정 결과 (escalation-engine.ts에서도 정의하지만 types에서 re-export)
export interface EscalationResult {
  decision: EscalationDecision;
  reason: string;
  recommended_engines?: string[];
  execute_immediately: boolean;
}
