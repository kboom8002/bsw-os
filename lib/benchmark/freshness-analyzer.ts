/**
 * lib/benchmark/freshness-analyzer.ts
 *
 * AI 응답의 정보 최신성(Freshness)을 독립 지표로 측정합니다.
 *
 * Freshness Score = 0~100
 * - 100: 모든 응답이 최신 정보를 포함
 * - 0: 모든 응답이 오래된 정보이거나 시간 정보 부재
 */

export type FreshnessLevel = 'current' | 'recent' | 'dated' | 'stale';

export interface FreshnessResult {
  /** 개별 응답의 최신성 등급 */
  level: FreshnessLevel;
  /** 가중치 (current=1.0, recent=0.7, dated=0.3, stale=0.0) */
  weight: number;
  /** 감지된 시간 신호 목록 */
  temporalSignals: string[];
  /** 감지된 가장 최근 연도 (없으면 null) */
  latestYear: number | null;
}

export interface FreshnessMetrics {
  /** 종합 Freshness Score (0-100) */
  freshnessScore: number;
  /** 등급별 분포 (각 0-100%) */
  distribution: {
    current: number;
    recent: number;
    dated: number;
    stale: number;
  };
  /** 분석된 총 응답 수 */
  totalAnalyzed: number;
}

/* ────────────────────────────────────────────────────────────────
 * 내부 상수
 * ──────────────────────────────────────────────────────────────── */

/** 현재 시점(current)을 나타내는 한국어 키워드 */
const CURRENT_KEYWORDS_KO = ['최신', '올해', '신제품', '새로', '업데이트', '리뉴얼', '출시', '오픈'];
/** 현재 시점(current)을 나타내는 영어 키워드 */
const CURRENT_KEYWORDS_EN = ['latest', 'new', 'current', 'this year', 'launched', 'updated'];

/** 최근(recent)을 나타내는 한국어 키워드 */
const RECENT_KEYWORDS_KO = ['최근'];
/** 최근(recent)을 나타내는 영어 키워드 */
const RECENT_KEYWORDS_EN = ['recently'];

/** 날짜 패턴: YYYY-MM-DD, YYYY.MM.DD, YYYY년 */
const DATE_PATTERNS = [
  /\b(20[2-3]\d)-\d{1,2}-\d{1,2}\b/g,
  /\b(20[2-3]\d)\.\d{1,2}\.\d{1,2}\b/g,
  /(20[2-3]\d)년/g,
];

/** 4자리 연도 추출 (2020-2030 범위) */
const YEAR_PATTERN = /\b(20[2-3]\d)\b/g;

/** 등급별 가중치 매핑 */
const WEIGHT_MAP: Record<FreshnessLevel, number> = {
  current: 1.0,
  recent: 0.7,
  dated: 0.3,
  stale: 0.0,
};

/* ────────────────────────────────────────────────────────────────
 * analyzeFreshness
 * ──────────────────────────────────────────────────────────────── */

/**
 * 단일 AI 응답 텍스트의 정보 최신성을 분석합니다.
 *
 * @param responseText - AI 응답 원문
 * @param referenceDate - 기준 날짜 (기본값: 현재 시각)
 * @returns FreshnessResult
 */
export function analyzeFreshness(
  responseText: string,
  referenceDate?: Date
): FreshnessResult {
  const refDate = referenceDate ?? new Date();
  const currentYear = refDate.getFullYear();
  const lower = responseText.toLowerCase();

  // ── 1. 시간 신호 수집 ─────────────────────────────────────────
  const temporalSignals: string[] = [];

  // 한국어 current 키워드
  for (const kw of CURRENT_KEYWORDS_KO) {
    if (responseText.includes(kw)) temporalSignals.push(kw);
  }
  // 영어 current 키워드
  for (const kw of CURRENT_KEYWORDS_EN) {
    if (lower.includes(kw)) temporalSignals.push(kw);
  }
  // 한국어 recent 키워드
  for (const kw of RECENT_KEYWORDS_KO) {
    if (responseText.includes(kw)) temporalSignals.push(kw);
  }
  // 영어 recent 키워드
  for (const kw of RECENT_KEYWORDS_EN) {
    if (lower.includes(kw)) temporalSignals.push(kw);
  }

  // 날짜 패턴에서 연도 추출 & 신호 기록
  for (const pattern of DATE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(responseText)) !== null) {
      temporalSignals.push(match[0]);
    }
  }

  // ── 2. 연도 추출 ──────────────────────────────────────────────
  const yearRegex = new RegExp(YEAR_PATTERN.source, YEAR_PATTERN.flags);
  const years: number[] = [];
  let yearMatch: RegExpExecArray | null;
  while ((yearMatch = yearRegex.exec(responseText)) !== null) {
    years.push(parseInt(yearMatch[1], 10));
  }
  const latestYear = years.length > 0 ? Math.max(...years) : null;

  // ── 3. 분류 ───────────────────────────────────────────────────
  // current 키워드 확인
  const hasCurrent =
    CURRENT_KEYWORDS_KO.some((kw) => responseText.includes(kw)) ||
    CURRENT_KEYWORDS_EN.some((kw) => lower.includes(kw));
  // recent 키워드 확인
  const hasRecent =
    RECENT_KEYWORDS_KO.some((kw) => responseText.includes(kw)) ||
    RECENT_KEYWORDS_EN.some((kw) => lower.includes(kw));

  let level: FreshnessLevel;

  if (latestYear !== null && latestYear === currentYear) {
    level = 'current';
  } else if (hasCurrent) {
    level = 'current';
  } else if (latestYear !== null && latestYear === currentYear - 1) {
    level = 'recent';
  } else if (hasRecent) {
    level = 'recent';
  } else if (latestYear !== null && (latestYear === currentYear - 2 || latestYear === currentYear - 3)) {
    level = 'dated';
  } else {
    // latestYear < currentYear - 3 또는 시간 신호 없음
    level = 'stale';
  }

  // 중복 제거
  const uniqueSignals = [...new Set(temporalSignals)];

  return {
    level,
    weight: WEIGHT_MAP[level],
    temporalSignals: uniqueSignals,
    latestYear,
  };
}

/* ────────────────────────────────────────────────────────────────
 * calculateFreshnessMetrics
 * ──────────────────────────────────────────────────────────────── */

/**
 * 복수 AI 응답의 Freshness 지표를 집계합니다.
 *
 * @param responses - AI 응답 텍스트 배열
 * @param referenceDate - 기준 날짜 (기본값: 현재 시각)
 * @returns FreshnessMetrics
 */
export function calculateFreshnessMetrics(
  responses: string[],
  referenceDate?: Date
): FreshnessMetrics {
  if (responses.length === 0) {
    return {
      freshnessScore: 0,
      distribution: { current: 0, recent: 0, dated: 0, stale: 0 },
      totalAnalyzed: 0,
    };
  }

  const results = responses.map((text) => analyzeFreshness(text, referenceDate));
  const totalAnalyzed = results.length;

  // 가중치 합산 → 0-100 스코어
  const weightSum = results.reduce((sum, r) => sum + r.weight, 0);
  const freshnessScore = parseFloat(((weightSum / totalAnalyzed) * 100).toFixed(1));

  // 등급별 분포 (%)
  const counts: Record<FreshnessLevel, number> = { current: 0, recent: 0, dated: 0, stale: 0 };
  for (const r of results) {
    counts[r.level]++;
  }

  return {
    freshnessScore,
    distribution: {
      current: parseFloat(((counts.current / totalAnalyzed) * 100).toFixed(1)),
      recent: parseFloat(((counts.recent / totalAnalyzed) * 100).toFixed(1)),
      dated: parseFloat(((counts.dated / totalAnalyzed) * 100).toFixed(1)),
      stale: parseFloat(((counts.stale / totalAnalyzed) * 100).toFixed(1)),
    },
    totalAnalyzed,
  };
}
