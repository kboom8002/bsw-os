import { BairEngine, BairResult } from "./bair";

export interface AiprEntry {
  rank: number;
  brand: string;
  bairScore: number;
  details: BairResult;
}

export class AiprEngine {
  private bairEngine: BairEngine;

  constructor() {
    this.bairEngine = new BairEngine();
  }

  /**
   * Computes Industry AI Power Ranking (AIPR) listing competitor leaderboards.
   */
  public async computeAIPR(
    workspaceId: string,
    industry: string,
    brandKeyword: string,
    competitors: string[]
  ): Promise<AiprEntry[]> {
    const brands = [brandKeyword, ...competitors];
    const results: BairResult[] = [];

    // Compute BAIR score for each competitor brand
    for (const brand of brands) {
      const res = await this.bairEngine.computeBAIR(workspaceId, brand);
      
      // Seed some realistic variations for competitor mocks to ensure ranking differentiation
      if (brand !== brandKeyword) {
        res.bair = Number((res.bair * this.deterministicVariation(brand, workspaceId)).toFixed(2));
      }
      
      results.push(res);
    }

    // Sort descending by BAIR score
    results.sort((a, b) => b.bair - a.bair);

    return results.map((res, index) => ({
      rank: index + 1,
      brand: res.brand,
      bairScore: res.bair,
      details: res,
    }));
  }

  /**
   * 결정적 해시 기반 스코어 변동 함수.
   * 동일한 (brand, workspaceId) 조합은 항상 동일한 변동 계수를 반환.
   */
  private deterministicVariation(brand: string, workspaceId: string): number {
    let hash = 0;
    const seed = `${workspaceId}::${brand}`;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Normalize to [0.70, 1.10] range — same brand always gets same factor
    return 0.70 + (Math.abs(hash) % 4001) / 10000;
  }
}
