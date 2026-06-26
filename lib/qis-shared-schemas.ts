import { z } from 'zod';

// ── 3축(업종·지역·테마) 공통 타입 ──
export const hubAxisEnum = z.enum(['industry', 'place', 'vortex']).default('industry');
export type HubAxis = z.infer<typeof hubAxisEnum>;

export const geoContextSchema = z.object({
  region: z.string(),
  city: z.string().optional(),
  district: z.string().optional(),
}).optional();
export type GeoContext = z.infer<typeof geoContextSchema>;

// QIS 신호 방출 스키마 (Hub → BSW)
export const qisSignalPayloadSchema = z.object({
  source_platform: z.enum(['kweddinghub', 'aihompyhub', 'jehuhub', 'other']).default('kweddinghub'),
  signal_type: z.enum([
    'community_question',    // CAFE 아고라 Q&A
    'verified_review',       // 안심 후기
    'price_report',          // 실거래가 제보
    'stress_pattern',        // WeddyCare 스트레스 데이터
    'deal_room_contract',    // Deal Room 계약 조건
    'deal_room_price',       // Deal Room 시세 데이터
    'style_dna_trend',       // Style DNA 트렌드
    'event_intent',          // 파티 플래너 의도
    'newlywed_lifecycle',    // 신혼 라이프 데이터
    'family_conflict',       // Family Bridge 갈등 패턴
    // 스펙 추가
    'sentiment_pattern',
    'deal_contract',
    'deal_price',
    'trend_signal',
    'intent_signal',
    'lifecycle_event',
    'conflict_pattern',
    'entity_created',
    'entity_reviewed',
    'comparison_requested',
    // 3축 확장
    'place_review',          // 지역 스팟 후기
    'place_inquiry',         // 지역 문의 (주차, 예약 등)
    'vortex_mission_signal', // Vortex 미션 관련 신호
    'cross_axis_trend',      // 3축 교차 트렌드
  ]),
  industry: z.string().default('wedding'),  // BSW V3 세부업종 키 (Place/Vortex도 수용)
  macro_industry: z.string().optional(),     // V3 BM 매크로 카테고리 (ecommerce_d2c | local_services | ...)
  hub_slug: z.string().optional(),
  // ── 3축 컨텍스트 ──
  hub_axis: hubAxisEnum,
  place_slug: z.string().optional(),        // 'jeju', 'gangnam', 'seongsu'
  vortex_slug: z.string().optional(),       // 테마 DAO slug
  geo_context: geoContextSchema,
  // ── 기존 필드 ──
  tenant_id: z.string().uuid().optional(),
  raw_text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  predicted_impact: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  detected_at: z.string(),
  expires_at: z.string().optional(),
});

export type QisSignalPayload = z.infer<typeof qisSignalPayloadSchema>;

export const qisSignalBatchSchema = z.object({
  signals: z.array(qisSignalPayloadSchema)
});
export type QisSignalBatch = z.infer<typeof qisSignalBatchSchema>;

// QIS 예측 질문 수신 스키마 (BSW → Hub)
export const qisPredictedQuestionSchema = z.object({
  bsw_question_id: z.string().uuid(),
  question_text: z.string().min(5),
  predicted_intent: z.string().min(2),
  predicted_volume: z.enum(['low', 'medium', 'high']).default('medium'),
  confidence: z.number().min(0).max(1),
  first_mover_window_days: z.number().int().positive(),
  current_ai_coverage: z.enum(['none', 'sparse', 'moderate', 'saturated']),
  auto_must_include: z.array(z.string()).default([]),
  auto_must_not_do: z.array(z.string()).default([]),
  qvs_composite: z.number().optional(),
  // ── 3축 타겟 정보 ──
  target_axis: z.enum(['industry', 'place', 'vortex', 'cross_axis']).default('industry'),
  place_slug: z.string().optional(),
  vortex_slug: z.string().optional(),
  geo_keywords: z.array(z.string()).default([]),
  recommended_formats: z.array(z.string()).default([]),  // 축별 추천: expert_column, case_study, answer_card
});

export type QisPredictedQuestion = z.infer<typeof qisPredictedQuestionSchema>;

// QIS 실측 데이터 스키마 (KWeddingHub → BSW)
export const qisRealMetricsSchema = z.object({
  metric_type: z.enum([
    'question_frequency',    // 질문 빈도 실측
    'conversion_rate',       // Deal Room 계약 전환율
    'average_transaction',   // 실거래 평균 단가
    'stress_seasonal',       // 감정 계절 패턴
    'question_emergence',    // 예측 질문 실제 출현 확인
    'ai_visibility_score',   // AI 검색 노출 점수
    'probe_citation_rate',   // 프로브 인용률
    'sentiment_seasonal',    // 계절 감정 패턴
  ]),
  industry: z.string().default('wedding'),
  macro_industry: z.string().optional(),     // V3 BM 매크로 카테고리
  hub_slug: z.string().optional(),
  period_start: z.string(),
  period_end: z.string(),
  value: z.number(),
  sample_size: z.number().int().positive(),
  breakdown: z.record(z.string(), z.unknown()).default({}),
});

export type QisRealMetrics = z.infer<typeof qisRealMetricsSchema>;

export const qisRealMetricsBatchSchema = z.object({
  metrics: z.array(qisRealMetricsSchema)
});
export type QisRealMetricsBatch = z.infer<typeof qisRealMetricsBatchSchema>;

// QIS Expected Layer 데이터 (KWeddingHub → BSW)
export const qisExpectedLayerDataSchema = z.object({
  question_reference: z.string(), // slug 또는 ID
  tier: z.enum(['must_include', 'strongly_recommended', 'should_include', 'caution', 'must_not_do']),
  content: z.string().min(1),
  source: z.string(), // verified_review, price_data, contract_clause, safety_guard, community_consensus, etc.
  confidence: z.number().min(0).max(1),
  sample_count: z.number().int(),
  industry: z.string().optional(),
});

export type QisExpectedLayerData = z.infer<typeof qisExpectedLayerDataSchema>;

export const qisExpectedLayerBatchSchema = z.object({
  layers: z.array(qisExpectedLayerDataSchema)
});
export type QisExpectedLayerBatch = z.infer<typeof qisExpectedLayerBatchSchema>;

// QIS 피드백 수신 스키마 (KWeddingHub → BSW)
export const qisFeedbackPayloadSchema = z.object({
  bsw_question_id: z.string().uuid(),
  emerged: z.boolean(),
  emerged_at: z.string().optional(),
  emergence_source: z.string().optional(), // cafe_agora, review, deal_room, stress_check
  actual_frequency: z.number().int().optional(),
});

export type QisFeedbackPayload = z.infer<typeof qisFeedbackPayloadSchema>;

export const qisFeedbackBatchSchema = z.object({
  feedbacks: z.array(qisFeedbackPayloadSchema)
});
export type QisFeedbackBatch = z.infer<typeof qisFeedbackBatchSchema>;
