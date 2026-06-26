import { NextRequest, NextResponse } from 'next/server';
import { runBatchAudit } from '../../../actions/industry-benchmark';
import { TemporalTracker } from '../../../../lib/benchmark/temporal-tracker';
import { getReferenceSitesBySubIndustry } from '../../../../lib/industry/reference-sites-registry';

export const maxDuration = 300; // Vercel Pro: 최대 5분

/**
 * GET /api/cron/benchmark-refresh
 *
 * 업종별 레퍼런스 사이트 주간 재감사 → benchmark_snapshots 이력 축적
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [
 *     { "path": "/api/cron/benchmark-refresh", "schedule": "0 18 * * 1" },  // 월 03:00 KST
 *     { "path": "/api/cron/benchmark-refresh?industry=wedding", "schedule": "0 18 * * 2" },
 *     { "path": "/api/cron/benchmark-refresh?industry=medical_clinic", "schedule": "0 18 * * 3" },
 *     { "path": "/api/cron/benchmark-refresh?industry=restaurant_cafe", "schedule": "0 18 * * 4" },
 *     { "path": "/api/cron/benchmark-refresh?industry=hotel", "schedule": "0 18 * * 5" },
 *     { "path": "/api/cron/benchmark-refresh?industry=place_brand", "schedule": "0 18 * * 6" }
 *   ]
 * }
 *
 * Query params:
 *   - industry: subIndustryKey (없으면 요일 기반 자동 결정)
 *   - mode: 'quick' | 'full' (default: 'quick')
 *   - secret: CRON_SECRET 토큰
 */

// 요일별 기본 업종 (UTC 기준, KST = UTC+9)
const WEEKDAY_INDUSTRY: Record<number, string> = {
  1: 'skincare',        // 월
  2: 'wedding',         // 화
  3: 'medical_clinic',  // 수
  4: 'restaurant_cafe', // 목
  5: 'hotel',           // 금
  6: 'place_brand',     // 토
};

export async function GET(request: NextRequest) {
  // ─── 보안 검증 ───────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron은 자동으로 Authorization 헤더를 설정하므로 양쪽 허용
  const authHeader = request.headers.get('authorization');
  const isVercelCron = authHeader === `Bearer ${cronSecret}`;
  const isManualTrigger = cronSecret && secret === cronSecret;

  if (cronSecret && !isVercelCron && !isManualTrigger) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ─── 업종 결정 ───────────────────────────────────────────
  const industryParam = searchParams.get('industry');
  const mode = (searchParams.get('mode') ?? 'quick') as 'quick' | 'full';
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID ?? 'cron-workspace';

  // 요일 기반 자동 결정 (UTC → KST +9)
  const kstDay = ((new Date().getUTCDay() + 7 - 0) % 7) || 7; // 1=월 ~ 7=일
  const subIndustryKey = industryParam ?? WEEKDAY_INDUSTRY[kstDay] ?? 'skincare';

  const sites = getReferenceSitesBySubIndustry(subIndustryKey);
  if (sites.length === 0) {
    return NextResponse.json({
      success: false,
      message: `No reference sites for industry: ${subIndustryKey}`,
    }, { status: 200 });
  }

  const startedAt = new Date().toISOString();
  console.log(`[Cron] benchmark-refresh start | industry=${subIndustryKey} | mode=${mode} | sites=${sites.length}`);

  // ─── 배치 감사 실행 ───────────────────────────────────────
  let batchResult: Awaited<ReturnType<typeof runBatchAudit>> | null = null;
  let batchError: string | null = null;

  try {
    batchResult = await runBatchAudit(subIndustryKey, workspaceId, mode);
  } catch (err: unknown) {
    batchError = err instanceof Error ? err.message : String(err);
    console.error(`[Cron] runBatchAudit failed:`, batchError);
  }

  // ─── 시계열 스냅샷 저장 ───────────────────────────────────
  const tracker = new TemporalTracker();
  const savedIds: string[] = [];
  const saveErrors: string[] = [];

  if (batchResult) {
    for (const snapshot of batchResult.snapshots) {
      if (snapshot.error) continue; // 오류 스냅샷 건너뜀
      const id = await tracker.saveSnapshot(snapshot);
      if (id) {
        savedIds.push(id);
      } else {
        saveErrors.push(snapshot.siteUrl);
      }
    }
  }

  const completedAt = new Date().toISOString();

  return NextResponse.json({
    success: !batchError,
    subIndustryKey,
    mode,
    sitesTotal: sites.length,
    snapshotsAudited: batchResult?.snapshots.length ?? 0,
    snapshotsSaved: savedIds.length,
    saveErrors: saveErrors.length > 0 ? saveErrors : undefined,
    batchError: batchError ?? undefined,
    startedAt,
    completedAt,
  });
}
