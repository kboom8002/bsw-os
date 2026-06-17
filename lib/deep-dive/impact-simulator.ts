import { ContentBlueprint, DeepDiveDiagnostic } from './types';

export class ImpactSimulator {
  /**
   * Run the impact simulation predicting metric shifts based on the proposed blueprints.
   */
  static simulate(
    currentDiagnostic: DeepDiveDiagnostic,
    blueprints: ContentBlueprint[]
  ) {
    const current = {
      aepi: 34.2, // mock base aepi
      bdr: currentDiagnostic.benchmarkSnapshot.bdr,
      cwr: currentDiagnostic.benchmarkSnapshot.cwr,
      aas: currentDiagnostic.benchmarkSnapshot.aas,
      dmri: currentDiagnostic.dmri.value
    };

    let totalAepiDelta = 0;
    let totalBdrDelta = 0;
    let totalCwrDelta = 0;
    
    const perBlueprintContribution = blueprints.map(bp => {
      totalAepiDelta += bp.estimated_aepi_impact;
      
      // If it's a competitive article, assume CWR delta. If brand article, BDR delta.
      const isCompetitive = bp.content_type === 'comparison_guide';
      let bpBdrDelta = isCompetitive ? 0 : bp.estimated_bdr_delta;
      let bpCwrDelta = isCompetitive ? bp.estimated_bdr_delta * 0.8 : 0; // heuristic

      totalBdrDelta += bpBdrDelta;
      totalCwrDelta += bpCwrDelta;
      
      return {
        blueprint_id: bp.id || 'temp',
        title: bp.title_suggestion_ko,
        aepi_delta: bp.estimated_aepi_impact,
        bdr_delta: bpBdrDelta,
        cwr_delta: bpCwrDelta,
        effort_estimate: bp.estimated_aepi_impact > 15 ? 'high' : 'medium',
        roi_score: Math.round(bp.estimated_aepi_impact * 5)
      };
    });

    const projected = {
      aepi: current.aepi + totalAepiDelta,
      bdr: current.bdr + totalBdrDelta,
      cwr: current.cwr + totalCwrDelta,
      aas: current.aas + (totalAepiDelta * 0.5), // heuristic
      dmri: Math.min(100, current.dmri + (blueprints.length * 1.5))
    };

    const sortedBlueprints = [...perBlueprintContribution].sort((a, b) => b.roi_score - a.roi_score);
    
    // Create scenarios
    const top3 = sortedBlueprints.slice(0, 3);
    const scenarios = [];
    
    if (top3.length > 0) {
      scenarios.push({
        name: 'Top 3 집중 실행 (가성비 최대)',
        blueprint_count: top3.length,
        total_aepi_delta: top3.reduce((sum, item) => sum + item.aepi_delta, 0),
        total_bdr_delta: top3.reduce((sum, item) => sum + item.bdr_delta, 0),
        estimated_weeks: 3
      });
    }
    
    if (blueprints.length > 3) {
      scenarios.push({
        name: `Full Package (${blueprints.length}개)`,
        blueprint_count: blueprints.length,
        total_aepi_delta: totalAepiDelta,
        total_bdr_delta: totalBdrDelta,
        estimated_weeks: Math.ceil(blueprints.length * 0.7)
      });
    }

    return {
      current,
      projected,
      per_blueprint_contribution: perBlueprintContribution,
      scenarios
    };
  }
}
