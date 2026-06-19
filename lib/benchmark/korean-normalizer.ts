/**
 * 한국어 텍스트 정규화 유틸리티
 * - 조사(particle) 스트리핑
 * - 복합 조사 처리 (에서, 까지, 부터, 마저, 조차, 이라도)
 * - 유니코드 자모 분리 fallback
 */

// 1글자 조사 (빈도순)
const SINGLE_PARTICLES = /[은는이가을를의에서로와과도만]/g;

// 2글자 복합 조사
const COMPOUND_PARTICLES = /(에서|까지|부터|마저|조차|이라|에게|한테|처럼|만큼|대로|밖에)$/g;

// 초성 분리 (ㄱ=0x3131, 가=0xAC00)
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function normalizeKorean(text: string): string {
  return text
    .replace(COMPOUND_PARTICLES, '')
    .replace(SINGLE_PARTICLES, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractChosung(text: string): string {
  return [...text].map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      return CHOSUNG[Math.floor((code - 0xAC00) / 588)];
    }
    return ch;
  }).join('');
}

/**
 * 3단계 한국어 퍼지 매칭
 * 1. 조사 제거 후 문자열 포함 검사
 * 2. 단어 분리 후 80% 매칭
 * 3. 초성 매칭 (최종 fallback)
 */
export function fuzzyKoreanMatch(target: string, response: string): boolean {
  const normTarget = normalizeKorean(target.toLowerCase());
  const normResponse = normalizeKorean(response.toLowerCase());
  
  // 1차: 정규화된 문자열 포함 검사
  if (normResponse.includes(normTarget)) return true;
  
  // 2차: 단어 단위 분리 후 80% 매칭
  const targetWords = normTarget.split(/\s+/).filter(w => w.length > 1);
  if (targetWords.length === 0) return false;
  const matchCount = targetWords.filter(w => normResponse.includes(w)).length;
  if (matchCount / targetWords.length >= 0.8) return true;
  
  // 3차: 초성 매칭 (마지막 fallback, 3글자 이상만)
  const chosungTarget = extractChosung(normTarget);
  const chosungResponse = extractChosung(normResponse);
  if (chosungTarget.length >= 3 && chosungResponse.includes(chosungTarget)) return true;
  
  return false;
}
