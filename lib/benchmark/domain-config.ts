/**
 * lib/benchmark/domain-config.ts
 *
 * 공개 대시보드용 도메인/브랜드 설정 파일.
 * AI 호출 최소화 방침에 따라 텍스트 매칭 기반 AAS/OCR 산출에 활용됩니다.
 */

export interface BrandConfig {
  slug: string;
  name: string;           // 대시보드 표시용 한국어 이름
  name_en: string;        // 영문 표시 이름
  domains: string[];      // OCR 측정용 공식 도메인
  keywords: string[];     // AAS 측정용 브랜드 키워드 (소문자)
  color: string;          // 대시보드 브랜드 컬러
}

export interface DomainConfig {
  slug: string;
  name: string;
  icon: string;
  description: string;
  brands: BrandConfig[];
  sampleQuestionsForLight: number; // Daily 경량 측정 시 샘플링 질문 수
  sampleQuestionsForFull: number;  // Weekly 전체 측정 시 질문 수
  industryType: string;            // INDUSTRY_PANELS_DATA 키
}

export const BENCHMARK_DOMAINS: Record<string, DomainConfig> = {
  skincare: {
    slug: 'skincare',
    name: '스킨케어',
    icon: '🧴',
    description: 'K-뷰티 스킨케어 브랜드 AI 가시성 지표',
    industryType: 'skincare',
    sampleQuestionsForLight: 10,
    sampleQuestionsForFull: 25,
    brands: [
      {
        slug: 'dr-o',
        name: 'DR.O (닥터오)',
        name_en: 'DR.O',
        domains: ['droanswer.com'],
        keywords: ['닥터오', 'dr.o', 'dro', 'droanswer', '더마리셋'],
        color: '#6366f1',
      },
      {
        slug: 'dr-jart',
        name: '닥터자르트',
        name_en: 'Dr. Jart+',
        domains: ['drjart.com', 'drjart.co.kr'],
        keywords: ['닥터자르트', 'dr.jart', 'dr jart', 'drjart'],
        color: '#8b5cf6',
      },
      {
        slug: 'cnp',
        name: 'CNP Laboratory',
        name_en: 'CNP',
        domains: ['cnplaboratory.com', 'cnplab.co.kr'],
        keywords: ['cnp', 'cnp랩', 'cnp laboratory', 'cnplaboratory'],
        color: '#06b6d4',
      },
      {
        slug: 'roundlab',
        name: '라운드랩',
        name_en: 'Round Lab',
        domains: ['roundlab.co.kr'],
        keywords: ['라운드랩', 'round lab', 'roundlab'],
        color: '#10b981',
      },
      {
        slug: 'isoi',
        name: '아이소이',
        name_en: 'isoi',
        domains: ['isoi.co.kr'],
        keywords: ['아이소이', 'isoi', 'i-soi'],
        color: '#f59e0b',
      },
    ],
  },

  wedding_studio: {
    slug: 'wedding_studio',
    name: '웨딩 포토 스튜디오',
    icon: '📸',
    description: '웨딩 포토 스튜디오 브랜드 AI 가시성 지표',
    industryType: 'wedding_studio',
    sampleQuestionsForLight: 10,
    sampleQuestionsForFull: 25,
    brands: [
      {
        slug: 'the-cheongdam-studio',
        name: '더청담스튜디오',
        name_en: 'The Cheongdam Studio',
        domains: ['thecheongdamstudio.com', 'cheongdamstudio.kr'],
        keywords: ['더청담스튜디오', '더청담', '청담스튜디오', 'cheongdam studio', 'thecheongdam'],
        color: '#6366f1',
      },
      {
        slug: 'ephoto-essay',
        name: '이포토에세이',
        name_en: 'E Photo Essay',
        domains: ['ephotooessay.com', 'ephotoessay.co.kr'],
        keywords: ['이포토에세이', '이포토', 'ephotoessay', 'e photo essay', 'e포토에세이'],
        color: '#8b5cf6',
      },
      {
        slug: 'lumiere-studio',
        name: '루미에 스튜디오',
        name_en: 'Lumière Studio',
        domains: ['lumierstudio.kr', 'lumierstudio.com'],
        keywords: ['루미에 스튜디오', '루미에', 'lumiere studio', 'lumière', 'lumierstudio'],
        color: '#ec4899',
      },
      {
        slug: 'roy-studio',
        name: '로이 스튜디오',
        name_en: 'Roy Studio',
        domains: ['roystudio.co.kr', 'roy-studio.com'],
        keywords: ['로이 스튜디오', '로이스튜디오', 'roy studio', 'roystudio'],
        color: '#10b981',
      },
      {
        slug: 'som-studio',
        name: '섬 스튜디오',
        name_en: 'Som Studio',
        domains: ['somstudio.kr', 'som-studio.com'],
        keywords: ['섬 스튜디오', '섬스튜디오', 'som studio', 'somstudio'],
        color: '#f59e0b',
      },
    ],
  },
} as const;

export type DomainSlug = keyof typeof BENCHMARK_DOMAINS;

/**
 * 도메인 slug로 설정 반환
 */
export function getDomainConfig(slug: string): DomainConfig | undefined {
  return BENCHMARK_DOMAINS[slug];
}

/**
 * 모든 도메인 slug 목록
 */
export const ALL_DOMAIN_SLUGS = Object.keys(BENCHMARK_DOMAINS) as DomainSlug[];
