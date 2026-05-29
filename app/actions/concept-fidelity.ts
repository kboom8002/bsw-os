'use server';

import { getSupabaseAdminClient } from '../../lib/supabase';
import { JudgePipeline } from '../../lib/judges/judge-pipeline';
import { ConceptFidelityAggregator } from '../../lib/metrics/concept-fidelity-aggregator';
import { generateAIBrandMRIReport } from '../../lib/reports/ai-brand-mri-generator';

const pipeline = new JudgePipeline();
const aggregator = new ConceptFidelityAggregator();

/**
 * 1. Run Judge Pipeline for all probe runs in an observation run.
 */
export async function runJudgePipeline(
  workspaceId: string,
  observationRunId: string
): Promise<{ completed: number; errors: number }> {
  try {
    const supabase = getSupabaseAdminClient();

    // Fetch all probe runs
    const { data: runs, error } = await supabase
      .from('probe_runs')
      .select('id')
      .eq('ai_observation_run_id', observationRunId);

    if (error || !runs) {
      throw new Error(`Failed to fetch probe runs: ${error?.message}`);
    }

    let completed = 0;
    let errors = 0;

    for (const run of runs) {
      try {
        const res = await pipeline.runForProbeRun(workspaceId, run.id);
        if (res.errors && res.errors.length > 0) {
          errors++;
        } else {
          completed++;
        }
      } catch (err) {
        errors++;
      }
    }

    // Update observation run status to completed
    await supabase
      .from('ai_observation_runs')
      .update({ run_status: 'completed' })
      .eq('id', observationRunId);

    return { completed, errors };
  } catch (err: any) {
    console.error(`runJudgePipeline server action error: ${err.message}`);
    throw new Error(`Pipeline execution failed: ${err.message}`);
  }
}

/**
 * 2. Run Judge Pipeline for a single probe run.
 */
export async function judgeProbeRun(workspaceId: string, probeRunId: string): Promise<any> {
  try {
    return await pipeline.runForProbeRun(workspaceId, probeRunId);
  } catch (err: any) {
    console.error(`judgeProbeRun error: ${err.message}`);
    throw new Error(`Single probe judgment failed: ${err.message}`);
  }
}

/**
 * 3. Aggregate Concept Fidelity metrics (M1-M13) for an observation run.
 */
export async function aggregateConceptFidelity(
  workspaceId: string,
  observationRunId: string,
  condition: 'baseline' | 'intervention' = 'baseline'
): Promise<any> {
  try {
    return await aggregator.aggregate(workspaceId, observationRunId, condition);
  } catch (err: any) {
    console.error(`aggregateConceptFidelity error: ${err.message}`);
    throw new Error(`Aggregation failed: ${err.message}`);
  }
}

/**
 * 4. Fetch Missing Concept Gaps for a snapshot.
 */
export async function getMissingConceptGaps(workspaceId: string, snapshotId: string): Promise<any[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('missing_concept_gaps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('snapshot_id', snapshotId);

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error(`getMissingConceptGaps error: ${err.message}`);
    throw new Error(`Failed to fetch missing concept gaps: ${err.message}`);
  }
}

/**
 * 5. Generate AI Brand MRI Report markdown.
 */
export async function generateAIBrandMRI(
  workspaceId: string,
  observationRunId: string
): Promise<{ reportId: string; markdown: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // Check if snapshot exists. If not, aggregate first
    let { data: snapshots } = await supabase
      .from('concept_fidelity_snapshots')
      .select('*')
      .eq('ai_observation_run_id', observationRunId)
      .limit(1);

    let snapshot = snapshots?.[0];
    if (!snapshot) {
      snapshot = await aggregateConceptFidelity(workspaceId, observationRunId, 'baseline');
    }

    const markdown = await generateAIBrandMRIReport(workspaceId, observationRunId, snapshot.id);

    // Save as a benchmark report
    const { data: report, error: reportErr } = await supabase
      .from('benchmark_reports')
      .insert({
        workspace_id: workspaceId,
        report_name: `AI Brand MRI Report - ${new Date().toLocaleDateString()}`,
        scores: snapshot,
      })
      .select('id')
      .single();

    if (reportErr) throw reportErr;

    // Create report section for the markdown
    await supabase
      .from('report_sections')
      .insert({
        workspace_id: workspaceId,
        benchmark_report_id: report.id,
        section_title: 'AI Brand MRI Analysis',
        section_body: markdown,
        section_type: 'executive_summary',
        status: 'completed',
      });

    return {
      reportId: report.id,
      markdown,
    };
  } catch (err: any) {
    console.error(`generateAIBrandMRI error: ${err.message}`);
    throw new Error(`Report generation failed: ${err.message}`);
  }
}

/**
 * 6. Create Baseline vs Intervention Experiment.
 */
export async function createExperiment(
  workspaceId: string,
  experimentName: string,
  baselineRunId: string,
  interventionRunId: string,
  interventionType: string
): Promise<{ experimentId: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('experiment_runs')
      .insert({
        workspace_id: workspaceId,
        experiment_name: experimentName,
        baseline_run_id: baselineRunId,
        intervention_run_id: interventionRunId,
        intervention_type: interventionType,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) throw error;
    return { experimentId: data.id };
  } catch (err: any) {
    console.error(`createExperiment error: ${err.message}`);
    throw new Error(`Experiment creation failed: ${err.message}`);
  }
}

/**
 * 7. Run Baseline vs Intervention comparison.
 */
export async function runExperimentComparison(workspaceId: string, experimentId: string): Promise<any> {
  try {
    const supabase = getSupabaseAdminClient();

    // Fetch experiment run
    const { data: exp, error: expErr } = await supabase
      .from('experiment_runs')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (expErr || !exp) {
      throw new Error(`Experiment not found: ${expErr?.message}`);
    }

    // Ensure snapshots exist or aggregate them
    let { data: baseSnaps } = await supabase
      .from('concept_fidelity_snapshots')
      .select('*')
      .eq('ai_observation_run_id', exp.baseline_run_id)
      .limit(1);
    let baseSnap = baseSnaps?.[0];
    if (!baseSnap) {
      baseSnap = await aggregateConceptFidelity(workspaceId, exp.baseline_run_id, 'baseline');
    }

    let { data: interSnaps } = await supabase
      .from('concept_fidelity_snapshots')
      .select('*')
      .eq('ai_observation_run_id', exp.intervention_run_id)
      .limit(1);
    let interSnap = interSnaps?.[0];
    if (!interSnap) {
      interSnap = await aggregateConceptFidelity(workspaceId, exp.intervention_run_id, 'intervention');
    }

    // Compute improvements
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
      const baseVal = Number(baseSnap[m.key] || 0);
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

    const riskReduction = Number(baseSnap.floor_risk || 0) - Number(interSnap.floor_risk || 0);

    const comparisonResults = {
      improvements,
      risk_reduction: parseFloat(riskReduction.toFixed(4)),
      summary: `Baseline AEO Readiness of ${baseSnap.aeo_geo_readiness} improved to ${interSnap.aeo_geo_readiness} under ${exp.intervention_type} conditions.`,
    };

    // Update experiment run
    await supabase
      .from('experiment_runs')
      .update({
        status: 'completed',
        comparison_results: comparisonResults,
        completed_at: new Date().toISOString(),
      })
      .eq('id', experimentId);

    return {
      experimentId,
      baseline: baseSnap,
      intervention: interSnap,
      ...comparisonResults,
    };
  } catch (err: any) {
    console.error(`runExperimentComparison error: ${err.message}`);
    throw new Error(`Comparison computation failed: ${err.message}`);
  }
}

/**
 * 8. Retrieve Concept Fidelity Snapshot for an observation run.
 */
export async function getConceptFidelitySnapshot(
  workspaceId: string,
  observationRunId: string
): Promise<any | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('concept_fidelity_snapshots')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('ai_observation_run_id', observationRunId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err: any) {
    console.error(`getConceptFidelitySnapshot error: ${err.message}`);
    throw new Error(`Snapshot retrieval failed: ${err.message}`);
  }
}

/**
 * 9. Generate Answer Card Backlog items for missing concept gaps.
 */
export async function generateAnswerCardBacklog(
  workspaceId: string,
  snapshotId: string
): Promise<{ created: number; items: any[] }> {
  try {
    const supabase = getSupabaseAdminClient();

    // Fetch missing concept gaps
    const gaps = await getMissingConceptGaps(workspaceId, snapshotId);
    if (gaps.length === 0) {
      return { created: 0, items: [] };
    }

    const createdItems: any[] = [];

    for (const gap of gaps) {
      // Create a RCA Case for each missing concept gap to trigger closed-loop optimization
      const { data: rca, error: rcaErr } = await supabase
        .from('rca_cases')
        .insert({
          workspace_id: workspaceId,
          metric_name: 'Concept Recall Gap',
          metric_value: gap.recall_rate,
          cause_hypothesis: `AI model fails to transfer core concept: ${gap.concept_label} (M1 recall = ${gap.recall_rate * 100}%, threshold = ${gap.threshold * 100}%) due to weak evidence binding.`,
          status: 'candidate',
          justification_notes: `Auto-generated from TCO-GEO Concept Fidelity Aggregator snapshot gap ID: ${gap.id}.`,
        })
        .select('*')
        .single();

      if (!rcaErr && rca) {
        createdItems.push({
          rca_case_id: rca.id,
          concept_label: gap.concept_label,
          recall_rate: gap.recall_rate,
          severity: gap.gap_severity,
        });
      }
    }

    return {
      created: createdItems.length,
      items: createdItems,
    };
  } catch (err: any) {
    console.error(`generateAnswerCardBacklog error: ${err.message}`);
    throw new Error(`Failed to generate backlog: ${err.message}`);
  }
}
