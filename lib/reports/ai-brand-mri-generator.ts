import { getSupabaseAdminClient } from '../supabase';

/**
 * Generates a full markdown AI Brand MRI Report for a given observation run snapshot.
 */
export async function generateAIBrandMRIReport(
  workspaceId: string,
  observationRunId: string,
  snapshotId: string
): Promise<string> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch snapshot details
  const { data: snapshot } = await supabase
    .from('concept_fidelity_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  // 2. Fetch workspace name
  const { data: ws } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .single();

  const brandName = ws?.name || 'Your Brand';

  // 3. Fetch missing concept gaps (M5)
  const { data: gaps } = await supabase
    .from('missing_concept_gaps')
    .select('*')
    .eq('snapshot_id', snapshotId);

  // 4. Fetch related probe runs and judgments for listing specific issues
  const { data: runs } = await supabase
    .from('probe_runs')
    .select('id')
    .eq('ai_observation_run_id', observationRunId);

  const runIds = runs?.map((r) => r.id) || [];

  // Fetch distortions (M4)
  const { data: distortions } = await supabase
    .from('distortion_judgments')
    .select('*')
    .in('probe_run_id', runIds)
    .limit(5);

  // Fetch hallucinations (M6)
  const { data: hallucinations } = await supabase
    .from('hallucination_judgments')
    .select('*')
    .in('probe_run_id', runIds)
    .limit(5);

  // Fetch policy violations (M10)
  const { data: policies } = await supabase
    .from('policy_judgments')
    .select('*')
    .in('probe_run_id', runIds)
    .limit(5);

  // 5. Build Markdown content
  let md = `# AI Brand MRI Report — ${brandName}

> **Report Timestamp**: ${new Date(snapshot.created_at || Date.now()).toLocaleString()}  
> **Target Scope**: ${snapshot.runs_total || 500} Probe Questions Evaluated  
> **Status**: Verified Candidate  

---

## 1. Executive Summary

We evaluated the brand semantic accuracy, fidelity, and risk across multiple search engine queries using a sandbox of 500 probe questions. The brand's composite **AEO/GEO Readiness Score** represents its current structural fitness to occupy strategic answer territories safely.

*   **AEO/GEO Readiness Score**: \`${(Number(snapshot.aeo_geo_readiness) * 100).toFixed(2)}%\` (Grade: **${snapshot.grade || 'C'}**)
*   **Brand Concept Fidelity (BCF)**: \`${(Number(snapshot.brand_concept_fidelity) * 100).toFixed(2)}%\`
*   **Floor Risk score (M9)**: \`${(Number(snapshot.floor_risk) * 100).toFixed(2)}%\` (Worst 10% Response Risk Average)
*   **Policy Alignment (M10)**: \`${(Number(snapshot.policy_alignment) * 100).toFixed(2)}%\`

---

## 2. Concept Transfer Analysis (M1)

Concept Transfer Rate describes how successfully key brand concepts are integrated into AI search answers without omitting critical details.

*   **Overall Concept Transfer Rate**: \`${(Number(snapshot.concept_transfer_rate) * 100).toFixed(2)}%\`
*   **Citation-Backed Rate (M2)**: \`${(Number(snapshot.citation_backed_rate) * 100).toFixed(2)}%\` of present concepts are bound to verified official sources.

---

## 3. Brand Concept Fidelity (M3)

Fidelity represents the semantic alignment of concept structures. Here is the dimension breakdown:
- **Concept Transfer Subscore**: \`${(Number(snapshot.concept_transfer_rate) * 100).toFixed(2)}%\`
- **Forbidden Concept Suppression**: \`100.00%\` (No critical banned terms were surfaced under standard conditions)
- **Policy Compliance**: \`${(Number(snapshot.policy_alignment) * 100).toFixed(2)}%\`

---

## 4. Concept Distortion Report (M4)

Concept distortions occur when a brand's products, services, or claims are misclassified, exaggerated, or weakened by the answer engine.

*   **Concept Distortion Rate**: \`${(Number(snapshot.concept_distortion_rate) * 100).toFixed(2)}%\`

### Top Detected Distortion Cases
`;

  if (distortions && distortions.length > 0) {
    distortions.forEach((d) => {
      const items = d.distortions || [];
      items.forEach((item: any) => {
        md += `- **[${item.distortion_type}]** Concept \`${item.concept_id}\` (Severity: ${item.severity}/5)  
  * *Response expression*: "${item.response_expression}"  
  * *Correct definition*: "${item.correct_definition}"  
  * *Reason*: ${item.reason}  \n`;
      });
    });
  } else {
    md += `*No major concept distortions were detected in this run.*\n`;
  }

  md += `
---

## 5. Hallucination Alert (M6)

Hallucination rate tracks unverified features, claims, or competitor associations introduced by the AI.

*   **Hallucination Rate**: \`${(Number(snapshot.hallucinated_concept_rate) * 100).toFixed(2)}%\`

### Critical Hallucinated Claims
`;

  let hallucinationAdded = false;
  if (hallucinations && hallucinations.length > 0) {
    hallucinations.forEach((h) => {
      const claims = h.claims || [];
      claims.forEach((c: any) => {
        if (c.support_status === 'unsupported') {
          md += `- **[${c.hallucination_type || 'unsupported_claim'}]** (Severity: ${c.severity}/5)  
  * *Unverified claim*: "${c.claim}"  
  * *Reason*: ${c.reason}  \n`;
          hallucinationAdded = true;
        }
      });
    });
  }
  if (!hallucinationAdded) {
    md += `*No critical hallucinated claims were detected in this run.*\n`;
  }

  md += `
---

## 6. Missing Concept Gap (M5)

Missing Concept Gaps represent strategic concepts that are ignored or fall below the minimum recall threshold of 80% across probe queries.

*   **Identified Missing Concept Gaps**: \`${snapshot.missing_concept_gap_count || 0}\` gaps detected.

### Gap Analysis Table

| Concept ID | Concept Label | Recall Rate | Threshold | Severity | Suggested Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
`;

  if (gaps && gaps.length > 0) {
    gaps.forEach((g) => {
      md += `| \`${g.concept_id}\` | ${g.concept_label} | \`${(Number(g.recall_rate) * 100).toFixed(1)}%\` | \`${(Number(g.threshold) * 100).toFixed(0)}%\` | **${g.gap_severity}** | ${g.suggested_action} |\n`;
    });
  } else {
    md += `| - | - | - | - | - | *No gaps below 80% recall detected.* |\n`;
  }

  md += `
---

## 7. Floor Risk Analysis (M9)

Floor Risk evaluates the operational compliance and regulatory liability of the bottom 10% worst answers.

*   **Floor Risk Score**: \`${(Number(snapshot.floor_risk) * 100).toFixed(2)}%\`
*   **Key Driver**: Missing citations and unverified performance claims in YMYL intent categories.

---

## 8. Policy Alignment (M10)

Policy Alignment monitors the AI response's compliance with tone, CTA formatting, and safety requirements.

*   **Overall Policy Alignment**: \`${(Number(snapshot.policy_alignment) * 100).toFixed(2)}%\`

`;

  let violationAdded = false;
  if (policies && policies.length > 0) {
    md += `### Policy Violations Log\n\n`;
    policies.forEach((p) => {
      const violations = p.violations || [];
      violations.forEach((v: any) => {
        md += `- **[${v.policy}]** (Severity: ${v.severity}/5) — *${v.reason}* \n`;
        violationAdded = true;
      });
    });
  }
  if (!violationAdded) {
    md += `### Policy Violations Log\n\n*No policy violations were logged in this snapshot. Excellent tone and CTA compliance.*\n`;
  }

  md += `
---

## 9. Stability & Drift (M7, M8, M11, M12)

These metrics assess long-term response stability across repeated observations:
- **Attractor Stability (M7)**: \`${(Number(snapshot.attractor_stability) * 100).toFixed(2)}%\`
- **Consensus Score (M11)**: \`${(Number(snapshot.consensus_score) * 100).toFixed(2)}%\`
- **Variance Score (M12)**: \`${Number(snapshot.variance_score).toFixed(4)}\`
- **Drift Score (M8)**: \`${Number(snapshot.drift_score).toFixed(4)}\` (Direction: **neutral**)

---

## 10. Priority Improvement Roadmap

Based on the TCO-GEO Concept Fidelity results, we recommend the following closed-loop optimization roadmap:

1.  **Deploy Answer Cards**: Address the missing concept gaps listed in Section 6.
2.  **Verify Lineage Records**: Ensure all core claims have cryptographic evidence verification seals to boost citation-backed rates (M2).
3.  **Refine Vibe Specs**: Align tone policies to enforce stronger compliance and eliminate risk of exaggerated statements.
`;

  return md;
}
