import { getSupabaseAdminClient } from "../supabase";

type LifecycleStatus = "draft" | "review" | "active" | "deprecated" | "archived";

// Valid state transitions
const VALID_TRANSITIONS: Record<LifecycleStatus, LifecycleStatus[]> = {
  draft:       ["review", "archived"],
  review:      ["active", "draft", "archived"],
  active:      ["deprecated", "archived"],
  deprecated:  ["active", "archived"],    // Can re-activate
  archived:    [],                         // Terminal state
};

export class QuestionLifecycleManager {
  /**
   * Transitions a question to a new lifecycle status.
   * Validates the transition against the state machine rules.
   */
  public async transition(
    questionId: string,
    workspaceId: string,
    toStatus: LifecycleStatus,
    userId: string
  ): Promise<{ success: boolean; from: string; to: string }> {
    const supabase = getSupabaseAdminClient();

    const { data: question } = await supabase
      .from("probe_questions")
      .select("lifecycle_status")
      .eq("id", questionId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!question) throw new Error(`QuestionNotFound: ${questionId}`);

    const fromStatus = (question.lifecycle_status || "active") as LifecycleStatus;
    const allowed = VALID_TRANSITIONS[fromStatus] || [];

    if (!allowed.includes(toStatus)) {
      throw new Error(
        `InvalidTransition: Cannot transition from "${fromStatus}" to "${toStatus}". Allowed: [${allowed.join(", ")}]`
      );
    }

    await supabase
      .from("probe_questions")
      .update({
        lifecycle_status: toStatus,
        lifecycle_changed_at: new Date().toISOString(),
        lifecycle_changed_by: userId,
      })
      .eq("id", questionId);

    // Audit trail
    await supabase.from("audit_events").insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: "LIFECYCLE_TRANSITION",
      target_type: "probe_questions",
      target_id: questionId,
      payload: { from: fromStatus, to: toStatus },
    });

    return { success: true, from: fromStatus, to: toStatus };
  }

  /**
   * Bulk-deprecates expired TTL questions.
   * Should be run as a scheduled cron job.
   */
  public async deprecateExpired(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data: expired } = await supabase
      .from("probe_questions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("lifecycle_status", "active")
      .eq("is_time_sensitive", true)
      .lt("ttl_expires_at", now);

    if (!expired || expired.length === 0) return 0;

    const ids = expired.map(e => e.id);

    await supabase
      .from("probe_questions")
      .update({
        lifecycle_status: "deprecated",
        lifecycle_changed_at: now,
      })
      .in("id", ids);

    return ids.length;
  }
}
