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
  comparative_pairs?: string[]; // 전략적 고정 비교 대상 (slug)
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
  deep_dive_enabled?: boolean;     // Client Deep Dive 지원 여부
}

export const BENCHMARK_DOMAINS: Record<string, DomainConfig> = {
  skincare: {
    slug: 'skincare',
    name: '스킨케어',
    icon: '🧴',
    description: 'K-뷰티 스킨케어 브랜드 AI 가시성 지표',
    industryType: 'skincare',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 60,
    sampleQuestionsForFull: 80,
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
      // ── 확장 패널: AI 실제 추천 브랜드 (2026-06 실측 기반 추가) ──
      {
        slug: 'aestura',
        name: '에스트라',
        name_en: 'Aestura',
        domains: ['aestura.com', 'aestura.co.kr'],
        keywords: ['에스트라', 'aestura', '아토베리어', 'atobarrier'],
        color: '#0ea5e9',
      },
      {
        slug: 'drg',
        name: '닥터지',
        name_en: 'Dr.G',
        domains: ['dr-g.com', 'drg.co.kr'],
        keywords: ['닥터지', 'dr.g', 'drg', 'doctor g'],
        color: '#22c55e',
      },
      {
        slug: 'torriden',
        name: '토리든',
        name_en: 'Torriden',
        domains: ['torriden.com', 'torriden.co.kr'],
        keywords: ['토리든', 'torriden'],
        color: '#a855f7',
      },
      {
        slug: 'illiyoon',
        name: '일리윤',
        name_en: 'Illiyoon',
        domains: ['illiyoon.com'],
        keywords: ['일리윤', 'illiyoon'],
        color: '#f97316',
      },
      {
        slug: 'physiogel',
        name: '피지오겔',
        name_en: 'Physiogel',
        domains: ['physiogel.co.kr', 'physiogel.com'],
        keywords: ['피지오겔', 'physiogel'],
        color: '#14b8a6',
      },
      {
        slug: 'cosrx',
        name: 'COSRX',
        name_en: 'COSRX',
        domains: ['cosrx.com', 'cosrx.co.kr'],
        keywords: ['코스알엑스', 'cosrx', 'cos rx'],
        color: '#ef4444',
      },
      {
        slug: 'innisfree',
        name: '이니스프리',
        name_en: 'Innisfree',
        domains: ['innisfree.com', 'innisfree.co.kr'],
        keywords: ['이니스프리', 'innisfree'],
        color: '#84cc16',
      },
      {
        slug: 'atopalm',
        name: '아토팜',
        name_en: 'Atopalm',
        domains: ['atopalm.co.kr', 'atopalm.com'],
        keywords: ['아토팜', 'atopalm'],
        color: '#f43f5e',
      },
      {
        slug: 'numbuzin',
        name: '넘버즈인',
        name_en: 'Numbuzin',
        domains: ['numbuzin.com', 'numbuzin.co.kr'],
        keywords: ['넘버즈인', 'numbuzin'],
        color: '#d946ef',
      },
      {
        slug: 'lrp',
        name: '라로슈포제',
        name_en: 'La Roche-Posay',
        domains: ['laroche-posay.co.kr', 'laroche-posay.com'],
        keywords: ['라로슈포제', 'la roche-posay', 'laroche posay', 'lrp'],
        color: '#1d4ed8',
      },
      {
        slug: 'medicube',
        name: '메디큐브',
        name_en: 'Medicube',
        domains: ['medicube.net', 'medicube.co.kr'],
        keywords: ['메디큐브', 'medicube', 'medi cube'],
        color: '#dc2626',
      },
      {
        slug: 'dalba',
        name: '달바',
        name_en: "d'Alba",
        domains: ['dalba.co.kr', 'dalba.com'],
        keywords: ['달바', "d'alba", 'dalba'],
        color: '#fbbf24',
      },
      {
        slug: 'manyo',
        name: '마녀공장',
        name_en: 'Manyo Factory',
        domains: ['manyofactory.com', 'manyofactory.co.kr'],
        keywords: ['마녀공장', 'manyo factory', 'manyo', '마녀'],
        color: '#7c3aed',
      },
      {
        slug: 'beplain',
        name: '비플레인',
        name_en: 'Beplain',
        domains: ['beplain.com', 'beplain.co.kr'],
        keywords: ['비플레인', 'beplain'],
        color: '#16a34a',
      },
      {
        slug: 'etude',
        name: '에뛰드',
        name_en: 'Etude',
        domains: ['etude.com', 'etude.co.kr'],
        keywords: ['에뛰드', 'etude', 'etude house'],
        color: '#ec4899',
      },
    ],
  },

  wedding_studio: {
    slug: 'wedding_studio',
    name: '웨딩 포토 스튜디오',
    icon: '📸',
    description: '웨딩 포토 스튜디오 브랜드 AI 가시성 지표',
    industryType: 'wedding_studio',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 40,
    sampleQuestionsForFull: 45,
    brands: [
      {
        slug: 'the-cheongdam-studio',
        name: '더청담스튜디오',
        name_en: 'The Cheongdam Studio',
        domains: ['thechungdamstudio.com', 'thecheongdamstudio.com'],
        keywords: ['더청담스튜디오', '더청담', '청담스튜디오', 'cheongdam studio', 'chungdam studio', 'thecheongdam', 'thechungdam'],
        color: '#6366f1',
      },
      {
        slug: 'ephoto-essay',
        name: '이포토에세이',
        name_en: 'E Photo Essay',
        domains: ['ephotoessay.com', 'ephotoessay.co.kr'],
        keywords: ['이포토에세이', '이포토', 'ephotoessay', 'e photo essay', 'e포토에세이', 'e-photo essay'],
        color: '#8b5cf6',
      },
      {
        slug: 'lumiere-studio',
        name: '루미에 스튜디오',
        name_en: 'Lumière Studio',
        domains: ['lumierestudio.co.kr', 'lumierestudio.com', 'lumierstudio.kr'],
        keywords: ['루미에 스튜디오', '루미에', 'lumiere studio', 'lumière studio', 'lumierestudio', 'lumierstudio'],
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
        keywords: ['섬 스튜디오', '섬스튜디오', 'somstudio', 'som studio', '하남 섬 스튜디오'],
        color: '#f59e0b',
      },
      {
        slug: 'gaeul-studio',
        name: '가을스튜디오',
        name_en: 'Gaeul Studio',
        domains: ['gaeulstudio.com', 'gaeulstudio.co.kr'],
        keywords: ['가을스튜디오', '가을 스튜디오', 'gaeul studio'],
        color: '#f43f5e',
      },
      {
        slug: 'wonkyu-studio',
        name: '원규스튜디오',
        name_en: 'Wonkyu Studio',
        domains: ['wonkyu.co.kr', 'wonkyu.com'],
        keywords: ['원규스튜디오', '원규 스튜디오', 'wonkyu', '원규 노블레스', '원규 디퍼런스'],
        color: '#0ea5e9',
      },
      {
        slug: 'sullem-studio',
        name: '설렘매력주의보',
        name_en: 'Sullem Studio',
        domains: ['sullem.co.kr', 'sullemstudio.com'],
        keywords: ['설렘매력주의보', '설렘스튜디오', '설렘 매력 주의보', 'sullem'],
        color: '#fb7185',
      },
      {
        slug: 'may-studio',
        name: '메이스튜디오',
        name_en: 'May Studio',
        domains: ['maystudio.co.kr', 'maystudio.com'],
        keywords: ['메이스튜디오', '메이 스튜디오', 'may studio'],
        color: '#10b981',
      },
      {
        slug: 'forevermine-studio',
        name: '포에버마인스튜디오',
        name_en: 'Forever Mine Studio',
        domains: ['forevermine.co.kr', 'foreverminestudio.com'],
        keywords: ['포에버마인스튜디오', '포에버마인', 'forever mine', 'forevermine'],
        color: '#4b5563',
      },
      {
        slug: 'dalbit-scooter',
        name: '달빛스쿠터',
        name_en: 'Dalbit Scooter',
        domains: ['dalbitscooter.co.kr', 'dalbit-scooter.com'],
        keywords: ['달빛스쿠터', '달빛 스쿠터', 'dalbit scooter', '달스'],
        color: '#fbbf24',
      },
      {
        slug: 'terrace-studio',
        name: '테라스스튜디오',
        name_en: 'Terrace Studio',
        domains: ['terracestudio.co.kr', 'terracestudio.com'],
        keywords: ['테라스스튜디오', '테라스 스튜디오', 'terrace studio'],
        color: '#f97316',
      },
      {
        slug: 'spazio-studio',
        name: '스파지오스튜디오',
        name_en: 'Spazio Studio',
        domains: ['spaziostudio.co.kr', 'spazio-studio.com'],
        keywords: ['스파지오스튜디오', '스파지오 스튜디오', 'spazio studio', '스파지오'],
        color: '#84cc16',
      },
      {
        slug: 'julies-garden',
        name: '줄리의정원',
        name_en: 'Julies Garden',
        domains: ['juliesgarden.co.kr', 'juliesgarden.com'],
        keywords: ['줄리의정원', '줄리의 정원', 'julies garden', '줄리정원'],
        color: '#10b981',
      },
      {
        slug: 'be-for-one-studio',
        name: '비포원스튜디오',
        name_en: 'Be For One Studio',
        domains: ['beforone.co.kr', 'be-for-one.com'],
        keywords: ['비포원스튜디오', '비포원 스튜디오', '비포원', 'be for one'],
        color: '#6366f1',
      },
    ],
  },
  seoul_district: {
    slug: 'seoul_district',
    name: '서울 자치구 (플레이스 브랜드)',
    icon: '🏛️',
    description: '서울시 25개 자치구 AI 가시성 지표',
    industryType: 'place_brand',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 45,
    sampleQuestionsForFull: 80,
    brands: [
      { slug: 'gangnam', name: '강남구', name_en: 'Gangnam-gu', domains: ['gangnam.go.kr', 'visitseoul.net/gangnam'], keywords: ['강남구', 'gangnam'], color: '#ef4444', comparative_pairs: ['seocho', 'songpa'] },
      { slug: 'gangdong', name: '강동구', name_en: 'Gangdong-gu', domains: ['gangdong.go.kr', 'visitseoul.net/gangdong'], keywords: ['강동구', 'gangdong'], color: '#f97316', comparative_pairs: ['songpa', 'gwangjin'] },
      { slug: 'gangbuk', name: '강북구', name_en: 'Gangbuk-gu', domains: ['gangbuk.go.kr', 'visitseoul.net/gangbuk'], keywords: ['강북구', 'gangbuk'], color: '#f59e0b', comparative_pairs: ['dobong', 'nowon'] },
      { slug: 'gangseo', name: '강서구', name_en: 'Gangseo-gu', domains: ['gangseo.seoul.kr', 'visitseoul.net/gangseo'], keywords: ['강서구', 'gangseo'], color: '#eab308', comparative_pairs: ['yangcheon', 'yeongdeungpo'] },
      { slug: 'gwanak', name: '관악구', name_en: 'Gwanak-gu', domains: ['gwanak.go.kr', 'visitseoul.net/gwanak'], keywords: ['관악구', 'gwanak'], color: '#84cc16', comparative_pairs: ['dongjak', 'geumcheon'] },
      { slug: 'gwangjin', name: '광진구', name_en: 'Gwangjin-gu', domains: ['gwangjin.go.kr', 'visitseoul.net/gwangjin'], keywords: ['광진구', 'gwangjin'], color: '#22c55e', comparative_pairs: ['seongdong', 'gangdong'] },
      { slug: 'guro', name: '구로구', name_en: 'Guro-gu', domains: ['guro.go.kr', 'visitseoul.net/guro'], keywords: ['구로구', 'guro'], color: '#10b981', comparative_pairs: ['geumcheon', 'yeongdeungpo'] },
      { slug: 'geumcheon', name: '금천구', name_en: 'Geumcheon-gu', domains: ['geumcheon.go.kr', 'visitseoul.net/geumcheon'], keywords: ['금천구', 'geumcheon'], color: '#14b8a6', comparative_pairs: ['guro', 'gwanak'] },
      { slug: 'nowon', name: '노원구', name_en: 'Nowon-gu', domains: ['nowon.kr', 'visitseoul.net/nowon'], keywords: ['노원구', 'nowon'], color: '#06b6d4', comparative_pairs: ['dobong', 'jungnang'] },
      { slug: 'dobong', name: '도봉구', name_en: 'Dobong-gu', domains: ['dobong.go.kr', 'visitseoul.net/dobong'], keywords: ['도봉구', 'dobong'], color: '#0ea5e9', comparative_pairs: ['gangbuk', 'nowon'] },
      { slug: 'dongdaemun', name: '동대문구', name_en: 'Dongdaemun-gu', domains: ['ddm.go.kr', 'visitseoul.net/dongdaemun'], keywords: ['동대문구', 'dongdaemun'], color: '#3b82f6', comparative_pairs: ['seongdong', 'jungnang'] },
      { slug: 'dongjak', name: '동작구', name_en: 'Dongjak-gu', domains: ['dongjak.go.kr', 'visitseoul.net/dongjak'], keywords: ['동작구', 'dongjak'], color: '#6366f1', comparative_pairs: ['gwanak', 'yeongdeungpo'] },
      { slug: 'mapo', name: '마포구', name_en: 'Mapo-gu', domains: ['mapo.go.kr', 'visitseoul.net/mapo'], keywords: ['마포구', 'mapo'], color: '#8b5cf6', comparative_pairs: ['seodaemun', 'yongsan'] },
      { slug: 'seodaemun', name: '서대문구', name_en: 'Seodaemun-gu', domains: ['sdm.go.kr', 'visitseoul.net/seodaemun'], keywords: ['서대문구', 'seodaemun'], color: '#a855f7', comparative_pairs: ['mapo', 'eunpyeong'] },
      { slug: 'seocho', name: '서초구', name_en: 'Seocho-gu', domains: ['seocho.go.kr', 'visitseoul.net/seocho'], keywords: ['서초구', 'seocho'], color: '#d946ef', comparative_pairs: ['gangnam', 'dongjak'] },
      { slug: 'seongdong', name: '성동구', name_en: 'Seongdong-gu', domains: ['sd.go.kr', 'visitseoul.net/seongdong'], keywords: ['성동구', 'seongdong'], color: '#ec4899', comparative_pairs: ['mapo', 'gwangjin'] },
      { slug: 'seongbuk', name: '성북구', name_en: 'Seongbuk-gu', domains: ['sb.go.kr', 'visitseoul.net/seongbuk'], keywords: ['성북구', 'seongbuk'], color: '#f43f5e', comparative_pairs: ['jongno', 'gangbuk'] },
      { slug: 'songpa', name: '송파구', name_en: 'Songpa-gu', domains: ['songpa.go.kr', 'visitseoul.net/songpa'], keywords: ['송파구', 'songpa'], color: '#fb7185', comparative_pairs: ['gangnam', 'gangdong'] },
      { slug: 'yangcheon', name: '양천구', name_en: 'Yangcheon-gu', domains: ['yangcheon.go.kr', 'visitseoul.net/yangcheon'], keywords: ['양천구', 'yangcheon'], color: '#fca5a5', comparative_pairs: ['gangseo', 'yeongdeungpo'] },
      { slug: 'yeongdeungpo', name: '영등포구', name_en: 'Yeongdeungpo-gu', domains: ['ydp.go.kr', 'visitseoul.net/yeongdeungpo'], keywords: ['영등포구', 'yeongdeungpo'], color: '#fdba74', comparative_pairs: ['mapo', 'dongjak'] },
      { slug: 'yongsan', name: '용산구', name_en: 'Yongsan-gu', domains: ['yongsan.go.kr', 'visitseoul.net/yongsan'], keywords: ['용산구', 'yongsan'], color: '#fcd34d', comparative_pairs: ['junggu', 'mapo'] },
      { slug: 'eunpyeong', name: '은평구', name_en: 'Eunpyeong-gu', domains: ['ep.go.kr', 'visitseoul.net/eunpyeong'], keywords: ['은평구', 'eunpyeong'], color: '#fde047', comparative_pairs: ['seodaemun', 'mapo'] },
      { slug: 'jongno', name: '종로구', name_en: 'Jongno-gu', domains: ['jongno.go.kr', 'visitseoul.net/jongno'], keywords: ['종로구', 'jongno'], color: '#bef264', comparative_pairs: ['junggu', 'seongbuk'] },
      { slug: 'junggu', name: '중구', name_en: 'Jung-gu', domains: ['junggu.seoul.kr', 'visitseoul.net/junggu'], keywords: ['중구', '중구청', 'junggu', 'jung-gu'], color: '#86efac', comparative_pairs: ['jongno', 'yongsan'] },
      { slug: 'jungnang', name: '중랑구', name_en: 'Jungnang-gu', domains: ['jungnang.go.kr', 'visitseoul.net/jungnang'], keywords: ['중랑구', 'jungnang'], color: '#6ee7b7', comparative_pairs: ['dongdaemun', 'nowon'] },
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
