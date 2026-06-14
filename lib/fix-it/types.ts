/**
 * lib/fix-it/types.ts
 *
 * Fix-It RCA 파이프라인 공유 타입 정의.
 * Anomaly, RcaHypothesis, PatchResult, CooldownConfig, GuardrailConfig 등.
 */

// ─────────────────────────────────────────
// 이상 탐지 (Anomaly Detection)
// ─────────────────────────────────────────
export interface Anomaly {
  metric_name: string;          // e.g., 'M4_distortion'
  current_value: number;        // 현재 관측값
  threshold: number;            // 임계값
  severity: 'warning' | 'critical';
  direction: 'above' | 'below'; // 임계 방향
  affected_concepts: string[];  // 영향받는 개념 목록
}

// ─────────────────────────────────────────
// RCA (Root Cause Analysis)
// ─────────────────────────────────────────
export type PatchType =
  | 'ssot_update'               // Brand Truth 수정/추가
  | 'answer_card_create'        // 새 Answer Card 생성
  | 'answer_card_update'        // 기존 Answer Card 수정
  | 'boundary_rule_add'         // Boundary Rule 추가
  | 'schema_markup_fix'         // Schema.org 수정
  | 'expected_layer_update'     // Expected Layer 수정
  | 'content_restructure';      // 콘텐츠 구조 변경

export interface ArtifactRef {
  artifact_type: 'brand_operational_truth' | 'semantic_page' | 'boundary_rule' | 'expected_layer';
  artifact_id: string;
  description: string;
}

export interface RcaContext {
  /** 워크스페이스 SSoT (Brand Operational Truths) */
  ssot_entries: { claim: string; risk_level: string }[];
  /** 최근 변경 이력 */
  recent_changes: { date: string; change_type: string; description: string }[];
  /** 과거 RCA 케이스 요약 */
  past_rca_summaries: string[];
  /** 왜곡 상세 */
  distortion_details?: { concept: string; original: string; distorted: string; severity: number }[];
}

export interface RcaHypothesis {
  cause_hypothesis: string;         // 원인 가설 (자연어)
  confidence: number;               // AI 신뢰도 (0~1)
  evidence: string[];               // 근거 목록
  suggested_patch_type: PatchType;  // 제안 패치 유형
  affected_artifacts: ArtifactRef[];
}

// ─────────────────────────────────────────
// Patch (패치 실행 결과)
// ─────────────────────────────────────────
export type PatchStatus = 'pending' | 'approved' | 'rejected' | 'applied' | 'rolled_back' | 'failed';

export interface PatchTicket {
  id: string;
  workspace_id: string;
  patch_type: PatchType;
  rca_hypothesis: RcaHypothesis;
  status: PatchStatus;
  original_payload?: Record<string, any>;  // 롤백을 위한 원본 데이터
  patch_payload: Record<string, any>;       // 적용할 변경 내용
  approved_by?: string;
  applied_at?: string;
  created_at: string;
}

export interface PatchResult {
  patch_ticket_id: string;
  success: boolean;
  applied_at: string;
  error_message?: string;
  /** 롤백 가능 여부 */
  rollback_available: boolean;
}

// ─────────────────────────────────────────
// Cooldown (업종별 쿨다운)
// ─────────────────────────────────────────
export type IndustryKey =
  | 'skincare'
  | 'wedding'
  | 'medical'
  | 'convenience'
  | 'real_estate'
  | 'finance'
  | 'legal'
  | 'education'
  | 'fnb'
  | 'default';

export interface CooldownConfig {
  industry: IndustryKey;
  base_cooldown_days: number;
  min_cooldown_days: number;
  max_cooldown_days: number;
  description: string;
}

// ─────────────────────────────────────────
// Regression Guard (회귀 방지)
// ─────────────────────────────────────────
export interface GuardrailConfig {
  id?: string;
  workspace_id: string;
  retest_run_id: string;
  metric_name: string;
  /** 이 값 이하로 떨어지면 경고 */
  floor_value: number;
  /** 이 값 이상으로 올라가면 경고 (M4, M6 등) */
  ceiling_value?: number;
  /** 허용 변동 폭 */
  tolerance: number;
  created_at?: string;
}

export interface RegressionAlert {
  guardrail_id: string;
  metric_name: string;
  previous_value: number;
  current_value: number;
  violation_type: 'floor' | 'ceiling';
  severity: 'warning' | 'critical';
  detected_at: string;
}

// ─────────────────────────────────────────
// Retest Scheduler
// ─────────────────────────────────────────
export interface RetestSchedule {
  id: string;
  workspace_id: string;
  patch_ticket_id: string;
  panel_id: string;
  industry: IndustryKey;
  scheduled_at: string;    // ISO 날짜
  cooldown_days: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retest_run_id?: string;
  created_at: string;
}
