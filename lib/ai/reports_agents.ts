import { getSupabaseAdminClient } from '../supabase';
import { 
  generateReportDraftCore,
  addReportSectionCore
} from '../db/reports-db';
import { getAIProvider } from './ai-provider';


/**
 * 1. Report Drafting Agent
 * Automatically creates candidate sections using mock semantic insight mappings
 */
export async function runReportDraftingAgent(workspaceId: string, reportId: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Report Drafting Agent",
      input_payload: { reportId },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // Generate draft sections (all candidates by default)
    const sections = await generateReportDraftCore(workspaceId, reportId);

    // Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { draftedSectionsCount: sections.length },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, draftedSectionsCount: sections.length };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 2. Report Insight Agent
 * Formulates competitive observed insights based on active metric snapshots
 */
export async function runReportInsightAgent(workspaceId: string, reportId: string, runId: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Report Insight Agent",
      input_payload: { reportId, runId },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Fetch metric snapshots
    const { data: snaps } = await supabase
      .from("metric_snapshots")
      .select("metric_name, metric_value")
      .eq("ai_observation_run_id", runId);

    const ars = snaps?.find(s => s.metric_name === "ARS")?.metric_value || 0;
    const ocr = snaps?.find(s => s.metric_name === "OCR")?.metric_value || 0;

    // 2. Synthesize insights paragraph using AI Provider
    const ai = getAIProvider();
    const prompt = `Synthesize a professional observed competitive AI engine coverage report insight. ` +
      `Our active observation run achieved an observed AEO Readiness Score (ARS) of ${ars}%. ` +
      `Our verified citation rate (OCR) is at ${ocr}%. ` +
      `Generate a 2-sentence analytical paragraph discussing competitor visibility compared to our safety alignment.`;

    const body = await ai.generateText(prompt);

    const section = await addReportSectionCore(workspaceId, {
      benchmark_report_id: reportId,
      section_title: "AI Observation Insights Pass",
      section_body: body,
      section_type: "metrics_analysis",
      status: "candidate" // candidate by default!
    });

    // Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { reportSectionId: section.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, section };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}
