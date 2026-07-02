import { BairEngine, BairResult } from "./bair";

// ═══════════════════════════════════════════════════════════════
// AIPR V2 — 경쟁사 실측 기반 AI Power Ranking
// ═══════════════════════════════════════════════════════════════
//
// V1 → V2 주요 변경:
// 1. deterministicVariation() 해시 모의값 제거
// 2. 경쟁사도 동일 computeBAIR()로 실측
// 3. 프로브 데이터 부족 시 isEstimated=true 투명 표시
// 4. dataConfidence 필드 추가 — 실측 데이터 충분성 표시
//
// 과학성 근거:
// - 동일 프로브 파이프라인으로 타깃/경쟁사 모두 측정 → 공정한 비교
// - 데이터 부족 시 추정임을 명시 → 대외 공표 투명성 확보
// ═══════════════════════════════════════════════════════════════

export interface AiprEntry {
  rank: number;
  brand: string;
  bairScore: number;
  details: BairResult;
  /** true = 프로브 데이터 부족으로 추정치 포함 */
  isEstimated: boolean;
}

export interface AiprResult {
  rankings: AiprEntry[];
  /** 전체 랭킹의 데이터 신뢰도 (0~1, 1=모든 브랜드 실측) */
  dataConfidence: number;
  measuredAt: string;
}

export class AiprEngine {
  private bairEngine: BairEngine;

  constructor() {
    this.bairEngine = new BairEngine();
  }

  /**
   * AIPR V2 — 경쟁사 실측 기반 업종 내 AI Power Ranking
   *
   * 타깃 브랜드와 경쟁사 모두 동일한 computeBAIR() 파이프라인으로 측정합니다.
   * 프로브 데이터가 없는 경쟁사는 isEstimated=true로 표시됩니다.
   */
  public async computeAIPR(
    workspaceId: string,
    industry: string,
    brandKeyword: string,
    competitors: string[]
  ): Promise<AiprEntry[]> {
    const brands = [brandKeyword, ...competitors];
    const results: BairResult[] = [];

    // 모든 브랜드에 대해 동일한 측정 파이프라인 적용
    for (const brand of brands) {
      const res = await this.bairEngine.computeBAIR(workspaceId, brand);
      results.push(res);
    }

    // BAIR 점수 내림차순 정렬
    results.sort((a, b) => b.bair - a.bair);

    // 데이터 신뢰도 계산 (실측 브랜드 비율)
    const measuredCount = results.filter(r => !r.isEstimated).length;
    const dataConfidence = results.length > 0
      ? Number((measuredCount / results.length).toFixed(2))
      : 0;

    return results.map((res, index) => ({
      rank: index + 1,
      brand: res.brand,
      bairScore: res.bair,
      details: res,
      isEstimated: res.isEstimated,
    }));
  }

  /**
   * 확장 결과를 포함한 AIPR — dataConfidence 포함
   */
  public async computeAIPRWithConfidence(
    workspaceId: string,
    industry: string,
    brandKeyword: string,
    competitors: string[]
  ): Promise<AiprResult> {
    const rankings = await this.computeAIPR(workspaceId, industry, brandKeyword, competitors);

    const measuredCount = rankings.filter(r => !r.isEstimated).length;
    const dataConfidence = rankings.length > 0
      ? Number((measuredCount / rankings.length).toFixed(2))
      : 0;

    return {
      rankings,
      dataConfidence,
      measuredAt: new Date().toISOString(),
    };
  }
}
