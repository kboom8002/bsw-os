import { getAIProvider } from '../ai/ai-provider';
import { DEEP_DIVE_PROMPTS } from './prompts';
import { ContentBlueprint, DeepDiveDiagnostic, TargetQuestionCandidate } from './types';
import { BrandOpportunity } from '../benchmark/opportunity-analyzer';

export class LlmAnalyst {
  /**
   * AI 응답 텍스트에서 브랜드 언급의 감성·맥락·추천 강도를 LLM이 심층 판별
   */
  static async classifyMentionDeep(
    responseText: string,
    brandName: string,
    questionText: string
  ): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    isRecommendation: boolean;
    isMereListing: boolean;
    isComparativeWin: boolean;
    confidenceScore: number;
    reasoning: string;
  }> {
    const ai = getAIProvider();
    const system = DEEP_DIVE_PROMPTS.classifyMention.system
      .replace('{brandName}', brandName)
      .replace('{questionText}', questionText);
    const user = DEEP_DIVE_PROMPTS.classifyMention.user
      .replace('{brandName}', brandName)
      .replace('{questionText}', questionText)
      .replace('{responseText}', responseText);

    try {
      const res = await ai.generateStructuredOutput<any>(`System:\n${system}\n\nUser:\n${user}`, {
        type: 'object',
        properties: {
          sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
          isRecommendation: { type: 'boolean' },
          isMereListing: { type: 'boolean' },
          isComparativeWin: { type: 'boolean' },
          confidenceScore: { type: 'number' },
          reasoning: { type: 'string' }
        },
        required: ['sentiment', 'isRecommendation', 'isMereListing', 'isComparativeWin', 'confidenceScore', 'reasoning']
      });
      return res;
    } catch (e) {
      console.warn("LLM classification failed, falling back", e);
      return { sentiment: 'neutral', isRecommendation: false, isMereListing: true, isComparativeWin: false, confidenceScore: 0, reasoning: 'Fallback' };
    }
  }

  /**
   * 기회 영역에 대한 타겟 질문 후보를 LLM이 자동 발굴
   */
  static async discoverTargetQuestions(
    brandName: string,
    domainSlug: string,
    existingGaps: BrandOpportunity[],
    eeatSummary: any
  ): Promise<TargetQuestionCandidate[]> {
    const ai = getAIProvider();
    const system = DEEP_DIVE_PROMPTS.discoverTargets.system
      .replace('{brandName}', brandName)
      .replace('{domainSlug}', domainSlug);
    const user = DEEP_DIVE_PROMPTS.discoverTargets.user
      .replace('{brandName}', brandName)
      .replace('{domainSlug}', domainSlug)
      .replace('{existingGaps}', JSON.stringify(existingGaps.slice(0, 5)));

    try {
      const res = await ai.generateStructuredOutput<any>(`System:\n${system}\n\nUser:\n${user}`, {
        type: 'object',
        properties: {
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question_text: { type: 'string' },
                eeat_dimension: { type: 'string', enum: ['expertise', 'experience', 'authority', 'trust'] },
                rationale: { type: 'string' },
                estimated_impact: { type: 'number' },
                estimated_difficulty: { type: 'number' }
              },
              required: ['question_text', 'eeat_dimension', 'rationale', 'estimated_impact', 'estimated_difficulty']
            }
          }
        },
        required: ['candidates']
      });
      
      const candidates: TargetQuestionCandidate[] = res.candidates.map((c: any) => ({
        question_text: c.question_text,
        sources: [{
          type: 'signal_mined',
          source_detail: c.rationale,
          priority_score: c.estimated_impact
        }],
        composite_priority: Math.round(c.estimated_impact * (100 - c.estimated_difficulty) / 100) + 20,
        eeat_dimension: c.eeat_dimension as any,
        current_ai_coverage: 'none',
        competitors_owning: [],
        estimated_aepi_impact: c.estimated_impact * 0.2,
        estimated_bdr_delta: c.estimated_impact * 0.1,
        first_mover_window_days: 90
      }));
      return candidates;
    } catch (e) {
      console.warn("LLM discover failed", e);
      return [];
    }
  }

  /**
   * 타겟 질문에 대한 맞춤형 콘텐츠 블루프린트를 LLM이 생성
   */
  static async generateContentBlueprint(
    candidate: TargetQuestionCandidate,
    brandContext: { name: string; keywords: string[]; domains: string[] },
    approvedClaims: string[],
    boundaryRules: string[]
  ): Promise<Partial<ContentBlueprint>> {
    const ai = getAIProvider();
    const system = DEEP_DIVE_PROMPTS.contentBlueprint.system
      .replace('{questionText}', candidate.question_text)
      .replace('{brandName}', brandContext.name)
      .replace('{approvedClaims}', JSON.stringify(approvedClaims))
      .replace('{boundaryRules}', JSON.stringify(boundaryRules));
      
    const user = DEEP_DIVE_PROMPTS.contentBlueprint.user
      .replace('{questionText}', candidate.question_text)
      .replace('{brandName}', brandContext.name);

    try {
      const res = await ai.generateStructuredOutput<any>(`System:\n${system}\n\nUser:\n${user}`, {
        type: 'object',
        properties: {
          title_suggestion_ko: { type: 'string' },
          heading_structure: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                level: { type: 'string', enum: ['h2', 'h3'] },
                text: { type: 'string' },
                target_keyword: { type: 'string' },
                is_question_heading: { type: 'boolean' }
              },
              required: ['level', 'text', 'target_keyword', 'is_question_heading']
            }
          },
          expected_layer: {
            type: 'object',
            properties: {
              must_include: { type: 'array', items: { type: 'string' } },
              strongly_recommended: { type: 'array', items: { type: 'string' } },
              should_include: { type: 'array', items: { type: 'string' } },
              caution: { type: 'array', items: { type: 'string' } },
              must_not_do: { type: 'array', items: { type: 'string' } }
            },
            required: ['must_include', 'strongly_recommended', 'should_include', 'caution', 'must_not_do']
          }
        },
        required: ['title_suggestion_ko', 'heading_structure', 'expected_layer']
      });
      return res;
    } catch (e) {
      console.warn("LLM blueprint failed", e);
      return {};
    }
  }

  /**
   * 전체 진단 결과를 종합하여 경영진용 요약 인사이트를 생성
   */
  static async generateExecutiveSummary(
    diagnostic: DeepDiveDiagnostic,
    projected: any,
    scenarios: any[],
    brandName: string
  ): Promise<string> {
    const ai = getAIProvider();
    
    const curMetrics = {
      AEPI: diagnostic.benchmarkSnapshot.bdr, // simplified for mock
      BDR: diagnostic.benchmarkSnapshot.bdr,
      CWR: diagnostic.benchmarkSnapshot.cwr
    };
    
    const system = DEEP_DIVE_PROMPTS.executiveSummary.system
      .replace('{brandName}', brandName);
      
    const user = DEEP_DIVE_PROMPTS.executiveSummary.user
      .replace('{currentMetrics}', JSON.stringify(curMetrics))
      .replace('{projectedMetrics}', JSON.stringify(projected))
      .replace('{scenarios}', JSON.stringify(scenarios));

    try {
      const res = await ai.generateStructuredOutput<any>(`System:\n${system}\n\nUser:\n${user}`, {
        type: 'object',
        properties: {
          executiveSummary: { type: 'string' }
        },
        required: ['executiveSummary']
      });
      return res.executiveSummary;
    } catch (e) {
      console.warn("LLM exec summary failed", e);
      return "분석 요약 생성에 실패했습니다.";
    }
  }

  /**
   * 정규 질문(canonical)에서 파생되는 니치 질문을 LLM으로 발굴.
   * 정규 질문은 대형 경쟁사가 장악하고 있어 직접 공략이 어려우므로,
   * 연관성 높고 공략 난이도가 낮은 롱테일 질문을 찾아 우회 전략을 제안합니다.
   */
  static async discoverNicheQuestions(
    brandName: string,
    domainSlug: string,
    canonicalQuestions: string[]
  ): Promise<TargetQuestionCandidate[]> {
    const ai = getAIProvider();
    const system = DEEP_DIVE_PROMPTS.nicheDiscovery.system
      .replace(/{brandName}/g, brandName)
      .replace(/{domainSlug}/g, domainSlug);
    const user = DEEP_DIVE_PROMPTS.nicheDiscovery.user
      .replace(/{brandName}/g, brandName)
      .replace(/{domainSlug}/g, domainSlug)
      .replace('{canonicalQuestions}', canonicalQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n'));

    try {
      const res = await ai.generateStructuredOutput<any>(`System:\n${system}\n\nUser:\n${user}`, {
        type: 'object',
        properties: {
          niches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                niche_question: { type: 'string' },
                parent_question: { type: 'string' },
                eeat_dimension: { type: 'string', enum: ['expertise', 'experience', 'authority', 'trust'] },
                rationale: { type: 'string' },
                relevance_to_parent: { type: 'number' },
                estimated_impact: { type: 'number' },
                estimated_difficulty: { type: 'number' }
              },
              required: ['niche_question', 'parent_question', 'eeat_dimension', 'rationale', 'relevance_to_parent', 'estimated_impact', 'estimated_difficulty']
            }
          }
        },
        required: ['niches']
      });

      return res.niches.map((n: any) => ({
        question_text: n.niche_question,
        sources: [{
          type: 'niche_discovery' as const,
          source_detail: n.rationale,
          priority_score: n.estimated_impact
        }],
        // 니치 질문은 impact × (100 - difficulty) / 100로 우선순위 산출 + 관련도 가산
        composite_priority: Math.round(
          n.estimated_impact * (100 - n.estimated_difficulty) / 100 * 0.7 +
          n.relevance_to_parent * 0.3
        ) + 15, // 니치 보너스
        eeat_dimension: n.eeat_dimension as any,
        current_ai_coverage: 'none' as const,
        competitors_owning: [],
        estimated_aepi_impact: n.estimated_impact * 0.3,
        estimated_bdr_delta: n.estimated_impact * 0.15,
        first_mover_window_days: 14, // 니치는 선점 효과가 크므로 짧은 윈도우
        niche_parent_question: n.parent_question,
        niche_difficulty: n.estimated_difficulty,
        niche_relevance: n.relevance_to_parent
      }));
    } catch (e) {
      console.warn("LLM niche discovery failed", e);
      return [];
    }
  }

  /**
   * 브랜드-제품 적합성 필터.
   * GAP 질문이 브랜드의 실제 제품/서비스와 정합하는지 LLM으로 판별.
   * unfit 질문은 제거, partial은 감점 처리.
   */
  static async filterByBrandFit(
    candidates: TargetQuestionCandidate[],
    brandName: string,
    productCategories: string[],
    brandIdentity: string
  ): Promise<TargetQuestionCandidate[]> {
    if (!productCategories?.length && !brandIdentity) {
      // 브랜드 정보가 없으면 필터링 없이 그대로 반환
      return candidates;
    }

    const ai = getAIProvider();
    const system = DEEP_DIVE_PROMPTS.brandFitFilter.system
      .replace(/{brandName}/g, brandName)
      .replace('{productCategories}', productCategories?.join(', ') || '정보 없음')
      .replace('{brandIdentity}', brandIdentity || '정보 없음');
    
    const questionsList = candidates
      .map((c, i) => `[${i}] ${c.question_text}`)
      .join('\n');
    
    const user = DEEP_DIVE_PROMPTS.brandFitFilter.user
      .replace('{candidateQuestions}', questionsList);

    try {
      const res = await ai.generateStructuredOutput<any>(`System:\n${system}\n\nUser:\n${user}`, {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question_index: { type: 'number' },
                fit: { type: 'string', enum: ['fit', 'partial', 'unfit'] },
                reason: { type: 'string' },
                adjusted_priority: { type: 'number' }
              },
              required: ['question_index', 'fit', 'reason', 'adjusted_priority']
            }
          }
        },
        required: ['results']
      });

      // Apply fit adjustments
      const filtered: TargetQuestionCandidate[] = [];
      for (let i = 0; i < candidates.length; i++) {
        const assessment = res.results.find((r: any) => r.question_index === i);
        if (!assessment) {
          // No assessment = keep with original priority
          filtered.push(candidates[i]);
          continue;
        }

        if (assessment.fit === 'unfit') {
          // 부적합 질문 제거 (로그 기록)
          console.log(`[brand-fit] REMOVED: "${candidates[i].question_text}" — ${assessment.reason}`);
          continue;
        }

        const adjusted = { ...candidates[i] };
        if (assessment.fit === 'partial') {
          adjusted.composite_priority = Math.round(adjusted.composite_priority * 0.5);
          adjusted.estimated_bdr_delta = (adjusted.estimated_bdr_delta || 0) * 0.5;
          // 소스에 적합성 감점 이유 추가
          adjusted.sources = [
            ...adjusted.sources,
            {
              type: 'signal_mined' as const,
              source_detail: `⚠️ 부분 적합: ${assessment.reason}`,
              priority_score: adjusted.composite_priority
            }
          ];
        }
        filtered.push(adjusted);
      }

      return filtered;
    } catch (e) {
      console.warn("LLM brand fit filter failed, returning all candidates", e);
      return candidates;
    }
  }
}
