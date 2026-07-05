"use server";

/**
 * app/actions/pipeline-artifacts.ts
 * 파이프라인 중간/최종 산출물 조회 서버 액션
 */

import { getSupabaseAdminClient } from '@/lib/supabase';
import { resolveWorkspaceSlug } from './workspace';

// ─────────────────────────────────────────────────────────
// 탭1: 외부 시그널
// ─────────────────────────────────────────────────────────
export async function getExternalSignalsAction(
  workspaceSlug: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: { sourceType?: string; isConverted?: boolean }
) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return { data: [], total: 0 };

  const supabase = getSupabaseAdminClient();
  let q = supabase
    .from('external_signals')
    .select('id, source_type, content, url, published_at, collected_at, is_converted, metadata', { count: 'exact' })
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    .order('collected_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters?.sourceType) q = q.eq('source_type', filters.sourceType);
  if (filters?.isConverted !== undefined) q = q.eq('is_converted', filters.isConverted);

  const { data, count, error } = await q;
  if (error) return { data: [], total: 0 };
  return { data: data || [], total: count || 0 };
}

export async function getSearchTrendsAction(workspaceSlug: string, limit: number = 50) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return [];

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('search_trends')
    .select('*')
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

// ─────────────────────────────────────────────────────────
// 탭2: 질문 시그널
// ─────────────────────────────────────────────────────────
export async function getQuestionSignalsFilteredAction(
  workspaceSlug: string,
  filters?: {
    status?: string;
    gateStatus?: string;
    isYmyl?: boolean;
    minCps?: number;
    searchQuery?: string;
  },
  page: number = 1,
  pageSize: number = 30
) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return { data: [], total: 0 };

  const supabase = getSupabaseAdminClient();
  let q = supabase
    .from('question_signals')
    .select(
      'id, query, volume, intent, status, source_type, cps_score, qvs_total, gate_status, eval_confidence, is_ymyl, panel_layer, created_at',
      { count: 'exact' }
    )
    .eq('workspace_id', workspaceId)
    .order('cps_score', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.gateStatus) q = q.eq('gate_status', filters.gateStatus);
  if (filters?.isYmyl !== undefined) q = q.eq('is_ymyl', filters.isYmyl);
  if (filters?.minCps !== undefined) q = q.gte('cps_score', filters.minCps);
  if (filters?.searchQuery) q = q.ilike('query', `%${filters.searchQuery}%`);

  const { data, count, error } = await q;
  if (error) return { data: [], total: 0 };
  return { data: data || [], total: count || 0 };
}

// 시그널 통계 요약
export async function getSignalStatsSummaryAction(workspaceSlug: string) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return null;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('question_signals')
    .select('status, gate_status, is_ymyl')
    .eq('workspace_id', workspaceId);

  if (!data) return null;

  return {
    total: data.length,
    mined: data.filter(d => d.status === 'mined').length,
    promoted: data.filter(d => d.status === 'promoted').length,
    ignored: data.filter(d => d.status === 'ignored').length,
    go: data.filter(d => d.gate_status === 'Go').length,
    watch: data.filter(d => d.gate_status === 'Watch').length,
    noGo: data.filter(d => d.gate_status === 'No-Go').length,
    ymyl: data.filter(d => d.is_ymyl).length,
  };
}

// ─────────────────────────────────────────────────────────
// 탭3: 시그널 클러스터
// ─────────────────────────────────────────────────────────
export async function getSignalClustersAction(workspaceSlug: string, limit: number = 20) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return [];

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('question_clusters')
    .select('id, representative_question, signal_count, dominant_intents, created_at')
    .eq('workspace_id', workspaceId)
    .order('signal_count', { ascending: false })
    .limit(limit);

  return data || [];
}

// ─────────────────────────────────────────────────────────
// 탭4: 정규 질문 (CQ)
// ─────────────────────────────────────────────────────────
export async function getCanonicalQuestionsAction(
  workspaceSlug: string,
  page: number = 1,
  pageSize: number = 20
) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return { data: [], total: 0 };

  const supabase = getSupabaseAdminClient();
  const { data, count, error } = await supabase
    .from('canonical_questions')
    .select(
      'id, normalized_question, primary_intent, risk_level, cps_score, variants, created_at',
      { count: 'exact' }
    )
    .eq('workspace_id', workspaceId)
    .order('cps_score', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return { data: [], total: 0 };
  return { data: data || [], total: count || 0 };
}

// ─────────────────────────────────────────────────────────
// 탭5: QIS Scenes
// ─────────────────────────────────────────────────────────
export async function getQisScenesAction(workspaceSlug: string, limit: number = 20) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return [];

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('qis_scenes')
    .select('id, scene_name, risk_level, readiness_score, must_do, must_not_do, created_at')
    .eq('workspace_id', workspaceId)
    .order('readiness_score', { ascending: false })
    .limit(limit);

  return data || [];
}

// ─────────────────────────────────────────────────────────
// 탭6: 실행 이력 & 공급 패키지
// ─────────────────────────────────────────────────────────
export async function getPipelineRunsAction(
  workspaceSlug: string,
  domainKey?: string,
  limit: number = 20
) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return [];

  const supabase = getSupabaseAdminClient();
  let q = supabase
    .from('pipeline_runs')
    .select('id, pipeline_type, domain_key, brand_slug, status, phase_detail, result_summary, error_message, started_at, completed_at, duration_ms')
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (domainKey) q = q.eq('domain_key', domainKey);

  const { data } = await q;
  return data || [];
}

export async function getSupplyPackagesAction(workspaceSlug: string, domainKey?: string) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return [];

  const supabase = getSupabaseAdminClient();
  let q = supabase
    .from('question_supply_packages')
    .select('id, domain_key, brand_slug, cq_count, status, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (domainKey) q = q.eq('domain_key', domainKey);

  const { data } = await q;
  return data || [];
}

// CSV 내보내기 (질문 시그널)
export async function exportQuestionSignalsCsvAction(workspaceSlug: string): Promise<string> {
  const result = await getQuestionSignalsFilteredAction(workspaceSlug, {}, 1, 1000);
  const rows = result.data;

  const header = 'id,query,volume,intent,status,cps_score,qvs_total,gate_status,is_ymyl,panel_layer,created_at';
  const body = rows.map(r =>
    [r.id, `"${String(r.query || '').replace(/"/g, '""')}"`, r.volume, r.intent, r.status,
      r.cps_score, r.qvs_total, r.gate_status, r.is_ymyl, r.panel_layer, r.created_at].join(',')
  ).join('\n');

  return `${header}\n${body}`;
}

// CSV 내보내기 (정규 질문)
export async function exportCanonicalQuestionsCsvAction(workspaceSlug: string): Promise<string> {
  const result = await getCanonicalQuestionsAction(workspaceSlug, 1, 1000);
  const rows = result.data;

  const header = 'id,normalized_question,primary_intent,risk_level,cps_score,created_at';
  const body = rows.map(r =>
    [r.id, `"${String(r.normalized_question || '').replace(/"/g, '""')}"`,
      r.primary_intent, r.risk_level, r.cps_score, r.created_at].join(',')
  ).join('\n');

  return `${header}\n${body}`;
}

// ─────────────────────────────────────────────────────────
// CSV 내보내기 (QIS Scenes)
// ─────────────────────────────────────────────────────────
export async function exportQisScenesCsvAction(workspaceSlug: string): Promise<string> {
  const scenes = await getQisScenesAction(workspaceSlug, 1000);

  const header = 'id,scene_name,risk_level,readiness_score,must_do,must_not_do,created_at';
  const body = scenes.map(s =>
    [
      s.id,
      `"${String(s.scene_name || '').replace(/"/g, '""')}"`,
      s.risk_level,
      s.readiness_score,
      `"${(s.must_do || []).join('; ').replace(/"/g, '""')}"`,
      `"${(s.must_not_do || []).join('; ').replace(/"/g, '""')}"`,
      s.created_at,
    ].join(',')
  ).join('\n');

  return `${header}\n${body}`;
}

// ─────────────────────────────────────────────────────────
// 공급 패키지 상세 조회 (CQ 목록 포함)
// ─────────────────────────────────────────────────────────
export async function getSupplyPackageDetailAction(
  workspaceSlug: string,
  packageId: string
): Promise<{
  pkg: any;
  questions: Array<{ id: string; normalized_question: string; primary_intent: string; cps_score: number }>;
}> {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return { pkg: null, questions: [] };

  const supabase = getSupabaseAdminClient();

  // 패키지 조회
  const { data: pkg } = await supabase
    .from('question_supply_packages')
    .select('id, domain_key, brand_slug, package_data, cq_count, status, created_at')
    .eq('id', packageId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!pkg) return { pkg: null, questions: [] };

  // package_data에서 cq_ids 추출하여 CQ 상세 조회
  const cqIds: string[] = (pkg.package_data as any)?.cq_ids || [];
  if (cqIds.length === 0) return { pkg, questions: [] };

  const { data: questions } = await supabase
    .from('canonical_questions')
    .select('id, normalized_question, primary_intent, cps_score')
    .in('id', cqIds)
    .eq('workspace_id', workspaceId)
    .order('cps_score', { ascending: false });

  return { pkg, questions: questions || [] };
}

// ─────────────────────────────────────────────────────────
// CQ 포화도 조회 (UI 표시용)
// ─────────────────────────────────────────────────────────
export async function getSaturationStatusAction(
  workspaceSlug: string,
  domainKey: string
): Promise<{
  coveragePercent: number;
  isNearSaturation: boolean;
  cqCount: number;
  estimatedPool: number;
  recommendation?: string;
}> {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return { coveragePercent: 0, isNearSaturation: false, cqCount: 0, estimatedPool: 0 };

  try {
    const { SaturationMonitor } = await import('@/lib/pipeline/saturation-monitor');
    const result = await SaturationMonitor.checkSaturation(workspaceId, domainKey);

    const supabase = getSupabaseAdminClient();
    const { count } = await supabase
      .from('canonical_questions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const { BENCHMARK_DOMAINS } = await import('@/lib/benchmark/domain-config');
    const cfg = BENCHMARK_DOMAINS[domainKey as keyof typeof BENCHMARK_DOMAINS];
    const baseProbes = cfg ? cfg.sampleQuestionsForFull : 50;
    const brandCount = cfg ? cfg.brands.length : 10;
    const estimatedPool = (baseProbes * 2) + (brandCount * 10);

    return {
      ...result,
      cqCount: count ?? 0,
      estimatedPool,
    };
  } catch {
    return { coveragePercent: 0, isNearSaturation: false, cqCount: 0, estimatedPool: 0 };
  }
}

// ─────────────────────────────────────────────────────────
// AI Hub 역방향 피드백 이력 조회 및 수동 수집
// ─────────────────────────────────────────────────────────

export async function getHubFeedbackLogsAction(workspaceSlug: string) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('hub_feedback_logs')
    .select('id, region, feedback_date, source, processed, process_result, created_at')
    .eq('workspace_id', workspaceId)
    .order('feedback_date', { ascending: false })
    .limit(30);

  if (error) {
    console.error('[pipeline-artifacts] getHubFeedbackLogsAction failed:', error.message);
    return [];
  }
  return data || [];
}

export async function triggerManualFeedbackPullAction(workspaceSlug: string, domainKey: string) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) return { ok: false, error: 'Workspace not resolved' };

  try {
    const { QisHubClient } = await import('@/lib/qis/hub-client');
    const { FeedbackProcessor } = await import('@/lib/hub-feedback/feedback-processor');
    const supabase = getSupabaseAdminClient();
    const hubClient = new QisHubClient();

    const DOMAIN_REGION_MAP: Record<string, string> = {
      jeju_smb: 'jeju',
      skincare: 'korea',
    };
    const region = DOMAIN_REGION_MAP[domainKey] || 'jeju';

    // 1. Hub로부터 피드백 조회
    const feedback = await hubClient.pullFeedback(region);
    if (!feedback) {
      return { ok: false, error: 'No feedback data returned from AI Hub' };
    }

    // 2. 로그 테이블에 UPSERT
    const dateStr = feedback.date || new Date().toISOString().split('T')[0];
    const { error: upsertError } = await supabase
      .from('hub_feedback_logs')
      .upsert({
        workspace_id: workspaceId,
        region,
        feedback_date: dateStr,
        source: 'manual_pull',
        payload: feedback,
        processed: false
      }, {
        onConflict: 'workspace_id,region,feedback_date,source'
      });

    if (upsertError) {
      console.warn('[pipeline-artifacts] manual feedback log upsert error:', upsertError.message);
    }

    // 3. 분석 및 환류 실행
    const processResult = await FeedbackProcessor.processIncoming(
      workspaceId,
      feedback,
      domainKey
    );

    return {
      ok: true,
      data: processResult
    };
  } catch (err: any) {
    console.error('[pipeline-artifacts] triggerManualFeedbackPullAction failed:', err);
    return { ok: false, error: err.message };
  }
}


