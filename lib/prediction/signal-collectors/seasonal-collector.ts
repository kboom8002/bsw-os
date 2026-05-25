import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";

export class SeasonalCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";

    const seasonalData: Record<string, Array<{ text: string; event: string; season: string; impact: "low" | "medium" | "high" | "critical" }>> = {
      beauty: [
        {
          text: "환절기 메디컬 캘린더 분석: 5월 중순 초여름 진입에 따른 자외선 지수 급상승 예고. 끈적임 없는 무기자차 선크림 및 선에센스 제형 선호 시즌 진입.",
          event: "초여름 자외선 폭발기",
          season: "summer",
          impact: "medium",
        }
      ],
      wedding: [
        {
          text: "웨딩 산업 시즌 분석: 가을 황금 성수기(9~11월) 결혼식을 목표로 한 상반기(5월) 웨딩홀 잔여 타임 확보 경쟁 및 식대 견적 문의 급증 예상.",
          event: "가을 성수기 예약 러시",
          season: "spring",
          impact: "high",
        }
      ],
      clinic: [
        {
          text: "클리닉 마케팅 캘린더 분석: 여름 휴가철 바디 프로필 및 수영복 시즌 대비 바디 조각술, 지방분해주사 수요 집중 시기 개시.",
          event: "여름 휴가 대비 바디 시술",
          season: "summer",
          impact: "medium",
        }
      ]
    };

    const items = seasonalData[targetIndustry] || [
      {
        text: `시즌성 트렌드 분석: 분기별 ${targetIndustry} 업종의 계절적 교체 주기 및 맞춤형 신상품 패키지 기획 문의가 증가하는 시기 돌입.`,
        event: "정기 분기 프로모션",
        season: "general",
        impact: "low",
      }
    ];

    return items.map((item) => ({
      workspace_id: workspaceId || null,
      source_type: "seasonal",
      industry: targetIndustry,
      raw_text: item.text,
      source_url: null,
      ai_analysis: {
        target_season: item.season,
        associated_event: item.event,
        predictive_confidence: 0.95,
      },
      predicted_impact: item.impact,
      status: "new",
    }));
  }
}
