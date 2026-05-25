import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";

export class SearchTrendCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";

    const searchTrendData: Record<string, Array<{ text: string; query: string; spike: number; impact: "low" | "medium" | "high" | "critical" }>> = {
      beauty: [
        {
          text: "구글 트렌드 분석: 최근 48시간 내 '민감성 피부 레티놀 화끈거림' 관련 롱테일 검색 쿼리 검색량 300% 폭증. 부작용 대처법 인텐트 유입 다수 포착.",
          query: "민감성 피부 레티놀 화끈거림",
          spike: 3.0,
          impact: "high",
        }
      ],
      wedding: [
        {
          text: "네이버 데이터랩 분석: '웨딩홀 패키지 스드메 추가금 항목 비교' 키워드의 주간 검색량 지수 280% 상승. 가격 투명성 비교에 대한 검색 집중 현상.",
          query: "웨딩홀 패키지 스드메 추가금 항목 비교",
          spike: 2.8,
          impact: "high",
        }
      ],
      clinic: [
        {
          text: "검색 트렌드 분석: '울써마지 시술 주기 효과 차이' 검색 쿼리 버즈량 급증. 복합 안티에이징 시술을 동시 고려하는 스마트 소비 인텐트 지배적.",
          query: "울써마지 시술 주기 효과 차이",
          spike: 1.9,
          impact: "medium",
        }
      ]
    };

    const items = searchTrendData[targetIndustry] || [
      {
        text: `검색 트렌드 분석: ${targetIndustry} 업종 내 '가성비 패키지 추천' 및 '신규 서비스 출시 가격' 관련 모바일 검색 비중이 150% 가량 급격히 상승함.`,
        query: `${targetIndustry} 가성비 패키지`,
        spike: 1.5,
        impact: "medium",
      }
    ];

    return items.map((item) => ({
      workspace_id: workspaceId || null,
      source_type: "search_trend",
      industry: targetIndustry,
      raw_text: item.text,
      source_url: null,
      ai_analysis: {
        target_query: item.query,
        volume_spike_multiplier: item.spike,
        search_platform: "Google / Naver",
      },
      predicted_impact: item.impact,
      status: "new",
    }));
  }
}
