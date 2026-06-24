"use server";
import { getSupabaseAdminClient } from "../../lib/supabase";
import {  checkWorkspacePermission , requireAuth } from "../../lib/auth";
import { 
  personaSpecSchema, 
  personaAssignmentSchema, 
  personaEvalRunSchema, 
  personaObservatorySnapshotSchema, 
  personaPatchSchema, 
  vibeSpecSchema, 
  vibeAssignmentSchema, 
  vibeRatingEventSchema, 
  vibeProfileSchema, 
  vibeAlignmentSnapshotSchema, 
  vibeDiagnosisSchema, 
  vibeInterventionSchema, 
  vibeValidationRunSchema, 
  darkPatternRuleSchema 
} from "../../lib/schema";
import { cosineSimilarity, recordToVector, absoluteDifferenceAlignment } from "../../lib/math/vector-math";



/**
 * Helper to validate persona spec fields (Governance layers, scopes, guardrails)
 */
export function validatePersonaSpec(spec: any) {
  if (!spec.governance_layer || Object.keys(spec.governance_layer).length === 0) {
    throw new Error("Validation Error: PersonaSpec must carry a valid governance_layer configuration.");
  }
  if (!spec.authority_scope || spec.authority_scope.length === 0) {
    throw new Error("Validation Error: PersonaSpec must carry a defined authority_scope list.");
  }
  if (!spec.legal_guardrails || spec.legal_guardrails.length === 0) {
    throw new Error("Validation Error: PersonaSpec must carry legal_guardrails parameters.");
  }
  if (!spec.allowed_modes || spec.allowed_modes.length === 0) {
    throw new Error("Validation Error: PersonaSpec must carry allowed_modes list.");
  }
  if (!spec.allowed_modes.includes(spec.current_mode || 'standard')) {
    throw new Error(`Validation Error: Mode "${spec.current_mode}" is not allowed for this persona spec. Allowed: [${spec.allowed_modes.join(", ")}]`);
  }
}

/**
 * Helper to validate switching modes complies with allowed spec modes
 */
export function validatePersonaModeSwitch(spec: any, newMode: string) {
  const allowed = spec.allowed_modes || ["standard"];
  if (!allowed.includes(newMode)) {
    throw new Error(`Validation Error: Mode "${newMode}" is not allowed for this persona spec. Allowed: [${allowed.join(", ")}]`);
  }
}

/**
 * Scans generated or submitted claim text against persona authority_scope.
 * E.g., if claim references clinical terms but persona lacks 'clinical' authority, it's an overreach.
 */
export async function detectAuthorityOverreach(workspaceId: string, personaId: string, claimText: string) {
  const supabase = getSupabaseAdminClient();
  const { data: spec, error } = await supabase
    .from("persona_specs")
    .select("persona_name, authority_scope")
    .eq("id", personaId)
    .single();

  if (error || !spec) {
    throw new Error(`Error loading PersonaSpec: ${error?.message || "Not found"}`);
  }

  const claimLower = claimText.toLowerCase();
  
  // Mapping of restricted terms to required authority scopes
  const restrictedScopes = [
    { keyword: "clinical", requiredScope: "clinical" },
    { keyword: "medical", requiredScope: "medical" },
    { keyword: "prescribe", requiredScope: "medical" },
    { keyword: "diagnose", requiredScope: "medical" },
    { keyword: "guarantee", requiredScope: "legal" },
    { keyword: "legal", requiredScope: "legal" },
    { keyword: "financial", requiredScope: "financial" },
  ];

  const violations: string[] = [];
  const scopes = spec.authority_scope.map((s: string) => s.toLowerCase());

  for (const item of restrictedScopes) {
    if (claimLower.includes(item.keyword)) {
      if (!scopes.includes(item.requiredScope)) {
        violations.push(`Claim asserts "${item.keyword}" domain which requires "${item.requiredScope}" authority, but persona only holds [${spec.authority_scope.join(", ")}]`);
      }
    }
  }

  return {
    overreach: violations.length > 0,
    violations,
    personaName: spec.persona_name
  };
}

/**
 * CRISIS Mode check: switching or operating in crisis mode blocks commercial sales CTAs.
 */
export async function validatePersonaCrisisContent(workspaceId: string, personaId: string, contentText: string) {
  const supabase = getSupabaseAdminClient();
  const { data: spec, error } = await supabase
    .from("persona_specs")
    .select("current_mode")
    .eq("id", personaId)
    .single();

  if (error || !spec) return;

  if (spec.current_mode === "crisis") {
    const commercialTriggers = ["buy now", "discount", "limited time", "sale", "purchase", "hurry", "special offer"];
    const contentLower = contentText.toLowerCase();
    for (const trigger of commercialTriggers) {
      if (contentLower.includes(trigger)) {
        throw new Error(`CRISIS MODE ACTION BLOCK: Aggressive commercial CTA trigger word "${trigger}" was blocked because the active persona is in CRISIS mode.`);
      }
    }
  }
}

/**
 * Computes Persona Mismatch Risk Index (P-MRI)
 */
export async function computePMRI(workspaceId: string, personaSpecId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: spec, error } = await supabase
    .from("persona_specs")
    .select("current_mode, legal_guardrails")
    .eq("id", personaSpecId)
    .single();

  if (error || !spec) return 0;

  let pmri = 0;

  // Mode check
  if (spec.current_mode === "crisis") {
    pmri += 30;
  } else if (spec.current_mode === "advisory") {
    pmri += 15;
  }

  // Guardrails check
  if (!spec.legal_guardrails || spec.legal_guardrails.length === 0) {
    pmri += 25;
  }

  // Candidate patches check
  const { data: patches } = await supabase
    .from("persona_patches")
    .select("id")
    .eq("persona_spec_id", personaSpecId)
    .eq("status", "candidate");
  pmri += (patches?.length || 0) * 15;

  return Math.min(100, Math.max(0, pmri));
}

/**
 * Verifies clinical-warm-luxury target vector sums equal exactly 100
 */
export function validateVibeSpec(spec: any) {
  const vector = spec.target_vector || {};
  const clinical = Number(vector.clinical || 0);
  const warm = Number(vector.warm || 0);
  const luxury = Number(vector.luxury || 0);
  const sum = clinical + warm + luxury;

  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`Validation Error: Target vector sums must equal exactly 100%. Current sum: ${sum}% (clinical: ${clinical}, warm: ${warm}, luxury: ${luxury})`);
  }
}

/**
 * Scans page/content texts against active dark pattern trigger strings.
 */
export async function checkDarkPatternFlags(workspaceId: string, contentText: string) {
  const supabase = getSupabaseAdminClient();
  const { data: rules, error } = await supabase
    .from("dark_pattern_rules")
    .select("rule_name, forbidden_linguistic_triggers")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  if (error || !rules) {
    return { flagged: false, violations: [] };
  }

  const contentLower = contentText.toLowerCase();
  const violations: string[] = [];

  for (const rule of rules) {
    for (const trigger of rule.forbidden_linguistic_triggers) {
      if (contentLower.includes(trigger.toLowerCase())) {
        violations.push(`Flagged rule "${rule.rule_name}" by trigger "${trigger}"`);
      }
    }
  }

  return {
    flagged: violations.length > 0,
    violations
  };
}

/**
 * Cosine difference based Vibe-to-Page Alignment (VPA)
 */
export async function computeVPA(workspaceId: string, pageId: string) {
  const supabase = getSupabaseAdminClient();

  // Find assignment
  const { data: assign } = await supabase
    .from("vibe_assignments")
    .select("vibe_spec_id")
    .eq("target_id", pageId)
    .eq("target_type", "page")
    .maybeSingle();

  if (!assign) return 100.00; // Aligned by default if no spec assigned yet

  // Get vibe spec
  const { data: spec } = await supabase
    .from("vibe_specs")
    .select("target_vector")
    .eq("id", assign.vibe_spec_id)
    .single();

  if (!spec) return 100.00;

  // Get profile
  const { data: profile } = await supabase
    .from("vibe_profiles")
    .select("aggregated_vector")
    .eq("target_id", pageId)
    .eq("target_type", "page")
    .maybeSingle();

  if (!profile) return 100.00; // If no ratings logged, treat as perfectly aligned to target initial state

  const target = spec.target_vector;
  const actual = profile.aggregated_vector;

  const mode = process.env.VPA_MODE || 'absolute';
  if (mode === 'semantic') {
    try {
      const { computeSemanticVibeAlignment } = await import('../../lib/vibe/semantic-alignment');
      const alignment = await computeSemanticVibeAlignment(workspaceId, assign.vibe_spec_id, pageId);
      return alignment.score;
    } catch (e) {
      console.warn('Semantic VPA calculation failed, falling back to absolute mode:', e);
    }
  }

  if (mode === 'cosine') {
    const keys = ['clinical', 'warm', 'luxury'];
    const vecTarget = recordToVector(target, keys);
    const vecActual = recordToVector(actual, keys);
    // cosine similarity maps [-1, 1], here positive dimensions [0, 1] => score = sim * 100
    const sim = cosineSimilarity(vecTarget, vecActual);
    return Number((Math.max(0, sim) * 100).toFixed(2));
  }

  // Math absolute vector distance (Default / Backward Compatibility)
  const diff = 
    Math.abs((target.clinical || 0) - (actual.clinical || 0)) +
    Math.abs((target.warm || 0) - (actual.warm || 0)) +
    Math.abs((target.luxury || 0) - (actual.luxury || 0));

  // Max absolute difference sum is 200 (e.g. 100-0, 0-100, 0-0 etc.), so diff / 2 maps perfectly to [0, 100]
  const vpa = Math.max(0, 100 - (diff / 2));
  return Number(vpa.toFixed(2));

}

/**
 * Mismatch Severity Index (MSA)
 */
export async function detectMSA(workspaceId: string, pageId: string) {
  const vpa = await computeVPA(workspaceId, pageId);
  return Number((100 - vpa).toFixed(2));
}

/**
 * Vibe Consistency Score (VCS)
 */
export async function computeVCS(workspaceId: string, vibeSpecId: string) {
  const supabase = getSupabaseAdminClient();

  // Retrieve last 10 ratings
  const { data: ratings } = await supabase
    .from("vibe_rating_events")
    .select("rating_scores")
    .eq("vibe_spec_id", vibeSpecId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!ratings || ratings.length < 2) return 100.00; // Perfectly consistent if single or no score exists

  // Get target spec vector
  const { data: spec } = await supabase
    .from("vibe_specs")
    .select("target_vector")
    .eq("id", vibeSpecId)
    .single();

  if (!spec) return 100.00;

  const target = spec.target_vector;
  
  const mode = process.env.VPA_MODE || 'absolute';
  if (mode === 'cosine') {
    const keys = ['clinical', 'warm', 'luxury'];
    const vecTarget = recordToVector(target, keys);
    
    // Compute cosine similarities to target for the ratings
    const similarities = ratings.map(r => {
      const vecRating = recordToVector(r.rating_scores, keys);
      return cosineSimilarity(vecTarget, vecRating) * 100;
    });

    const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const variance = similarities.reduce((sum, s) => sum + Math.pow(s - avgSim, 2), 0) / similarities.length;
    const stdDev = Math.sqrt(variance);

    // Consistency is higher when variance/deviation is lower
    const vcs = Math.max(0, 100 - (stdDev * 2));
    return Number(vcs.toFixed(2));
  }

  // Calculate variance of absolute difference (Default / Backward Compatibility)
  let sumDiff = 0;
  const distances = ratings.map(r => {
    return (
      Math.abs((target.clinical || 0) - (r.rating_scores.clinical || 0)) +
      Math.abs((target.warm || 0) - (r.rating_scores.warm || 0)) +
      Math.abs((target.luxury || 0) - (r.rating_scores.luxury || 0))
    ) / 2;
  });

  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
  const stdDev = Math.sqrt(variance);

  // Consistency goes down as deviation increases
  const vcs = Math.max(0, 100 - (stdDev * 5));
  return Number(vcs.toFixed(2));
}

/**
 * Vibe Mismatch Risk Index (VMRI)
 */
export async function computeVMRI(workspaceId: string, vibeSpecId: string) {
  const supabase = getSupabaseAdminClient();

  // Find all assignments
  const { data: assigns } = await supabase
    .from("vibe_assignments")
    .select("target_id, target_type")
    .eq("vibe_spec_id", vibeSpecId);

  let vcs = await computeVCS(workspaceId, vibeSpecId);

  if (!assigns || assigns.length === 0) {
    return Number((100 - vcs).toFixed(2));
  }

  let totalMSA = 0;
  let pageCount = 0;

  for (const assign of assigns) {
    if (assign.target_type === "page") {
      const msa = await detectMSA(workspaceId, assign.target_id);
      totalMSA += msa;
      pageCount++;
    }
  }

  const avgMSA = pageCount > 0 ? totalMSA / pageCount : 0;
  
  // VMRI formula combines active page MSA and consistency score
  const vmri = (avgMSA * 0.6) + ((100 - vcs) * 0.4);
  return Number(Math.min(100, Math.max(0, vmri)).toFixed(2));
}

// ======================== SERVER ACTIONS ========================

/**
 * Create governed Persona Spec
 */
export async function createPersonaSpec(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create brand persona specifications.");
  }

  validatePersonaSpec(data);
  const parsed = personaSpecSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("persona_specs")
    .insert({
      workspace_id: parsed.workspace_id,
      persona_name: parsed.persona_name,
      slug: parsed.slug,
      governance_layer: parsed.governance_layer,
      authority_scope: parsed.authority_scope,
      legal_guardrails: parsed.legal_guardrails,
      allowed_modes: parsed.allowed_modes,
      current_mode: parsed.current_mode,
      prompt_text: parsed.prompt_text,
      version: parsed.version
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Update governed Persona Spec with active version increments
 */
export async function updatePersonaSpec(workspaceId: string, id: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify brand persona specifications.");
  }

  validatePersonaSpec(data);
  const parsed = personaSpecSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  // Load current to check for mode transition authorization
  const { data: currentSpec } = await supabase
    .from("persona_specs")
    .select("allowed_modes, current_mode, version")
    .eq("id", id)
    .single();

  if (currentSpec && parsed.current_mode !== currentSpec.current_mode) {
    validatePersonaModeSwitch(currentSpec, parsed.current_mode);
  }

  const nextVersion = (currentSpec?.version || 1) + 1;

  const { data: result, error } = await supabase
    .from("persona_specs")
    .update({
      persona_name: parsed.persona_name,
      governance_layer: parsed.governance_layer,
      authority_scope: parsed.authority_scope,
      legal_guardrails: parsed.legal_guardrails,
      allowed_modes: parsed.allowed_modes,
      current_mode: parsed.current_mode,
      prompt_text: parsed.prompt_text,
      version: nextVersion,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Assign governed Persona spec to Domain
 */
export async function assignPersona(workspaceId: string, personaSpecId: string, domainId: string) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to assign brand personas.");
  }

  const supabase = getSupabaseAdminClient();

  // Delete active domain assignment first to uphold unique domain rule
  await supabase
    .from("persona_assignments")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("domain_id", domainId);

  const { data: result, error } = await supabase
    .from("persona_assignments")
    .insert({
      workspace_id: workspaceId,
      persona_spec_id: personaSpecId,
      domain_id: domainId,
      is_active: true
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Trigger persona evaluation and save metrics (P-MRI)
 */
export async function runPersonaEval(workspaceId: string, personaSpecId: string) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to evaluate personas.");
  }

  const pmri = await computePMRI(workspaceId, personaSpecId);
  const supabase = getSupabaseAdminClient();

  const { data: spec } = await supabase
    .from("persona_specs")
    .select("legal_guardrails")
    .eq("id", personaSpecId)
    .single();

  const warnings: string[] = [];
  if (!spec || !spec.legal_guardrails || spec.legal_guardrails.length === 0) {
    warnings.push("Legal guardrails missing: P-MRI score includes default variance penalty.");
  }

  const { data: result, error } = await supabase
    .from("persona_eval_runs")
    .insert({
      workspace_id: workspaceId,
      persona_spec_id: personaSpecId,
      run_status: "completed",
      evaluation_metrics: { pmri },
      details: { 
        evaluated_at: new Date().toISOString(),
        warnings
      }
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Log Persona Observatory snapshot
 */
export async function createPersonaObservatorySnapshot(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "observatory_analyst"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to log observatory snapshots.");
  }

  const parsed = personaObservatorySnapshotSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("persona_observatory_snapshots")
    .insert({
      workspace_id: parsed.workspace_id,
      snapshot_name: parsed.snapshot_name,
      metrics: parsed.metrics
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Create persona patch adjustment
 */
export async function createPersonaPatch(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to propose persona patches.");
  }

  const parsed = personaPatchSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("persona_patches")
    .insert({
      workspace_id: parsed.workspace_id,
      persona_spec_id: parsed.persona_spec_id,
      proposed_patch_text: parsed.proposed_patch_text,
      status: parsed.status
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Create distinct Vibe Spec vector target
 */
export async function createVibeSpec(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create vibe specs.");
  }

  validateVibeSpec(data);
  const parsed = vibeSpecSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("vibe_specs")
    .insert({
      workspace_id: parsed.workspace_id,
      vibe_name: parsed.vibe_name,
      slug: parsed.slug,
      target_vector: parsed.target_vector,
      anti_vibe_keywords: parsed.anti_vibe_keywords
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Update distinct Vibe Spec vector target
 */
export async function updateVibeSpec(workspaceId: string, id: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify vibe specs.");
  }

  validateVibeSpec(data);
  const parsed = vibeSpecSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("vibe_specs")
    .update({
      vibe_name: parsed.vibe_name,
      target_vector: parsed.target_vector,
      anti_vibe_keywords: parsed.anti_vibe_keywords,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Assign Vibe spec vector constraints to Target object/page
 */
export async function assignVibe(workspaceId: string, vibeSpecId: string, targetId: string, targetType: string) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to assign vibe targets.");
  }

  const parsed = vibeAssignmentSchema.parse({
    workspace_id: workspaceId,
    vibe_spec_id: vibeSpecId,
    target_id: targetId,
    target_type: targetType
  });

  const supabase = getSupabaseAdminClient();

  // Clear older assignments first to maintain uniqueness constraints
  await supabase
    .from("vibe_assignments")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("target_id", targetId)
    .eq("target_type", targetType);

  const { data: result, error } = await supabase
    .from("vibe_assignments")
    .insert({
      workspace_id: parsed.workspace_id,
      vibe_spec_id: parsed.vibe_spec_id,
      target_id: parsed.target_id,
      target_type: parsed.target_type
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Create Vibe Rating Event: ENFORCES verified clinical evidence reference checks (No evidence, no vibe score)
 */
export async function createVibeRatingEvent(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to log brand vibe rating scores.");
  }

  // 1. Evidence Presence & Verification Check
  if (!data.evidence_item_id) {
    throw new Error("No evidence, no vibe score. The vibe rating event lacks a clinical evidence reference link.");
  }

  const supabase = getSupabaseAdminClient();
  
  const { data: evidence, error: evError } = await supabase
    .from("evidence_items")
    .select("is_verified")
    .eq("id", data.evidence_item_id)
    .single();

  if (evError || !evidence) {
    throw new Error("No evidence, no vibe score. The provided evidence_item_id does not reference an existing clinical evidence record.");
  }
  if (!evidence.is_verified) {
    throw new Error("No evidence, no vibe score. The linked evidence item must be actively VERIFIED first.");
  }

  // 2. Parse & Insert Rating
  const parsed = vibeRatingEventSchema.parse({ ...data, workspace_id: workspaceId });

  const { data: rating, error } = await supabase
    .from("vibe_rating_events")
    .insert({
      workspace_id: parsed.workspace_id,
      vibe_spec_id: parsed.vibe_spec_id,
      target_id: parsed.target_id,
      target_type: parsed.target_type,
      rating_scores: parsed.rating_scores,
      evidence_item_id: parsed.evidence_item_id
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);

  // 3. Update active Vibe Profile aggregated vectors
  const { data: ratings } = await supabase
    .from("vibe_rating_events")
    .select("rating_scores")
    .eq("target_id", parsed.target_id)
    .eq("target_type", parsed.target_type);

  const allRatings = ratings || [];
  let cSum = 0, wSum = 0, lSum = 0;
  for (const r of allRatings) {
    cSum += Number(r.rating_scores?.clinical || 0);
    wSum += Number(r.rating_scores?.warm || 0);
    lSum += Number(r.rating_scores?.luxury || 0);
  }
  const count = allRatings.length;
  const aggregated_vector = {
    clinical: count > 0 ? Number((cSum / count).toFixed(2)) : 0,
    warm: count > 0 ? Number((wSum / count).toFixed(2)) : 0,
    luxury: count > 0 ? Number((lSum / count).toFixed(2)) : 0
  };

  await supabase
    .from("vibe_profiles")
    .upsert({
      workspace_id: workspaceId,
      target_id: parsed.target_id,
      target_type: parsed.target_type,
      aggregated_vector
    }, { onConflict: "workspace_id,target_id,target_type" });

  return rating;
}

/**
 * Create Vibe Profile
 */
export async function createVibeProfile(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create vibe profiles.");
  }

  const parsed = vibeProfileSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("vibe_profiles")
    .upsert({
      workspace_id: parsed.workspace_id,
      target_id: parsed.target_id,
      target_type: parsed.target_type,
      aggregated_vector: parsed.aggregated_vector
    }, { onConflict: "workspace_id,target_id,target_type" })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Compute and save vibe alignment snapshot (VPA & VCS)
 */
export async function computeVibeAlignmentSnapshot(workspaceId: string, vibeSpecId: string) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const supabase = getSupabaseAdminClient();

  // Find assignments under spec
  const { data: assign } = await supabase
    .from("vibe_assignments")
    .select("target_id")
    .eq("vibe_spec_id", vibeSpecId)
    .eq("target_type", "page")
    .limit(1)
    .maybeSingle();

  let vpa = 100.00;
  if (assign) {
    vpa = await computeVPA(workspaceId, assign.target_id);
  }

  const vcs = await computeVCS(workspaceId, vibeSpecId);

  const { data: result, error } = await supabase
    .from("vibe_alignment_snapshots")
    .insert({
      workspace_id: workspaceId,
      vibe_spec_id: vibeSpecId,
      vpa,
      vcs
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Create Vibe Diagnosis based on page mismatch findings
 */
export async function createVibeDiagnosis(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to diagnose vibe discrepancies.");
  }

  const parsed = vibeDiagnosisSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("vibe_diagnoses")
    .insert({
      workspace_id: parsed.workspace_id,
      vibe_spec_id: parsed.vibe_spec_id,
      msa: parsed.msa,
      findings: parsed.findings
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Create Vibe Intervention adjustments proposal
 */
export async function createVibeIntervention(workspaceId: string, data: any) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to log vibe interventions.");
  }

  const parsed = vibeInterventionSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("vibe_interventions")
    .insert({
      workspace_id: parsed.workspace_id,
      vibe_diagnosis_id: parsed.vibe_diagnosis_id,
      proposed_adjustments: parsed.proposed_adjustments,
      is_applied: parsed.is_applied
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Run and log Vibe validation risk run (VMRI)
 */
export async function runVibeValidation(workspaceId: string, vibeSpecId: string) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const vmri = await computeVMRI(workspaceId, vibeSpecId);
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("vibe_validation_runs")
    .insert({
      workspace_id: workspaceId,
      vibe_spec_id: vibeSpecId,
      vmri,
      status: "completed"
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Seed active dark patterns rules library
 */
export async function seedDarkPatternRules(workspaceId: string) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const supabase = getSupabaseAdminClient();
  
  // Default rules
  const defaults = [
    {
      workspace_id: workspaceId,
      rule_name: "False Scarcity Trigger Block",
      forbidden_linguistic_triggers: ["limited time only", "only 2 left", "hurry before it is gone", "while supplies last"],
      is_active: true
    },
    {
      workspace_id: workspaceId,
      rule_name: "Fake Urgency CTA Block",
      forbidden_linguistic_triggers: ["buy now or lose forever", "immediate action required", "don't miss your only chance"],
      is_active: true
    }
  ];

  const results = [];
  for (const item of defaults) {
    // Delete existing to support re-seeding
    await supabase
      .from("dark_pattern_rules")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("rule_name", item.rule_name);

    const { data: res } = await supabase
      .from("dark_pattern_rules")
      .insert(item)
      .select()
      .single();

    if (res) results.push(res);
  }

  return results;
}
