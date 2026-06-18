import type { QuestionDetail } from './lightweight-metric-runner';
import type { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import type { BrandConfig } from './domain-config';

export interface PerLayerMetrics {
  iri: number; // Industry Readiness Index
  bdr: number; // Brand Defense Rate
  cwr: number; // Competitive Win Rate
  opp: number; // Opportunity Score
}

const GENERIC_LAYERS = new Set(['L1_universal', 'L3_ingredient', 'L5_ymyl', 'L6_trend']);

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
  for (const q of l2Questions) {
    let won = false;
    if (engine === 'composite') {
      for (const eng of Object.keys(q.per_engine)) {
        const brands = q.per_engine[eng].brands_mentioned;
        const text = q.per_engine[eng].raw_response_text || '';
        if (brands.includes(brand.name)) {
           // Find first mention index of the brand
           const brandIdx = text.toLowerCase().indexOf(brand.name.toLowerCase());
           // Find first mention index of any competitor mentioned
           let isFirst = true;
           for (const b of brands) {
             if (b !== brand.name) {
               const bIdx = text.toLowerCase().indexOf(b.toLowerCase());
               if (bIdx !== -1 && brandIdx !== -1 && bIdx < brandIdx) {
                 isFirst = false;
                 break;
               }
             }
           }
           if (isFirst) {
             won = true;
             break;
           }
        }
      }
    } else {
      if (q.per_engine[engine]) {
        const brands = q.per_engine[engine].brands_mentioned;
        const text = q.per_engine[engine].raw_response_text || '';
        if (brands.includes(brand.name)) {
           const brandIdx = text.toLowerCase().indexOf(brand.name.toLowerCase());
           let isFirst = true;
           for (const b of brands) {
             if (b !== brand.name) {
               const bIdx = text.toLowerCase().indexOf(b.toLowerCase());
               if (bIdx !== -1 && brandIdx !== -1 && bIdx < brandIdx) {
                 isFirst = false;
                 break;
               }
             }
           }
           if (isFirst) {
             won = true;
           }
        }
      }
    }
    if (won) l2Won++;
  }

  const cwr = l2Questions.length > 0
    ? (l2Won / l2Questions.length) * 100
    : 0;

  return {
    iri: parseFloat(iri.toFixed(1)),
    bdr: parseFloat(bdr.toFixed(1)),
    cwr: parseFloat(cwr.toFixed(1)),
    opp: parseFloat(opp.toFixed(1))
  };
}
