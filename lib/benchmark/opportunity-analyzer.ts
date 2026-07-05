import { QuestionDetail } from './lightweight-metric-runner';

export interface BrandOpportunity {
  type: 'gap' | 'volatile' | 'weak_mention' | 'dominance' | 'blind_spot';
  severity: 'high' | 'medium' | 'low';
  question_text: string;
  question_type: string;
  competitors_present: string[];      // For gap/volatile/weak
  engines_with_mention: string[];     // Which engines mentioned the brand
  eeat_dimension: 'expertise' | 'experience' | 'authority' | 'trust';
  recommendation_ko: string;          // Actionable advice
  priority_score: number;             // 0-100
}

export interface BrandOpportunityReport {
  brand_slug: string;
  brand_name: string;
  total_opportunities: number;
  high_priority_count: number;
  opportunities: BrandOpportunity[];
  eeat_summary: {
    expertise_gaps: number;
    experience_gaps: number;
    authority_gaps: number;
    trust_gaps: number;
  };
  top_action_items: string[];
  auto_generated_signals?: { query: string; intent: string; source: string }[];
}

function mapQuestionTypeToEeat(qType: string): 'expertise' | 'experience' | 'authority' | 'trust' {
  switch (qType) {
    case 'recommendation':
    case 'informational':
      return 'expertise';
    case 'comparison':
    case 'source_seeking':
      return 'authority';
    case 'routine_guidance':
    case 'product_fit':
      return 'experience';
    case 'risk_boundary':
    case 'trust_verification':
      return 'trust';
    default:
      return 'expertise';
  }
}

export class OpportunityAnalyzer {
  public static analyze(
    targetBrandName: string,
    targetBrandSlug: string,
    currentDetails: QuestionDetail[],
    historicalDetails?: QuestionDetail[] // For inter-run volatility
  ): BrandOpportunityReport {
    
    const opportunities: BrandOpportunity[] = [];
    const eeatCounts = { expertise: 0, experience: 0, authority: 0, trust: 0 };
    const autoSignals: { query: string; intent: string; source: string }[] = [];

    for (const q of currentDetails) {
      const engines = Object.keys(q.per_engine);
      if (engines.length === 0) continue;

      let mentionedInCurrentAnyEngine = false;
      const allCompetitorsSet = new Set<string>();
      const enginesWithMention: string[] = [];

      for (const eng of engines) {
        const brands = q.per_engine[eng].brands_mentioned;
        for (const b of brands) {
          if (b === targetBrandName) {
            mentionedInCurrentAnyEngine = true;
            enginesWithMention.push(eng);
          } else {
            allCompetitorsSet.add(b);
          }
        }
      }

      const competitorsPresent = Array.from(allCompetitorsSet);
      const eeatDim = mapQuestionTypeToEeat(q.question_type);
      const isHighIntent = q.question_type === 'recommendation' || q.question_type === 'comparison';

      // 1. GAP Detection: target brand is missing, but competitors are present
      if (!mentionedInCurrentAnyEngine && competitorsPresent.length > 0) {
        // LLM Judge가 명시적으로 경쟁사 우위를 판정했는지 확인
        const llmConfirmsCompetitorWin = Object.values(q.per_engine).some(
          e => e.llm_cwr_winner && e.llm_cwr_winner !== targetBrandName && e.llm_cwr_winner !== 'tie'
        );

        // If it's a high intent question or LLM Judge confirms competitor win, it's a high severity gap
        const severity = (isHighIntent || llmConfirmsCompetitorWin) ? 'high' : 'medium';
        const priority = (isHighIntent || llmConfirmsCompetitorWin) ? 90 : 60;
        
        let advice = `경쟁사(${competitorsPresent.slice(0, 2).join(', ')} 등)가 등장했지만 자사 브랜드는 누락되었습니다. 관련 키워드 콘텐츠 최적화가 필요합니다.`;
        if (eeatDim === 'expertise') advice = `전문성(Expertise) 신호 부족: 해당 주제에 대한 임상/성분 데이터를 구조화하여 발행하세요. (${competitorsPresent[0]} 등 경쟁사 우위)`;
        if (eeatDim === 'authority') advice = `권위(Authority) 신호 부족: 객관적 비교 리뷰나 랭킹 사이트에서의 자사 언급량을 늘리세요.`;

        opportunities.push({
          type: 'gap', severity, priority_score: priority,
          question_text: q.question_text, question_type: q.question_type,
          competitors_present: competitorsPresent, engines_with_mention: [],
          eeat_dimension: eeatDim, recommendation_ko: advice
        });
        
        if (severity === 'high') {
           if (eeatDim === 'expertise') eeatCounts.expertise++;
           if (eeatDim === 'experience') eeatCounts.experience++;
           if (eeatDim === 'authority') eeatCounts.authority++;
           if (eeatDim === 'trust') eeatCounts.trust++;
           
           // AUTO-PILOT: GAP -> Signal
           autoSignals.push({
             query: q.question_text,
             intent: q.question_type,
             source: 'benchmark_opportunity_gap'
           });
        }
        continue; // If it's a gap, it can't be weak or dominance
      }

      // 2. DOMINANCE: only target brand is mentioned
      if (mentionedInCurrentAnyEngine && competitorsPresent.length === 0) {
        opportunities.push({
          type: 'dominance', severity: 'low', priority_score: 30,
          question_text: q.question_text, question_type: q.question_type,
          competitors_present: [], engines_with_mention: enginesWithMention,
          eeat_dimension: eeatDim, 
          recommendation_ko: `현재 AI가 자사 브랜드만 단독 추천/언급하고 있습니다. 이 영역의 콘텐츠 지배력을 계속 유지하세요.`
        });
        continue;
      }

      // 3. BLIND SPOT: no brands mentioned at all (across the panel)
      if (!mentionedInCurrentAnyEngine && competitorsPresent.length === 0) {
        if (isHighIntent) {
          opportunities.push({
            type: 'blind_spot', severity: 'medium', priority_score: 50,
            question_text: q.question_text, question_type: q.question_type,
            competitors_present: [], engines_with_mention: [],
            eeat_dimension: eeatDim, 
            recommendation_ko: `패널 내 어떤 브랜드도 언급되지 않은 기회 영역(블루오션)입니다. 먼저 콘텐츠를 점유하면 즉각적인 AI 노출이 가능합니다.`
          });
          
          // AUTO-PILOT: BLIND SPOT -> Signal
          autoSignals.push({
            query: q.question_text,
            intent: q.question_type,
            source: 'benchmark_opportunity_blind_spot'
          });
        }
        continue;
      }

      // 4. WEAK MENTION: mentioned, but snippet shows low BSF or just a passing mention
      // Simple heuristic: if BSF is very low despite mention
      if (mentionedInCurrentAnyEngine && competitorsPresent.length > 0) {
         let avgBsf = 0;
         for (const eng of enginesWithMention) {
           // LLM Judge가 매긴 bsf_score가 존재한다면 우선 반영
           const engineBsf = q.per_engine[eng].llm_bsf_score !== undefined
             ? q.per_engine[eng].llm_bsf_score!
             : q.per_engine[eng].bsf_score;
           avgBsf += engineBsf;
         }
         avgBsf = avgBsf / enginesWithMention.length;

         if (avgBsf < 30) {
           opportunities.push({
            type: 'weak_mention', severity: 'medium', priority_score: 70,
            question_text: q.question_text, question_type: q.question_type,
            competitors_present: competitorsPresent, engines_with_mention: enginesWithMention,
            eeat_dimension: eeatDim, 
            recommendation_ko: `브랜드가 언급은 되었으나 상세 설명(Fidelity)이 부족합니다. 단순히 이름만 나열되지 않도록 제품의 특장점이나 리뷰를 결합한 정보 배포가 필요합니다.`
          });
         }
      }

      // 5. VOLATILITY: Inter-run or Inter-engine
      // If historical data is provided, check if it was mentioned before but not now
      if (historicalDetails) {
         const pastQ = historicalDetails.find(hq => hq.question_text === q.question_text);
         if (pastQ) {
            let mentionedInPast = false;
            for (const eng of Object.keys(pastQ.per_engine)) {
               if (pastQ.per_engine[eng].brands_mentioned.includes(targetBrandName)) {
                 mentionedInPast = true;
               }
            }
            if (mentionedInPast && !mentionedInCurrentAnyEngine) {
               opportunities.push({
                type: 'volatile', severity: 'high', priority_score: 85,
                question_text: q.question_text, question_type: q.question_type,
                competitors_present: competitorsPresent, engines_with_mention: [],
                eeat_dimension: eeatDim, 
                recommendation_ko: `[경고] 이전 측정에서는 언급되었으나 이번 실행에서는 누락되었습니다. AI 검색 결과 상단에서 자사 콘텐츠가 밀려났을 가능성이 큽니다.`
              });
            }
         }
      } else {
        // Fallback to inter-engine volatility if no history
        if (mentionedInCurrentAnyEngine && enginesWithMention.length < engines.length) {
          opportunities.push({
            type: 'volatile', severity: 'medium', priority_score: 65,
            question_text: q.question_text, question_type: q.question_type,
            competitors_present: competitorsPresent, engines_with_mention: enginesWithMention,
            eeat_dimension: eeatDim, 
            recommendation_ko: `엔진간 일관성 부족: ${enginesWithMention.join(', ')} 에서는 언급되나 다른 엔진에서는 누락됩니다. 크로스 플랫폼 출처 확보가 필요합니다.`
          });
        }
      }
    }

    // Sort opportunities by priority score descending
    opportunities.sort((a, b) => b.priority_score - a.priority_score);

    // Generate top action items based on E-E-A-T gaps
    const actionItems = [];
    if (eeatCounts.expertise > 0) actionItems.push('성분, 기술력, 임상 데이터를 강조하는 백서/블로그 배포 (Expertise 강화)');
    if (eeatCounts.authority > 0) actionItems.push('타사 제품과의 객관적 비교 리뷰, 미디어 노출 증대 (Authority 확보)');
    if (eeatCounts.experience > 0) actionItems.push('실제 사용자 리뷰와 비포/애프터 사례를 구조화된 데이터로 배포 (Experience 강조)');
    if (eeatCounts.trust > 0) actionItems.push('전문가(의사/약사) 추천 및 안전성 검증 정보 강조 (Trust 증진)');

    if (actionItems.length === 0 && opportunities.length > 0) {
      actionItems.push('현재 수준의 AI 브랜드 점유율을 유지하기 위해 지속적인 신제품 리뷰 모니터링 필요');
    }

    return {
      brand_slug: targetBrandSlug,
      brand_name: targetBrandName,
      total_opportunities: opportunities.length,
      high_priority_count: opportunities.filter(o => o.severity === 'high').length,
      opportunities,
      eeat_summary: {
        expertise_gaps: eeatCounts.expertise,
        experience_gaps: eeatCounts.experience,
        authority_gaps: eeatCounts.authority,
        trust_gaps: eeatCounts.trust
      },
      top_action_items: actionItems.slice(0, 3),
      auto_generated_signals: autoSignals
    };
  }
}
