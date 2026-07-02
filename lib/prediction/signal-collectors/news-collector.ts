import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";
import { SearchProviderFactory } from "../../ai/search-provider-factory";

export class NewsCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";
    
    try {
      // Use Gemini Grounding (via Google Search) to find real news
      const query = `최신 ${targetIndustry} 업계 뉴스 동향 문제점`;
      const searchRes = await SearchProviderFactory.runMultiEngine(query, ['gemini_grounding']);
      const res = searchRes.results['gemini_grounding'];
      
      if (!res || !res.citations || res.citations.length === 0) {
        throw new Error("No real news citations found");
      }

      // Map citations to signals
      return res.citations.slice(0, 5).map((cit) => ({
        workspace_id: workspaceId || null,
        source_type: "news",
        industry: targetIndustry,
        raw_text: cit.title || res.raw_response_text?.substring(0, 200) || "뉴스 요약",
        source_url: cit.url,
        ai_analysis: {
          extracted_keywords: [targetIndustry, "뉴스", "트렌드"],
          sentiment: "neutral",
        },
        predicted_impact: "medium", // Baseline impact
        status: "new",
      }));

    } catch (e: any) {
      console.warn(`[NewsCollector] Failed to fetch real news for ${targetIndustry}, falling back to static data:`, e.message);
      
      // Fallback
      return [{
        workspace_id: workspaceId || null,
        source_type: "news",
        industry: targetIndustry,
        raw_text: `${targetIndustry} 업종의 최신 기술 트렌드 및 소비자 수요 패턴 변화에 대한 업계 종합 리포트 발표. 신규 고부가 가치 비즈니스 모델 등장 예고.`,
        source_url: `https://news.example.com/${targetIndustry}/generic-industry-trend`,
        ai_analysis: {
          extracted_keywords: ["특허", "트렌드", "시장변화"],
          sentiment: "neutral",
        },
        predicted_impact: "medium",
        status: "new",
      }];
    }
  }
}
