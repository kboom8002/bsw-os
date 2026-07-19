// lib/pipeline/brand-assigner.ts

/**
 * CQ → 브랜드 자동 배정 및 공급 패키지 생성기.
 * 최근 24시간 동안 생성된 Canonical Question들을 분석하여 알맞은 브랜드에 자동 매칭하고
 * question_supply_packages 테이블에 패키징합니다.
 * [v2.0] 단순 키워드 매치에서 고속 키워드 패스 + LLM 의미론적 배정 하이브리드 엔진 적용.
 */

import { getSupabaseAdminClient } from '../supabase';
import { BrandConfig } from '../benchmark/domain-config';
import { getAIProvider } from '../ai/ai-provider';

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
    
    // [v2.0] normalized_question 필드가 스키마에 부합하는지 조회 (기본 fallback으로 question_text)
    const { data: recentCQs, error: fetchError } = await supabase
      .from('canonical_questions')
      .select('id, normalized_question, slug, metadata')
      .eq('workspace_id', workspaceId)
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
      const questionText = cq.normalized_question || (cq as any).question_text || '';
      if (!questionText) {
        genericCqIds.push(cq.id);
        continue;
      }

      let matchedBrandSlug: string | null = null;
      const textLower = questionText.toLowerCase();

      // Step 1: 고속 텍스트 키워드 매칭 (Fast Path)
      for (const brand of brands) {
        if (brand.keywords && brand.keywords.some((kw: string) => textLower.includes(kw.toLowerCase()))) {
          matchedBrandSlug = brand.slug;
          break;
        }
      }

      // Step 2: 매칭 실패 시 LLM 기반 의미론적 배정 (Slow Path)
      if (!matchedBrandSlug && brands.length > 0) {
        try {
          const ai = getAIProvider();
          const prompt = `당신은 질문(Canonical Question)을 가장 연관성이 높은 브랜드에 배정하는 매칭 전문가입니다.
질문: "${questionText}"
브랜드 후보 목록: ${JSON.stringify(brands.map(b => ({ slug: b.slug, keywords: b.keywords })))}

위 질문이 특정 브랜드와 강하게 결합되어 있거나 브랜드의 주 전문 분야(키워드 범위)에 속하는지 분석하고,
가장 어울리는 브랜드의 slug를 선택하십시오. 어떤 브랜드와도 관련이 없는 중립적 질문인 경우 null을 반환하십시오.

다음 JSON 스키마를 만족하게 응답하십시오.`;

          const schema = {
            type: "OBJECT",
            properties: {
              brandSlug: { type: "STRING", nullable: true }
            },
            required: ["brandSlug"]
          };

          const res = await ai.generateStructuredOutput<{ brandSlug: string | null }>(prompt, schema, { temperature: 0.1 });
          if (res.brandSlug && brands.some(b => b.slug === res.brandSlug)) {
            matchedBrandSlug = res.brandSlug;
          }
        } catch (llmErr) {
          console.warn(`[BrandAssigner] Semantic assignment failed for "${questionText}":`, (llmErr as Error).message);
        }
      }

      // 결과 배정
      if (matchedBrandSlug) {
        const list = brandAssignments.get(matchedBrandSlug) || [];
        list.push(cq.id);
        brandAssignments.set(matchedBrandSlug, list);
        cqAssigned++;
      } else {
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

  /**
   * 질문 텍스트에 대해 다중 브랜드 매칭을 수행합니다.
   * 2개 이상 브랜드 매칭 시 JOINT_ANSWER 타입으로 반환합니다.
   * SDD §2-E: assignMultiple (JOINT_ANSWER 다중 브랜드 매칭)
   */
  static async assignMultiple(
    questionText: string,
    brands: BrandConfig[]
  ): Promise<{
    brands: { slug: string; relevance: number }[];
    assignmentType: 'SINGLE' | 'JOINT_ANSWER' | 'HUB_ONLY';
  }> {
    if (!questionText || brands.length === 0) {
      return { brands: [], assignmentType: 'HUB_ONLY' };
    }

    const textLower = questionText.toLowerCase();
    const matchedBrands: { slug: string; relevance: number }[] = [];

    // Step 1: 키워드 기반 전수 매칭 (Fast Path) — 모든 매칭 브랜드 수집
    for (const brand of brands) {
      if (brand.keywords && brand.keywords.length > 0) {
        const matchedKeywords = brand.keywords.filter((kw: string) => textLower.includes(kw.toLowerCase()));
        if (matchedKeywords.length > 0) {
          const relevance = Math.min(1.0, matchedKeywords.length / brand.keywords.length + 0.5);
          matchedBrands.push({ slug: brand.slug, relevance: Number(relevance.toFixed(3)) });
        }
      }
    }

    // 키워드 매칭 결과가 있으면 반환
    if (matchedBrands.length >= 2) {
      matchedBrands.sort((a, b) => b.relevance - a.relevance);
      return { brands: matchedBrands, assignmentType: 'JOINT_ANSWER' };
    }
    if (matchedBrands.length === 1) {
      return { brands: matchedBrands, assignmentType: 'SINGLE' };
    }

    // Step 2: LLM 기반 의미론적 다중 매칭 (Slow Path)
    try {
      const ai = getAIProvider();
      const prompt = `당신은 질문(Canonical Question)을 관련 브랜드에 배정하는 매칭 전문가입니다.
질문: "${questionText}"
브랜드 후보: ${JSON.stringify(brands.map(b => ({ slug: b.slug, keywords: b.keywords })))}

이 질문과 관련된 브랜드를 최대 3개까지 선택하고, 각각에 0.0~1.0 관련도 점수를 부여하십시오.
어떤 브랜드와도 관련이 없는 중립적 질문인 경우 빈 배열을 반환하십시오.
JSON 스키마를 따르십시오.`;

      const schema = {
        type: "OBJECT",
        properties: {
          matches: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                slug: { type: "STRING" },
                relevance: { type: "NUMBER" }
              },
              required: ["slug", "relevance"]
            }
          }
        },
        required: ["matches"]
      };

      const res = await ai.generateStructuredOutput<{ matches: { slug: string; relevance: number }[] }>(
        prompt, schema, { temperature: 0.1 }
      );

      // 유효한 브랜드만 필터링
      const validMatches = res.matches
        .filter(m => brands.some(b => b.slug === m.slug) && m.relevance >= 0.4)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 3);

      if (validMatches.length >= 2) {
        return { brands: validMatches, assignmentType: 'JOINT_ANSWER' };
      }
      if (validMatches.length === 1) {
        return { brands: validMatches, assignmentType: 'SINGLE' };
      }
    } catch (llmErr) {
      console.warn(`[BrandAssigner] Multi-brand LLM assignment failed:`, (llmErr as Error).message);
    }

    return { brands: [], assignmentType: 'HUB_ONLY' };
  }
}
