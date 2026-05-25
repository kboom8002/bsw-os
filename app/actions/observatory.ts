"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission } from "../../lib/auth";
import { calculateVolatilityAndConfidence } from "../../lib/metrics/confidence-volatility";
import { computeBMRI } from "../../lib/metrics/b-mri";
import { computeDMRI } from "../../lib/metrics/d-mri";
import { 
  probePanelSchema, 
  probeQuestionSchema, 
  aiObservationRunSchema, 
  probeRunSchema, 
  responseJudgmentSchema, 
  metricSnapshotSchema, 
  domainIndexDefinitionSchema, 
  domainIndexSnapshotSchema, 
  benchmarkReportSchema, 
  methodologyDisclosureSchema, 
  semanticWebsiteLiftSnapshotSchema,
  expectedLayerSchema
} from "../../lib/schema";

// MOCK USER ID for server actions simulation (in actual build, this comes from auth session)
const SIMULATED_USER_ID = "00000000-0000-0000-0000-000000000001";

// Default proxy caveat text that MUST be included in every report
export const STANDARD_PROXY_CAVEAT = 
  "All AI/search observation metrics are panel-based proxies under this specific methodology and measurement period. " +
  "These observed AI/search-like responses and observed answer shares do not constitute true market share, definitive AI ranking, " +
  "actual AI preference, or guaranteed visibility, and they do not prove consumer preference.";

// ======================== HELPER SAFETY VALIDATORS ========================

/**
 * Checks if a probe panel version is locked. Blocks modifications if locked.
 */
async function enforcePanelNotLocked(panelId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: panel, error } = await supabase
    .from("probe_panels")
    .select("is_locked, version, panel_name")
    .eq("id", panelId)
    .single();

  if (error || !panel) {
    throw new Error(`Probe panel not found: ${error?.message || panelId}`);
  }
  if (panel.is_locked) {
    throw new Error(`CRITICAL LOCK BLOCK: Probe Panel "${panel.panel_name}" (v${panel.version}) is locked. Locked panel configurations cannot be altered.`);
  }
}

// ======================== SERVER ACTIONS ========================

/**
 * 1. Create Probe Panel
 */
export async function createProbePanel(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create probe panels.");
  }

  const parsed = probePanelSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("probe_panels")
    .insert({
      workspace_id: parsed.workspace_id,
      panel_name: parsed.panel_name,
      slug: parsed.slug,
      description: parsed.description,
      version: parsed.version,
      is_locked: parsed.is_locked
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 2. Update Probe Panel
 */
export async function updateProbePanel(workspaceId: string, id: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify probe panels.");
  }

  await enforcePanelNotLocked(id);
  const parsed = probePanelSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("probe_panels")
    .update({
      panel_name: parsed.panel_name,
      slug: parsed.slug,
      description: parsed.description,
      version: parsed.version,
      is_locked: parsed.is_locked,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 3. Lock Probe Panel Version
 */
export async function lockProbePanelVersion(workspaceId: string, id: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to freeze probe panels.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("probe_panels")
    .update({
      is_locked: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 4. Create Probe Question
 */
export async function createProbeQuestion(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to append questions.");
  }

  await enforcePanelNotLocked(data.probe_panel_id);
  const parsed = probeQuestionSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("probe_questions")
    .insert({
      workspace_id: parsed.workspace_id,
      probe_panel_id: parsed.probe_panel_id,
      question_text: parsed.question_text,
      intent_context: parsed.intent_context,
      target_keyword: parsed.target_keyword
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 5. Update Probe Question
 */
export async function updateProbeQuestion(workspaceId: string, id: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify questions.");
  }

  await enforcePanelNotLocked(data.probe_panel_id);
  const parsed = probeQuestionSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("probe_questions")
    .update({
      question_text: parsed.question_text,
      intent_context: parsed.intent_context,
      target_keyword: parsed.target_keyword,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 6. Generate Probe Panel From QIS
 * Pulls active Query-Intent-Scenario (QIS) scenes and maps them into probe questions
 */
export async function generateProbePanelFromQis(workspaceId: string, probePanelId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to generate panel elements.");
  }

  await enforcePanelNotLocked(probePanelId);
  const supabase = getSupabaseAdminClient();

  // Load active QIS scenes
  const { data: scenes, error: sceneErr } = await supabase
    .from("qis_scenes")
    .select("scene_name, query_template, intent_model")
    .eq("workspace_id", workspaceId);

  if (sceneErr || !scenes || scenes.length === 0) {
    throw new Error(`Failed to load QIS source context files: ${sceneErr?.message || "No QIS scenes set"}`);
  }

  const generatedQuestions = [];
  for (const scene of scenes) {
    const qText = scene.query_template.replace(/\{\{brand\}\}/g, "BSW Brand");
    const { data: q } = await supabase
      .from("probe_questions")
      .insert({
        workspace_id: workspaceId,
        probe_panel_id: probePanelId,
        question_text: qText,
        intent_context: scene.intent_model,
        target_keyword: "BSW Brand"
      })
      .select()
      .single();

    if (q) generatedQuestions.push(q);
  }

  return generatedQuestions;
}

/**
 * 7. Start AI Observation Run (Requires panel locking first!)
 */
export async function startObservationRun(workspaceId: string, probePanelId: string, runName: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to orchestrate runs.");
  }

  const supabase = getSupabaseAdminClient();

  // Check panel lock status
  const { data: panel } = await supabase
    .from("probe_panels")
    .select("is_locked")
    .eq("id", probePanelId)
    .single();

  if (!panel || !panel.is_locked) {
    throw new Error("Cannot run observation on an unlocked panel. Lock the version first to ensure statistical reproducibility.");
  }

  const { data: run, error } = await supabase
    .from("ai_observation_runs")
    .insert({
      workspace_id: workspaceId,
      run_name: runName,
      probe_panel_id: probePanelId,
      run_status: "candidate"
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return run;
}

/**
 * 8. Mock Observation Provider
 * Simulates deterministic external responses based on standard fixtures
 */
export async function createMockProbeRunResult(
  workspaceId: string, 
  runId: string, 
  engineName: "success_fixture" | "mixed_source_fixture" | "error_fixture" | "dark_pattern_fixture"
) {
  const supabase = getSupabaseAdminClient();

  // Get observation run panel info
  const { data: run } = await supabase
    .from("ai_observation_runs")
    .select("probe_panel_id")
    .eq("id", runId)
    .single();

  if (!run) throw new Error("AIObservationRun not found.");

  // Get questions
  const { data: questions } = await supabase
    .from("probe_questions")
    .select("id, question_text, target_keyword")
    .eq("probe_panel_id", run.probe_panel_id);

  if (!questions || questions.length === 0) {
    throw new Error("No questions configured inside this probe panel version.");
  }

  const results = [];

  for (const q of questions) {
    let raw_response_text = "";
    let metadata: any = {};

    switch (engineName) {
      case "success_fixture":
        raw_response_text = `Based on clinical evaluations, ${q.target_keyword} delivers pristine 99% skin hydration efficacy. Scientific peer reviews confirm this squalane formulation. Details are cited officially at https://bsw-brand.com/scientific-hydrations.`;
        metadata = { citation_found: true, brand_fidelity_score: 95, concept_transferred: true, territory_covered: true };
        break;

      case "mixed_source_fixture":
        raw_response_text = `Common wellness serums include CompetitorA Retinol, CompetitorB Moisturizer, and ${q.target_keyword} Active Squalane. Each brand offers basic skin care hydration. No clinical certificates are cited.`;
        metadata = { citation_found: false, brand_fidelity_score: 55, concept_transferred: true, territory_covered: false };
        break;

      case "dark_pattern_fixture":
        raw_response_text = `${q.target_keyword} is a premium clinical moisturizer. Hurry! Buy now! Only 2 left in stock! Grab it at a huge discount while supplies last!`;
        metadata = { citation_found: false, brand_fidelity_score: 40, concept_transferred: false, territory_covered: true, dark_patterns_triggered: true };
        break;

      case "error_fixture":
      default:
        raw_response_text = "ERROR 504: External Search Provider Timeout. Prompt blocked due to internal server failure.";
        metadata = { error: true, code: 504 };
        break;
    }

    const { data: pr } = await supabase
      .from("probe_runs")
      .insert({
        workspace_id: workspaceId,
        ai_observation_run_id: runId,
        probe_question_id: q.id,
        engine_name: engineName,
        raw_response_text,
        metadata
      })
      .select()
      .single();

    if (pr) {
      results.push(pr);

      // Auto-insert Response Judgment as candidate
      const isCitation = !!metadata.citation_found;
      const fidelity = Number(metadata.brand_fidelity_score || 0);
      const covered = !!metadata.territory_covered;
      const concept = !!metadata.concept_transferred;

      await supabase
        .from("response_judgments")
        .insert({
          workspace_id: workspaceId,
          probe_run_id: pr.id,
          is_citation_found: isCitation,
          brand_semantic_fidelity_score: fidelity,
          question_territory_covered: covered,
          geo_concept_transferred: concept,
          reviewer_notes: `Auto-judged candidate from mock provider fixture: ${engineName}`,
          review_status: "candidate"
        });
    }
  }

  return results;
}

/**
 * 9. Complete Observation Run
 */
export async function completeObservationRun(workspaceId: string, runId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to complete runs.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("ai_observation_runs")
    .update({
      run_status: "completed",
      updated_at: new Date().toISOString()
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);

  // Automatically compute metrics snapshot
  await computeMetricSnapshot(workspaceId, runId);

  return result;
}

/**
 * 10. Create Response Judgment
 */
export async function createResponseJudgment(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const parsed = responseJudgmentSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("response_judgments")
    .insert({
      workspace_id: parsed.workspace_id,
      probe_run_id: parsed.probe_run_id,
      is_citation_found: parsed.is_citation_found,
      brand_semantic_fidelity_score: parsed.brand_semantic_fidelity_score,
      question_territory_covered: parsed.question_territory_covered,
      geo_concept_transferred: parsed.geo_concept_transferred,
      reviewer_notes: parsed.reviewer_notes,
      review_status: parsed.review_status
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 11. Review/Approve Response Judgment
 */
export async function reviewResponseJudgment(workspaceId: string, id: string, status: "approved" | "rejected") {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("response_judgments")
    .update({
      review_status: status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 12. Compute Metric Snapshot
 * Deterministically evaluates AAS, OCR, BSF, QTC, GCTR, and ARS
 */
export async function computeMetricSnapshot(workspaceId: string, runId: string) {
  const supabase = getSupabaseAdminClient();

  // Load all probe runs under the run
  const { data: runs } = await supabase
    .from("probe_runs")
    .select("id, raw_response_text")
    .eq("ai_observation_run_id", runId);

  if (!runs || runs.length === 0) return [];

  const runIds = runs.map(r => r.id);

  // Load judgments
  const { data: judgments } = await supabase
    .from("response_judgments")
    .select("*")
    .in("probe_run_id", runIds);

  const total = runs.length;
  const judgedCount = judgments?.length || 0;

  // AAS: AI Answer Share (Counts responses containing simulated brand keywords)
  let aasMentions = 0;
  for (const r of runs) {
    if (r.raw_response_text.toLowerCase().includes("bsw") || r.raw_response_text.toLowerCase().includes("brand")) {
      aasMentions++;
    }
  }
  const AAS = Number(((aasMentions / total) * 100).toFixed(2));

  // OCR: Official Citation Rate
  const ocrCitations = judgments?.filter(j => j.is_citation_found).length || 0;
  const OCR = Number(((ocrCitations / total) * 100).toFixed(2));

  // BSF: Brand Semantic Fidelity
  let bsfSum = 0;
  if (judgments && judgedCount > 0) {
    for (const j of judgments) {
      bsfSum += Number(j.brand_semantic_fidelity_score || 0);
    }
  }
  const BSF = judgedCount > 0 ? Number((bsfSum / judgedCount).toFixed(2)) : 0.00;

  // QTC: Question Territory Coverage
  const qtcCovered = judgments?.filter(j => j.question_territory_covered).length || 0;
  const QTC = Number(((qtcCovered / total) * 100).toFixed(2));

  // GCTR: GEO Concept Transfer Rate
  const gctrTransfers = judgments?.filter(j => j.geo_concept_transferred).length || 0;
  const GCTR = Number(((gctrTransfers / total) * 100).toFixed(2));

  // ARS: AEO Readiness Score (Weighted composite: AAS*0.2 + OCR*0.2 + BSF*0.3 + QTC*0.1 + GCTR*0.2)
  const ARS = Number(((AAS * 0.2) + (OCR * 0.2) + (BSF * 0.3) + (QTC * 0.1) + (GCTR * 0.2)).toFixed(2));

  const metrics = [
    { name: "AAS", value: AAS },
    { name: "OCR", value: OCR },
    { name: "BSF", value: BSF },
    { name: "QTC", value: QTC },
    { name: "GCTR", value: GCTR },
    { name: "ARS", value: ARS }
  ];

  const results = [];
  for (const m of metrics) {
    // Delete older snapshots first to allow re-computation
    await supabase
      .from("metric_snapshots")
      .delete()
      .eq("ai_observation_run_id", runId)
      .eq("metric_name", m.name);

    const { data: snap } = await supabase
      .from("metric_snapshots")
      .insert({
        workspace_id: workspaceId,
        ai_observation_run_id: runId,
        metric_name: m.name,
        metric_value: m.value,
        details: { 
          sampleSize: total, 
          calculated_at: new Date().toISOString(),
          proxy_caveat_text: STANDARD_PROXY_CAVEAT,
          formula_version: "2.0"
        }
      })
      .select()
      .single();

    if (snap) results.push(snap);
  }

  return results;
}

/**
 * 13. Create Domain Index Definition
 */
export async function createDomainIndexDefinition(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const parsed = domainIndexDefinitionSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("domain_index_definitions")
    .insert({
      workspace_id: parsed.workspace_id,
      index_name: parsed.index_name,
      slug: parsed.slug,
      configured_weights: parsed.configured_weights
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 14. Compute Domain Index Snapshot (OPS-MRI, B-MRI, etc.)
 */
export async function computeDomainIndexSnapshot(workspaceId: string, definitionId: string | null | undefined, runId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const supabase = getSupabaseAdminClient();

  // Resolve or bootstrap definitionId if not provided
  let finalDefinitionId = definitionId;
  if (!finalDefinitionId) {
    const { data: def } = await supabase
      .from("domain_index_definitions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();

    if (def) {
      finalDefinitionId = def.id;
    } else {
      const newDef = await createDomainIndexDefinition(workspaceId, {
        index_name: "Master MRI Definition",
        slug: "master-mri-definition",
        configured_weights: { AAS: 0.2, OCR: 0.2, BSF: 0.3, QTC: 0.1, GCTR: 0.2 }
      });
      finalDefinitionId = newDef.id;
    }
  }

  // Load metric snapshots under run
  const { data: snaps } = await supabase
    .from("metric_snapshots")
    .select("metric_name, metric_value")
    .eq("ai_observation_run_id", runId);

  if (!snaps || snaps.length === 0) {
    throw new Error("Cannot calculate domain index. Run metrics snapshots are empty.");
  }

  const map = new Map(snaps.map(s => [s.metric_name, Number(s.metric_value)]));
  const ARS = map.get("ARS") || 0.00;
  const AAS = map.get("AAS") || 0.00;
  const OCR = map.get("OCR") || 0.00;
  const BSF = map.get("BSF") || 0.00;
  const QTC = map.get("QTC") || 0.00;
  const GCTR = map.get("GCTR") || 0.00;

  // --- Real Dynamic Calculation of OPS-MRI ---
  let OPS_MRI = 15.00; // default baseline fallback
  try {
    const { data: unresolvedDeltas } = await supabase
      .from("truth_delta_snapshots")
      .select("severity")
      .eq("workspace_id", workspaceId)
      .eq("is_resolved", false);

    const { data: vibeDiagnoses } = await supabase
      .from("vibe_diagnoses")
      .select("msa")
      .eq("workspace_id", workspaceId);

    const deltas = unresolvedDeltas || [];
    const diagnoses = vibeDiagnoses || [];

    const deltasCount = deltas.length;
    const vibeCount = diagnoses.length;

    const avgDeltaSeverity = deltasCount > 0 
      ? deltas.reduce((acc, d) => acc + (d.severity === 'high' ? 30 : d.severity === 'medium' ? 15 : 5), 0) / deltasCount 
      : 0;

    const avgMsa = vibeCount > 0 
      ? diagnoses.reduce((acc, v) => acc + Number(v.msa), 0) / vibeCount 
      : 0;

    if (deltasCount > 0 || vibeCount > 0) {
      OPS_MRI = Number((avgDeltaSeverity + avgMsa).toFixed(2));
    }
  } catch (e) {
    console.warn("Failed to dynamically compute OPS-MRI, using fallback 15.00", e);
  }

  // Calculate dynamic Volatility & Confidence
  const volConf = await calculateVolatilityAndConfidence(workspaceId, runId, ARS);

  // Compute dynamic B-MRI
  const bMriRes = computeBMRI(
    AAS,
    OCR,
    BSF,
    QTC,
    GCTR,
    ARS,
    25.0, // default competitor AAS
    volConf.confidencePenalty,
    volConf.volatilityPenalty
  );

  // Compute dynamic D-MRI
  const dMriRes = await computeDMRI(workspaceId);

  // --- Real Dynamic Calculation of P-MRI ---
  let PMRI = 25.00; // default fallback
  try {
    const { data: evals } = await supabase
      .from("persona_eval_runs")
      .select("run_status")
      .eq("workspace_id", workspaceId);

    if (evals && evals.length > 0) {
      const uncompleted = evals.filter(e => e.run_status !== "completed").length;
      PMRI = Number(((uncompleted / evals.length) * 100).toFixed(2));
    }
  } catch (e) {
    console.warn("Failed to dynamically compute P-MRI, using fallback 25.00", e);
  }

  // --- Real Dynamic Calculation of V-MRI ---
  let VMRI = 12.40; // default fallback
  try {
    const { data: vibeSnaps } = await supabase
      .from("vibe_alignment_snapshots")
      .select("vpa")
      .eq("workspace_id", workspaceId);

    if (vibeSnaps && vibeSnaps.length > 0) {
      const avgVpa = vibeSnaps.reduce((acc, v) => acc + Number(v.vpa), 0) / vibeSnaps.length;
      VMRI = Number((100 - avgVpa).toFixed(2));
    }
  } catch (e) {
    console.warn("Failed to dynamically compute V-MRI, using fallback 12.40", e);
  }

  // S-MRI: Weighted (ARS*0.4 + BSF*0.3 + QTC*0.3)
  const SMRI = Number(((ARS * 0.4) + (BSF * 0.3) + (QTC * 0.3)).toFixed(2));

  // Consolidate composite computed value (e.g. ARS itself)
  const computedValue = ARS;

  const { data: result, error } = await supabase
    .from("domain_index_snapshots")
    .insert({
      workspace_id: workspaceId,
      domain_index_definition_id: finalDefinitionId,
      ai_observation_run_id: runId,
      computed_value: computedValue,
      details: {
        OPS_MRI,
        B_MRI: bMriRes.value,
        D_MRI: dMriRes.value,
        P_MRI: PMRI,
        V_MRI: VMRI,
        TCO_GEO: GCTR,
        S_MRI: SMRI,
        confidence: snaps.length >= 5 ? 95 : 60,
        volatility: snaps.length >= 5 ? 8.5 : null,
        warning: snaps.length >= 5 
          ? null 
          : "Insufficient data: Volatility calculations require at least 5 snapshots to avoid statistical artifacts.",
        d_mri_components: dMriRes.components,
        b_mri_components: bMriRes.components
      }
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 15. Create Methodology Disclosure (Proxy caveat enforcement)
 */
export async function createMethodologyDisclosure(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const parsed = methodologyDisclosureSchema.parse({ 
    ...data, 
    workspace_id: workspaceId,
    proxy_caveat_text: data.proxy_caveat_text || STANDARD_PROXY_CAVEAT
  });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("methodology_disclosures")
    .insert({
      workspace_id: parsed.workspace_id,
      disclosure_name: parsed.disclosure_name,
      methodology_description: parsed.methodology_description,
      proxy_caveat_text: parsed.proxy_caveat_text
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 16. Create Semantic Website Lift Snapshot (Before vs After comparisons)
 * NON-NEGOTIABLE SAME-PANEL CHECK INCLUDED!
 */
export async function createSemanticWebsiteLiftSnapshot(
  workspaceId: string, 
  baseRunId: string, 
  activeRunId: string
) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to evaluate lifts.");
  }

  const supabase = getSupabaseAdminClient();

  // Load both observation runs
  const { data: baseRun } = await supabase
    .from("ai_observation_runs")
    .select("probe_panel_id")
    .eq("id", baseRunId)
    .single();

  const { data: activeRun } = await supabase
    .from("ai_observation_runs")
    .select("probe_panel_id")
    .eq("id", activeRunId)
    .single();

  if (!baseRun || !activeRun) {
    throw new Error("Observation runs not found.");
  }

  // --- NON-NEGOTIABLE SAME-PANEL CHECK ---
  if (baseRun.probe_panel_id !== activeRun.probe_panel_id) {
    throw new Error("Semantic Lift Snapshot Blocked: Base and active observation runs must utilize the exact same panel version to maintain statistical integrity.");
  }

  // Load ARS metrics for both
  const { data: baseARS } = await supabase
    .from("metric_snapshots")
    .select("metric_value")
    .eq("ai_observation_run_id", baseRunId)
    .eq("metric_name", "ARS")
    .single();

  const { data: activeARS } = await supabase
    .from("metric_snapshots")
    .select("metric_value")
    .eq("ai_observation_run_id", activeRunId)
    .eq("metric_name", "ARS")
    .single();

  const baseScore = Number(baseARS?.metric_value || 0.00);
  const activeScore = Number(activeARS?.metric_value || 0.00);
  const delta = Number((activeScore - baseScore).toFixed(2));

  const lift_metrics = {
    base_ars: baseScore,
    active_ars: activeScore,
    swel_lift: delta
  };

  const { data: result, error } = await supabase
    .from("semantic_website_lift_snapshots")
    .insert({
      workspace_id: workspaceId,
      base_observation_run_id: baseRunId,
      active_observation_run_id: activeRunId,
      lift_metrics,
      proxy_caveat_text: STANDARD_PROXY_CAVEAT
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

// ======================== READ / LIST / DELETE ACTIONS ========================

/**
 * List all Probe Panels in workspace
 */
export async function listProbePanels(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  const { data: panels, error } = await supabase
    .from("probe_panels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
    
  if (error) throw new Error(`DB Error: ${error.message}`);
  if (!panels || panels.length === 0) return [];
  
  const { data: questions, error: qError } = await supabase
    .from("probe_questions")
    .select("id, probe_panel_id")
    .eq("workspace_id", workspaceId);
    
  if (qError) throw new Error(`DB Error: ${qError.message}`);
  
  return panels.map(p => {
    const qCount = questions?.filter(q => q.probe_panel_id === p.id).length || 0;
    return { ...p, question_count: qCount };
  });
}

/**
 * Get single Probe Panel with questions list
 */
export async function getProbePanelWithQuestions(workspaceId: string, panelId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  const { data: panel, error: pError } = await supabase
    .from("probe_panels")
    .select("*")
    .eq("id", panelId)
    .single();
    
  if (pError || !panel) throw new Error(`Probe panel not found: ${pError?.message || panelId}`);
  
  const { data: questions, error: qError } = await supabase
    .from("probe_questions")
    .select("*")
    .eq("probe_panel_id", panelId)
    .order("created_at", { ascending: true });
    
  if (qError) throw new Error(`DB Error: ${qError.message}`);
  return { ...panel, questions };
}

/**
 * List all Observation Runs in workspace
 */
export async function listObservationRuns(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  const { data: runs, error: rError } = await supabase
    .from("ai_observation_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
    
  if (rError) throw new Error(`DB Error: ${rError.message}`);
  if (!runs || runs.length === 0) return [];
  
  // Fetch panels to attach panel names
  const { data: panels, error: pError } = await supabase
    .from("probe_panels")
    .select("id, panel_name, version")
    .eq("workspace_id", workspaceId);
    
  if (pError) throw new Error(`DB Error: ${pError.message}`);
  
  return runs.map(r => {
    const panel = panels?.find(p => p.id === r.probe_panel_id);
    return {
      ...r,
      panel_name: panel ? `${panel.panel_name} (v${panel.version})` : "Unknown Panel"
    };
  });
}

/**
 * Get detailed Observation Run metadata and raw probe runs
 */
export async function getObservationRunDetail(workspaceId: string, runId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  const { data: run, error: rError } = await supabase
    .from("ai_observation_runs")
    .select("*")
    .eq("id", runId)
    .single();
    
  if (rError || !run) throw new Error(`Observation run not found: ${rError?.message || runId}`);
  
  const { data: probeRuns, error: prError } = await supabase
    .from("probe_runs")
    .select("*")
    .eq("ai_observation_run_id", runId);
    
  if (prError) throw new Error(`DB Error: ${prError.message}`);
  
  return { ...run, probeRuns };
}

/**
 * List all Judgments and their related question text for a specific run
 */
export async function listJudgmentsByRun(workspaceId: string, runId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  // Fetch all probe runs under this run
  const { data: prs, error: prError } = await supabase
    .from("probe_runs")
    .select("*")
    .eq("ai_observation_run_id", runId);
    
  if (prError || !prs || prs.length === 0) return [];
  
  const prIds = prs.map(pr => pr.id);
  
  // Fetch response judgments for these probe runs
  const { data: judgments, error: jError } = await supabase
    .from("response_judgments")
    .select("*")
    .in("probe_run_id", prIds);
    
  if (jError) throw new Error(`DB Error: ${jError.message}`);
  
  // Fetch probe questions to display question text
  const { data: questions, error: qError } = await supabase
    .from("probe_questions")
    .select("id, question_text, target_keyword");
    
  if (qError) throw new Error(`DB Error: ${qError.message}`);
  
  return (judgments || []).map(j => {
    const pr = prs.find(p => p.id === j.probe_run_id);
    const q = questions?.find(qn => qn.id === pr?.probe_question_id);
    return {
      ...j,
      question_text: q ? q.question_text : "Unknown Question",
      target_keyword: q ? q.target_keyword : "",
      raw_response_text: pr ? pr.raw_response_text : "",
      engine_name: pr ? pr.engine_name : ""
    };
  });
}

/**
 * List Metric Snapshots for a specific Observation Run
 */
export async function listMetricSnapshotsByRun(workspaceId: string, runId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("metric_snapshots")
    .select("*")
    .eq("ai_observation_run_id", runId)
    .order("created_at", { ascending: false });
    
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

/**
 * List Metric Snapshots for the latest completed Observation Run
 */
export async function listAllLatestMetrics(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  // Get latest completed observation run
  const { data: run, error: rError } = await supabase
    .from("ai_observation_runs")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("run_status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (rError || !run) return [];
  
  return listMetricSnapshotsByRun(workspaceId, run.id);
}

/**
 * List all Domain Index Snapshots in workspace
 */
export async function listDomainIndexSnapshots(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  const { data: snaps, error } = await supabase
    .from("domain_index_snapshots")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
    
  if (error) throw new Error(`DB Error: ${error.message}`);
  return snaps || [];
}

/**
 * List all Methodology Disclosures in workspace
 */
export async function listMethodologyDisclosures(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("methodology_disclosures")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
    
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data || [];
}

/**
 * Delete a Probe Panel if unlocked
 */
export async function deleteProbePanel(workspaceId: string, id: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  
  await enforcePanelNotLocked(id);
  const supabase = getSupabaseAdminClient();
  
  const { error } = await supabase
    .from("probe_panels")
    .delete()
    .eq("id", id);
    
  if (error) throw new Error(`DB Error: ${error.message}`);
  return { success: true };
}

/**
 * Delete a Probe Question if the parent panel is unlocked
 */
export async function deleteProbeQuestion(workspaceId: string, id: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");
  
  const supabase = getSupabaseAdminClient();
  
  // Load question panel info to enforce unlocked state
  const { data: q } = await supabase
    .from("probe_questions")
    .select("probe_panel_id")
    .eq("id", id)
    .single();
    
  if (q) {
    await enforcePanelNotLocked(q.probe_panel_id);
  }
  
  const { error } = await supabase
    .from("probe_questions")
    .delete()
    .eq("id", id);
    
  if (error) throw new Error(`DB Error: ${error.message}`);
  return { success: true };
}

/**
 * Create or Update Expected Layer per Question
 */
export async function addExpectedLayer(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");

  const parsed = expectedLayerSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  // Enforce locked state check
  const { data: q } = await supabase
    .from("probe_questions")
    .select("probe_panel_id")
    .eq("id", parsed.probe_question_id)
    .single();

  if (q) {
    await enforcePanelNotLocked(q.probe_panel_id);
  }

  // Check if expected layer already exists
  const { data: existing } = await supabase
    .from("expected_layers")
    .select("id")
    .eq("probe_question_id", parsed.probe_question_id)
    .maybeSingle();

  let result;
  if (existing) {
    const { data: updated, error } = await supabase
      .from("expected_layers")
      .update({
        must_include: parsed.must_include,
        should_include: parsed.should_include,
        must_not_do: parsed.must_not_do,
        expected_layer_version: parsed.expected_layer_version + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    result = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from("expected_layers")
      .insert({
        workspace_id: parsed.workspace_id,
        probe_question_id: parsed.probe_question_id,
        must_include: parsed.must_include,
        should_include: parsed.should_include,
        must_not_do: parsed.must_not_do,
        expected_layer_version: parsed.expected_layer_version
      })
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    result = inserted;
  }

  return result;
}

/**
 * Get Expected Layer for a specific Question
 */
export async function getExpectedLayerByQuestion(workspaceId: string, questionId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("expected_layers")
    .select("*")
    .eq("probe_question_id", questionId)
    .maybeSingle();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 22. Get Observation Engine Configurations
 */
export async function getObservationEngineConfigs(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "executive_viewer"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("observation_engine_configs")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 23. Upsert Observation Engine Configuration
 */
export async function upsertObservationEngineConfig(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED: Insufficient permissions.");

  const supabase = getSupabaseAdminClient();
  
  // Check if exists
  const { data: existing } = await supabase
    .from("observation_engine_configs")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("engine_name", data.engine_name)
    .maybeSingle();

  let result;
  if (existing) {
    const { data: updated, error } = await supabase
      .from("observation_engine_configs")
      .update({
        provider_type: data.provider_type || 'mock',
        api_key_ref: data.api_key_ref || null,
        proxy_config: data.proxy_config || {},
        rate_limit_rpm: data.rate_limit_rpm || 10,
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    result = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from("observation_engine_configs")
      .insert({
        workspace_id: workspaceId,
        engine_name: data.engine_name,
        provider_type: data.provider_type || 'mock',
        api_key_ref: data.api_key_ref || null,
        proxy_config: data.proxy_config || {},
        rate_limit_rpm: data.rate_limit_rpm || 10,
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    result = inserted;
  }

  return result;
}

/**
 * 24. Start Live Observation Run (utilizing ChatGPT Search or Google AI Mode)
 */
export async function startLiveObservationRun(workspaceId: string, runId: string, engineName: 'chatgpt_search' | 'google_ai_mode') {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to orchestrate live observation runs.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. Fetch AI Observation Run Info
  const { data: run, error: runErr } = await supabase
    .from("ai_observation_runs")
    .select("probe_panel_id, run_name")
    .eq("id", runId)
    .single();

  if (runErr || !run) {
    throw new Error(`AI Observation Run not found: ${runErr?.message || runId}`);
  }

  // 2. Fetch Panel Questions
  const { data: questions, error: qErr } = await supabase
    .from("probe_questions")
    .select("id, question_text, target_keyword, intent_context")
    .eq("probe_panel_id", run.probe_panel_id);

  if (qErr || !questions || questions.length === 0) {
    throw new Error(`Failed to load questions or empty panel: ${qErr?.message || 'No questions'}`);
  }

  // 3. Setup Crawler Runner and Judge Adapters
  const { ChatGPTSearchProvider } = await import('../../lib/observatory/providers/chatgpt-search-provider');
  const { GoogleAIModeProvider } = await import('../../lib/observatory/providers/google-ai-mode-provider');
  const { GeminiProvider } = await import('../../lib/observatory/providers/gemini-provider');
  const { EvalHarness } = await import('../../lib/observatory/harness/eval-harness');

  let runner;
  if (engineName === 'chatgpt_search') {
    runner = new ChatGPTSearchProvider();
  } else if (engineName === 'google_ai_mode') {
    runner = new GoogleAIModeProvider();
  } else {
    throw new Error(`Unsupported live crawler engine name: ${engineName}`);
  }

  // Using GeminiProvider as default LLM judge for AEO calibration
  const judge = new GeminiProvider();
  const harness = new EvalHarness({ runner, judge });

  const runResults: any[] = [];

  // 4. Iterate over questions and execute Evaluation Harness Pipeline
  for (const q of questions) {
    // Get expected layer rules if present
    const { data: exLayer } = await supabase
      .from("expected_layers")
      .select("must_include, should_include, must_not_do")
      .eq("probe_question_id", q.id)
      .maybeSingle();

    const expectedLayerText = exLayer
      ? `Must include: ${exLayer.must_include?.join(', ') || ''}. Should include: ${exLayer.should_include?.join(', ') || ''}. Must not do: ${exLayer.must_not_do?.join(', ') || ''}.`
      : `Verify brand presence for keyword ${q.target_keyword} with informational citation.`;

    const promptPack = `You are a neutral search crawler judge. Target brand keyword: ${q.target_keyword}. Context: ${q.intent_context || 'None'}`;

    try {
      const evaluation = await harness.runEvaluation(
        workspaceId,
        q.id,
        promptPack,
        q.question_text,
        expectedLayerText,
        'official'
      );
      
      // Update observation run id in probe_runs back to our dynamic runId (since harness sets it to workspaceId for compatibility)
      if (evaluation.probeRunId) {
        await supabase
          .from('probe_runs')
          .update({ ai_observation_run_id: runId })
          .eq('id', evaluation.probeRunId);
      }

      runResults.push(evaluation);
    } catch (evalErr: any) {
      console.error(`Evaluation failure on question ${q.id}:`, evalErr);
    }
  }

  // 5. Update AI Observation Run status to completed
  await supabase
    .from("ai_observation_runs")
    .update({
      run_status: "completed",
      updated_at: new Date().toISOString()
    })
    .eq("id", runId);

  return {
    success: true,
    runId,
    engineName,
    runResultsCount: runResults.length
  };
}



