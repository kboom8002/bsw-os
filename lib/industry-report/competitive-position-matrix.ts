/**
 * lib/industry-report/competitive-position-matrix.ts
 *
 * BDR × CWR 4사분면 포지셔닝 계산기.
 * 기준선: 업종 평균 (동적) — 하드코딩 50% 아님.
 */

// ═══════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════

/**
 * 4사분면 분류
 *
 *         CWR 높음
 *     AI Leader  | Competitive Warrior
 *   ─────────────┼─────────────────────
 *  Steady Defender| Vulnerable
 *         CWR 낮음
 *
 *        BDR 낮음       BDR 높음
 */
export type Quadrant =
  | 'ai_leader'             // BDR 높음 + CWR 높음
  | 'competitive_warrior'   // BDR 낮음 + CWR 높음
  | 'steady_defender'       // BDR 높음 + CWR 낮음
  | 'vulnerable';           // BDR 낮음 + CWR 낮음

export interface BrandBdrCwr {
  brand: string;
  brandSlug: string;
  bdr: number;
  cwr: number;
  bairScore: number;       // 버블 크기용
  aepiScore?: number;
}

export interface PositionMatrixEntry extends BrandBdrCwr {
  quadrant: Quadrant;
  /** 기준선 대비 BDR 편차 (양수=기준 이상, 음수=기준 미만) */
  bdrDeviation: number;
  /** 기준선 대비 CWR 편차 */
  cwrDeviation: number;
}

export interface PositionMatrixResult {
  entries: PositionMatrixEntry[];
  /** 업종 평균 BDR (기준선) */
  bdrThreshold: number;
  /** 업종 평균 CWR (기준선) */
  cwrThreshold: number;
  /** 각 사분면 브랜드 목록 */
  byQuadrant: Record<Quadrant, PositionMatrixEntry[]>;
}

// ═══════════════════════════════════════════════════════════════
// 핵심 함수
// ═══════════════════════════════════════════════════════════════

/**
 * BDR × CWR 4사분면 포지션 계산
 *
 * 기준선을 업종 평균으로 동적 설정하여,
 * 측정된 브랜드 수와 상관없이 항상 의미 있는 분류를 보장합니다.
 *
 * @param brands - 각 브랜드의 BDR·CWR·BAIR 점수 배열
 * @returns 4사분면 포지셔닝 결과 (기준선 포함)
 */
export function calculatePositionMatrix(brands: BrandBdrCwr[]): PositionMatrixResult {
  if (brands.length === 0) {
    return {
      entries: [],
      bdrThreshold: 50,
      cwrThreshold: 50,
      byQuadrant: {
        ai_leader: [],
        competitive_warrior: [],
        steady_defender: [],
        vulnerable: [],
      },
    };
  }

  // 업종 평균을 기준선으로 동적 계산
  const bdrThreshold = brands.reduce((sum, b) => sum + b.bdr, 0) / brands.length;
  const cwrThreshold = brands.reduce((sum, b) => sum + b.cwr, 0) / brands.length;

  const entries: PositionMatrixEntry[] = brands.map((b) => {
    const bdrAbove = b.bdr >= bdrThreshold;
    const cwrAbove = b.cwr >= cwrThreshold;

    let quadrant: Quadrant;
    if (bdrAbove && cwrAbove) quadrant = 'ai_leader';
    else if (!bdrAbove && cwrAbove) quadrant = 'competitive_warrior';
    else if (bdrAbove && !cwrAbove) quadrant = 'steady_defender';
    else quadrant = 'vulnerable';

    return {
      ...b,
      quadrant,
      bdrDeviation: Number((b.bdr - bdrThreshold).toFixed(1)),
      cwrDeviation: Number((b.cwr - cwrThreshold).toFixed(1)),
    };
  });

  // 각 사분면별 그룹화 (BAIR 내림차순 정렬)
  const byQuadrant: Record<Quadrant, PositionMatrixEntry[]> = {
    ai_leader: [],
    competitive_warrior: [],
    steady_defender: [],
    vulnerable: [],
  };

  for (const entry of entries) {
    byQuadrant[entry.quadrant].push(entry);
  }

  for (const q of Object.keys(byQuadrant) as Quadrant[]) {
    byQuadrant[q].sort((a, b) => b.bairScore - a.bairScore);
  }

  return {
    entries: entries.sort((a, b) => b.bairScore - a.bairScore),
    bdrThreshold: Number(bdrThreshold.toFixed(1)),
    cwrThreshold: Number(cwrThreshold.toFixed(1)),
    byQuadrant,
  };
}

/**
 * 사분면 한국어 레이블 반환
 */
export function getQuadrantLabel(quadrant: Quadrant): string {
  const labels: Record<Quadrant, string> = {
    ai_leader: 'AI Leader (방어·공격 모두 강)',
    competitive_warrior: 'Competitive Warrior (공격 강, 방어 약)',
    steady_defender: 'Steady Defender (방어 강, 공격 약)',
    vulnerable: 'Vulnerable (방어·공격 모두 약)',
  };
  return labels[quadrant];
}

/**
 * 사분면별 전략 처방 반환
 */
export function getQuadrantPrescription(quadrant: Quadrant): {
  title: string;
  action: string;
  priority: string;
} {
  const prescriptions: Record<Quadrant, { title: string; action: string; priority: string }> = {
    ai_leader: {
      title: 'AI 검색 선도 유지',
      action: 'OPP 기회 영역 선점 + 트렌드 질문 콘텐츠 우선 생성',
      priority: '모니터링 중심',
    },
    competitive_warrior: {
      title: '브랜드 방어력 강화',
      action: 'L7 브랜드 직접 질문 대응 콘텐츠 집중 제작 + 브랜드 엔티티 스키마 강화',
      priority: '⚠ 긴급',
    },
    steady_defender: {
      title: '경쟁 비교 질의 공략',
      action: 'L2 비교 질문 대응 차별화 콘텐츠 + 강점 근거 데이터 강화',
      priority: '🔴 중요',
    },
    vulnerable: {
      title: 'AI 가시성 기반 구축',
      action: '엔티티 스키마·시맨틱 페이지 최우선 구축 + Answer-First 문체 전환',
      priority: '🚨 최우선',
    },
  };
  return prescriptions[quadrant];
}
