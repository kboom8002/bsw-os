import { getSupabaseAdminClient } from "../supabase";
import { AiprEngine } from "./aipr";
import { INDUSTRY_PANELS_DATA } from "../../db/seed/industry-panels/questions-data";

export class KaiviEngine {
  private aiprEngine: AiprEngine;

  constructor() {
    this.aiprEngine = new AiprEngine();
  }

  /**
   * Computes Korea AI Visibility Index (KAIVI) combining top industry averages and MRI scores.
   * KAIVI = Avg(BAIR of top brands) * Avg(Meaning Readiness Index)
   */
  public async computeKAIVI(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch Meaning Readiness Index (MRI) scores from workspaces
    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id, name");

    let mriAverage = 0.82; // Default 82% semantic readiness
    if (workspaces && workspaces.length > 0) {
      // In production, queries brand_operational_truths and calculates verification ratios
      const { data: claims } = await supabase
        .from("brand_operational_truths")
        .select("review_status");

      if (claims && claims.length > 0) {
        const approved = claims.filter(c => c.review_status === "approved" || c.review_status === "verified").length;
        mriAverage = Number((approved / claims.length).toFixed(2));
      }
    }

    // 2. Fetch BAIR averages across key industries dynamically
    const { data: panels } = await supabase
      .from("probe_panels")
      .select("industry")
      .eq("workspace_id", workspaceId);

    const uniqueIndustries = [...new Set((panels ?? []).map(p => p.industry).filter(Boolean))];
    const industries = uniqueIndustries.length > 0
      ? uniqueIndustries
      : Object.keys(INDUSTRY_PANELS_DATA);

    let bairSum = 0;

    for (const ind of industries) {
      // Discover actual brand from panel metadata
      const { data: indPanel } = await supabase
        .from("probe_panels")
        .select("panel_name")
        .eq("workspace_id", workspaceId)
        .eq("industry", ind)
        .limit(1)
        .maybeSingle();

      const brand = indPanel?.panel_name?.match(/^\[(.+?)\]/)?.[1] ?? "DefaultBrand";
      const aipr = await this.aiprEngine.computeAIPR(workspaceId, ind, brand, ["경쟁사A", "경쟁사B", "경쟁사C"]);
      const topScore = aipr[0]?.bairScore ?? 70.0;
      bairSum += topScore;
    }

    const bairAverage = bairSum / industries.length;

    // KAIVI = Avg(BAIR) * Avg(MRI)
    const kaivi = Number((bairAverage * mriAverage).toFixed(2));

    return Math.max(0, Math.min(100, kaivi));
  }
}
