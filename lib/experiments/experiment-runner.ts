import { getSupabaseAdminClient } from '../supabase';
import { aggregateConceptFidelity } from '../../app/actions/concept-fidelity';
import { ExperimentComparison } from './types';

export class ExperimentRunner {
  /**
   * Runs the comparison for a baseline vs intervention experiment.
   */
  public async run(workspaceId: string, experimentId: string): Promise<ExperimentComparison> {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch experiment run
    const { data: exp, error: expErr } = await supabase
      .from('experiment_runs')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (expErr || !exp) {
      throw new Error(`Experiment run not found: ${expErr?.message || 'Not found'}`);
    }

    // 2. Fetch or compute baseline snapshot
    let { data: baselineSnaps } = await supabase
      .from('concept_fidelity_snapshots')
      .select('*')
      .eq('ai_observation_run_id', exp.baseline_run_id)
      .limit(1);

    let baselineSnap = baselineSnaps?.[0];
    if (!baselineSnap) {
      baselineSnap = await aggregateConceptFidelity(workspaceId, exp.baseline_run_id, 'baseline');
    }

    // 3. Fetch or compute intervention snapshot
    let { data: interSnaps } = await supabase
      .from('concept_fidelity_snapshots')
      .select('*')
      .eq('ai_observation_run_id', exp.intervention_run_id)
      .limit(1);

    let interSnap = interSnaps?.[0];
    if (!interSnap) {
      interSnap = await aggregateConceptFidelity(workspaceId, exp.intervention_run_id, 'intervention');
    }

    // 4. Calculate improvements
    const metrics = [
      { key: 'concept_transfer_rate', label: 'Concept Transfer Rate' },
      { key: 'citation_backed_rate', label: 'Citation-Backed Rate' },
      { key: 'brand_concept_fidelity', label: 'Brand Concept Fidelity' },
      { key: 'concept_distortion_rate', label: 'Distortion Rate' },
      { key: 'hallucinated_concept_rate', label: 'Hallucination Rate' },
      { key: 'floor_risk', label: 'Floor Risk' },
      { key: 'policy_alignment', label: 'Policy Alignment' },
      { key: 'aeo_geo_readiness', label: 'AEO/GEO Readiness' },
    ];

    const improvements = metrics.map((m) => {
      const baseVal = Number(baselineSnap[m.key] || 0);
      const interVal = Number(interSnap[m.key] || 0);
      const absolute = interVal - baseVal;
      const relative = baseVal === 0 ? 0 : absolute / baseVal;

      return {
        metric: m.label,
        baseline_value: parseFloat(baseVal.toFixed(4)),
        intervention_value: parseFloat(interVal.toFixed(4)),
        absolute_improvement: parseFloat(absolute.toFixed(4)),
        relative_improvement: parseFloat(relative.toFixed(4)),
      };
    });

    const riskReduction = Number(baselineSnap.floor_risk || 0) - Number(interSnap.floor_risk || 0);

    const comparisonResults = {
      improvements,
      risk_reduction: parseFloat(riskReduction.toFixed(4)),
      summary: `Baseline AEO Readiness of ${baselineSnap.aeo_geo_readiness} improved to ${interSnap.aeo_geo_readiness} under ${exp.intervention_type} conditions.`,
    };

    // 5. Update experiment run to completed
    const { error: updateErr } = await supabase
      .from('experiment_runs')
      .update({
        status: 'completed',
        comparison_results: comparisonResults,
        completed_at: new Date().toISOString(),
      })
      .eq('id', experimentId);

    if (updateErr) {
      throw new Error(`Failed to complete experiment run: ${updateErr.message}`);
    }

    return {
      experimentId,
      baseline: baselineSnap,
      intervention: interSnap,
      ...comparisonResults,
    };
  }
}
