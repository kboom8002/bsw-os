import { getSupabaseAdminClient } from '../supabase';
import { rcaCaseSchema, patchTicketSchema } from '../schema';

/**
 * Core DB execution layer for creating an RCA Case.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createRcaCaseCore(workspaceId: string, data: any) {
  const parsed = rcaCaseSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("rca_cases")
    .insert({
      workspace_id: parsed.workspace_id,
      source_metric_snapshot_id: parsed.source_metric_snapshot_id,
      metric_name: parsed.metric_name,
      metric_value: parsed.metric_value,
      cause_hypothesis: parsed.cause_hypothesis,
      status: parsed.status,
      justification_notes: parsed.justification_notes
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Core DB execution layer for creating a Patch Ticket.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createPatchTicketCore(workspaceId: string, data: any) {
  const parsed = patchTicketSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("patch_tickets")
    .insert({
      workspace_id: parsed.workspace_id,
      rca_case_id: parsed.rca_case_id,
      patch_name: parsed.patch_name,
      patch_hypothesis: parsed.patch_hypothesis,
      status: parsed.status
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}
