/**
 * lib/regional-report/types.ts
 *
 * 지자체 및 협회 전용 지역 리포트 시스템 공용 인터페이스 정의
 */

export type RegionalReportType = 
  | 'monthly_question_intelligence' // 월간 질문 인텔리전스
  | 'accessibility_gap'             // 접근성 정보 갭
  | 'foreign_tourist_question'      // 외국인 관광 질문 (영문 우선)
  | 'smb_ai_transition';            // 소상공인 AI 전환

export interface RegionalReportData {
  id: string;
  workspace_id: string;
  report_type: RegionalReportType;
  report_title: string;
  report_period: string;             // e.g. "2026-07"
  region_name: string;               // e.g. "제주 애월읍"
  
  // 섹션 1: 상위 질문 100개 요약
  top_questions: Array<{
    rank: number;
    query: string;
    qvs_score: number;
    cps_score: number;
    volume_estimate: number;
    growth_rate: number;
    coverage: 'answered' | 'partial' | 'unanswered';
  }>;

  // 섹션 2: 카테고리별 수요 변화
  category_trends: Array<{
    category: string;                // e.g. "rain", "elderly", "kids", "foreigner"
    current_volume: number;
    previous_volume: number;
    change_rate: number;
    top_query: string;
  }>;

  // 섹션 3: 답변 커버리지 요약
  coverage_summary: {
    total_queries: number;
    answered_count: number;
    partial_count: number;
    unanswered_count: number;
    coverage_score: number;          // 백분율 (%)
  };

  // 섹션 4: 하위 업종별 기회 요인
  industry_opportunities: Array<{
    industry: string;                // restaurant_cafe | accommodation | etc.
    gap_count: number;
    opportunity_score: number;
    recommended_action: string;
  }>;

  // 섹션 5: AI 분석 총평 및 정책 제언
  executive_summary: string;
  policy_recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    expected_impact: string;
  }>;

  shared_token?: string;             // 인증 없는 공개 공유용 해시 토큰
  created_at?: string;
}
