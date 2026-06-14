import { getSupabaseAdminClient } from '../supabase';
import { 
  createMockProbeRunResult,
  computeMetricSnapshot,
  computeDomainIndexSnapshot,
  createResponseJudgment
} from '../../app/actions/observatory';
import { getObservationProvider } from './observation-provider';


/**
 * 1. AI Response Probe Agent
 * Orchestrates external sandboxed proxy inquiry runs using fixtures.
 */
export async function runAIResponseProbeAgent(workspaceId: string, runId: string, engineName: any) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "AI Response Probe Agent",
      input_payload: { runId, engineName },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    const isMockMode = !['gemini', 'openai'].includes(process.env.AI_PROVIDER_MODE || '') || 
      ['success_fixture', 'mixed_source_fixture', 'dark_pattern_fixture', 'error_fixture'].includes(engineName);

    let runsCount = 0;

    if (isMockMode) {
      // 1. Existing backward compatible deterministic mock runs
      const runs = await createMockProbeRunResult(workspaceId, runId, engineName);
      runsCount = runs.length;
    } else {
      // 2. Real-time Gemini/SGE/ChatGPT Observation crawl
      const { data: run } = await supabase
        .from("ai_observation_runs")
        .select("probe_panel_id")
        .eq("id", runId)
        .single();

      if (!run) throw new Error("AIObservationRun not found.");

      const { data: questions } = await supabase
        .from("probe_questions")
        .select("id, question_text, target_keyword")
        .eq("probe_panel_id", run.probe_panel_id);

      if (!questions || questions.length === 0) {
        throw new Error("No questions configured inside this probe panel.");
      }

      const provider = getObservationProvider(engineName);

      for (const q of questions) {
        const obs = await provider.queryEngine(q.question_text, engineName);
        
        // Write raw crawling response
        const { data: pr } = await supabase
          .from("probe_runs")
          .insert({
            workspace_id: workspaceId,
            ai_observation_run_id: runId,
            probe_question_id: q.id,
            engine_name: engineName,
            raw_response_text: obs.rawResponseText,
            metadata: { latency_ms: obs.latencyMs }
          })
          .select()
          .single();

        if (pr) {
          runsCount++;
          
          // Auto-insert Response Judgment as candidate
          const text = obs.rawResponseText.toLowerCase();
          const isCitation = text.includes("http") || text.includes("cite");
          const fidelity = text.includes("efficacy") || text.includes("clinical") ? 90.00 : 50.00;
          const covered = text.includes(q.target_keyword.toLowerCase());
          const concept = text.includes("squalane") || text.includes("retinol");

          await supabase
            .from("response_judgments")
            .insert({
              workspace_id: workspaceId,
              probe_run_id: pr.id,
              is_citation_found: isCitation,
              brand_semantic_fidelity_score: fidelity,
              question_territory_covered: covered,
              geo_concept_transferred: concept,
              reviewer_notes: `Auto-judged candidate from live observation query run: ${engineName}`,
              review_status: "candidate"
            });
        }
      }
    }

    // Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { probeRunsCount: runsCount },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, probeRunsCount: runsCount };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 2. Response Judgment Agent
 * Analyzes raw response text to score citation accuracy, brand fidelity, and concept transfers.
 */
export async function runResponseJudgmentAgent(workspaceId: string, probeRunId: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Response Judgment Agent",
      input_payload: { probeRunId },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Fetch raw response text
    const { data: run } = await supabase
      .from("probe_runs")
      .select("raw_response_text")
      .eq("id", probeRunId)
      .single();

    if (!run) throw new Error(`Probe run not found: ${probeRunId}`);

    const text = run.raw_response_text.toLowerCase();

    // 2. Deterministic AI judgment criteria mapping
    const isCitation = text.includes("http") || text.includes("cite");
    const fidelity = text.includes("clinical") ? 90.00 : 50.00;
    const covered = text.includes("hydration") || text.includes("efficacy");
    const concept = text.includes("squalane") || text.includes("retinol");

    // 3. Create or Update Response Judgment
    const judgment = await createResponseJudgment(workspaceId, {
      probe_run_id: probeRunId,
      is_citation_found: isCitation,
      brand_semantic_fidelity_score: fidelity,
      question_territory_covered: covered,
      geo_concept_transferred: concept,
      reviewer_notes: "Response Judgment Agent auto-evaluation analysis pass.",
      review_status: "draft"
    });

    // Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { responseJudgmentId: judgment.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, judgment };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 3. Metric Aggregation Agent
 * Aggregates metric scores and domain snapshots chronologically.
 */
export async function runMetricAggregationAgent(workspaceId: string, runId: string, definitionId: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Metric Aggregation Agent",
      input_payload: { runId, definitionId },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Calculate snapshots
    const snapshots = await computeMetricSnapshot(workspaceId, runId);

    // 2. Compute index snapshots
    const indexSnapshot = await computeDomainIndexSnapshot(workspaceId, definitionId, runId);

    // Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { snapshotsCount: snapshots.length, indexSnapshotId: indexSnapshot.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, snapshotsCount: snapshots.length, indexSnapshot };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}
