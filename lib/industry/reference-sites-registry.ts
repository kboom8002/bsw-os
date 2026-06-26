// lib/industry/reference-sites-registry.ts
// 업종별 레퍼런스 사이트 레지스트리
// tier: excellent(우수) / average(평균) / poor(미흡)

import { MacroCategoryKey } from './industry-taxonomy';

export interface ReferenceSite {
  id: string;          // 고유 식별자 (영문 slug)
  url: string;
  brandName: string;
  tier: 'excellent' | 'average' | 'poor';
  subIndustryKey: string;
  macroKey?: MacroCategoryKey;
  curatorNotes?: string;
}

export const REFERENCE_SITES: Record<string, ReferenceSite[]> = {
  // ─────────────────────────────────────────────────────
  // 스킨케어 (skincare)
  // 큐레이션 기준:
  //   excellent: 글로벌 K-Beauty 브랜드, JSON-LD 풍부, 다국어, FAQ/Product 스키마 완비
  //   average: 국내 중견 브랜드, 일부 스키마, OG 부분 적용
  //   poor: 소규모 브랜드, HTML-only, 스키마 미적용
  // ─────────────────────────────────────────────────────
  skincare: [
    // === Excellent (우수) ===
    {
      id: 'laneige',
      url: 'https://www.laneige.com',
      brandName: 'LANEIGE',
      tier: 'excellent',
      subIndustryKey: 'skincare',
      curatorNotes: '아모레퍼시픽 산하 글로벌 브랜드. Organization + Product + Article 스키마 완비, 다국어 hreflang, OG 완비, SSR, TTFB 우수',
    },
    {
      id: 'drjart',
      url: 'https://www.drjart.com',
      brandName: 'Dr.Jart+',
      tier: 'excellent',
      subIndustryKey: 'skincare',
      curatorNotes: '에스티로더 산하 글로벌 K-Beauty. Product + FAQ 스키마, BreadcrumbList, 풍부한 Review 신호, AggregateRating 적용',
    },
    {
      id: 'innisfree',
      url: 'https://www.innisfree.com',
      brandName: 'Innisfree',
      tier: 'excellent',
      subIndustryKey: 'skincare',
      curatorNotes: '아모레퍼시픽 산하. 강력한 Organization sameAs (SNS 5종), HowTo 스키마, 토픽 클러스터 구조 우수',
    },
    // === Average (평균) ===
    {
      id: 'roundlab',
      url: 'https://www.roundlab.co.kr',
      brandName: '라운드랩',
      tier: 'average',
      subIndustryKey: 'skincare',
      curatorNotes: '성분 중심 국내 브랜드. Organization 스키마 있으나 sameAs 부족, OG 부분 적용, FAQ 미사용',
    },
    {
      id: 'cnpcosmetics',
      url: 'https://www.cnpcosmetics.com',
      brandName: 'CNP Laboratory',
      tier: 'average',
      subIndustryKey: 'skincare',
      curatorNotes: '더마 코스메틱. Product 스키마 일부 적용, 저자 정보 부족, Answer-First 문체 미흡',
    },
    {
      id: 'goodal',
      url: 'https://www.goodal.com',
      brandName: 'Goodal',
      tier: 'average',
      subIndustryKey: 'skincare',
      curatorNotes: '클리오 산하. OG 태그 부분 적용, FAQ 스키마 미적용, 콘텐츠 갱신 주기 불규칙',
    },
    // === Poor (미흡) ===
    {
      id: 'cosrx',
      url: 'https://www.cosrx.com',
      brandName: 'COSRX',
      tier: 'poor',
      subIndustryKey: 'skincare',
      curatorNotes: '해외 유명세 대비 웹사이트 기술 최적화 미흡. JSON-LD 부재, robots.txt AI 봇 설정 없음, CSR 방식',
    },
    {
      id: 'anua',
      url: 'https://anuaofficial.com',
      brandName: 'ANUA',
      tier: 'poor',
      subIndustryKey: 'skincare',
      curatorNotes: '신흥 브랜드. 스키마 미적용, 내부 링크 구조 취약, E-E-A-T 신호 전무, 토픽 클러스터 없음',
    },
    {
      id: 'mixsoon',
      url: 'https://www.mixsoon.co.kr',
      brandName: 'MIXSOON',
      tier: 'poor',
      subIndustryKey: 'skincare',
      curatorNotes: '비건 성분 브랜드. HTML only, Organization 스키마 없음, OG 태그 미비, TTFB 느림',
    },
  ],

  // ─────────────────────────────────────────────────────
  // 웨딩스튜디오 (wedding_studio) — 추후 시드 제공 예정
  // ─────────────────────────────────────────────────────
  wedding_studio: [],

  // ─────────────────────────────────────────────────────
  // 기타 업종 — 추후 시드 제공 예정
  // ─────────────────────────────────────────────────────
};

/**
 * 세부 업종 키로 레퍼런스 사이트 목록을 반환
 */
export function getReferenceSitesBySubIndustry(subIndustryKey: string): ReferenceSite[] {
  return REFERENCE_SITES[subIndustryKey] ?? [];
}

/**
 * 활성 레퍼런스 사이트가 있는 업종 키 목록 반환
 */
export function getSeededSubIndustryKeys(): string[] {
  return Object.entries(REFERENCE_SITES)
    .filter(([, sites]) => sites.length >= 3)
    .map(([key]) => key);
}
