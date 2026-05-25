import { CosineAlignmentEngine } from "../embeddings/cosine-engine";

export class CrossIndustryDeduplicator {
  private cosineEngine: CosineAlignmentEngine;

  constructor() {
    this.cosineEngine = new CosineAlignmentEngine();
  }

  public async detectDuplicates(
    q1: string,
    q2: string,
    workspaceId: string = "00000000-0000-4000-a000-000000000001"
  ): Promise<{ isDuplicate: boolean; similarity: number }> {
    // CosineAlignmentEngine computes embedding alignment on [0, 100] normalization scale.
    // So similarity is normalized to [0, 1] range.
    const vpa = await this.cosineEngine.computeVPA(workspaceId, q1, q2);
    const similarity = vpa / 100;
    
    return {
      isDuplicate: similarity > 0.85,
      similarity,
    };
  }
}
