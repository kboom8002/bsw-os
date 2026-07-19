/**
 * app/actions/sales-automation.ts
 *
 * "use server"
 * 세일즈 자동화 및 영업 타깃 매칭을 처리하는 백엔드 서버 액션 모듈
 */

'use server';

import { getSupabaseAdminClient } from '../../lib/supabase';
import { requireAuthOrDemo } from '../../lib/auth';
import { PortalGapAggregator } from '../../lib/sales-automation/portal-gap-aggregator';
import { BusinessQuestionMatcher } from '../../lib/sales-automation/business-question-matcher';
import { OutreachMessageGenerator } from '../../lib/sales-automation/outreach-message-generator';
import type { SalesTarget, PortalGapReport } from '../../lib/sales-automation/types';

/**
 * 1. 포털 수준 갭 리포트 생성 및 저장
 */
export async function generatePortalGapReport(
  workspaceId: string,
  domainId: string | undefined,
  period: string
): Promise<PortalGapReport> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  // 라이브러리를 통해 리포트 데이터 조립
  const report = await PortalGapAggregator.aggregateGaps(workspaceId, domainId, period);

  try {
    const { data, error } = await supabase
      .from('portal_gap_reports')
      .insert({
        workspace_id: workspaceId,
        domain_id: domainId || null,
        report_period: period,
        total_demand_questions: report.total_demand_questions,
        answered_questions: report.answered_questions,
        coverage_score: report.coverage_score,
        gap_summary: report.gap_summary,
        trending_questions: report.trending_questions,
        underserved_segments: report.underserved_segments
      })
      .select('*')
      .single();

    if (!error && data) {
      return data as PortalGapReport;
    }
  } catch (err) {
    console.warn('[Server Action generatePortalGapReport] DB insert 실패, 로컬 메모리 값 반환:', err);
  }

  return report;
}

/**
 * 2. 영업 대상 업체 매칭 및 적합 상품 도출
 */
export async function matchSalesTargets(
  workspaceId: string,
  reportId: string | undefined,
  businesses: Array<{ name: string; address?: string; type?: string; attributes: any }>
): Promise<SalesTarget[]> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  // 1. 기준이 되는 갭 리포트 데이터 조회 (없으면 모의 리포트 사용)
  let gapSummary: Record<string, number> = { missing_attractor: 8, weak_attractor: 4 };
  if (reportId) {
    try {
      const { data } = await supabase
        .from('portal_gap_reports')
        .select('gap_summary')
        .eq('id', reportId)
        .single();
      if (data?.gap_summary) gapSummary = data.gap_summary;
    } catch (e) {}
  }

  const results: SalesTarget[] = [];

  for (const biz of businesses) {
    const match = BusinessQuestionMatcher.matchBusinessToGaps(biz.attributes, gapSummary);
    
    const target: SalesTarget = {
      workspace_id: workspaceId,
      portal_gap_report_id: reportId,
      business_name: biz.name,
      business_address: biz.address || '제주시 애월읍',
      business_type: (biz.type as any) || 'restaurant_cafe',
      business_attributes: biz.attributes,
      matched_gap_types: match.matched_gap_types,
      matched_attractors: match.matched_attractors,
      match_score: match.match_score,
      recommended_product: match.recommended_product,
      recommended_tier: match.recommended_tier,
      outreach_status: 'pending'
    };

    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .insert({
          workspace_id: workspaceId,
          portal_gap_report_id: reportId || null,
          business_name: target.business_name,
          business_address: target.business_address,
          business_type: target.business_type,
          business_attributes: target.business_attributes,
          matched_gap_types: target.matched_gap_types,
          matched_attractors: target.matched_attractors,
          match_score: target.match_score,
          recommended_product: target.recommended_product,
          recommended_tier: target.recommended_tier,
          outreach_status: 'pending'
        })
        .select('*')
        .single();

      if (!error && data) {
        results.push(data as SalesTarget);
        continue;
      }
    } catch (e) {}

    // DB 실패 시 가상 ID 부여 후 메모리 저장
    target.id = `temp-target-${Math.random().toString(36).substr(2, 9)}`;
    results.push(target);
  }

  return results;
}

/**
 * 3. 영업 제안 메시지 자동 생성 및 저장
 */
export async function generateOutreachMessage(
  workspaceId: string,
  targetId: string
): Promise<string> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  // 1. 타깃 업체 정보 조회
  let target: SalesTarget | null = null;
  let trendingQuestions: any[] = [];

  try {
    const { data, error } = await supabase
      .from('sales_targets')
      .select('*, portal_gap_reports(trending_questions)')
      .eq('id', targetId)
      .single();

    if (!error && data) {
      target = data as any;
      trendingQuestions = (data.portal_gap_reports as any)?.trending_questions || [];
    }
  } catch (e) {}

  // DB 갭 우회 시 Mock 데이터 활용
  if (!target) {
    target = {
      workspace_id: workspaceId,
      business_name: '애월 한라 감성 카페',
      business_type: 'restaurant_cafe',
      business_attributes: { parking: true, indoor_seats: true, wheelchair_access: true, kids_menu: false, pet_allowed: false, foreign_language_menu: [] },
      matched_gap_types: ['missing_attractor.weather.rain'],
      matched_attractors: ['attractor.resto.rainy_day_visit'],
      match_score: 75,
      recommended_product: 'Rainy-Day AI홈피 Pack',
      recommended_tier: 'pro',
      outreach_status: 'pending'
    };
    trendingQuestions = [{ query: '비 오는 날 애월 주차 편한 카페' }];
  }

  // 2. 메시지 생성
  const message = await OutreachMessageGenerator.generate(
    target.business_name,
    target.business_type || 'restaurant_cafe',
    target.business_attributes,
    {
      matched_gap_types: target.matched_gap_types,
      matched_attractors: target.matched_attractors,
      match_score: target.match_score,
      recommended_product: target.recommended_product,
      recommended_tier: target.recommended_tier
    },
    trendingQuestions,
    '제주 애월읍' // 지역 맥락 강화
  );

  // 3. 생성된 메시지 저장
  try {
    await supabase
      .from('sales_targets')
      .update({ outreach_message: message, updated_at: new Date().toISOString() })
      .eq('id', targetId);
  } catch (e) {}

  return message;
}

/**
 * 4. 영업 진행 상태 변경
 */
export async function updateOutreachStatus(
  workspaceId: string,
  targetId: string,
  status: 'pending' | 'contacted' | 'interested' | 'converted' | 'declined'
): Promise<boolean> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('sales_targets')
      .update({ outreach_status: status, updated_at: new Date().toISOString() })
      .eq('id', targetId);

    if (!error) return true;
  } catch (e) {}

  return false;
}

/**
 * 5. 세일즈 대시보드 8개 지표 데이터 조회
 */
export async function getSalesDashboardData(
  workspaceId: string,
  reportId: string | undefined
): Promise<any> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  let report: PortalGapReport | null = null;

  if (reportId) {
    try {
      const { data } = await supabase
        .from('portal_gap_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      if (data) report = data as PortalGapReport;
    } catch (e) {}
  }

  // 리포트가 없으면 기본 모의 리포트 조립
  if (!report) {
    const { PortalGapAggregator } = await import('../../lib/sales-automation/portal-gap-aggregator');
    report = await PortalGapAggregator.aggregateGaps(workspaceId, undefined, '2026-07');
  }

  // 추천 후보 조회 (테이블 존재 시 조회, 미존재 시 모의)
  let targets: SalesTarget[] = [];
  try {
    const { data } = await supabase
      .from('sales_targets')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(10);
    if (data && data.length > 0) {
      targets = data as SalesTarget[];
    }
  } catch (e) {}

  if (targets.length === 0) {
    targets = [
      {
        id: 'target-1',
        workspace_id: workspaceId,
        business_name: '애월 선셋 브런치 카페',
        business_type: 'restaurant_cafe',
        business_attributes: { parking: true, indoor_seats: true, wheelchair_access: true, kids_menu: true, pet_allowed: false, foreign_language_menu: ['en'] },
        matched_gap_types: ['missing_attractor.access.parking', 'missing_attractor.weather.rain', 'conversion_gap.companion.foreigner'],
        matched_attractors: ['attractor.resto.parking_convenience', 'attractor.resto.rainy_day_visit', 'attractor.resto.foreigner_friendly'],
        match_score: 95,
        recommended_product: 'Foreigner-Friendly Page Pack',
        recommended_tier: 'premium',
        outreach_status: 'pending'
      },
      {
        id: 'target-2',
        workspace_id: workspaceId,
        business_name: '제주 하버 뷰 풀빌라',
        business_type: 'accommodation',
        business_attributes: { parking: true, indoor_seats: true, wheelchair_access: false, kids_menu: true, pet_allowed: true, foreign_language_menu: [] },
        matched_gap_types: ['missing_attractor.companion.child'],
        matched_attractors: ['attractor.stay.family_child'],
        match_score: 60,
        recommended_product: 'Family-Friendly Attractor Pack',
        recommended_tier: 'pro',
        outreach_status: 'contacted'
      }
    ];
  }

  return {
    trendingQuestions: report.trending_questions,        // 1. 수요 증가 질문
    questionScores: report.trending_questions.map(q => ({ query: q.query, qvs: q.qvs_score, cps: q.cps_score })), // 2. QVS/CPS 점수
    answerableBusinessCount: targets.length,             // 3. 답변 가능 업체 수
    missingFields: report.underserved_segments,          // 4. 부족한 정보 필드
    recommendedBusinesses: targets,                       // 5. 추천 업체 후보
    readinessDistribution: {                             // 6. AI홈피 준비도 분포
      high: targets.filter(t => t.match_score >= 80).length,
      medium: targets.filter(t => t.match_score < 80 && t.match_score >= 50).length,
      low: targets.filter(t => t.match_score < 50).length
    },
    recommendedProducts: report.underserved_segments.map(s => ({ product: s.recommended_product, gap_count: s.gap_count })), // 7. 제안 상품
    estimatedCTAs: {                                     // 8. 예상 CTA 전환 리프트
      map_clicks: Math.round(report.total_demand_questions * 150),
      calls: Math.round(report.total_demand_questions * 45),
      saves: Math.round(report.total_demand_questions * 80)
    }
  };
}
