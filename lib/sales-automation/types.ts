/**
 * lib/sales-automation/types.ts
 *
 * 세일즈 자동화 및 포털 갭 분석 시스템 전용 공용 인터페이스 정의
 */

export interface PortalGapReport {
  id?: string;
  workspace_id: string;
  domain_id?: string;
  report_period: string;
  total_demand_questions: number;
  answered_questions: number;
  coverage_score: number;
  gap_summary: Record<string, number>;
  trending_questions: TrendingQuestion[];
  underserved_segments: UnderservedSegment[];
  created_at?: string;
}

export interface TrendingQuestion {
  query: string;
  intent: 'informational' | 'navigational' | 'transactional' | 'local' | 'comparison' | 'risk';
  qvs_score: number;
  cps_score: number;
  growth_rate: number; // 전월 대비 증가율 (%)
  coverage_status: 'answered' | 'partial' | 'unanswered';
  answered_count: number;
  total_demand: number;
}

export interface UnderservedSegment {
  segment: string;        // e.g. "access.parking", "companion.foreigner"
  gap_count: number;      // 미해결 업체수
  opportunity_score: number; // 영업 매칭 기회지수 (수요량 × 미보유 업체비율)
  recommended_product: string;
}

export interface BusinessAttributes {
  parking: boolean;
  indoor_seats: boolean;
  wheelchair_access: boolean;
  kids_menu: boolean;
  pet_allowed: boolean;
  foreign_language_menu: string[];
}

export interface BusinessMatchResult {
  matched_gap_types: string[];  // e.g. ["missing_attractor", "conversion_gap"]
  matched_attractors: string[]; // e.g. ["attractor.resto.rainy_day_visit"]
  match_score: number;
  recommended_product: string;
  recommended_tier: 'basic' | 'pro' | 'premium';
}

export interface SalesTarget {
  id?: string;
  workspace_id: string;
  portal_gap_report_id?: string;
  business_name: string;
  business_address?: string;
  business_type?: 'restaurant_cafe' | 'accommodation' | 'experience' | 'wellness_kbeauty';
  business_attributes: BusinessAttributes;
  matched_gap_types: string[];
  matched_attractors: string[];
  match_score: number;
  recommended_product: string;
  recommended_tier: 'basic' | 'pro' | 'premium';
  outreach_status: 'pending' | 'contacted' | 'interested' | 'converted' | 'declined';
  outreach_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GapProductMapping {
  id?: string;
  workspace_id?: string;
  gap_pattern: string;
  product_name: string;
  product_slug: string;
  product_description?: string;
  applicable_industries?: string[];
  default_tier?: 'basic' | 'pro' | 'premium';
}
