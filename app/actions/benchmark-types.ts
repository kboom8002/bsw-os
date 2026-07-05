/**
 * app/actions/benchmark-types.ts
 *
 * 벤치마크 관련 타입 정의 파일.
 * 'use server' 파일에서는 async function만 export 가능하므로
 * 인터페이스/타입을 이 파일에 분리합니다.
 */

export interface BenchmarkLeaderboardEntry {
  rank: number;
  brand_slug: string;
  brand_name: string;
  aas: number;
  ocr: number;
  bsf: number | null;
  bair: number | null;
  bdr: number | null;
  cwr: number | null;
  iri: number | null;
  opp: number | null;
  top3: number | null;
  top5: number | null;
  freshness: number | null;
  aas_trend: number;   // 이전 대비 변화 (+/-/0)
  color: string;
}

export interface BenchmarkHistoryPoint {
  date: string;        // 'YYYY-MM-DD'
  brand_slug: string;
  brand_name: string;
  aas: number;
  ocr: number;
}

export interface DomainLeaderboardResult {
  domain_slug: string;
  domain_name: string;
  measured_at: string;
  leaderboard: BenchmarkLeaderboardEntry[];
  history: BenchmarkHistoryPoint[];
}
