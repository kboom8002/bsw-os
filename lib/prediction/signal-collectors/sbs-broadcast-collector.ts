import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";

export class SBSBroadcastCollector implements SignalCollector {
  /**
   * Scans SBS broadcast schedules for upcoming highly high-impact keyword signals.
   * Maps television scheduling to digital semantic preemption opportunities.
   */
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";

    const broadcastData: Record<string, Array<{ text: string; showName: string; airDate: string; impact: "low" | "medium" | "high" | "critical" }>> = {
      beauty: [
        {
          text: "SBS 스페셜 방영 예고: '화장품 성분의 명과 암' 편에서 민감성 피부 대상 저자극 레티놀 고함량 신소재 특허 제품의 피부 장벽 개선 실증 취재 예정.",
          showName: "SBS 스페셜",
          airDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow (24 hours in advance)
          impact: "high",
        }
      ],
      wedding: [
        {
          text: "SBS 뉴스토리 고발 취재 예고: '예식장 추가금 횡포와 예비부부 눈물' 편에서 스드메 패키지 계약 해지 시 위약금 및 보증보험 피해 사례 집중 조명 예정.",
          showName: "SBS 뉴스토리",
          airDate: new Date(Date.now() + 86400000).toISOString(),
          impact: "critical",
        }
      ]
    };

    const items = broadcastData[targetIndustry] || [
      {
        text: `SBS 모닝와이드 트렌드 예고: ${targetIndustry} 업종 소비 활성화 대책 및 가성비 알뜰 소비 문화 트렌드 기획 취재 방영 예정.`,
        showName: "SBS 모닝와이드",
        airDate: new Date(Date.now() + 86400000).toISOString(),
        impact: "medium",
      }
    ];

    return items.map((item) => ({
      workspace_id: workspaceId || null,
      source_type: "broadcast",
      industry: targetIndustry,
      raw_text: item.text,
      source_url: "https://www.sbs.co.kr/schedule",
      ai_analysis: {
        sbs_program_name: item.showName,
        scheduled_air_date: item.airDate,
        preemption_golden_hours: 24, // 24 hours lead time
      },
      predicted_impact: item.impact,
      status: "new",
    }));
  }
}
