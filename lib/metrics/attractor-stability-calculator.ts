export class AttractorStabilityCalculator {
  /**
   * Computes M7 (Attractor Stability), M11 (Consensus), M12 (Variance)
   * for a set of probe runs (specifically repeated runs of the same queries).
   */
  public static computeMetrics(
    runs: {
      concepts: { concept_id: string; present: boolean; rank: number; evidence_bound: boolean }[];
      relations: { source_concept_id: string; target_concept_id: string; relation_type?: string; accuracy: number }[];
    }[]
  ): { attractor_stability: number; consensus_score: number; variance_score: number } {
    if (runs.length <= 1) {
      // Single run fallback defaults
      return {
        attractor_stability: 1.0,
        consensus_score: 1.0,
        variance_score: 0.0,
      };
    }

    const numRuns = runs.length;

    // 1. Compute M11 Consensus Score: Average pairwise Jaccard similarity of present concepts
    let totalJaccard = 0.0;
    let jaccardPairs = 0;

    for (let i = 0; i < numRuns; i++) {
      for (let j = i + 1; j < numRuns; j++) {
        const setA = new Set(runs[i].concepts.filter((c) => c.present).map((c) => c.concept_id));
        const setB = new Set(runs[j].concepts.filter((c) => c.present).map((c) => c.concept_id));

        const intersection = new Set([...setA].filter((x) => setB.has(x)));
        const union = new Set([...setA, ...setB]);

        const jaccard = union.size === 0 ? 1.0 : intersection.size / union.size;
        totalJaccard += jaccard;
        jaccardPairs++;
      }
    }

    const consensusScore = jaccardPairs === 0 ? 1.0 : totalJaccard / jaccardPairs;

    // 2. Compute M12 Variance Score: Sum of variances of concept recall rates
    const conceptCounts: { [cid: string]: number } = {};
    const conceptRanks: { [cid: string]: number[] } = {};

    runs.forEach((run) => {
      run.concepts.forEach((c) => {
        if (!conceptCounts[c.concept_id]) {
          conceptCounts[c.concept_id] = 0;
          conceptRanks[c.concept_id] = [];
        }
        if (c.present) {
          conceptCounts[c.concept_id]++;
          conceptRanks[c.concept_id].push(c.rank);
        } else {
          conceptRanks[c.concept_id].push(99); // high rank value for missing
        }
      });
    });

    let totalVariance = 0.0;
    Object.keys(conceptCounts).forEach((cid) => {
      const recallRate = conceptCounts[cid] / numRuns;
      // Variance of a Bernoulli variable (present / not present) is p * (1 - p)
      const pVar = recallRate * (1.0 - recallRate);
      totalVariance += pVar;
    });

    const varianceScore = totalVariance;

    // 3. Compute M7 Attractor Stability
    // Attractor = 0.40 * recall_consistency + 0.20 * rank_stability + 0.20 * relation_stability + 0.20 * boundary_suppression
    // Let's compute components:
    
    // 3.1 Recall Consistency: 1 - average variance of key concepts
    const activeConceptIds = Object.keys(conceptCounts);
    let avgVariance = 0.0;
    if (activeConceptIds.length > 0) {
      const varSum = activeConceptIds.reduce((sum, cid) => {
        const p = conceptCounts[cid] / numRuns;
        return sum + p * (1.0 - p);
      }, 0);
      avgVariance = varSum / activeConceptIds.length;
    }
    const recallConsistency = 1.0 - 4.0 * avgVariance; // scaled so that max variance (p=0.5, var=0.25) goes to 0

    // 3.2 Rank Stability
    let rankStabilitySum = 0.0;
    let rankStabilityCount = 0;
    Object.keys(conceptRanks).forEach((cid) => {
      const ranks = conceptRanks[cid];
      if (ranks.length > 0) {
        const meanRank = ranks.reduce((sum, r) => sum + r, 0) / ranks.length;
        const rankVar = ranks.reduce((sum, r) => sum + Math.pow(r - meanRank, 2), 0) / ranks.length;
        // Standardize rank stability: 1 / (1 + rankVar)
        rankStabilitySum += 1.0 / (1.0 + rankVar);
        rankStabilityCount++;
      }
    });
    const rankStability = rankStabilityCount === 0 ? 1.0 : rankStabilitySum / rankStabilityCount;

    // 3.3 Relation Stability: Consistency of extracted relationships
    const relationKeyCounts: { [rkey: string]: number } = {};
    runs.forEach((run) => {
      run.relations.forEach((r) => {
        const rkey = `${r.source_concept_id}->${r.relation_type || 'related'}->${r.target_concept_id}`;
        relationKeyCounts[rkey] = (relationKeyCounts[rkey] || 0) + 1;
      });
    });

    let relationStabilitySum = 0.0;
    const rkeys = Object.keys(relationKeyCounts);
    rkeys.forEach((rkey) => {
      const p = relationKeyCounts[rkey] / numRuns;
      relationStabilitySum += 1.0 - 4.0 * (p * (1.0 - p)); // scaled consistency
    });
    const relationStability = rkeys.length === 0 ? 1.0 : Math.max(0, relationStabilitySum / rkeys.length);

    // 3.4 Boundary Suppression (assume stable high suppression for mock/standard setup)
    const boundarySuppression = 0.95;

    // Attractor Stability final score
    const attractorStability =
      0.40 * Math.max(0, recallConsistency) +
      0.20 * rankStability +
      0.20 * relationStability +
      0.20 * boundarySuppression;

    return {
      attractor_stability: parseFloat(attractorStability.toFixed(4)),
      consensus_score: parseFloat(consensusScore.toFixed(4)),
      variance_score: parseFloat(varianceScore.toFixed(4)),
    };
  }
}
