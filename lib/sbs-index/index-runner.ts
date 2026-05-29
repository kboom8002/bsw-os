import { BairEngine } from "./bair";
import { AiprEngine } from "./aipr";
import { KaiviEngine } from "./kaivi";
import { getSupabaseAdminClient } from "../supabase";
import { IndustryType, INDUSTRY_PANELS_DATA } from "../../db/seed/industry-panels/questions-data";

export interface IndustryAiprResult {
  industry: IndustryType;
  rankings: any[];
}

export interface SbsIndexReport {
  kaivi: number;
  aiti: number;
  industryRankings: IndustryAiprResult[];
  beautyAipr: any[];
  weddingAipr: any[];
  conceptFidelity?: any;
  timestamp: string;
}

export class SbsIndexRunner {
  private bairEngine: BairEngine;
  private aiprEngine: AiprEngine;
  private kaiviEngine: KaiviEngine;

  constructor() {
    this.bairEngine = new BairEngine();
    this.aiprEngine = new AiprEngine();
    this.kaiviEngine = new KaiviEngine();
  }

  /**
   * Dynamically discovers all active brands per industry from probe_panels,
   * then computes AIPR for ALL 10 industries.
   */
  public async generateReport(workspaceId: string): Promise<SbsIndexReport> {
    const supabase = getSupabaseAdminClient();
    const kaivi = await this.kaiviEngine.computeKAIVI(workspaceId);
    const aiti = await this.bairEngine.computeAITI(workspaceId);

    // Fetch the latest concept fidelity snapshot if available
    const { data: latestCfSnap } = await supabase
      .from("concept_fidelity_snapshots")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1);

    const conceptFidelity = latestCfSnap && latestCfSnap.length > 0 ? latestCfSnap[0] : undefined;

    // Dynamically fetch all probe_panels and group by industry
    const { data: panels } = await supabase
      .from("probe_panels")
      .select("industry, panel_name, slug")
      .eq("workspace_id", workspaceId);

    const industriesInUse = new Set<string>();
    if (panels) {
      panels.forEach(p => { if (p.industry) industriesInUse.add(p.industry); });
    }

    // Fallback: use all 10 standard industries if no panels found
    const targetIndustries: string[] = industriesInUse.size > 0
      ? Array.from(industriesInUse)
      : Object.keys(INDUSTRY_PANELS_DATA);

    const industryRankings: IndustryAiprResult[] = [];

    for (const industry of targetIndustries) {
      // Discover brand keywords from panel names
      const industryPanels = panels?.filter(p => p.industry === industry) ?? [];
      const brandKeyword = industryPanels.length > 0
        ? this.extractBrandFromPanelName(industryPanels[0].panel_name)
        : this.getDefaultBrand(industry);
      const competitors = this.getDefaultCompetitors(industry);

      const rankings = await this.aiprEngine.computeAIPR(
        workspaceId, industry, brandKeyword, competitors
      );

      industryRankings.push({ industry: industry as IndustryType, rankings });
    }

    const beautyAipr = industryRankings.find(r => r.industry === "beauty")?.rankings ?? [];
    const weddingAipr = industryRankings.find(r => r.industry === "wedding")?.rankings ?? [];

    return {
      kaivi,
      aiti,
      industryRankings,
      beautyAipr,
      weddingAipr,
      conceptFidelity,
      timestamp: new Date().toISOString()
    };
  }

  private extractBrandFromPanelName(panelName: string): string {
    // Panel name format: "[BrandKeyword] SBS-AIPR-Industry-v1"
    const match = panelName.match(/^\[(.+?)\]/);
    return match ? match[1] : "DefaultBrand";
  }

  private getDefaultBrand(industry: string): string {
    const brandMap: Record<string, string> = {
      beauty: "PureBarrier",
      wedding: "LumiereHall",
    };
    return brandMap[industry] ?? "DefaultBrand";
  }

  private getDefaultCompetitors(industry: string): string[] {
    // Provide 3 placeholder competitors per industry for benchmarking
    const competitorMap: Record<string, string[]> = {
      beauty: ["레티놀랩", "더마뷰티", "민감장벽"],
      wedding: ["아펠가모", "더채플", "베뉴지"],
      clinic: ["경쟁사A-클리닉", "경쟁사B-클리닉", "경쟁사C-클리닉"],
      restaurant: ["경쟁사A-레스토랑", "경쟁사B-레스토랑", "경쟁사C-레스토랑"],
      real_estate: ["경쟁사A-부동산", "경쟁사B-부동산", "경쟁사C-부동산"],
      legal: ["경쟁사A-법률", "경쟁사B-법률", "경쟁사C-법률"],
      education: ["경쟁사A-교육", "경쟁사B-교육", "경쟁사C-교육"],
      travel: ["경쟁사A-여행", "경쟁사B-여행", "경쟁사C-여행"],
      pet: ["경쟁사A-펫", "경쟁사B-펫", "경쟁사C-펫"],
      auto: ["경쟁사A-자동차", "경쟁사B-자동차", "경쟁사C-자동차"],
    };
    return competitorMap[industry] ?? ["경쟁사A", "경쟁사B", "경쟁사C"];
  }
}
