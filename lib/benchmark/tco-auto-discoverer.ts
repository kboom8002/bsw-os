import { getSupabaseAdminClient } from '../supabase';
import type { QuestionDetail } from './lightweight-metric-runner';
import crypto from 'crypto';

export interface TcoCandidate {
  keyword: string;
  frequency: number;            // 실측 중 등장 빈도
  source_questions: string[];   // 발견된 질문들
  novelty: 'new' | 'enrichment'; // 신규 TCO vs 기존 TCO 보강
  confidence: number;            // 0-100
}

export class TcoAutoDiscoverer {
  /**
   * 실측 결과(search_queries 및 LLM Judge reasoning)에서 TCO 후보를 추출합니다.
   */
  static discover(
    questionDetails: QuestionDetail[],
    existingTcoSlugs: string[] = []
  ): TcoCandidate[] {
    const candidatesMap = new Map<string, { count: number; questions: Set<string> }>();

    for (const q of questionDetails) {
      const engines = Object.keys(q.per_engine);
      for (const eng of engines) {
        const data = q.per_engine[eng];

        // 1. search_queries에서 키워드 분석
        if (data.search_queries) {
          for (const query of data.search_queries) {
            // 제주, 맛집 등 너무 일반적인 단어 제외
            const tokens = query.split(/\s+/).map(t => t.replace(/[^가-힣a-zA-Z0-9]/g, '').trim()).filter(Boolean);
            for (const tok of tokens) {
              if (tok.length >= 2 && !tok.includes('제주') && !tok.includes('맛집') && !tok.includes('추천')) {
                const lowerTok = tok.toLowerCase();
                const existing = candidatesMap.get(lowerTok) || { count: 0, questions: new Set<string>() };
                existing.count++;
                existing.questions.add(q.question_text);
                candidatesMap.set(lowerTok, existing);
              }
            }
          }
        }
      }
    }

    const candidates: TcoCandidate[] = [];
    const existingSlugsSet = new Set(existingTcoSlugs.map(s => s.toLowerCase()));

    for (const [kw, stats] of candidatesMap.entries()) {
      if (stats.count >= 2) { // 2회 이상 등장한 것만 추출
        const slug = `tco-${kw.replace(/[^a-zA-Z0-9가-힣]/g, '-')}`;
        const novelty = existingSlugsSet.has(slug) ? 'enrichment' : 'new';

        candidates.push({
          keyword: kw,
          frequency: stats.count,
          source_questions: Array.from(stats.questions),
          novelty,
          // 빈도 + 질문 분포를 고려한 가중 신뢰도
          confidence: Math.min(100, 40 + stats.count * 8 + stats.questions.size * 5)
        });
      }
    }

    // 빈도수 내림차순 정렬
    // 상한 확장: 업종 보캐뷸러리 충분성을 위해 5→30개로 확대
    return candidates.sort((a, b) => b.frequency - a.frequency).slice(0, 30);
  }

  /**
   * 발견된 TCO 후보를 Supabase DB에 반영합니다.
   */
  static async apply(
    workspaceId: string,
    candidates: TcoCandidate[]
  ): Promise<{ created: number; enriched: number }> {
    let created = 0;
    let enriched = 0;

    try {
      const supabase = getSupabaseAdminClient();

      for (const cand of candidates) {
        const slug = `tco-${cand.keyword.replace(/[^a-zA-Z0-9가-힣]/g, '-')}`;

        // 1. 기존 개념 체크
        const { data: existing } = await supabase
          .from('tco_concepts')
          .select('id, definition')
          .eq('workspace_id', workspaceId)
          .eq('slug', slug)
          .maybeSingle();

        const conceptPayload = {
          workspace_id: workspaceId,
          concept_name: cand.keyword,
          slug,
          definition: `Auto-discovered TCO concept representing "${cand.keyword}" (Frequency: ${cand.frequency})`,
          is_strategic: false,
          concept_type: 'tco_discovered_entity',
          activation_condition: {
            frequency: cand.frequency,
            source_questions: cand.source_questions
          },
          boundary: {},
          operator: {},
          risk_vector: {},
          operational_fields: {
            discovered_at: new Date().toISOString()
          }
        };

        if (existing) {
          // 기존 개념 보강 (Enrichment)
          const { error } = await supabase
            .from('tco_concepts')
            .update({
              ...conceptPayload,
              id: existing.id,
              definition: `${existing.definition} | Enriched with frequency: ${cand.frequency}`
            })
            .eq('id', existing.id);

          if (!error) enriched++;
        } else {
          // 신규 개념 등록 (Create)
          const { error } = await supabase
            .from('tco_concepts')
            .insert({
              id: crypto.randomUUID(),
              ...conceptPayload
            });

          if (!error) created++;
        }
      }
    } catch (e: any) {
      console.warn(`[TcoAutoDiscoverer] DB error: ${e.message}`);
    }

    return { created, enriched };
  }
}
