import { EmergenceSignal } from "../../schema";
import { SignalCollector } from "../types";

export class CommunityCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    const targetIndustry = industry ?? "beauty";

    const communityData: Record<string, Array<{ text: string; channel: string; sentiment: string; impact: "low" | "medium" | "high" | "critical" }>> = {
      beauty: [
        {
          text: "화장품 커뮤니티 파우더룸 분석: '레티놀 크림 바르고 피부 붉어짐 현상 발생했을 때 바로 냉찜질 해야 하나요, 아니면 보습제만 바르나요?' 질문 게시물 조횟수 및 댓글 200개 이상 누적.",
          channel: "파우더룸 (Powderroom)",
          sentiment: "negative_anxious",
          impact: "high",
        }
      ],
      wedding: [
        {
          text: "결혼 준비 대표 카페 메이크마이웨딩 분석: '예비부부들이 웨딩 플래너 업체 고를 때 보증보험 가입 여부를 가장 중요하게 본다'는 경험 공유 글이 베스트 랭킹 등극.",
          channel: "메이크마이웨딩 (Makemywedding)",
          sentiment: "positive_cautionary",
          impact: "medium",
        }
      ],
      clinic: [
        {
          text: "여성 뷰티 커뮤니티 분석: '기미 레이저 토닝 10회 패키지 끊었는데, 3회차부터 색소 침착 더 진해진 것 같아요. 부작용인가요?' 고민 상담 및 환불 요구 글 급증.",
          channel: "여성동아 / 맘카페",
          sentiment: "negative_alarmed",
          impact: "high",
        }
      ]
    };

    const items = communityData[targetIndustry] || [
      {
        text: `온라인 커뮤니티 종합 분석: ${targetIndustry} 업종 서비스 이용 전 '실제 사용자 내돈내산 부작용 솔직 후기'를 꼼꼼히 탐색하는 경향성이 뚜렷해짐.`,
        channel: "디시인사이드 / 네이버카페",
        sentiment: "neutral_skeptical",
        impact: "medium",
      }
    ];

    return items.map((item) => ({
      workspace_id: workspaceId || null,
      source_type: "community",
      industry: targetIndustry,
      raw_text: item.text,
      source_url: null,
      ai_analysis: {
        source_channel: item.channel,
        user_sentiment: item.sentiment,
        urgency_rating: "high",
      },
      predicted_impact: item.impact,
      status: "new",
    }));
  }
}
