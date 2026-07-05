// lib/pipeline/brand-assigner.ts

/**
 * CQ → 브랜드 자동 배정 및 공급 패키지 생성기.
 * 최근 24시간 동안 생성된 Canonical Question들을 텍스트 키워드 기반으로 분석하여
 * 각각 알맞은 브랜드에 자동 매칭하고 question_supply_packages 테이블에 패키징합니다.
 */

import { getSupabaseAdminClient } from '../supabase';
import { BrandConfig } from '../benchmark/domain-config';

export class BrandAssigner {
  static async assignAndPackage(
    workspaceId: string,
    domainKey: string,
    brands: BrandConfig[]
  ): Promise<{ packagesCreated: number; cqAssigned: number }> {
    const supabase = getSupabaseAdminClient();
    
    // 최근 24시간 내 생성된 CQ 조회
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: recentCQs, error: fetchError } = await supabase
      .from('canonical_questions')
      .select('id, question_text, metadata')
      .eq('workspace_id', workspaceId)
      .eq('domain_key', domainKey)
      .gte('created_at', oneDayAgo.toISOString());

    if (fetchError) {
      console.warn(`[BrandAssigner] Failed to fetch recent CQs:`, fetchError.message);
      return { packagesCreated: 0, cqAssigned: 0 };
    }

    if (!recentCQs || recentCQs.length === 0) {
      console.log(`[BrandAssigner] No recent CQs found in last 24h for assignment.`);
      return { packagesCreated: 0, cqAssigned: 0 };
    }

    let cqAssigned = 0;
    const brandAssignments = new Map<string, string[]>(); // brandSlug -> cqIds[]
    const genericCqIds: string[] = [];

    for (const cq of recentCQs) {
      let matched = false;
      const text = cq.question_text.toLowerCase();

      // 브랜드 키워드 텍스트 매칭
      for (const brand of brands) {
        if (brand.keywords && brand.keywords.some(kw => text.includes(kw.toLowerCase()))) {
          const list = brandAssignments.get(brand.slug) || [];
          list.push(cq.id);
          brandAssignments.set(brand.slug, list);
          matched = true;
          cqAssigned++;
          break;
        }
      }

      if (!matched) {
        genericCqIds.push(cq.id);
      }
    }

    let packagesCreated = 0;

    // 브랜드 패키지들 생성
    for (const [brandSlug, cqIds] of brandAssignments.entries()) {
      try {
        const { error } = await supabase
          .from('question_supply_packages')
          .insert({
            workspace_id: workspaceId,
            domain_key: domainKey,
            brand_slug: brandSlug,
            package_data: { cq_ids: cqIds, created_at: new Date().toISOString() },
            cq_count: cqIds.length,
            status: 'ready'
          });
        if (!error) {
          packagesCreated++;
        } else {
          console.warn(`[BrandAssigner] Failed to insert package for ${brandSlug}:`, error.message);
        }
      } catch (err: any) {
        console.error(`[BrandAssigner] Error inserting package for ${brandSlug}:`, err.message);
      }
    }

    // 공통 패키지 생성
    if (genericCqIds.length > 0) {
      try {
        const { error } = await supabase
          .from('question_supply_packages')
          .insert({
            workspace_id: workspaceId,
            domain_key: domainKey,
            brand_slug: null,
            package_data: { cq_ids: genericCqIds, created_at: new Date().toISOString() },
            cq_count: genericCqIds.length,
            status: 'ready'
          });
        if (!error) {
          packagesCreated++;
        } else {
          console.warn(`[BrandAssigner] Failed to insert generic package:`, error.message);
        }
      } catch (err: any) {
        console.error(`[BrandAssigner] Error inserting generic package:`, err.message);
      }
    }

    console.log(`[BrandAssigner] Completed. Created ${packagesCreated} packages. Assigned ${cqAssigned}/${recentCQs.length} CQs.`);
    return { packagesCreated, cqAssigned };
  }
}
