import type { QuestionDetail } from './lightweight-metric-runner';
import type { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import type { BrandConfig } from './domain-config';
import { classifyMention } from './mention-classifier';

export interface PerLayerMetrics {
  iri: number; // Industry Readiness Index
  bdr: number; // Brand Defense Rate
  cwr: number; // Competitive Win Rate
  opp: number; // Opportunity Score
  top3: number; // Top-3 Presence Rate (0-100)
  top5: number; // Top-5 Presence Rate (0-100)
}

/**
 * AI 응답 텍스트 내에서 브랜드의 언급 순위(포지션)를 산출합니다.
 * indexOf 기반으로 첫 등장 순서를 측정합니다.
 *
 * @param responseText - AI 응답 원문
 * @param targetBrand - 대상 브랜드명
 * @param allMentionedBrands - 해당 응답에서 언급된 전체 브랜드 목록
 * @returns 1-based 포지션 (언급 안 됐으면 Infinity)
 */
export function getBrandPosition(
  responseText: string,
  targetBrand: string,
  allMentionedBrands: string[]
): number {
  const lower = responseText.toLowerCase();
  const positions = allMentionedBrands
    .map(b => ({ brand: b, idx: lower.indexOf(b.toLowerCase()) }))
    .filter(p => p.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  const rank = positions.findIndex(p => p.brand === targetBrand);
  return rank === -1 ? Infinity : rank + 1; // 1-based
}

const GENERIC_LAYERS = new Set(['L1_universal', 'L3_ingredient', 'L4_journey', 'L5_ymyl', 'L6_trend']);

export function calculatePerLayerMetrics(
  brand: BrandConfig,
  details: QuestionDetail[],
  originalQuestions: SeedProbeQuestion[],
  engine: string = 'composite' // If 'composite', we check if any engine mentioned it
): PerLayerMetrics {
  
  // 1. Generic Questions (IRI & OPP)
  const genericQuestions = details.filter(d => GENERIC_LAYERS.has(d.layer) || !d.layer || d.layer === 'unknown');
  let genericAnyBrandMentioned = 0;
  
  for (const q of genericQuestions) {
    let mentionedAny = false;
    if (engine === 'composite') {
      // Check all engines
      for (const eng of Object.keys(q.per_engine)) {
        if (q.per_engine[eng].brands_mentioned.length > 0) {
          mentionedAny = true;
          break;
        }
      }
    } else {
      if (q.per_engine[engine] && q.per_engine[engine].brands_mentioned.length > 0) {
        mentionedAny = true;
      }
    }
    if (mentionedAny) {
      genericAnyBrandMentioned++;
    }
  }

  const iri = genericQuestions.length > 0 
    ? (genericAnyBrandMentioned / genericQuestions.length) * 100 
    : 0;
  const opp = genericQuestions.length > 0
    ? ((genericQuestions.length - genericAnyBrandMentioned) / genericQuestions.length) * 100
    : 0;

  // 2. L7 Brand Defense Rate (BDR)
  const l7Questions = details.filter(d => {
    if (d.layer !== 'L7_brand') return false;
    const origQ = originalQuestions.find(oq => oq.question_text === d.question_text) as any;
    if (!origQ) return false;
    // Check if the explicitly injected target_brand matches, or fallback
    return origQ.target_brand === brand.name || origQ.target_keyword.includes(brand.name) || origQ.target_keyword.includes(brand.name_en) || origQ.target_keyword === '{brand}';
  });

  let l7Defended = 0;
  for (const q of l7Questions) {
    let defended = false;
    if (engine === 'composite') {
      for (const eng of Object.keys(q.per_engine)) {
        if (q.per_engine[eng].brands_mentioned.includes(brand.name)) {
          defended = true;
          break;
        }
      }
    } else {
      if (q.per_engine[engine] && q.per_engine[engine].brands_mentioned.includes(brand.name)) {
        defended = true;
      }
    }
    if (defended) l7Defended++;
  }

  const bdr = l7Questions.length > 0
    ? (l7Defended / l7Questions.length) * 100
    : 0;

  // 3. L2 Competitive Win Rate (CWR)
  const l2Questions = details.filter(d => {
    if (d.layer !== 'L2_competitive') return false;
    const origQ = originalQuestions.find(oq => oq.question_text === d.question_text) as any;
    if (!origQ) return false;
    // target_brand (The one being compared)
    return origQ.target_brand === brand.name || origQ.must_include.some((term: string) => term.includes(brand.name) || term.includes('{brand}')) ||
           origQ.target_keyword.includes(brand.name) || origQ.target_keyword.includes('{brand}');
  });

  let l2Won = 0;
  let l2InTop3 = 0;
  let l2InTop5 = 0;
  for (const q of l2Questions) {
    let won = false;
    let targetText = '';
    let targetBrands: string[] = [];
    let llmWinner: string | undefined;

    if (engine === 'composite') {
      for (const eng of Object.keys(q.per_engine)) {
        if (q.per_engine[eng].brands_mentioned.includes(brand.name)) {
          targetText = q.per_engine[eng].raw_response_text || '';
          targetBrands = q.per_engine[eng].brands_mentioned;
          llmWinner = q.per_engine[eng].llm_cwr_winner;
          break; // Use the first engine where the brand was mentioned for sentiment analysis
        }
      }
    } else {
      if (q.per_engine[engine] && q.per_engine[engine].brands_mentioned.includes(brand.name)) {
        targetText = q.per_engine[engine].raw_response_text || '';
        targetBrands = q.per_engine[engine].brands_mentioned;
        llmWinner = q.per_engine[engine].llm_cwr_winner;
      }
    }

    if (llmWinner) {
      if (llmWinner === brand.name || llmWinner.includes(brand.name)) {
        won = true;
      }
    } else if (targetText && targetBrands.includes(brand.name)) {
      const mySentiment = classifyMention(targetText, brand.name);
      
      let betterCompetitorFound = false;
      for (const b of targetBrands) {
        if (b !== brand.name) {
          const compSentiment = classifyMention(targetText, b);
          // If competitor has 'strong' and we only have 'neutral'/'negative', we lose
          if (compSentiment === 'strong' && mySentiment !== 'strong') {
            betterCompetitorFound = true;
            break;
          }
          // If both have same sentiment, fallback to indexOf
          if (compSentiment === mySentiment) {
            const myIdx = targetText.toLowerCase().indexOf(brand.name.toLowerCase());
            const compIdx = targetText.toLowerCase().indexOf(b.toLowerCase());
            if (compIdx !== -1 && myIdx !== -1 && compIdx < myIdx) {
              betterCompetitorFound = true;
              break;
            }
          }
        }
      }
      if (!betterCompetitorFound && mySentiment !== 'negative') {
        won = true;
      }
    }
    if (won) l2Won++;

    // ── Top-N Position 산출 ──
    // 응답 텍스트에서 모든 언급 브랜드의 등장 순서 기반 포지션 결정
    if (targetText && targetBrands.includes(brand.name)) {
      const position = getBrandPosition(targetText, brand.name, targetBrands);
      if (position <= 3) l2InTop3++;
      if (position <= 5) l2InTop5++;
    }
  }

  const cwr = l2Questions.length > 0
    ? (l2Won / l2Questions.length) * 100
    : 0;

  const top3 = l2Questions.length > 0
    ? (l2InTop3 / l2Questions.length) * 100
    : 0;
  const top5 = l2Questions.length > 0
    ? (l2InTop5 / l2Questions.length) * 100
    : 0;

  return {
    iri: parseFloat(iri.toFixed(1)),
    bdr: parseFloat(bdr.toFixed(1)),
    cwr: parseFloat(cwr.toFixed(1)),
    opp: parseFloat(opp.toFixed(1)),
    top3: parseFloat(top3.toFixed(1)),
    top5: parseFloat(top5.toFixed(1)),
  };
}
