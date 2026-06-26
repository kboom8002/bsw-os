'use server';

// app/actions/qis-benchmark.ts
// QIS × 벤치마크 통합 Server Actions

import {
  getQisBenchmarkIntegration,
  getContentTrends,
  buildQvsAepiMatrix,
  getFirstMoverOpportunities,
} from '../../lib/benchmark/qis-benchmark-bridge';
import type {
  QisBenchmarkIntegration,
  ContentTrendPoint,
  QvsAepiMatrixItem,
  FirstMoverItem,
} from '../../lib/benchmark/qis-benchmark-bridge';
import type { SiteAuditSnapshot } from '../../lib/industry/batch-audit-runner';

/**
 * QIS × 벤치마크 통합 데이터 전체 조회
 */
export async function fetchQisBenchmarkData(
  subIndustryKey: string,
  snapshots: SiteAuditSnapshot[]
): Promise<QisBenchmarkIntegration> {
  return getQisBenchmarkIntegration(subIndustryKey, snapshots);
}

/**
 * AEO 콘텐츠 트렌드 시계열 조회
 */
export async function fetchAeoContentTrends(
  subIndustryKey: string,
  days = 30
): Promise<ContentTrendPoint[]> {
  return getContentTrends(subIndustryKey, days);
}

/**
 * QVS × AEPI 매트릭스 데이터 조회
 */
export async function fetchQvsAepiMatrix(
  subIndustryKey: string,
  snapshots: SiteAuditSnapshot[]
): Promise<QvsAepiMatrixItem[]> {
  return buildQvsAepiMatrix(subIndustryKey, snapshots);
}

/**
 * First Mover 기회 목록 조회
 */
export async function fetchFirstMoverOpportunities(
  subIndustryKey: string
): Promise<FirstMoverItem[]> {
  return getFirstMoverOpportunities(subIndustryKey);
}
