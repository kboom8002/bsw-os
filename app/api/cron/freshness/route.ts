import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const maxDuration = 120;

/**
 * GET /api/cron/freshness
 * 
 * Cron API endpoint to scan for expired Answer Assets based on their freshness policies
 * and create expert review lifecycle warnings in audit_events, updating asset status to 'stale'.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  const authHeader = request.headers.get('authorization');
  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isSecretParam = cronSecret && secret === cronSecret;
  const isManualUiTrigger = request.headers.get('X-Manual-Trigger') === 'true';

  if (cronSecret && !isVercelCron && !isSecretParam && !isManualUiTrigger) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date();
  
  let assets: any[] = [];
  try {
    const { data, error } = await supabase
      .from('answer_assets')
      .select('*')
      .eq('status', 'published');

    if (error) throw error;
    assets = data || [];
  } catch (err: any) {
    logger.error('[Freshness Cron] Failed to fetch published answer assets from DB', err);
    return NextResponse.json({
      status: 'error',
      message: `Failed to fetch assets: ${err.message}`
    }, { status: 500 });
  }

  let processed = 0;
  let expiredCount = 0;
  let warningsCreated = 0;
  const details: any[] = [];

  for (const asset of assets) {
    processed++;
    let isExpired = false;
    let reason = '';
    const payload = asset.payload || {};
    const createdAt = new Date(asset.created_at || asset.createdAt || now);
    const vertical = asset.workspace_id ? 'skincare' : 'general'; // or detect from payload/verticalId

    // 1. Explicit Expiry Date check (validUntil)
    const validUntilStr = asset.valid_until || payload.validUntil;
    if (validUntilStr) {
      const validUntil = new Date(validUntilStr);
      if (validUntil <= now) {
        isExpired = true;
        reason = `Explicit expiry date ${validUntilStr} has passed.`;
      }
    } else {
      // 2. Freshness Policy logic based on Vertical and category/keywords
      const titleLower = (asset.title || '').toLowerCase();
      const slugLower = (payload.question?.slug || '').toLowerCase();

      // Skincare policies
      if (asset.workspace_id || titleLower.includes('skin') || titleLower.includes('피부') || titleLower.includes('에센스')) {
        // Products: 90 days review
        if (titleLower.includes('product') || titleLower.includes('제품') || titleLower.includes('에센스') || titleLower.includes('크림')) {
          const limit = new Date(createdAt.getTime() + 90 * 24 * 3600 * 1000);
          if (limit <= now) {
            isExpired = true;
            reason = `Skincare Product Fact freshness limit (90 days) exceeded. Created at: ${createdAt.toISOString()}`;
          }
        }
        // Time-sensitive / regulatory: 30 days review
        else if (titleLower.includes('regulatory') || titleLower.includes('규정') || titleLower.includes('부작용') || titleLower.includes('이상 반응')) {
          const limit = new Date(createdAt.getTime() + 30 * 24 * 3600 * 1000);
          if (limit <= now) {
            isExpired = true;
            reason = `Skincare Regulatory freshness limit (30 days) exceeded. Created at: ${createdAt.toISOString()}`;
          }
        }
        // Default skincare: 180 days review
        else {
          const limit = new Date(createdAt.getTime() + 180 * 24 * 3600 * 1000);
          if (limit <= now) {
            isExpired = true;
            reason = `Skincare generic freshness limit (180 days) exceeded. Created at: ${createdAt.toISOString()}`;
          }
        }
      } 
      // Jeju local commerce policies
      else {
        // F0 Real-time / weather / roads: 1 day review
        if (titleLower.includes('weather') || titleLower.includes('날씨') || titleLower.includes('통제') || titleLower.includes('태풍') || titleLower.includes('폭설')) {
          const limit = new Date(createdAt.getTime() + 1 * 24 * 3600 * 1000);
          if (limit <= now) {
            isExpired = true;
            reason = `Jeju Real-time F0 freshness limit (1 day) exceeded. Created at: ${createdAt.toISOString()}`;
          }
        }
        // F1 Operational / price / booking / menu: 30 days review
        else if (titleLower.includes('menu') || titleLower.includes('메뉴') || titleLower.includes('가격') || titleLower.includes('예약') || titleLower.includes('hours') || titleLower.includes('영업')) {
          const limit = new Date(createdAt.getTime() + 30 * 24 * 3600 * 1000);
          if (limit <= now) {
            isExpired = true;
            reason = `Jeju Operational F1 freshness limit (30 days) exceeded. Created at: ${createdAt.toISOString()}`;
          }
        }
        // F2 Seating / parking / stairs (facilities): 90 days review
        else if (titleLower.includes('parking') || titleLower.includes('주차') || titleLower.includes('좌석') || titleLower.includes('계단') || titleLower.includes('편의')) {
          const limit = new Date(createdAt.getTime() + 90 * 24 * 3600 * 1000);
          if (limit <= now) {
            isExpired = true;
            reason = `Jeju Facility F2 freshness limit (90 days) exceeded. Created at: ${createdAt.toISOString()}`;
          }
        }
        // Default general fallback: 90 days
        else {
          const limit = new Date(createdAt.getTime() + 90 * 24 * 3600 * 1000);
          if (limit <= now) {
            isExpired = true;
            reason = `Default generic freshness limit (90 days) exceeded. Created at: ${createdAt.toISOString()}`;
          }
        }
      }
    }

    if (isExpired) {
      expiredCount++;
      
      // Update status to 'stale' in database
      const updatedPayload = { ...payload, status: 'stale' };
      try {
        await supabase
          .from('answer_assets')
          .update({
            status: 'stale',
            payload: updatedPayload
          })
          .eq('id', asset.id);
        
        logger.info(`[Freshness Cron] Updated status to 'stale' for asset ${asset.id}`);
      } catch (err: any) {
        logger.warn(`[Freshness Cron] Failed to update asset ${asset.id} status in DB: ${err.message}`);
      }

      // Create expert review lifecycle warning in audit_events
      try {
        await supabase.from('audit_events').insert({
          workspace_id: asset.workspace_id,
          user_id: 'system-freshness-cron',
          action: 'EXPERT_REVIEW_LIFECYCLE_WARNING',
          target_type: 'answer_assets',
          target_id: asset.id,
          payload: {
            assetId: asset.id,
            title: asset.title,
            createdAt: asset.created_at,
            reason: reason,
            reasons: [reason],
            requiresAction: true,
            warningType: 'freshness_expired'
          }
        });
        warningsCreated++;
        details.push({ assetId: asset.id, title: asset.title, reason });
      } catch (err: any) {
        logger.error(`[Freshness Cron] Failed to log audit event warning for asset ${asset.id}`, err);
      }
    }
  }

  return NextResponse.json({
    status: 'ok',
    processed,
    expired: expiredCount,
    warningsCreated,
    details
  });
}
