import { getSupabaseAdminClient } from '../supabase';
import type { FairProbeTemplate } from './fair-probe-templates';
import type { QuestionDetail } from './lightweight-metric-runner';
import { QisHubClient } from '../qis/hub-client';

export interface EnrichmentResult {
  qis_injected_must_include: string[];    // 채널①: Scene → must_include
  pa_dynamic_probes: FairProbeTemplate[]; // 채널②: PA → 신규 프로브
  hub_priority_weights: Map<string, number>; // 채널③: Hub → 가중치
  tco_discovered_keywords: string[];      // 채널④: 실측 → TCO
}

export class ProbeEnricher {
  private workspaceId: string;

  constructor(workspaceId: string = 'demo-workspace') {
    this.workspaceId = workspaceId;
  }

  /**
   * 채널①: QIS Scene의 must_include/must_not_do를 수집하여 프로브 검증 기준에 주입
   */
  async enrichFromQisScenes(domainSlug: string): Promise<string[]> {
    try {
      const supabase = getSupabaseAdminClient();
      // qis_scenes와 canonical_questions를 조인하거나,
      // workspace_id 필터링하여 must_include가 채워진 것들을 가져옵니다.
      const { data: scenes, error } = await supabase
        .from('qis_scenes')
        .select('must_include')
        .eq('workspace_id', this.workspaceId);

      if (error || !scenes) {
        return [];
      }

      const keywords = new Set<string>();
      for (const scene of scenes) {
        if (scene.must_include && Array.isArray(scene.must_include)) {
          scene.must_include.forEach((kw: string) => {
            if (kw && kw.trim().length > 0) {
              keywords.add(kw.trim());
            }
          });
        }
      }
      return Array.from(keywords);
    } catch (e: any) {
      console.warn(`[ProbeEnricher] Failed to fetch QIS scenes (using empty fallback): ${e.message}`);
      return [];
    }
  }

  /**
   * 채널②: PA의 user_question_patterns를 L2/L7 프로브 질문으로 변환하여 추가
   */
  async generateDynamicProbesFromPA(domainSlug: string): Promise<FairProbeTemplate[]> {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: attractors, error } = await supabase
        .from('pattern_attractors')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .eq('status', 'active');

      if (error || !attractors) {
        return [];
      }

      const dynamicProbes: FairProbeTemplate[] = [];

      for (const row of attractors) {
        const triggerState = row.trigger_state;
        if (triggerState && Array.isArray(triggerState.user_question_patterns)) {
          const mustInclude = row.concept_state?.required_concepts || [];
          const mustNotDo = row.action_policy?.blocked_actions || [];

          for (const pattern of triggerState.user_question_patterns) {
            // 패턴에 brand, competitor 템플릿 포함 여부에 따라 layer 결정
            const hasBrandPlaceholder = pattern.includes('{brand}');
            const hasCompetitorPlaceholder = pattern.includes('{competitor}');
            const layer = hasCompetitorPlaceholder ? 'L2_competitive' : 'L7_brand';

            dynamicProbes.push({
              template_text: pattern,
              intent_context: `pa_dynamic_${row.id.slice(0, 8)}`,
              risk_level: triggerState.risk_state?.level === 'high' ? 'high' : 'medium',
              decision_stage: 'consideration',
              question_type: triggerState.intent_state?.[0] || 'informational',
              weight: 1.0,
              must_include_templates: mustInclude,
              should_include_templates: [],
              must_not_do: mustNotDo,
              layer: layer as any,
            });
          }
        }
      }

      return dynamicProbes;
    } catch (e: any) {
      console.warn(`[ProbeEnricher] Failed to fetch pattern attractors (using empty fallback): ${e.message}`);
      return [];
    }
  }

  /**
   * 채널③: Hub에서 수요 신호를 수신하여 프로브 가중치 정보 맵 생성
   */
  async pullHubPriorityWeights(industryKey: string): Promise<Map<string, number>> {
    const weightMap = new Map<string, number>();
    try {
      const hubClient = new QisHubClient();
      const signals = await hubClient.pullSignals(industryKey);
      if (Array.isArray(signals)) {
        for (const sig of signals) {
          if (sig.query && sig.weight !== undefined) {
            weightMap.set(sig.query.toLowerCase(), sig.weight);
          }
        }
      }
    } catch (e: any) {
      console.warn(`[ProbeEnricher] Failed to pull Hub priority weights: ${e.message}`);
    }
    return weightMap;
  }

  /**
   * 채널④: 실측 결과(search_queries 및 LLM Judge reasoning) 분석을 통한 신규 TCO 키워드 발견
   */
  discoverTcoFromBenchmarkResults(questionDetails: QuestionDetail[]): string[] {
    const discovered = new Set<string>();
    for (const q of questionDetails) {
      for (const engineName of Object.keys(q.per_engine)) {
        const engineData = q.per_engine[engineName];
        if (engineData.search_queries) {
          for (const query of engineData.search_queries) {
            // "돈사돈 주차" 같은 쿼리에서 유의미한 명사/형태소 패턴 단순 추출 시도
            const tokens = query.split(/\s+/);
            tokens.forEach(tok => {
              if (tok.length >= 2 && !tok.includes('제주') && !tok.includes('맛집')) {
                discovered.add(tok);
              }
            });
          }
        }
      }
    }
    return Array.from(discovered).slice(0, 10);
  }

  /**
   * 4개 채널을 통합한 최종 enrichment 획득
   */
  async enrich(domainSlug: string, previousResults?: QuestionDetail[]): Promise<EnrichmentResult> {
    console.log(`[ProbeEnricher] Gathering enrichment for domain: ${domainSlug}...`);
    const qisMustIncludes = await this.enrichFromQisScenes(domainSlug);
    const paProbes = await this.generateDynamicProbesFromPA(domainSlug);
    const weights = await this.pullHubPriorityWeights(domainSlug);
    const tcoKeywords = previousResults ? this.discoverTcoFromBenchmarkResults(previousResults) : [];

    console.log(`  ✓ QIS Scenes must_include count: ${qisMustIncludes.length}`);
    console.log(`  ✓ PA Dynamic Probes count: ${paProbes.length}`);
    console.log(`  ✓ Hub Weights pulled: ${weights.size}`);
    console.log(`  ✓ Discovered TCO keywords: ${tcoKeywords.length}`);

    return {
      qis_injected_must_include: qisMustIncludes,
      pa_dynamic_probes: paProbes,
      hub_priority_weights: weights,
      tco_discovered_keywords: tcoKeywords
    };
  }
}
