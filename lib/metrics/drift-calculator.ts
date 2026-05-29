export interface ConceptDistribution {
  [conceptId: string]: number; // concept_id -> recall_rate (0~1)
}

export class DriftCalculator {
  /**
   * Computes the drift score between two concept recall distributions.
   * Drift = cosine distance (1 - cosine similarity) by default.
   */
  public static computeDrift(
    distA: ConceptDistribution,
    distB: ConceptDistribution,
    method: 'cosine' | 'l1' = 'cosine'
  ): { drift_score: number; direction: 'positive' | 'negative' | 'neutral' } {
    const keys = Array.from(new Set([...Object.keys(distA), ...Object.keys(distB)]));

    if (keys.length === 0) {
      return { drift_score: 0.0, direction: 'neutral' };
    }

    const vecA = keys.map((k) => distA[k] || 0.0);
    const vecB = keys.map((k) => distB[k] || 0.0);

    let driftScore = 0.0;

    if (method === 'cosine') {
      let dotProduct = 0.0;
      let normA = 0.0;
      let normB = 0.0;

      for (let i = 0; i < keys.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }

      normA = Math.sqrt(normA);
      normB = Math.sqrt(normB);

      if (normA === 0 || normB === 0) {
        driftScore = dotProduct === 0 ? 0.0 : 1.0;
      } else {
        const similarity = dotProduct / (normA * normB);
        driftScore = 1.0 - similarity;
      }
    } else {
      // L1 normalized Manhattan distance
      let sumDiff = 0.0;
      let sumTotal = 0.0;

      for (let i = 0; i < keys.length; i++) {
        sumDiff += Math.abs(vecA[i] - vecB[i]);
        sumTotal += vecA[i] + vecB[i];
      }

      driftScore = sumTotal === 0 ? 0.0 : sumDiff / sumTotal;
    }

    // Determine direction (overall concept recall improvement = positive, else negative)
    const sumA = vecA.reduce((sum, v) => sum + v, 0);
    const sumB = vecB.reduce((sum, v) => sum + v, 0);

    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
    const delta = sumB - sumA;

    if (delta > 0.02) {
      direction = 'positive';
    } else if (delta < -0.02) {
      direction = 'negative';
    }

    return {
      drift_score: parseFloat(driftScore.toFixed(4)),
      direction,
    };
  }
}
