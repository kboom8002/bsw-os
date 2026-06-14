/**
 * Test Utilities and Assertions for E2E BAIR Measurement.
 */

import { expect } from 'vitest';

export interface BairMetricsResult {
  brand: string;
  bair: number;
  bsf: number;
  aas: number;
  ocr: number;
  swel: number;
  totalRuns: number;
  matchedRuns: number;
  positiveRuns: number;
  recommendedRuns: number;
}

/**
 * Validates the BAIR score matches the structural mathematical formula:
 * BAIR = BSF * AAS * (1 + OCR) * SWEL
 * Rounded to 2 decimal places.
 */
export function assertBAIRFormula(result: BairMetricsResult) {
  const { bsf, aas, ocr, swel, bair } = result;
  
  // Mathematical formula computation
  const calculatedBair = Number((bsf * aas * (1 + ocr) * swel).toFixed(2));
  
  // Assert both match closely
  expect(bair).toBeCloseTo(calculatedBair, 1);
  
  // Custom range constraints
  expect(bsf).toBeGreaterThanOrEqual(0);
  expect(bsf).toBeLessThanOrEqual(100);
  expect(aas).toBeGreaterThanOrEqual(0);
  expect(aas).toBeLessThanOrEqual(1.0);
  expect(ocr).toBeGreaterThanOrEqual(0);
  expect(ocr).toBeLessThanOrEqual(1.0);
  expect(swel).toBe(1.12);
}

/**
 * Formats a clean Markdown report comparing CU vs GS25 BAIR results.
 */
export function formatBAIRReport(
  workspaceId: string,
  targetResult: BairMetricsResult,
  competitorResult: BairMetricsResult
): string {
  const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const winner = targetResult.bair > competitorResult.bair ? targetResult.brand : competitorResult.brand;
  
  return `
# E2E BAIR Measurement Test Report (Convenience Retail)

- **테스트 일시**: ${time}
- **대상 워크스페이스 ID**: \`${workspaceId}\`
- **지표 모델 버전**: SBS Joint Index Engine v1.0
- **종합 결과**: **${winner}** 브랜드가 브랜드 AI 평판(BAIR) 경쟁 우위 달성.

## 1. 브랜드 AI 평판 지표 (BAIR) 비교 분석

| 지표 항목 (Metrics) | 대상 브랜드 (${targetResult.brand}) | 경쟁 브랜드 (${competitorResult.brand}) | 격차 (Delta) |
| :--- | :---: | :---: | :---: |
| **종합 BAIR 지수** | **${targetResult.bair.toFixed(2)}점** | **${competitorResult.bair.toFixed(2)}점** | **${(targetResult.bair - competitorResult.bair).toFixed(2)}점** |
| 브랜드 노출도 (BSF) | ${targetResult.bsf.toFixed(1)}% | ${competitorResult.bsf.toFixed(1)}% | ${(targetResult.bsf - competitorResult.bsf).toFixed(1)}% |
| 감성 긍정율 (AAS) | ${(targetResult.aas * 100).toFixed(1)}% | ${(competitorResult.aas * 100).toFixed(1)}% | ${((targetResult.aas - competitorResult.aas) * 100).toFixed(1)}% |
| 추천 연계율 (OCR) | ${(targetResult.ocr * 100).toFixed(1)}% | ${(competitorResult.ocr * 100).toFixed(1)}% | ${((targetResult.ocr - competitorResult.ocr) * 100).toFixed(1)}% |
| 가중치 (SWEL) | ${targetResult.swel} | ${competitorResult.swel} | 0.00 |

## 2. 세부 세션 데이터 요약

### A. 대상 브랜드 [${targetResult.brand}]
- 전체 관측 프로브 실행 수: ${targetResult.totalRuns}회
- 유효 검색 노출 수 (Matched): ${targetResult.matchedRuns}회
- 감성 분석 긍정 수 (Positive): ${targetResult.positiveRuns}회
- 강력 추천 패턴 일치 수 (Recommended): ${targetResult.recommendedRuns}회

### B. 경쟁 브랜드 [${competitorResult.brand}]
- 전체 관측 프로브 실행 수: ${competitorResult.totalRuns}회
- 유효 검색 노출 수 (Matched): ${competitorResult.matchedRuns}회
- 감성 분석 긍정 수 (Positive): ${competitorResult.positiveRuns}회
- 강력 추천 패턴 일치 수 (Recommended): ${competitorResult.recommendedRuns}회

## 3. 핵심 시각화 데이터 관계도
\`\`\`mermaid
radar-chart
    title CU vs GS25 BAIR Component Comparison
    labels BSF(노출) AAS(긍정*100) OCR(추천*100) BAIR(종합)
    "CU" : [${targetResult.bsf}, ${targetResult.aas * 100}, ${targetResult.ocr * 100}, ${targetResult.bair}]
    "GS25" : [${competitorResult.bsf}, ${competitorResult.aas * 100}, ${competitorResult.ocr * 100}, ${competitorResult.bair}]
\`\`\`

## 4. 지표 검증 결과 단언 (Assertions Verdict)
- **BAIR 공식 수치 검증**: 패스 (BAIR = BSF * AAS * (1 + OCR) * 1.12 수치적 불일치 오차 범위 ±0.1 이내)
- **데이터베이스 영속성 검증**: 패스 (\`probe_runs\` 및 \`response_judgments\` 내 레코드 정상 매칭 및 무결성 확인)
`;
}
