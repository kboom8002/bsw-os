import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";

export class NewsCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";

    const newsData: Record<string, Array<{ text: string; url: string; impact: "low" | "medium" | "high" | "critical" }>> = {
      beauty: [
        {
          text: "식품의약품안전처, 민감성 피부 대상 저자극 레티놀 고농도 함량 신물질 특허 승인 발표. 관련 기능성 화장품 제조 기술 급물살 전망.",
          url: "https://news.example.com/beauty/retinol-patent-approval",
          impact: "high",
        },
        {
          text: "환절기 급격한 온도 변화로 인한 피부 장벽 무너짐 증상 호소 환자 급증. 더마 코스메틱 세라마이드 크림 수요 및 매출 40% 증가.",
          url: "https://news.example.com/beauty/seasonal-skin-barrier",
          impact: "medium",
        }
      ],
      wedding: [
        {
          text: "2026년 웨딩홀 당일 계약 취소 시 위약금 반환 분쟁 급증. 공정거래위원회, 예식업 표준약관 개정 추진 및 현장 실태 조사 착수.",
          url: "https://news.example.com/wedding/hall-contract-dispute",
          impact: "critical",
        }
      ],
      clinic: [
        {
          text: "비침습적 리프팅 시술 후 볼꺼짐 부작용 호소 사례 증가. 피부과 의료 분쟁 조율 가이드라인 배포 및 부작용 예방 시술법 관심 집중.",
          url: "https://news.example.com/clinic/lifting-side-effect",
          impact: "high",
        }
      ],
      restaurant: [
        {
          text: "외식 원가 급등에 따른 프랜차이즈 메뉴 가격 인상 러시. 가성비 세트 메뉴와 쿠폰 활용 꿀팁 공유 확산.",
          url: "https://news.example.com/restaurant/menu-price-inflation",
          impact: "medium",
        }
      ],
      auto: [
        {
          text: "국토교통부, 전기차 화재 방지를 위한 배터리 관리 시스템(BMS) 안전 기준 대폭 강화 입법 예고. 배터리 온도 실시간 감지 의무화.",
          url: "https://news.example.com/auto/electric-vehicle-safety",
          impact: "critical",
        }
      ]
    };

    const items = newsData[targetIndustry] || [
      {
        text: `${targetIndustry} 업종의 최신 기술 트렌드 및 소비자 수요 패턴 변화에 대한 업계 종합 리포트 발표. 신규 고부가 가치 비즈니스 모델 등장 예고.`,
        url: `https://news.example.com/${targetIndustry}/generic-industry-trend`,
        impact: "medium",
      }
    ];

    return items.map((item) => ({
      workspace_id: workspaceId || null,
      source_type: "news",
      industry: targetIndustry,
      raw_text: item.text,
      source_url: item.url,
      ai_analysis: {
        extracted_keywords: ["특허", "트렌드", "시장변화"],
        sentiment: "neutral",
      },
      predicted_impact: item.impact,
      status: "new",
    }));
  }
}
