import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

export const maxDuration = 30;

/**
 * GET /api/pipeline/signals?workspaceId=xxx&domainKey=yyy
 * 
 * 수집된 시그널 목록을 소스별 그룹핑하여 반환합니다.
 * Step 2 완료 후 사용자 확인/선택용입니다.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const domainKey = searchParams.get('domainKey');
  const status = searchParams.get('status') || 'mined'; // 기본: mined 상태
  const limit = parseInt(searchParams.get('limit') || '200', 10);

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  let query = supabase
    .from('question_signals')
    .select('id, query, intent, source, status, cps_score, volume, created_at, updated_at, industry_key')
    .eq('workspace_id', workspaceId)
    .order('cps_score', { ascending: false })
    .limit(limit);

  // status 필터: 'all'이면 전체 반환
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // domainKey/industryKey 필터 (선택적)
  if (domainKey) {
    query = query.eq('industry_key', domainKey);
  }

  const { data: signals, error } = await query;

  if (error) {
    console.error('[GET /api/pipeline/signals] DB error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 소스별 그룹핑
  const sourceGroups: Record<string, {
    source: string;
    label: string;
    count: number;
    signals: typeof signals;
  }> = {};

  const SOURCE_LABELS: Record<string, string> = {
    's_ogde': 'S-OGDE (AI 생성)',
    'external_collection': '외부 수집',
    'hub_feedback': 'Hub 피드백',
    'deep_dive_target': '딥다이브 타겟',
    'surface_reversal': 'Surface 역질문',
    'benchmark_opportunity': '벤치마크 기회',
    'report_weak_bdr': '리포트 갭 (BDR)',
    'report_weak_cwr': '리포트 갭 (CWR)',
    'report_prescription': '리포트 처방',
    'manual': '수동 입력',
  };

  for (const signal of (signals || [])) {
    const src = signal.source || 'unknown';
    // deep_dive_gap_xxx, deep_dive_weak_bsf_xxx 등 prefix 매핑
    const srcKey = src.startsWith('deep_dive_gap') ? 'deep_dive_gap'
      : src.startsWith('deep_dive_weak') ? 'deep_dive_weak_bsf'
      : src;

    if (!sourceGroups[srcKey]) {
      sourceGroups[srcKey] = {
        source: srcKey,
        label: SOURCE_LABELS[srcKey] || src,
        count: 0,
        signals: [],
      };
    }
    sourceGroups[srcKey].count++;
    sourceGroups[srcKey].signals!.push(signal);
  }

  const groups = Object.values(sourceGroups).sort((a, b) => b.count - a.count);
  const totalCount = (signals || []).length;

  return NextResponse.json({
    totalCount,
    groups,
    // 편의용: flat 배열도 반환
    signals: signals || [],
  });
}
