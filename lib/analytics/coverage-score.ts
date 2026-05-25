import { CosineAlignmentEngine } from "../embeddings/cosine-engine";

export class CoverageAnalyzer {
  private cosineEngine: CosineAlignmentEngine;

  constructor() {
    this.cosineEngine = new CosineAlignmentEngine();
  }

  /**
   * 자사 질문군이 업종 전체 "질문 우주"를 얼마나 빈틈없이 대표(Coverage)하는지
   * 3072차원 임베딩 정렬 엔진을 기반으로 백분율 시맨틱 커버리지 스코어(SCS)를 계산합니다.
   *
   * 공식: SCS = (Sum_i(max_j(CosineSim(ActiveQuestion_i, MasterUniverse_j))) / N) * 100
   */
  public async computeSemanticCoverageScore(
    workspaceId: string,
    activeQuestions: string[],
    masterUniverse: string[]
  ): Promise<number> {
    if (activeQuestions.length === 0 || masterUniverse.length === 0) return 0;

    let totalMaxSim = 0;

    for (const activeQ of activeQuestions) {
      let maxSim = 0;
      for (const masterQ of masterUniverse) {
        // computeVPA returns normalized alignment between 0 and 100
        const vpa = await this.cosineEngine.computeVPA(workspaceId, activeQ, masterQ);
        const sim = vpa / 100;
        if (sim > maxSim) {
          maxSim = sim;
        }
      }
      totalMaxSim += maxSim;
    }

    const scs = (totalMaxSim / activeQuestions.length) * 100;
    return Math.max(0, Math.min(100, Number(scs.toFixed(2))));
  }
}
