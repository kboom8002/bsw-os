// lib/benchmark/qis-benchmark-bridge.ts
// QIS/QVS ↔ 벤치마크 통합 데이터 브릿지
// 업종 AEO 콘텐츠 트렌드, QVS×AEPI 전략 매트릭스, QIS 레이어 벤치마크 조회

import { getSupabaseAdminClient } from '../supabase';
import type { SiteAuditSnapshot } from '../industry/batch-audit-runner';
import { BENCHMARK_METRIC_KEYS } from '../industry/batch-audit-runner';

// ═══════════════════════════════════════════════════════════════
// 통합 타입 정의
// ═══════════════════════════════════════════════════════════════

export interface QvsAepiMatrixItem {
  /** 질문 또는 콘텐츠 영역 식별 */
  id: string;
  label: string;
  /** AEPI 축 (0-100): 브랜드가 이 영역에서 얼마나 강한가 */
  aepi: number;
  /** QVS 축 (0-100): 이 질문/영역의 비즈니스 가치 */
  qvs: number;
  /** 4-Quadrant 분류 */
  quadrant: 'threat' | 'core' | 'ignore' | 'maintain';
  /** 긴급도 (선점 마감일 기반) */
  urgency: 'critical' | 'medium' | 'low';
  /** AI 커버리지 상태 */
  aiCoverage: 'none' | 'sparse' | 'moderate' | 'saturated';
  /** 경쟁 점수 (0-1) */
  competition: number;
  /** 선점 잔여일 */
  firstMoverDays?: number;
  /** 예측 볼륨 */
  predictedVolume?: 'low' | 'medium' | 'high';
  /** 예측 의도 */
  predictedIntent?: string;
}

export interface ContentTrendPoint {
  date: string;
  signalCounts: Record<string, number>;  // signal_type별 카운트
  totalSignals: number;
  newPredictions: number;
  avgConfidence: number;
  coverageDistribution: {
    none: number; sparse: number; moderate: number; saturated: number;
  };
}

export interface FirstMoverItem {
  id: string;
  questionText: string;
  qvsComposite: number;
  aiCoverage: 'none' | 'sparse' | 'moderate' | 'saturated';
  firstMoverDays: number;
  competition: number;
  predictedVolume: 'low' | 'medium' | 'high';
  predictedIntent: string;
  confidence: number;
  urgencyTier: 'critical' | 'medium' | 'low';  // ≤3 / ≤7 / >7
}

export interface QisLayerRow {
  layer: string;         // L1_universal, L2_competitive, etc.
  layerNameKo: string;
  questionCount: number;
  avgIri: number;        // Industry Readiness Index
  avgBdr: number;        // Brand Defense Rate
  avgCwr: number;        // Competitive Win Rate
  avgOpp: number;        // Opportunity Score
  brandScore?: number;   // 진단 대상 브랜드의 해당 레이어 점수
  industryAvg: number;
}

export interface TopPredictedQuestion {
  id: string;
  questionText: string;
  qvsComposite: number;
  confidence: number;
  firstMoverDays: number;
  aiCoverage: string;
  predictedVolume: string;
  predictedIntent: string;
}

export interface QisBenchmarkIntegration {
  subIndustryKey: string;
  // QIS 통계
  activeSignals: number;
  totalPredictions: number;
  highConfidencePredictions: number;
  avgQvsComposite: number;
  coverageDistribution: {
    none: number; sparse: number; moderate: number; saturated: number;
  };
  // 통합 데이터
  qvsAepiMatrix: QvsAepiMatrixItem[];
  layerBenchmarks: QisLayerRow[];
  firstMoverItems: FirstMoverItem[];
  contentTrends: ContentTrendPoint[];
  topPredictions: TopPredictedQuestion[];
}

// ═══════════════════════════════════════════════════════════════
// QIS 레이어 메타데이터
// ═══════════════════════════════════════════════════════════════

const QIS_LAYER_META: Record<string, string> = {
  L1_universal:    '보편적 질문',
  L2_competitive:  '경쟁 비교',
  L3_ingredient:   '성분/재료',
  L4_regulation:   '규제/인증',
  L5_ymyl:         'YMYL 안전',
  L6_trend:        '트렌드/신규',
  L7_seasonal:     '시즌/이벤트',
};

// ═══════════════════════════════════════════════════════════════
// 핵심 조회 함수들
// ═══════════════════════════════════════════════════════════════

/**
 * 업종별 QIS 시그널 시계열 트렌드 조회
 */
export async function getContentTrends(
  subIndustryKey: string,
  days = 30
): Promise<ContentTrendPoint[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    // 1. 시그널 조회
    const { data: signals } = await supabase
      .from('bsw_received_signals')
      .select('signal_type, detected_at')
      .eq('industry', subIndustryKey)
      .gte('detected_at', since.toISOString())
      .order('detected_at', { ascending: true });

    // 2. 예측 질문 조회
    const { data: predictions } = await supabase
      .from('bsw_predicted_questions')
      .select('id, confidence, current_ai_coverage, created_at')
      .eq('industry', subIndustryKey)
      .gte('created_at', since.toISOString());

    // 3. 일별 집계
    const dayMap = new Map<string, ContentTrendPoint>();

    for (let d = 0; d < days; d++) {
      const date = new Date(since);
      date.setDate(date.getDate() + d);
      const key = date.toISOString().split('T')[0];
      dayMap.set(key, {
        date: key,
        signalCounts: {},
        totalSignals: 0,
        newPredictions: 0,
        avgConfidence: 0,
        coverageDistribution: { none: 0, sparse: 0, moderate: 0, saturated: 0 },
      });
    }

    // 시그널 집계
    if (signals) {
      for (const s of signals) {
        const dateKey = s.detected_at?.split('T')[0];
        if (!dateKey) continue;
        const day = dayMap.get(dateKey);
        if (day) {
          day.signalCounts[s.signal_type] = (day.signalCounts[s.signal_type] || 0) + 1;
          day.totalSignals++;
        }
      }
    }

    // 예측 집계
    if (predictions) {
      for (const p of predictions) {
        const dateKey = p.created_at?.split('T')[0];
        if (!dateKey) continue;
        const day = dayMap.get(dateKey);
        if (day) {
          day.newPredictions++;
          const cov = p.current_ai_coverage as keyof typeof day.coverageDistribution;
          if (cov && day.coverageDistribution[cov] !== undefined) {
            day.coverageDistribution[cov]++;
          }
        }
      }
    }

    return Array.from(dayMap.values());
  } catch (err) {
    console.warn('[QisBenchmarkBridge] getContentTrends error:', err);
    return [];
  }
}

/**
 * QVS × AEPI 전략 매트릭스 데이터 생성
 */
export async function buildQvsAepiMatrix(
  subIndustryKey: string,
  snapshots: SiteAuditSnapshot[]
): Promise<QvsAepiMatrixItem[]> {
  try {
    const supabase = getSupabaseAdminClient();

    // QVS가 있는 예측 질문 조회
    const { data: predictions } = await supabase
      .from('bsw_predicted_questions')
      .select('id, question_text, predicted_intent, predicted_volume, confidence, first_mover_window_days, current_ai_coverage, qvs_composite, competition_score')
      .eq('industry', subIndustryKey)
      .eq('actually_emerged', false)
      .gte('confidence', 0.5)
      .order('qvs_composite', { ascending: false })
      .limit(50);

    if (!predictions || predictions.length === 0) {
      // DB에 데이터가 없으면 벤치마크 스냅샷 기반으로 시뮬레이션
      return buildSimulatedMatrix(snapshots);
    }

    // 업종 평균 AEPI 계산
    const avgAepi = snapshots.length > 0
      ? snapshots.reduce((s, sn) => s + (sn.techInfraScore * 0.3 + sn.schemaQualityScore * 0.3 + sn.contentSemanticScore * 0.4), 0) / snapshots.length
      : 50;

    return predictions.map((p) => {
      const qvs = p.qvs_composite ?? Math.round(Math.random() * 60 + 20);
      const competition = p.competition_score ?? 0.5;
      const firstMoverDays = p.first_mover_window_days ?? 14;

      // AEPI는 해당 질문 영역에 대한 브랜드의 강점으로 추정
      // 현재는 업종 평균에 coverage 보정을 적용
      const coverageFactor = p.current_ai_coverage === 'saturated' ? 0.8
        : p.current_ai_coverage === 'moderate' ? 0.6
        : p.current_ai_coverage === 'sparse' ? 0.4
        : 0.2;
      const aepi = Math.round(avgAepi * coverageFactor + Math.random() * 15);

      const quadrant: QvsAepiMatrixItem['quadrant'] =
        qvs >= 50 && aepi >= 50 ? 'core' :
        qvs >= 50 && aepi < 50 ? 'threat' :
        qvs < 50 && aepi >= 50 ? 'maintain' : 'ignore';

      const urgency: QvsAepiMatrixItem['urgency'] =
        firstMoverDays <= 3 ? 'critical' :
        firstMoverDays <= 7 ? 'medium' : 'low';

      return {
        id: p.id,
        label: p.question_text?.substring(0, 40) ?? '',
        aepi: Math.min(100, Math.max(0, aepi)),
        qvs: Math.min(100, Math.max(0, qvs)),
        quadrant,
        urgency,
        aiCoverage: p.current_ai_coverage ?? 'none',
        competition,
        firstMoverDays,
        predictedVolume: p.predicted_volume ?? 'medium',
        predictedIntent: p.predicted_intent ?? '',
      };
    });
  } catch (err) {
    console.warn('[QisBenchmarkBridge] buildQvsAepiMatrix error:', err);
    return buildSimulatedMatrix(snapshots);
  }
}

/**
 * DB 데이터 없을 때 벤치마크 스냅샷 기반 시뮬레이션 매트릭스
 */
function buildSimulatedMatrix(snapshots: SiteAuditSnapshot[]): QvsAepiMatrixItem[] {
  const areas = [
    { label: 'AI 크롤러 접근성', metricKey: 'aiCrawlerAccessScore', qvsBias: 75 },
    { label: 'FAQ 스키마 구현', metricKey: 'schemaQualityScore', qvsBias: 85 },
    { label: 'E-E-A-T 신호', metricKey: 'eeatOverall', qvsBias: 90 },
    { label: 'Answer-First 콘텐츠', metricKey: 'answerFirstAvgScore', qvsBias: 80 },
    { label: '콘텐츠 신선도', metricKey: 'freshnessScore', qvsBias: 65 },
    { label: 'OG 메타데이터', metricKey: 'ogCompleteness', qvsBias: 55 },
    { label: '인용 품질', metricKey: 'citationQualityScore', qvsBias: 70 },
    { label: '멀티미디어 활용', metricKey: 'multimediaScore', qvsBias: 45 },
    { label: '내부 링크 구조', metricKey: 'internalLinkTopologyScore', qvsBias: 60 },
    { label: '독창성 지수', metricKey: 'originalityScore', qvsBias: 72 },
  ];

  return areas.map((area, i) => {
    // 업종 평균 AEPI = 해당 메트릭의 업종 평균
    const values = snapshots.map(s => {
      const v = (s as unknown as Record<string, unknown>)[area.metricKey];
      return typeof v === 'number' ? v : 0;
    }).filter(v => v > 0);
    const aepi = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 50;
    const qvs = area.qvsBias + Math.round(Math.random() * 20 - 10);

    const quadrant: QvsAepiMatrixItem['quadrant'] =
      qvs >= 50 && aepi >= 50 ? 'core' :
      qvs >= 50 && aepi < 50 ? 'threat' :
      qvs < 50 && aepi >= 50 ? 'maintain' : 'ignore';

    return {
      id: `sim-${i}`,
      label: area.label,
      aepi: Math.round(aepi),
      qvs: Math.min(100, Math.max(0, qvs)),
      quadrant,
      urgency: 'low' as const,
      aiCoverage: 'sparse' as const,
      competition: 0.5,
      firstMoverDays: 14,
    };
  });
}

/**
 * First Mover 기회 목록 조회 (선점 마감일 기준 정렬)
 */
export async function getFirstMoverOpportunities(
  subIndustryKey: string,
  limit = 15
): Promise<FirstMoverItem[]> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data } = await supabase
      .from('bsw_predicted_questions')
      .select('id, question_text, predicted_intent, predicted_volume, confidence, first_mover_window_days, current_ai_coverage, qvs_composite, competition_score')
      .eq('industry', subIndustryKey)
      .eq('actually_emerged', false)
      .gte('confidence', 0.6)
      .order('first_mover_window_days', { ascending: true })
      .limit(limit);

    if (!data || data.length === 0) return [];

    return data.map((p) => ({
      id: p.id,
      questionText: p.question_text ?? '',
      qvsComposite: p.qvs_composite ?? 0,
      aiCoverage: (p.current_ai_coverage ?? 'none') as FirstMoverItem['aiCoverage'],
      firstMoverDays: p.first_mover_window_days ?? 14,
      competition: p.competition_score ?? 0.5,
      predictedVolume: (p.predicted_volume ?? 'medium') as FirstMoverItem['predictedVolume'],
      predictedIntent: p.predicted_intent ?? '',
      confidence: p.confidence ?? 0,
      urgencyTier: p.first_mover_window_days <= 3 ? 'critical' as const
        : p.first_mover_window_days <= 7 ? 'medium' as const
        : 'low' as const,
    }));
  } catch (err) {
    console.warn('[QisBenchmarkBridge] getFirstMoverOpportunities error:', err);
    return [];
  }
}

/**
 * 업종별 QIS 통합 요약 데이터 조회
 */
export async function getQisBenchmarkIntegration(
  subIndustryKey: string,
  snapshots: SiteAuditSnapshot[]
): Promise<QisBenchmarkIntegration> {
  // 병렬 조회
  const [trends, matrix, firstMover, summary] = await Promise.all([
    getContentTrends(subIndustryKey, 30),
    buildQvsAepiMatrix(subIndustryKey, snapshots),
    getFirstMoverOpportunities(subIndustryKey),
    getQisSummary(subIndustryKey),
  ]);

  return {
    subIndustryKey,
    ...summary,
    qvsAepiMatrix: matrix,
    layerBenchmarks: [], // per-layer-metrics 연동 시 활성화
    firstMoverItems: firstMover,
    contentTrends: trends,
    topPredictions: summary.topPredictions,
  };
}

/**
 * QIS 요약 통계 (시그널 수, 예측 수, 커버리지 분포)
 */
async function getQisSummary(subIndustryKey: string) {
  const defaults = {
    activeSignals: 0,
    totalPredictions: 0,
    highConfidencePredictions: 0,
    avgQvsComposite: 0,
    coverageDistribution: { none: 0, sparse: 0, moderate: 0, saturated: 0 },
    topPredictions: [] as TopPredictedQuestion[],
  };

  try {
    const supabase = getSupabaseAdminClient();
    const since30d = new Date();
    since30d.setDate(since30d.getDate() - 30);

    // 시그널 수
    const { count: signalCount } = await supabase
      .from('bsw_received_signals')
      .select('id', { count: 'exact', head: true })
      .eq('industry', subIndustryKey)
      .gte('detected_at', since30d.toISOString());

    // 예측 질문
    const { data: predictions } = await supabase
      .from('bsw_predicted_questions')
      .select('id, question_text, predicted_intent, predicted_volume, confidence, first_mover_window_days, current_ai_coverage, qvs_composite, competition_score')
      .eq('industry', subIndustryKey)
      .eq('actually_emerged', false)
      .order('qvs_composite', { ascending: false })
      .limit(100);

    if (!predictions || predictions.length === 0) {
      return { ...defaults, activeSignals: signalCount ?? 0 };
    }

    const highConf = predictions.filter(p => (p.confidence ?? 0) >= 0.7);
    const avgQvs = predictions.reduce((s, p) => s + (p.qvs_composite ?? 0), 0) / predictions.length;

    const dist = { none: 0, sparse: 0, moderate: 0, saturated: 0 };
    for (const p of predictions) {
      const cov = (p.current_ai_coverage ?? 'none') as keyof typeof dist;
      if (dist[cov] !== undefined) dist[cov]++;
    }

    const top5: TopPredictedQuestion[] = predictions.slice(0, 5).map(p => ({
      id: p.id,
      questionText: p.question_text ?? '',
      qvsComposite: p.qvs_composite ?? 0,
      confidence: p.confidence ?? 0,
      firstMoverDays: p.first_mover_window_days ?? 14,
      aiCoverage: p.current_ai_coverage ?? 'none',
      predictedVolume: p.predicted_volume ?? 'medium',
      predictedIntent: p.predicted_intent ?? '',
    }));

    return {
      activeSignals: signalCount ?? 0,
      totalPredictions: predictions.length,
      highConfidencePredictions: highConf.length,
      avgQvsComposite: Math.round(avgQvs),
      coverageDistribution: dist,
      topPredictions: top5,
    };
  } catch (err) {
    console.warn('[QisBenchmarkBridge] getQisSummary error:', err);
    return defaults;
  }
}
