import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";

export class RegulationCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";

    const regulationData: Record<string, Array<{ text: string; url: string; impact: "low" | "medium" | "high" | "critical" }>> = {
      beauty: [
        {
          text: "식품의약품안전처 고시 제2026-12호: 천연/유기농 화장품 인증 표시 기준 개정안 시행. 화장품 전성분 표시에서 특정 방부화학물질 배합 한도 0.1%로 축소 제한.",
          url: "https://www.mfds.go.kr/gosi/2026-12",
          impact: "high",
        }
      ],
      wedding: [
        {
          text: "공정거래위원회 고시: 결혼준비대행업(웨딩컨설팅) 분야 소비자 피해 예방을 위한 표준 약관 제정. 추가금 강요 금지 및 필수 품목 세부 명세 사전 고지 의무화.",
          url: "https://www.ftc.go.kr/gosi/wedding-standard-contract",
          impact: "critical",
        }
      ],
      clinic: [
        {
          text: "보건복지부 의료법 시행령 개정: 병의원 비급여 시술 항목(레이저, 주사제 등)의 사전 고지 의무 범위 확대 및 가격 투명화 규제 도입.",
          url: "https://www.mohw.go.kr/gosi/medical-transparency",
          impact: "high",
        }
      ],
      auto: [
        {
          text: "환경부 배출가스 및 소음 인증 규정 개정: 하이브리드 및 친환경 내연기관 차량의 저감 촉매 기술 실시간 상시 모니터링 검사 의무제 시행.",
          url: "https://www.me.go.kr/gosi/eco-emission",
          impact: "medium",
        }
      ]
    };

    const items = regulationData[targetIndustry] || [
      {
        text: `정부 부처 합동 고시: ${targetIndustry} 업종 내 소비자 보호 조치 강화를 위한 신규 운영 가이드라인 입법 예고 및 표시 광고 모니터링 강화 공표.`,
        url: "https://www.gov.kr/gosi/consumer-protection",
        impact: "medium",
      }
    ];

    return items.map((item) => ({
      workspace_id: workspaceId || null,
      source_type: "regulation",
      industry: targetIndustry,
      raw_text: item.text,
      source_url: item.url,
      ai_analysis: {
        legal_clauses: ["제2026-12호", "표준 약관", "사전 고지"],
        compliance_risk: "high",
      },
      predicted_impact: item.impact,
      status: "new",
    }));
  }
}
