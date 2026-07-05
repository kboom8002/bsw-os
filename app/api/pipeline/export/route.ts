import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { QisHubClient } from '../../../../lib/qis/hub-client';

export const maxDuration = 30;

const DOMAIN_REGION_MAP: Record<string, string> = {
  jeju_smb: 'jeju',
  skincare: 'korea',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const workspaceSlug = searchParams.get('workspace');
    const domain = searchParams.get('domain');
    const format = searchParams.get('format') || 'json';
    const brand = searchParams.get('brand') || undefined;

    if (!workspaceSlug || !domain) {
      return NextResponse.json(
        { error: 'Missing required query params: workspace, domain' },
        { status: 400 }
      );
    }

    if (format !== 'json' && format !== 'csv') {
      return NextResponse.json(
        { error: 'Invalid format. Supported: json, csv' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Resolve workspace slug → ID
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', workspaceSlug)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: `Workspace not found: ${workspaceSlug}` },
        { status: 404 }
      );
    }

    const workspaceId = workspace.id;

    // Fetch CQs
    const { data: cqs, error: cqError } = await supabase
      .from('canonical_questions')
      .select('id, normalized_question, primary_intent, risk_level, cps_score, metadata')
      .eq('workspace_id', workspaceId)
      .order('cps_score', { ascending: false })
      .limit(500);

    if (cqError) {
      return NextResponse.json(
        { error: `Failed to fetch CQs: ${cqError.message}` },
        { status: 500 }
      );
    }

    // Fetch QIS Scenes
    const { data: scenes, error: sceneError } = await supabase
      .from('qis_scenes')
      .select('id, scene_name, risk_level, readiness_score, must_do, must_not_do')
      .eq('workspace_id', workspaceId)
      .order('readiness_score', { ascending: false })
      .limit(100);

    if (sceneError) {
      return NextResponse.json(
        { error: `Failed to fetch QIS scenes: ${sceneError.message}` },
        { status: 500 }
      );
    }

    const bswQuestions = QisHubClient.mapCQsToBSWQuestions(cqs || [], domain, brand);
    const bswScenes = QisHubClient.mapQISScenesToBSWScenes(scenes || [], domain);
    const region = DOMAIN_REGION_MAP[domain] || process.env.BSW_HUB_REGION || 'jeju';
    const exportedAt = new Date().toISOString();

    if (format === 'csv') {
      const csvHeaders = [
        'id',
        'text',
        'industry_type',
        'source',
        'cps_score',
        'primary_intent',
        'risk_level',
        'brand_slug',
        'search_volume_trend',
      ];

      const csvRows = bswQuestions.map((q) =>
        csvHeaders
          .map((h) => {
            const val = (q as any)[h];
            if (val === undefined || val === null) return '';
            const str = String(val);
            // Escape CSV values containing commas, quotes, or newlines
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      );

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
      const filename = `bsw_export_${domain}_${Date.now()}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON format
    const bundle = {
      version: '2.0',
      source: 'bsw_pipeline_v3',
      domain,
      region,
      exported_at: exportedAt,
      questions: bswQuestions,
      scenes: bswScenes,
      summary: {
        total_questions: bswQuestions.length,
        total_scenes: bswScenes.length,
        risk_distribution: getRiskDistribution(bswQuestions),
      },
    };

    const filename = `bsw_export_${domain}_${Date.now()}.json`;

    return NextResponse.json(bundle, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('[API /pipeline/export] Unhandled error:', err);
    return NextResponse.json(
      { error: err?.message || '파이프라인 데이터 내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getRiskDistribution(
  questions: Array<{ risk_level?: string }>
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const q of questions) {
    const level = q.risk_level || 'unknown';
    dist[level] = (dist[level] || 0) + 1;
  }
  return dist;
}
