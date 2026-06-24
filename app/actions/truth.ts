"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import {  checkWorkspacePermission , requireAuth } from "../../lib/auth";
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
 * 9. Evaluate Truth Lock Gate (L0–L4)
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
