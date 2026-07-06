"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission, requireAuth, requireAuthOrDemo, checkWorkspacePermissionOrDemo } from "../../lib/auth";
import { 
  reportSectionSchema,
  reportExportSchema,
  reportReviewSchema,
  reportGateResultSchema,
  unsafeWordingFindingSchema
} from "../../lib/schema";
import { STANDARD_PROXY_CAVEAT } from "./observatory-constants";


// ======================== COMPLIANCE SCANNERS & GATES ========================

/**
 * 1. Scans report section bodies for forbidden unsafe market-share and brand-ranking terms.
 */
export async function runUnsafeWordingCheck(workspaceId: string, reportId: string) {
  const supabase = getSupabaseAdminClient();

  // Load sections
  const { data: sections } = await supabase
    .from("report_sections")
    .select("section_title, section_body")
    .eq("benchmark_report_id", reportId);

  if (!sections || sections.length === 0) return [];

  const forbiddenTerms = [
    { term: "market share", type: "market_share", msg: "Claims to measure true AI/search market share" },
    { term: "hidden preference", type: "hidden_preference", msg: "Claims to reveal hidden model preference" },
    { term: "hidden model preference", type: "hidden_preference", msg: "Claims to reveal hidden model preference" },
    { term: "guarantees visibility", type: "ranking", msg: "Guarantees ranking or visibility improvement" },
    { term: "guarantee ranking", type: "ranking", msg: "Guarantees ranking or visibility improvement" },
    { term: "proves consumer preference", type: "preference", msg: "Claims to prove consumer preference" },
    { term: "consumer preference", type: "preference", msg: "Claims to prove consumer preference" },
    { term: "legally final", type: "ranking", msg: "Claims to produce legally final competitive rankings" },
    { term: "definitive ranking", type: "ranking", msg: "Claims to produce definitive rankings" }
  ];

  const findings = [];

  for (const section of sections) {
    const text = section.section_body.toLowerCase();
    for (const rule of forbiddenTerms) {
      if (text.includes(rule.term)) {
        // Log finding in DB as unresolved
        const { data: finding } = await supabase
          .from("unsafe_wording_findings")
          .insert({
            workspace_id: workspaceId,
            benchmark_report_id: reportId,
            finding_type: rule.type,
            offending_text: `Found forbidden term "${rule.term}" in section "${section.section_title}": "${rule.msg}"`,
            is_resolved: false
          })
          .select()
          .single();

        if (finding) findings.push(finding);
      }
    }
  }

  return findings;
}

/**
 * 2. Resolve unsafe wording finding
 */
export async function resolveUnsafeWordingFinding(workspaceId: string, findingId: string, notes: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to resolve safety findings.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("unsafe_wording_findings")
    .update({
      is_resolved: true,
      resolution_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq("id", findingId)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 3. Log a manual report review (Real-brand competitive reports must be approved)
 */
export async function reviewReport(workspaceId: string, reportId: string, decision: "approved" | "rejected", notes: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to review reports.");
  }

  const parsed = reportReviewSchema.parse({
    workspace_id: workspaceId,
    benchmark_report_id: reportId,
    reviewer_id: userId,
    decision,
    notes
  });

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("report_reviews")
    .insert({
      workspace_id: parsed.workspace_id,
      benchmark_report_id: parsed.benchmark_report_id,
      reviewer_id: parsed.reviewer_id,
      decision: parsed.decision,
      notes: parsed.notes
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 4. Evaluate Report Export Gate
 * Validates the 4 core safety release parameters, returning blocking reasons
 */
export async function evaluateReportExportGate(workspaceId: string, reportId: string) {
  const supabase = getSupabaseAdminClient();
  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const requiredFixes: string[] = [];

  // Load the report details
  const { data: report } = await supabase
    .from("benchmark_reports")
    .select("report_name, scores, methodology_disclosure_id")
    .eq("id", reportId)
    .single();

  if (!report) {
    throw new Error("Benchmark report not found.");
  }

  // --- GATE 1: Methodology Appendix Linked check ---
  if (!report.methodology_disclosure_id) {
    blockingReasons.push("Report lacks a Methodology Appendix disclosure link. Benchmark reports cannot be published without unrolling methodology definitions.");
    requiredFixes.push("Attach a registered Methodology Disclosure under the Report Hub methodology settings.");
  }

  // --- GATE 2: Proxy Caveat Disclaimer check ---
  // Load sections to scan content
  const { data: sections } = await supabase
    .from("report_sections")
    .select("section_body")
    .eq("benchmark_report_id", reportId);

  const fullContent = (sections || []).map(s => s.section_body).join(" ").toLowerCase();
  
  // Search for crucial proxy caveat terminology: e.g. "observed proxy" or "limitations"
  const hasCaveat = fullContent.includes("observed proxy") || fullContent.includes("panel-based proxies");
  if (!hasCaveat) {
    blockingReasons.push("Report fails proxy caveat validation. The standard proxy caveat disclaimer must be present in the content body.");
    requiredFixes.push("Append BSW-OS's standard legal proxy caveat warning at the end of the methodology section copy.");
  }

  // --- GATE 3: Unsafe Wording scanning ---
  const { data: findings } = await supabase
    .from("unsafe_wording_findings")
    .select("id")
    .eq("benchmark_report_id", reportId)
    .eq("is_resolved", false);

  if (findings && findings.length > 0) {
    blockingReasons.push("Unresolved unsafe market-share or brand-ranking wording findings were detected. Reports must not assert definitive AI market share.");
    requiredFixes.push(`Resolve all ${findings.length} flagged wording scanner findings in the review queue console.`);
  }

  // --- GATE 4: Real-Brand Competitive manual reviews check ---
  // Check if report name or content text references competitor terms
  const competitorKeywords = ["competitor", "competitora", "competitorb", "competitorc", "rank", "ranking"];
  const isCompetitive = competitorKeywords.some(keyword => {
    return report.report_name.toLowerCase().includes(keyword) || fullContent.includes(keyword);
  });

  if (isCompetitive) {
    // Requires at least one review with decision = 'approved'
    const { data: reviews } = await supabase
      .from("report_reviews")
      .select("id")
      .eq("benchmark_report_id", reportId)
      .eq("decision", "approved");

    if (!reviews || reviews.length === 0) {
      blockingReasons.push("Competitive real-brand benchmark reports require an approved manual review before export to satisfy safety boundary constraints.");
      requiredFixes.push("Request a manual review and submit an APPROVED clearance decision inside the review notes board.");
    }
  }

  const passed = blockingReasons.length === 0;
  const status = passed ? "pass" : "fail";

  // Insert Gate Result
  const { data: gateResult } = await supabase
    .from("report_gate_results")
    .insert({
      workspace_id: workspaceId,
      benchmark_report_id: reportId,
      status,
      blocking_reasons: blockingReasons,
      warnings,
      required_fixes: requiredFixes
    })
    .select()
    .single();

  return {
    status,
    blockingReasons,
    warnings,
    requiredFixes,
    gateResultId: gateResult?.id
  };
}

/**
 * 5. Create Report Export (HTML/Markdown generator)
 * BLOCKS export if the safety gate has failed blockers!
 */
export async function createReportExport(workspaceId: string, reportId: string, format: "markdown" | "html") {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to export benchmark reports.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. Trigger strict export gate evaluation first!
  const gate = await evaluateReportExportGate(workspaceId, reportId);
  if (gate.status === "fail") {
    throw new Error(`EXPORT SECURITY BLOCKED: Report failed the safety publication gate. Blockers: [${gate.blockingReasons.join("; ")}]`);
  }

  // 2. Load report & attached disclosures & sections
  const { data: report } = await supabase
    .from("benchmark_reports")
    .select("report_name, scores, methodology_disclosure_id")
    .eq("id", reportId)
    .single();

  const { data: sections } = await supabase
    .from("report_sections")
    .select("section_title, section_body")
    .eq("benchmark_report_id", reportId)
    .order("created_at", { ascending: true });

  const { data: disclosure } = await supabase
    .from("methodology_disclosures")
    .select("methodology_description, proxy_caveat_text")
    .eq("id", report!.methodology_disclosure_id!)
    .single();

  // 3. Compile export payload
  let payload = "";

  if (format === "markdown") {
    payload += `# Benchmark Report: ${report!.report_name}\n\n`;
    payload += `*BSW-OS Governed Copy. Generated at: ${new Date().toLocaleDateString()}*\n\n`;
    
    // Add metrics score table
    payload += `## AI Crawler Observation Scores\n\n`;
    const scores = report!.scores || {};
    payload += `| Metric | Score |\n`;
    payload += `| --- | --- |\n`;
    for (const key of Object.keys(scores)) {
      payload += `| ${key} | ${scores[key]}% |\n`;
    }
    payload += `\n`;

    // Sections
    for (const sec of sections || []) {
      payload += `## ${sec.section_title}\n\n${sec.section_body}\n\n`;
    }

    // Methodology disclosure Appendix
    payload += `## Appendix: Methodology Disclosure\n\n`;
    payload += `${disclosure!.methodology_description}\n\n`;
    
    // Mandated proxy caveat
    payload += `> **Standard Proxy Caveat Disclaimer**\n`;
    payload += `> ${disclosure!.proxy_caveat_text}\n`;

  } else {
    // HTML compiled copy
    payload += `<h1>Benchmark Report: ${report!.report_name}</h1>`;
    payload += `<p><em>BSW-OS Governed Copy. Generated at: ${new Date().toLocaleDateString()}</em></p>`;
    
    // Scores
    payload += `<h3>AI Crawler Observation Scores</h3><table border="1"><tr><th>Metric</th><th>Score</th></tr>`;
    const scores = report!.scores || {};
    for (const key of Object.keys(scores)) {
      payload += `<tr><td>${key}</td><td>${scores[key]}%</td></tr>`;
    }
    payload += `</table><br/>`;

    // Sections
    for (const sec of sections || []) {
      payload += `<h2>${sec.section_title}</h2><p>${sec.section_body}</p>`;
    }

    // Methodology
    payload += `<h2>Appendix: Methodology Disclosure</h2><p>${disclosure!.methodology_description}</p>`;
    
    // Caveat
    payload += `<div style="padding: 10px; border-left: 3px solid #f59e0b; background-color: #fef3c7; color: #b45309; font-style: italic;">`;
    payload += `<strong>Standard Proxy Caveat Disclaimer</strong><br/>${disclosure!.proxy_caveat_text}</div>`;
  }

  // 4. Save Export record
  const { data: exp, error } = await supabase
    .from("report_exports")
    .insert({
      workspace_id: workspaceId,
      benchmark_report_id: reportId,
      export_format: format,
      exported_payload: payload,
      is_published: true
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return exp;
}

// ======================== CRUD ACTIONS ========================

/**
 * Create Benchmark Report
 */
export async function createBenchmarkReport(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("benchmark_reports")
    .insert({
      workspace_id: workspaceId,
      report_name: data.report_name,
      report_type: data.report_type || "benchmark",
      panel_version: data.panel_version || 1,
      scores: data.scores || {}
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Update Benchmark Report
 */
export async function updateBenchmarkReport(workspaceId: string, id: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("benchmark_reports")
    .update({
      report_name: data.report_name,
      report_type: data.report_type,
      panel_version: data.panel_version,
      scores: data.scores,
      methodology_disclosure_id: data.methodology_disclosure_id
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Add Report Section
 */
export async function addReportSection(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const { addReportSectionCore } = await import("../../lib/db/reports-db");
  return addReportSectionCore(workspaceId, data);
}

/**
 * Update Report Section
 */
export async function updateReportSection(workspaceId: string, id: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const parsed = reportSectionSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("report_sections")
    .update({
      section_title: parsed.section_title,
      section_body: parsed.section_body,
      section_type: parsed.section_type,
      status: parsed.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Generate report draft (Creates executive summary and landscape drafts as candidates)
 */
export async function generateReportDraft(workspaceId: string, reportId: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions.");
  }

  const { generateReportDraftCore } = await import("../../lib/db/reports-db");
  return generateReportDraftCore(workspaceId, reportId);
}

/**
 * Attach Metric Snapshots
 */
export async function attachMetricSnapshots(workspaceId: string, reportId: string, runId: string) {
  const supabase = getSupabaseAdminClient();

  // Load snapshots
  const { data: snaps } = await supabase
    .from("metric_snapshots")
    .select("metric_name, metric_value")
    .eq("ai_observation_run_id", runId);

  if (!snaps || snaps.length === 0) {
    throw new Error("Run metric snapshots are empty. Run calculations first.");
  }

  const scores: any = {};
  for (const s of snaps) {
    scores[s.metric_name] = Number(s.metric_value);
  }

  // Update report scores
  const { data: result } = await supabase
    .from("benchmark_reports")
    .update({
      scores,
      // Traceability check: preserve originating run reference!
      scores_metadata: { source_observation_run_id: runId, attached_at: new Date().toISOString() }
    })
    .eq("id", reportId)
    .select()
    .single();

  return result;
}

/**
 * Attach Domain Index Snapshot
 */
export async function attachDomainIndexSnapshot(workspaceId: string, reportId: string, snapshotId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: snap } = await supabase
    .from("domain_index_snapshots")
    .select("computed_value, details")
    .eq("id", snapshotId)
    .single();

  if (!snap) throw new Error("Index snapshot not found.");

  // Save in scores
  const { data: report } = await supabase
    .from("benchmark_reports")
    .select("scores")
    .eq("id", reportId)
    .single();

  const scores = { ...(report?.scores || {}), index_value: Number(snap.computed_value), details: snap.details };

  const { data: result } = await supabase
    .from("benchmark_reports")
    .update({
      scores,
      scores_metadata: { ...(report?.scores || {}).scores_metadata, source_index_snapshot_id: snapshotId }
    })
    .eq("id", reportId)
    .select()
    .single();

  return result;
}

/**
 * Attach Methodology Disclosure Link
 */
export async function attachMethodologyDisclosure(workspaceId: string, reportId: string, disclosureId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: result } = await supabase
    .from("benchmark_reports")
    .update({
      methodology_disclosure_id: disclosureId
    })
    .eq("id", reportId)
    .select()
    .single();

  return result;
}

/**
 * Track publishing state
 */
export async function markReportExported(workspaceId: string, exportId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: result } = await supabase
    .from("report_exports")
    .update({
      is_published: true
    })
    .eq("id", exportId)
    .select()
    .single();

  return result;
}
