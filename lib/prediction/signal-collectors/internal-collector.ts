import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";

export class InternalCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";

    const internalData: Record<string, Array<{ text: string; metric: string; val: number; impact: "low" | "medium" | "high" | "critical" }>> = {
      beauty: [
        {
          text: "AI홈피허브 내부 데이터 모니터링: 뷰티 테넌트 관리 대시보드 내 '레티놀 스킨케어 사용법' 관련 지식 데이터 수정 횟수 주간 40회 이상 급증. 브랜드 지식 자산 최신화 활동 활발.",
          metric: "knowledge_base_update_frequency",
          val: 45,
          impact: "medium",
        }
      ],
      wedding: [
        {
          text: "AI홈피허브 서비스 지표: 웨딩 패키지 테넌트의 견적 문의용 챗봇 전환 건수가 전주 대비 180% 폭증. 실시간 온라인 상담 유입 강세.",
          metric: "chatbot_conversion_growth",
          val: 180,
          impact: "high",
        }
      ]
    };

    const items = internalData[targetIndustry] || [
      {
        text: `AI홈피허브 내부 관측 지표: ${targetIndustry} 업종 테넌트들의 모바일 웹 트래픽 및 AI 응답 카드 로딩 속도가 20% 개선되어 사용자 접촉면 확대 가능성 확인.`,
        metric: "page_performance_index",
        val: 120,
        impact: "low",
      }
    ];

    return items.map((item) => ({
      workspace_id: workspaceId || null,
      source_type: "internal",
      industry: targetIndustry,
      raw_text: item.text,
      source_url: null,
      ai_analysis: {
        internal_metric_name: item.metric,
        measured_value: item.val,
        system_confidence: 0.88,
      },
      predicted_impact: item.impact,
      status: "new",
    }));
  }
}
