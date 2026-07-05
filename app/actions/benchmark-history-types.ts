/**
 * app/actions/benchmark-history-types.ts
 *
 * 벤치마크 이력 관련 타입 정의 파일.
 * 'use server' 파일에서는 async function만 export 가능하므로
 * 인터페이스/타입을 이 파일에 분리합니다.
 */

export interface MeasurementRun {
  id: string;
  domain_slug: string;
  domain_name: string;
  run_label: string | null;
  measured_at: string;
  brand_count: number;
  question_count: number;
  engine: string;
  status: string;
}

export interface MeasurementRunDetail extends MeasurementRun {
  leaderboard: {
    rank: number;
    brand_slug: string;
    brand_name: string;
    aas: number;
    ocr: number;
    bsf: number | null;
    bair: number | null;
    bdr: number | null;
    cwr: number | null;
    color: string;
  }[];
}
