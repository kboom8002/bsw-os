import { getSupabaseAdminClient } from '../supabase';
import type { QuestionDetail } from './lightweight-metric-runner';
import type { BrandConfig } from './domain-config';

export type QuestionAssetType = 'discovery_signal' | 'gap_question' | 'volatile_pattern' | 'cwr_winner_insight';

export interface QuestionAsset {
  type: QuestionAssetType;
  question_text: string;
  brand_slug?: string;
  insight: string;                        // 자산의 의미 요약
  evidence: {
    engine: string;
    raw_snippet: string;                   // AI 응답 근거 텍스트
    search_queries?: string[];             // Gemini가 사용한 검색 쿼리
    llm_judge_reasoning?: string;          // LLM Judge 판정 근거
  };
  priority: number;                        // 0-100
  target_axis: 'industry' | 'place' | 'vortex' | 'cross_axis';
  supply_targets: ('hub_industry' | 'hub_place' | 'brand_deep_dive')[];
}

export class BenchmarkAssetExtractor {
  /**
   * QuestionDetail[]에서 4종 질문 자산(Discovery Signal, GAP, Volatile, CWR Winner)을 일괄 추출합니다.
   */
  static extract(
    details: QuestionDetail[],
    brands: BrandConfig[],
    domainSlug: string,
    historicalDetails?: QuestionDetail[]
  ): QuestionAsset[] {
    const assets: QuestionAsset[] = [];
    const brandNames = new Set(brands.map(b => b.name));

    for (const q of details) {
      const engines = Object.keys(q.per_engine);
      if (engines.length === 0) continue;

      // ── 1. Discovery Signal 추출 (패널 미등록 브랜드/키워드가 AI 응답에 등장) ──
      // 단순 형태소 분석 대신, 영어 고유명사나 특정 키워드 패턴으로 분석
      for (const eng of engines) {
        const text = q.per_engine[eng].raw_response_text;
        // 정규식으로 대문자로 시작하는 단어나 따옴표 안의 단어 감지
        const candidates = text.match(/['"“]([가-힣A-Za-z0-9\s]{2,15})['"”]/g) || [];
        for (const rawCand of candidates) {
          const cand = rawCand.replace(/['"“’”]/g, '').trim();
          if (cand && !brandNames.has(cand) && cand.length >= 2 && !cand.includes('제주') && !cand.includes('맛집')) {
            assets.push({
              type: 'discovery_signal',
              question_text: q.question_text,
              insight: `새로운 브랜드 후보 발견: "${cand}" (AI 응답 내 인용)`,
              evidence: {
                engine: eng,
                raw_snippet: text.slice(0, 300),
                search_queries: q.per_engine[eng].search_queries
              },
              priority: 50,
              target_axis: 'industry',
              supply_targets: ['hub_industry']
            });
          }
        }
      }

      // ── 2. GAP Question 추출 (특정 브랜드 누락) ──
      // opportunity-analyzer.ts에서 기 생성된 기회를 활용할 수도 있으나 여기서 분석 규칙에 맞게 재정의
      for (const brand of brands) {
        let isMentioned = false;
        const competitors: string[] = [];

        for (const eng of engines) {
          const mentioned = q.per_engine[eng].brands_mentioned || [];
          if (mentioned.includes(brand.name)) {
            isMentioned = true;
          }
          mentioned.forEach(b => {
            if (b !== brand.name) competitors.push(b);
          });
        }

        if (!isMentioned && competitors.length > 0) {
          assets.push({
            type: 'gap_question',
            question_text: q.question_text,
            brand_slug: brand.slug,
            insight: `${brand.name} 브랜드가 경쟁사 대비 누락되었습니다. (경쟁 노출: ${Array.from(new Set(competitors)).join(', ')})`,
            evidence: {
              engine: engines[0],
              raw_snippet: q.per_engine[engines[0]].raw_response_text.slice(0, 300),
              search_queries: q.per_engine[engines[0]].search_queries
            },
            priority: q.layer === 'L2_competitive' ? 90 : 70,
            target_axis: domainSlug.includes('jeju') ? 'place' : 'industry',
            supply_targets: ['brand_deep_dive', 'hub_place']
          });
        }
      }

      // ── 3. Volatile Pattern 추출 (시계열 응답 변동성) ──
      if (historicalDetails) {
        const pastQ = historicalDetails.find(hq => hq.question_text === q.question_text);
        if (pastQ) {
          for (const eng of engines) {
            const currentMentions = q.per_engine[eng]?.brands_mentioned || [];
            const pastMentions = pastQ.per_engine[eng]?.brands_mentioned || [];

            // 이전에는 언급되었으나 현재는 누락된 브랜드 확인
            const lost = pastMentions.filter(b => !currentMentions.includes(b));
            if (lost.length > 0) {
              assets.push({
                type: 'volatile_pattern',
                question_text: q.question_text,
                insight: `응답 변동성(Volatility) 감지: 이전에는 언급되던 브랜드(${lost.join(', ')})가 현재 누락되었습니다.`,
                evidence: {
                  engine: eng,
                  raw_snippet: q.per_engine[eng].raw_response_text.slice(0, 300)
                },
                priority: 80,
                target_axis: 'industry',
                supply_targets: ['hub_industry']
              });
            }
          }
        }
      }

      // ── 4. CWR Winner Insight 추출 (LLM Judge가 판정한 경쟁 우위 근거) ──
      for (const eng of engines) {
        const engineData = q.per_engine[eng];
        if (engineData.llm_cwr_winner && engineData.llm_cwr_winner !== 'tie') {
          assets.push({
            type: 'cwr_winner_insight',
            question_text: q.question_text,
            brand_slug: brands.find(b => b.name === engineData.llm_cwr_winner)?.slug,
            insight: `경쟁 승리: LLM Judge가 "${engineData.llm_cwr_winner}" 브랜드를 경쟁 우위로 판정했습니다. (이유: ${engineData.llm_bsf_score ?? 0}점 매칭)`,
            evidence: {
              engine: eng,
              raw_snippet: engineData.raw_response_text.slice(0, 300),
              llm_judge_reasoning: 'Winner decided by LLM Judge'
            },
            priority: 85,
            target_axis: 'vortex',
            supply_targets: ['brand_deep_dive', 'hub_industry']
          });
        }
      }
    }

    return assets;
  }

  /**
   * 추출한 자산을 Supabase의 question_signals 테이블에 저장/피딩합니다.
   */
  static async persist(
    workspaceId: string,
    assets: QuestionAsset[]
  ): Promise<{ saved: number; skipped: number }> {
    let saved = 0;
    let skipped = 0;

    try {
      const supabase = getSupabaseAdminClient();

      for (const asset of assets) {
        // 중복 피딩 방지 (동일 workspace, 동일 query, 동일 source)
        const { data: existing } = await supabase
          .from('question_signals')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('query', asset.question_text)
          .eq('source', `asset_${asset.type}`)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // metadata 필드에 asset의 상세 정보(insight, evidence 등) 저장
        const { error } = await supabase
          .from('question_signals')
          .insert({
            workspace_id: workspaceId,
            query: asset.question_text,
            volume: asset.priority * 10, // 우선순위 기반 임시 볼륨 할당
            intent: 'informational',
            status: 'mined',
            source: `asset_${asset.type}`,
            metadata: {
              insight: asset.insight,
              brand_slug: asset.brand_slug,
              evidence: asset.evidence,
              target_axis: asset.target_axis,
              supply_targets: asset.supply_targets,
              auto_must_include: asset.evidence.search_queries || []
            }
          });

        if (!error) {
          saved++;
        } else {
          console.warn(`[BenchmarkAssetExtractor] Persist failed for "${asset.question_text}": ${error.message}`);
        }
      }
    } catch (e: any) {
      console.warn(`[BenchmarkAssetExtractor] DB connection error: ${e.message}`);
    }

    return { saved, skipped };
  }
}
