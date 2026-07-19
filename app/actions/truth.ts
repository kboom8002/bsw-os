"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission, requireAuth } from "../../lib/auth";
import { 
  brandStrategicTruthSchema, 
  brandOperationalTruthSchema, 
  brandObservedTruthSchema,
  evidenceItemSchema,
  boundaryRuleSchema,
  truthDeltaSnapshotSchema,
  truthLockEvaluationSchema
} from "../../lib/schema";


/**
 * 1. Upsert Strategic Truth
 */
export async function upsertStrategicTruth(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify strategic truth.");
  }

  const parsed = brandStrategicTruthSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  // Fetch old record for delta tracking
  let oldRecord: any = null;
  if (parsed.id) {
    const { data: existing } = await supabase
      .from("brand_strategic_truths")
      .select("*")
      .eq("id", parsed.id)
      .maybeSingle();
    oldRecord = existing;
  }

  const { data: result, error } = await supabase
    .from("brand_strategic_truths")
    .upsert({
      id: parsed.id || undefined,
      workspace_id: parsed.workspace_id,
      statement: parsed.statement,
      vision: parsed.vision,
      core_pillars: parsed.core_pillars
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);

  // Write audit trail record for critical mutation with delta calculation
  const { logDeltaAuditEvent } = await import("../../lib/logging");
  await logDeltaAuditEvent(
    workspaceId,
    userId,
    parsed.id ? "UPDATE_STRATEGIC_TRUTH" : "CREATE_STRATEGIC_TRUTH",
    "brand_strategic_truths",
    result.id,
    oldRecord,
    result
  );

  return result;
}

/**
 * 2. Upsert Operational Truth (with evidence and boundary relations)
 */
export async function upsertOperationalTruth(
  workspaceId: string, 
  data: any, 
  evidenceIds: string[] = [], 
  boundaryIds: string[] = []
) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify operational claims.");
  }

  const parsed = brandOperationalTruthSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  // Upsert the main claim
  const { data: claim, error } = await supabase
    .from("brand_operational_truths")
    .upsert({
      id: parsed.id || undefined,
      workspace_id: parsed.workspace_id,
      claim: parsed.claim,
      description: parsed.description,
      risk_level: parsed.risk_level,
      confidence_score: parsed.confidence_score,
      review_status: parsed.review_status
    })
    .select()
    .single();

  if (error || !claim) throw new Error(`DB Error: ${error?.message || "Failed to upsert claim"}`);

  // Re-establish evidence mapping links (Join Table)
  if (evidenceIds.length > 0) {
    // Delete old mappings first
    await supabase
      .from("brand_operational_truth_evidence")
      .delete()
      .eq("operational_truth_id", claim.id);

    // Insert new mappings
    const mappings = evidenceIds.map(eId => ({
      operational_truth_id: claim.id,
      evidence_item_id: eId
    }));
    await supabase
      .from("brand_operational_truth_evidence")
      .insert(mappings);
  }

  // Re-establish boundary mapping links (Join Table)
  if (boundaryIds.length > 0) {
    // Delete old mappings first
    await supabase
      .from("brand_operational_truth_boundaries")
      .delete()
      .eq("operational_truth_id", claim.id);

    // Insert new mappings
    const mappings = boundaryIds.map(bId => ({
      operational_truth_id: claim.id,
      boundary_rule_id: bId
    }));
    await supabase
      .from("brand_operational_truth_boundaries")
      .insert(mappings);
  }

  return claim;
}

/**
 * 3. Create Observed Truth
 */
export async function createObservedTruth(workspaceId: string, data: any) {
  const userId = await requireAuth();

  // Observed truths can be pushed by internal system agents as well
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to log observed third-party claims.");
  }

  const parsed = brandObservedTruthSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("brand_observed_truths")
    .insert({
      workspace_id: parsed.workspace_id,
      observed_claim: parsed.observed_claim,
      source_domain: parsed.source_domain,
      confidence_score: parsed.confidence_score,
      is_aligned_with_operational: parsed.is_aligned_with_operational,
      raw_payload: parsed.raw_payload
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 4. Create Evidence Item
 */
export async function createEvidenceItem(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "evidence_reviewer", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create evidence items.");
  }

  const parsed = evidenceItemSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("evidence_items")
    .insert({
      workspace_id: parsed.workspace_id,
      title: parsed.title,
      content: parsed.content,
      url: parsed.url,
      evidence_type: parsed.evidence_type,
      is_verified: parsed.is_verified,
      verified_at: parsed.is_verified ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 5. Update Evidence Item
 */
export async function updateEvidenceItem(workspaceId: string, id: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "evidence_reviewer", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to update evidence items.");
  }

  const parsed = evidenceItemSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("evidence_items")
    .update({
      title: parsed.title,
      content: parsed.content,
      url: parsed.url,
      evidence_type: parsed.evidence_type,
      is_verified: parsed.is_verified,
      verified_at: parsed.is_verified ? (parsed.verified_at || new Date().toISOString()) : null
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 6. Create Boundary Rule
 */
export async function createBoundaryRule(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to establish boundary rules.");
  }

  const parsed = boundaryRuleSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("boundary_rules")
    .insert({
      workspace_id: parsed.workspace_id,
      rule_name: parsed.rule_name,
      forbidden_terms: parsed.forbidden_terms,
      required_disclosures: parsed.required_disclosures,
      risk_level: parsed.risk_level,
      is_active: parsed.is_active
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 7. Update Boundary Rule
 */
export async function updateBoundaryRule(workspaceId: string, id: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify boundary rules.");
  }

  const parsed = boundaryRuleSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("boundary_rules")
    .update({
      rule_name: parsed.rule_name,
      forbidden_terms: parsed.forbidden_terms,
      required_disclosures: parsed.required_disclosures,
      risk_level: parsed.risk_level,
      is_active: parsed.is_active
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 8. Create Truth Delta Snapshot
 */
export async function createTruthDelta(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to record truth delta discrepancy snapshots.");
  }

  const parsed = truthDeltaSnapshotSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("truth_delta_snapshots")
    .insert({
      workspace_id: parsed.workspace_id,
      source_observed_truth_id: parsed.source_observed_truth_id,
      target_operational_truth_id: parsed.target_operational_truth_id,
      delta_summary: parsed.delta_summary,
      severity: parsed.severity,
      is_resolved: parsed.is_resolved
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 9. Evaluate Truth Lock Gate (L0?�L4)
 * Runs the deterministic system logic checking schema completeness,
 * active claim counts, verification trace paths, and unresolved panel deltas.
 */
export async function evaluateTruthLockGate(workspaceId: string, gateLevel: "L0" | "L1" | "L2" | "L3" | "L4") {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect", "evidence_reviewer"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to trigger a Truth Lock Gate evaluation.");
  }

  const supabase = getSupabaseAdminClient();
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  // L0: Basic Schema Complete (Checked via tables queries)
  const { count: wsCount, error: wsErr } = await supabase
    .from("workspaces")
    .select("*", { count: "exact", head: true })
    .eq("id", workspaceId);

  if (wsErr || wsCount === 0) {
    blockingReasons.push("L0 Blocker: Workspace configuration is missing or corrupted.");
  }

  if (gateLevel === "L0") {
    const passed = blockingReasons.length === 0;
    return { gateLevel, isPassed: passed, blockingReasons, warnings };
  }

  // L1: Core Claims Exist (At least 1 strategic and 1 operational claim)
  const { data: strat, error: stratErr } = await supabase
    .from("brand_strategic_truths")
    .select("id")
    .eq("workspace_id", workspaceId);

  const { data: oper, error: operErr } = await supabase
    .from("brand_operational_truths")
    .select("id, claim, risk_level")
    .eq("workspace_id", workspaceId);

  if (stratErr || !strat || strat.length === 0) {
    blockingReasons.push("L1 Blocker: Strategic Truth statement has not been set.");
  }
  if (operErr || !oper || oper.length === 0) {
    blockingReasons.push("L1 Blocker: Operational Claims list is completely empty.");
  }

  if (gateLevel === "L1") {
    const passed = blockingReasons.length === 0;
    return { gateLevel, isPassed: passed, blockingReasons, warnings };
  }

  // Stale Evidence Warnings for L2, L3, L4
  const { data: allEv } = await supabase
    .from("evidence_items")
    .select("id, title, created_at")
    .eq("workspace_id", workspaceId)
    .eq("is_verified", true);

  if (allEv && allEv.length > 0) {
    for (const ev of allEv) {
      if (ev.created_at) {
        const createdAt = new Date(ev.created_at);
        const threeYearsInMs = 3 * 365.25 * 24 * 60 * 60 * 1000;
        if (Date.now() - createdAt.getTime() > threeYearsInMs) {
          warnings.push(`Stale Evidence Warning: Evidence item "${ev.title}" is more than 3 years old.`);
        }
      }
    }
  }

  // L2: High-Risk Claim Validation
  // Every claim with risk_level = 'high' or 'critical' must have at least one verified evidence item AND a boundary rule linked.
  if (oper && oper.length > 0) {
    for (const claim of oper) {
      if (claim.risk_level === "high" || claim.risk_level === "critical") {
        // Query evidence mapping
        const { data: evLinks } = await supabase
          .from("brand_operational_truth_evidence")
          .select("evidence_item_id")
          .eq("operational_truth_id", claim.id);

        // Query boundary mapping
        const { data: bdLinks } = await supabase
          .from("brand_operational_truth_boundaries")
          .select("boundary_rule_id")
          .eq("operational_truth_id", claim.id);

        const evCount = evLinks?.length || 0;
        const bdCount = bdLinks?.length || 0;

        if (bdCount === 0) {
          blockingReasons.push(`L2 Blocker: High-risk claim "${claim.claim.substring(0, 30)}..." lacks a mandatory safety Boundary Rule.`);
        }
        if (evCount === 0) {
          blockingReasons.push(`L2 Blocker: High-risk claim "${claim.claim.substring(0, 30)}..." lacks Verified Evidence.`);
        } else if (evCount > 0) {
          // Verify that at least one of these evidence items is actually marked is_verified = TRUE
          const evIds = evLinks!.map(l => l.evidence_item_id);
          const { data: verifiedEv } = await supabase
            .from("evidence_items")
            .select("id")
            .in("id", evIds)
            .eq("is_verified", true);

          if (!verifiedEv || verifiedEv.length === 0) {
            blockingReasons.push(`L2 Blocker: High-risk claim "${claim.claim.substring(0, 30)}..." links to evidence, but none is verified.`);
          }
        }
      }
    }
  }

  if (gateLevel === "L2") {
    const passed = blockingReasons.length === 0;
    return { gateLevel, isPassed: passed, blockingReasons, warnings };
  }

  // L3: Full claim-evidence trace (100% of operational claims link to at least one verified evidence item)
  if (oper && oper.length > 0) {
    for (const claim of oper) {
      const { data: evLinks } = await supabase
        .from("brand_operational_truth_evidence")
        .select("evidence_item_id")
        .eq("operational_truth_id", claim.id);

      if (!evLinks || evLinks.length === 0) {
        blockingReasons.push(`L3 Blocker: Claim "${claim.claim.substring(0, 30)}..." has zero evidence references attached.`);
      } else {
        const evIds = evLinks.map(l => l.evidence_item_id);
        const { data: verifiedEv } = await supabase
          .from("evidence_items")
          .select("id")
          .in("id", evIds)
          .eq("is_verified", true);

        if (!verifiedEv || verifiedEv.length === 0) {
          blockingReasons.push(`L3 Blocker: Claim "${claim.claim.substring(0, 30)}..." links to evidence, but none has been verified.`);
        }
      }
    }
  }

  if (gateLevel === "L3") {
    const passed = blockingReasons.length === 0;
    return { gateLevel, isPassed: passed, blockingReasons, warnings };
  }

  // L4: Closed Loop Alignment (No unresolved truth_delta_snapshots)
  const { data: deltas, error: deltaErr } = await supabase
    .from("truth_delta_snapshots")
    .select("id, delta_summary")
    .eq("workspace_id", workspaceId)
    .eq("is_resolved", false);

  if (deltaErr || (deltas && deltas.length > 0)) {
    blockingReasons.push(`L4 Blocker: Open discrepancy deltas still exist (${deltas?.length || 0} unresolved items).`);
  }

  const passed = blockingReasons.length === 0;
  return { gateLevel, isPassed: passed, blockingReasons, warnings };
}

/**
 * 10. Save Truth Lock Evaluation Result
 */
export async function saveTruthLockEvaluation(workspaceId: string, evaluationResult: any) {
  const parsed = truthLockEvaluationSchema.parse({ 
    workspace_id: workspaceId,
    gate_level: evaluationResult.gateLevel,
    is_passed: evaluationResult.isPassed,
    blocking_reasons: evaluationResult.blockingReasons,
    warnings: evaluationResult.warnings
  });

  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("truth_lock_evaluations")
    .insert({
      workspace_id: parsed.workspace_id,
      gate_level: parsed.gate_level,
      is_passed: parsed.is_passed,
      blocking_reasons: parsed.blocking_reasons,
      warnings: parsed.warnings
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// ?�?� READ / LIST / DELETE ACTIONS ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

/**
 * 11. Get Strategic Truth (single record per workspace)
 */
export async function getStrategicTruth(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brand_strategic_truths")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data; // null if not yet set
}

/**
 * 12. List Operational Truths (with evidence and boundary link counts)
 */
export async function listOperationalTruths(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brand_operational_truths")
    .select(`
      *,
      evidence_count:brand_operational_truth_evidence(count),
      boundary_count:brand_operational_truth_boundaries(count)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

/**
 * 13. Get single Operational Truth with linked evidence & boundary IDs
 */
export async function getOperationalTruth(workspaceId: string, id: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const [{ data: claim, error }, { data: evLinks }, { data: bdLinks }] = await Promise.all([
    supabase.from("brand_operational_truths").select("*").eq("id", id).eq("workspace_id", workspaceId).single(),
    supabase.from("brand_operational_truth_evidence").select("evidence_item_id").eq("operational_truth_id", id),
    supabase.from("brand_operational_truth_boundaries").select("boundary_rule_id").eq("operational_truth_id", id),
  ]);
  if (error) throw new Error(`DB Error: ${error.message}`);
  return {
    ...claim,
    evidenceIds: (evLinks || []).map((l: any) => l.evidence_item_id),
    boundaryIds: (bdLinks || []).map((l: any) => l.boundary_rule_id),
  };
}

/**
 * 14. Delete Operational Truth
 */
export async function deleteOperationalTruth(workspaceId: string, id: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("brand_operational_truths")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`DB Error: ${error.message}`);
  return { success: true };
}

/**
 * 15. List Observed Truths
 */
export async function listObservedTruths(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brand_observed_truths")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("observed_at", { ascending: false });

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

/**
 * 16. Delete Observed Truth
 */
export async function deleteObservedTruth(workspaceId: string, id: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("brand_observed_truths")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`DB Error: ${error.message}`);
  return { success: true };
}

/**
 * 17. List Evidence Items
 */
export async function listEvidenceItems(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

/**
 * 18. Delete Evidence Item
 */
export async function deleteEvidenceItem(workspaceId: string, id: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "evidence_reviewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("evidence_items")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`DB Error: ${error.message}`);
  return { success: true };
}

/**
 * 19. List Boundary Rules
 */
export async function listBoundaryRules(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("boundary_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

/**
 * 20. Delete Boundary Rule
 */
export async function deleteBoundaryRule(workspaceId: string, id: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("boundary_rules")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`DB Error: ${error.message}`);
  return { success: true };
}

/**
 * 21. List Truth Delta Snapshots
 */
export async function listTruthDeltas(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("truth_delta_snapshots")
    .select(`
      *,
      source_observed:brand_observed_truths(observed_claim, source_domain),
      target_operational:brand_operational_truths(claim)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

/**
 * 22. Resolve a Truth Delta Snapshot
 */
export async function resolveTruthDelta(workspaceId: string, id: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("truth_delta_snapshots")
    .update({ is_resolved: true })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 23. List Truth Lock Gate Evaluation History
 */
export async function listTruthLockHistory(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("truth_lock_evaluations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("evaluated_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// ?�?� DASHBOARD SUMMARY ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

/**
 * 24. Get Truth Studio Dashboard Summary (real counts)
 */
export async function getTruthDashboardSummary(workspaceId: string) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "content_editor", "evidence_reviewer",
    "observatory_analyst", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const [
    { data: strat },
    { count: operCount },
    { count: approvedCount },
    { count: evidenceCount },
    { count: verifiedCount },
    { count: boundaryCount },
    { count: observedCount },
    { count: unresolvedDeltaCount },
    { data: latestGate },
  ] = await Promise.all([
    supabase.from("brand_strategic_truths").select("id, statement, core_pillars").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("brand_operational_truths").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("brand_operational_truths").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("review_status", "approved"),
    supabase.from("evidence_items").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("evidence_items").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("is_verified", true),
    supabase.from("boundary_rules").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("is_active", true),
    supabase.from("brand_observed_truths").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("truth_delta_snapshots").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("is_resolved", false),
    supabase.from("truth_lock_evaluations").select("gate_level, is_passed, evaluated_at").eq("workspace_id", workspaceId).order("evaluated_at", { ascending: false }).limit(1),
  ]);

  return {
    strategicTruth: strat || null,
    operational: { total: operCount || 0, approved: approvedCount || 0 },
    evidence: { total: evidenceCount || 0, verified: verifiedCount || 0 },
    boundaries: { active: boundaryCount || 0 },
    observed: { total: observedCount || 0 },
    deltas: { unresolved: unresolvedDeltaCount || 0 },
    gateStatus: latestGate?.[0] ?? null,
  };
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// ?�?� AUTO DELTA COMPARISON ENGINE ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

/**
 * 25. Auto-compare a newly observed claim against all operational truths.
 *     Creates a truth_delta_snapshot when misalignment is detected via AI.
 */
export async function autoCompareTruthDelta(
  workspaceId: string,
  observedTruthId: string
) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();

  // Fetch the observed truth
  const { data: observed, error: obsErr } = await supabase
    .from("brand_observed_truths")
    .select("*")
    .eq("id", observedTruthId)
    .eq("workspace_id", workspaceId)
    .single();
  if (obsErr || !observed) throw new Error("Observed truth not found.");

  // Fetch all approved operational truths
  const { data: operTruths } = await supabase
    .from("brand_operational_truths")
    .select("id, claim, description, risk_level")
    .eq("workspace_id", workspaceId)
    .in("review_status", ["approved", "in_review"]);

  if (!operTruths || operTruths.length === 0) {
    return { deltaCreated: false, reason: "No operational truths to compare against." };
  }

  // Use AI to compare the observed claim against all operational truths
  const { getAIProvider } = await import("../../lib/ai/ai-provider");
  const ai = getAIProvider();

  const schema = {
    type: "object",
    properties: {
      misaligned: { type: "boolean" },
      bestMatchOperationalId: { type: "string" },
      deltaSummary: { type: "string" },
      severity: { type: "string", enum: ["low", "medium", "high"] }
    },
    required: ["misaligned", "deltaSummary", "severity"]
  };

  const operList = operTruths.map(o => `[${o.id}] "${o.claim}"`).join("\n");
  const prompt = `You are a brand truth integrity auditor.

Observed claim from external source "${observed.source_domain}":
"${observed.observed_claim}"

Official operational brand claims:
${operList}

Task: Determine if the observed claim is MISALIGNED with the official operational claims.
- Misaligned means: contradicts, overstates, understates, or is inconsistent.
- If aligned: misaligned = false.
- If misaligned: set bestMatchOperationalId to the most relevant claim's ID, write a concise deltaSummary explaining the discrepancy, and rate severity.`;

  const result = await ai.generateStructuredOutput<{
    misaligned: boolean;
    bestMatchOperationalId?: string;
    deltaSummary: string;
    severity: "low" | "medium" | "high";
  }>(prompt, schema);

  if (!result.misaligned) {
    // Mark the observed truth as aligned
    await supabase
      .from("brand_observed_truths")
      .update({ is_aligned_with_operational: true })
      .eq("id", observedTruthId);
    return { deltaCreated: false, reason: "Observed claim is aligned with operational truths." };
  }

  // Mark the observed truth as misaligned
  await supabase
    .from("brand_observed_truths")
    .update({ is_aligned_with_operational: false })
    .eq("id", observedTruthId);

  // Create the delta snapshot
  const { data: delta, error: deltaErr } = await supabase
    .from("truth_delta_snapshots")
    .insert({
      workspace_id: workspaceId,
      source_observed_truth_id: observedTruthId,
      target_operational_truth_id: result.bestMatchOperationalId || null,
      delta_summary: result.deltaSummary,
      severity: result.severity,
      is_resolved: false,
    })
    .select()
    .single();

  if (deltaErr) throw new Error(`Delta creation failed: ${deltaErr.message}`);
  return { deltaCreated: true, delta };
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// ?�?� AI EXTRACTION (Server Action Wrapper) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

/**
 * 26. Run AI Truth Extraction from raw text (server action wrapper)
 */
export async function runTruthExtraction(
  workspaceId: string,
  sourceText: string,
  sourceDomain: string
) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst", "content_editor"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const { runBrandTruthExtractor } = await import("../../lib/ai/truth_extractor");
  return runBrandTruthExtractor(workspaceId, { sourceText, sourceDomain });
}

/**
 * 27. Run AI Truth Extraction from URL (crawl + extract pipeline)
 */
export async function runTruthExtractionFromUrl(
  workspaceId: string,
  url: string
) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst", "content_editor"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("?�효?��? ?��? URL ?�식?�니??");
  }

  // Use BrandSiteCrawler to crawl the page and extract structured text
  const { BrandSiteCrawler } = await import("../../lib/crawlers/brand-site-crawler");
  const crawler = new BrandSiteCrawler();
  const ssot = await crawler.crawlAndExtract(url, parsedUrl.hostname, 3);

  // Convert SSoT to rich text for claim extraction
  const rawText = [
    `Brand: ${ssot.brand_name_ko || ssot.brand_name_en}`,
    `Strategic Intent: ${ssot.strategic_intent}`,
    `Claims:\n${ssot.claims.map(c => `- ${c.text} (Evidence: ${c.evidence})`).join("\n")}`,
    `Concepts:\n${ssot.concepts.map(c => `- ${c.label}: ${c.definition}`).join("\n")}`,
    `Tone Guide: ${ssot.tone_guide}`,
    `Target Profile: ${ssot.target_profile}`,
    `Forbidden Claims: ${ssot.forbidden_claims.join(", ")}`,
  ].join("\n\n");

  const { runBrandTruthExtractor } = await import("../../lib/ai/truth_extractor");
  return runBrandTruthExtractor(workspaceId, {
    sourceText: rawText,
    sourceDomain: parsedUrl.hostname,
  });
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// ?�?� EVIDENCE FILE UPLOAD ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

/**
 * 28. Upload an evidence file to Supabase Storage and create the evidence record
 */
export async function uploadEvidenceFile(
  workspaceId: string,
  formData: FormData
) {
  const userId = await requireAuth();
  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "evidence_reviewer", "content_editor"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || "";
  const content = (formData.get("content") as string) || "";
  const evidenceType = (formData.get("evidence_type") as string) || "manual_verify";

  if (!file) throw new Error("?�일???�습?�다.");
  if (!title) throw new Error("증거 ?�목???�력??주세??");

  const supabase = getSupabaseAdminClient();
  const fileName = `${workspaceId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  // Upload to Supabase Storage bucket 'evidence-files'
  const { error: uploadError } = await supabase.storage
    .from("evidence-files")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`?�일 ?�로???�패: ${uploadError.message}`);

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("evidence-files")
    .getPublicUrl(fileName);

  // Create evidence_items record with file metadata
  const { data: result, error } = await supabase
    .from("evidence_items")
    .insert({
      workspace_id: workspaceId,
      title,
      content: content || `?�일 ?�로?? ${file.name}`,
      url: publicUrl,
      evidence_type: evidenceType,
      is_verified: false,
      verified_at: null,
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return { ...result, file_name: file.name, file_size: file.size };
}
