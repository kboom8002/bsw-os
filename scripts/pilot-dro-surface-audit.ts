import { runFullSiteAudit } from "../app/actions/site-audit";
import * as fs from "fs";
import * as path from "path";

// Built-in .env parser to avoid external dependency
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    env.split("\n").forEach(line => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
        if (key && !key.startsWith("#")) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (_) {}

async function runPilot() {
  const workspaceId = "pilot-workspace-dro-101";
  const websiteUrl = "https://droanswer.com";
  const brandName = "Dr.O";
  const competitors = ["닥터자르트", "CNP", "라운드랩"];

  console.log("======================================================================");
  console.log("             BSW-OS AEO/GEO Surface Auditor - E2E Pilot");
  console.log(`             Target: ${brandName} (${websiteUrl})`);
  console.log("======================================================================");
  console.log(`[Pilot] AI Provider Mode: ${process.env.AI_PROVIDER_MODE || "mock"}`);
  console.log("[Pilot] Initializing pipeline execution...");

  const startTime = Date.now();
  const result = await runFullSiteAudit(workspaceId, websiteUrl, brandName, competitors);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n[Pilot] Pipeline completed in ${elapsed}s!`);
  console.log("========================= AUDIT METRICS REPORT =======================");
  
  if (result.snapshot) {
    console.log(`\n📈 [AEPI Composite Score] : ${result.snapshot.aepi_score} pt`);
    console.log(`   - Technical Modifier   : ${result.snapshot.tech_mod_score}%`);
    console.log(`   - E-E-A-T Modifier     : ${result.snapshot.eeat_mod_score}%`);
    
    console.log("\n📊 [7-Dimension Entity Reflection Rate (ERR)]");
    console.log(`   - Factoid (사실형)    : ${result.snapshot.err_factoid}%`);
    console.log(`   - Procedural (절차형) : ${result.snapshot.err_procedural}%`);
    console.log(`   - Comparative (비교형): ${result.snapshot.err_comparative}%`);
    console.log(`   - Authority (권위성)  : ${result.snapshot.err_authority}%`);
    console.log(`   - Schema (구조화)     : ${result.snapshot.err_schema}%`);
    console.log(`   - Topical (주제성)    : ${result.snapshot.err_topical}%`);
    console.log(`   - Geo (지역성)        : ${result.snapshot.err_geo}%`);
  }

  console.log(`\n📁 [Knowledge Assets Extracted]`);
  console.log(`   - Total Entities      : ${result.entities.length} items`);
  console.log(`   - Reverse Answer Cards: ${result.cards.length} cards`);

  if (result.observedPersona) {
    console.log(`\n👤 [AI Brand Persona Matching]`);
    console.log(`   - Category Placement  : ${result.observedPersona.category_placement}`);
    console.log(`   - Observed Tone Vector:`);
    console.log(`     * Warmth (친근함)   : ${result.observedPersona.tone_warmth}`);
    console.log(`     * Formality (격식)  : ${result.observedPersona.tone_formality}`);
    console.log(`     * Confidence (확신) : ${result.observedPersona.tone_confidence}`);
    console.log(`     * Expertise (전문성): ${result.observedPersona.tone_expertise}`);
    console.log(`     * Empathy (공감)    : ${result.observedPersona.tone_empathy}`);
    console.log(`   - Intended Spec Match : ${result.observedPersona.persona_alignment_score}%`);
  }

  const green = result.gaps.filter(g => g.quadrant === "green").length;
  const yellow = result.gaps.filter(g => g.quadrant === "yellow").length;
  const red = result.gaps.filter(g => g.quadrant === "red").length;
  const white = result.gaps.filter(g => g.quadrant === "white").length;

  console.log(`\n🧩 [4-Quadrant Asset Matrix Summary]`);
  console.log(`   - Green  (Keep/Monitor) : ${green} items`);
  console.log(`   - Yellow (AEO Fixes)    : ${yellow} items`);
  console.log(`   - Red    (Content Gaps) : ${red} items`);
  console.log(`   - White  (Opportunities): ${white} items`);

  console.log("\n💊 [Priority Prescriptions Checklist]");
  const actionable = result.gaps
    .filter(g => g.prescription_type)
    .sort((a, b) => b.priority_score - a.priority_score);

  actionable.forEach((item, idx) => {
    console.log(`   ${idx + 1}. [Priority ${item.priority_score}pt] (+${item.estimated_aepi_impact}pt AEPI)`);
    console.log(`      * Type  : ${item.prescription_type}`);
    console.log(`      * Entity: ${item.entity_name}`);
    console.log(`      * Action: ${item.prescription_detail}`);
  });

  console.log("======================================================================");
}

runPilot().catch(err => {
  console.error("Pilot execution failed:", err);
});
