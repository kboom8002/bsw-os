import { getSupabaseAdminClient } from '../supabase';
import { reportSectionSchema } from '../schema';

/**
 * Core DB execution layer for adding a report section.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function addReportSectionCore(workspaceId: string, data: any) {
  const parsed = reportSectionSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("report_sections")
    .insert({
      workspace_id: parsed.workspace_id,
      benchmark_report_id: parsed.benchmark_report_id,
      section_title: parsed.section_title,
      section_body: parsed.section_body,
      section_type: parsed.section_type,
      status: parsed.status
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Core DB execution layer for generating report drafts.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function generateReportDraftCore(workspaceId: string, reportId: string) {
  const supabase = getSupabaseAdminClient();

  // Create Executive Summary Draft Candidate
  const execSec = await addReportSectionCore(workspaceId, {
    benchmark_report_id: reportId,
    section_title: "Executive Summary Draft",
    section_body: "AI Draft: Based on proxy crawls, the website shows high answer shares but lacks robust official links.",
    section_type: "executive_summary",
    status: "candidate"
  });

  // Create Competitive Landscape Draft Candidate
  const compSec = await addReportSectionCore(workspaceId, {
    benchmark_report_id: reportId,
    section_title: "Competitive Landscape Analysis",
    section_body: "AI Draft: CompetitorA Retinol outperforms on raw answer visibility, but BSW offers higher semantic fidelity.",
    section_type: "competitive_landscape",
    status: "candidate"
  });

  // Write AI candidate transaction record into agent_runs
  await supabase.from("agent_runs").insert({
    workspace_id: workspaceId,
    agent_name: "report-draft-generator-agent",
    input_payload: { report_id: reportId },
    output_payload: { generated_sections_count: 2 },
    status: "candidate"
  });

  return [execSec, compSec];
}
