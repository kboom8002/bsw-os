import { z } from 'zod';

// QIS 신호 방출 스키마 (KWeddingHub → BSW)
export const qisSignalPayloadSchema = z.object({
  source_platform: z.literal('kweddinghub'),
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
  ]),
  industry: z.literal('wedding'),
  tenant_id: z.string().uuid().optional(),
  raw_text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  predicted_impact: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  detected_at: z.string(),
  expires_at: z.string().optional(),
});

export type QisSignalPayload = z.infer<typeof qisSignalPayloadSchema>;

// QIS 예측 질문 수신 스키마 (BSW → KWeddingHub)
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
  ]),
  industry: z.literal('wedding'),
  period_start: z.string(),
  period_end: z.string(),
  value: z.number(),
  sample_size: z.number().int().positive(),
  breakdown: z.record(z.string(), z.unknown()).default({}),
});

export type QisRealMetrics = z.infer<typeof qisRealMetricsSchema>;

// QIS Expected Layer 데이터 (KWeddingHub → BSW)
export const qisExpectedLayerDataSchema = z.object({
  question_reference: z.string(), // slug 또는 ID
  tier: z.enum(['must_include', 'strongly_recommended', 'should_include', 'caution', 'must_not_do']),
  content: z.string().min(1),
  source: z.enum(['verified_review', 'price_data', 'contract_clause', 'safety_guard', 'community_consensus']),
  confidence: z.number().min(0).max(1),
  sample_count: z.number().int(),
});

export type QisExpectedLayerData = z.infer<typeof qisExpectedLayerDataSchema>;
