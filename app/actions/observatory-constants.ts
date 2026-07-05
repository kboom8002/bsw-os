/**
 * observatory-constants.ts
 * 
 * 'use server' 파일(observatory.ts)에서 const export가 불가능하므로
 * 상수를 별도 파일로 분리합니다.
 */

// Default proxy caveat text that MUST be included in every report
export const STANDARD_PROXY_CAVEAT = 
  "All AI/search observation metrics are panel-based proxies under this specific methodology and measurement period. " +
  "These observed AI/search-like responses and observed answer shares do not constitute true market share, definitive AI ranking, " +
  "actual AI preference, or guaranteed visibility, and they do not prove consumer preference.";
