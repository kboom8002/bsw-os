/**
 * lib/benchmark/mention-classifier.ts
 *
 * Sentiment and Context-aware mention classifier for AI responses.
 */

export type MentionStrength = 'strong' | 'neutral' | 'negative';

const NEGATIVE_PATTERNS_KO = [
  '추천하지 않', '비추', '단점', '주의', '피하', '안 좋', '논란',
  '부작용', '자극', '효과가 없', '실망', '개선이 필요', '아쉬', '부담', '아쉽', '호불호'
];
const NEGATIVE_PATTERNS_EN = [
  'not recommend', 'avoid', 'concern', 'drawback', 'caution',
  'side effect', 'irritat', 'disappoint', 'ineffective',
  'unlike', 'not as good', 'lacks', 'inferior', 'falls short',
  'compared poorly', 'doesn\'t have', 'missing', 'limited compared',
  'not suitable', 'better alternatives', 'overrated',
  'overcrowded', 'overtourism', 'polluted', 'unsafe', 'expensive for',
  'not worth', 'skip', 'pass on'
];

const STRONG_PATTERNS_KO = [
  '추천', '최고', '1위', '가장 좋', '강추', '인기', '베스트', '대표', '훌륭', '더 좋', '더 나', '장점', '뛰어'
];
const STRONG_PATTERNS_EN = [
  'recommend', 'best', 'top pick', '#1', 'highly rated', 'popular', 'better', 'excellent',
  'must-visit', 'bucket list', 'hidden gem', 'world-class',
  'stunning', 'unforgettable', 'paradise', 'unmatched',
  'unparalleled', 'premier destination', 'top-rated'
];

export function classifyMention(
  fullText: string,
  brandKeyword: string,
  windowSize: number = 150
): MentionStrength {
  const text = fullText.toLowerCase();
  const kwLower = brandKeyword.toLowerCase();
  const idx = text.indexOf(kwLower);
  
  if (idx === -1) return 'negative'; // not found at all
  
  // Extract context window around the brand mention
  const start = Math.max(0, idx - windowSize);
  const end = Math.min(text.length, idx + kwLower.length + windowSize);
  const context = text.slice(start, end);
  
  // Check negative patterns in context
  const isNegative = [...NEGATIVE_PATTERNS_KO, ...NEGATIVE_PATTERNS_EN]
    .some(p => context.includes(p.toLowerCase()));
  if (isNegative) return 'negative';
  
  // Check strong recommendation patterns
  const isStrong = [...STRONG_PATTERNS_KO, ...STRONG_PATTERNS_EN]
    .some(p => context.includes(p.toLowerCase()));
  if (isStrong) return 'strong';
  
  return 'neutral';
}

export function calcWeightedAAS(
  responseText: string,
  keywords: string[],
  weights = { strong: 1.0, neutral: 0.3, negative: 0.0 }
): { hit: boolean; strength: MentionStrength; weight: number } {
  let bestStrength: MentionStrength = 'negative';
  let bestWeight = 0;
  
  for (const kw of keywords) {
    let matches = false;
    
    // 한국어 포함 키워드는 substring 매칭
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(kw)) {
      matches = responseText.toLowerCase().includes(kw.toLowerCase());
    } else {
      // 영어/ASCII 키워드는 단어 경계 매칭
      const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
      matches = pattern.test(responseText);
    }
    
    if (!matches) continue;

    const strength = classifyMention(responseText, kw);
    const w = weights[strength];
    
    if (w > bestWeight) {
      bestWeight = w;
      bestStrength = strength;
    }
  }
  
  return {
    hit: bestWeight > 0,
    strength: bestStrength,
    weight: bestWeight
  };
}
