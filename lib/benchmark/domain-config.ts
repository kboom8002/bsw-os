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
  
  /** 브랜드가 제공하는 제품/서비스 카테고리 (GAP 정합성 필터에 사용) */
  product_categories?: string[];
  /** 브랜드 아이덴티티/포지셔닝 요약 (LLM 정합성 판단에 사용) */
  brand_identity?: string;
}

export interface DomainConfig {
  slug: string;
  name: string;
  icon: string;
  description: string;
  brands: BrandConfig[];
  sampleQuestionsForLight: number; // Daily 경량 측정 시 샘플링 질문 수
  sampleQuestionsForFull: number;
  repetitionCount?: number;  // Weekly 전체 측정 시 질문 수
  industryType: string;            // INDUSTRY_PANELS_DATA 키
  deep_dive_enabled?: boolean;     // Client Deep Dive 지원 여부
}


const KPOP_BRANDS = [
  // ── HYBE ──
  { slug: 'newjeans', name: 'NewJeans', name_en: 'NewJeans', domains: ['newjeans.kr', 'weverse.io/newjeans'], keywords: ['뉴진스', 'newjeans'], color: '#6366f1', comparative_pairs: ['illit', 'le-sserafim'] },
  { slug: 'le-sserafim', name: 'LE SSERAFIM', name_en: 'LE SSERAFIM', domains: ['lesserafim.com', 'weverse.io/lesserafim'], keywords: ['르세라핌', 'lesserafim'], color: '#8b5cf6', comparative_pairs: ['newjeans', 'ive'] },
  { slug: 'enhypen', name: 'ENHYPEN', name_en: 'ENHYPEN', domains: ['enhypen-official.com', 'weverse.io/enhypen'], keywords: ['엔하이픈', 'enhypen'], color: '#a855f7', comparative_pairs: ['txt', 'riize'] },
  { slug: 'boynextdoor', name: 'BOYNEXTDOOR', name_en: 'BOYNEXTDOOR', domains: ['boynextdoor.today', 'weverse.io/boynextdoor'], keywords: ['보이넥스트도어', 'boynextdoor', '보넥도'], color: '#c084fc', comparative_pairs: ['riize', 'zerobaseone'] },
  { slug: 'txt', name: 'TOMORROW X TOGETHER', name_en: 'TXT', domains: ['txt-official.com', 'weverse.io/txt'], keywords: ['투모로우바이투게더', 'txt', '투바투'], color: '#3b82f6', comparative_pairs: ['enhypen', 'stray-kids'] },
  { slug: 'illit', name: 'ILLIT', name_en: 'ILLIT', domains: ['illit.com', 'weverse.io/illit'], keywords: ['아일릿', 'illit'], color: '#10b981', comparative_pairs: ['newjeans', 'babymonster'] },
  { slug: 'tws', name: 'TWS', name_en: 'TWS', domains: ['pledis.co.kr/tws', 'weverse.io/tws'], keywords: ['투어스', 'tws'], color: '#06b6d4', comparative_pairs: ['boynextdoor', 'riize'] },
  // ── SM ──
  { slug: 'riize', name: 'RIIZE', name_en: 'RIIZE', domains: ['riize.smtown.com'], keywords: ['라이즈', 'riize'], color: '#ef4444', comparative_pairs: ['enhypen', 'boynextdoor'] },
  { slug: 'aespa', name: 'aespa', name_en: 'aespa', domains: ['aespa.smtown.com'], keywords: ['에스파', 'aespa'], color: '#f43f5e', comparative_pairs: ['ive', 'le-sserafim'] },
  // ── JYP ──
  { slug: 'nmixx', name: 'NMIXX', name_en: 'NMIXX', domains: ['nmixx.jype.com'], keywords: ['엔믹스', 'nmixx'], color: '#f97316', comparative_pairs: ['ive', 'illit'] },
  { slug: 'stray-kids', name: 'Stray Kids', name_en: 'Stray Kids', domains: ['straykids.jype.com'], keywords: ['스트레이키즈', 'stray kids', '스키즈'], color: '#fb923c', comparative_pairs: ['ateez', 'txt'] },
  { slug: 'itzy', name: 'ITZY', name_en: 'ITZY', domains: ['itzy.jype.com'], keywords: ['있지', 'itzy'], color: '#f59e0b', comparative_pairs: ['aespa', 'le-sserafim'] },
  // ── YG ──
  { slug: 'babymonster', name: 'BABYMONSTER', name_en: 'BABYMONSTER', domains: ['babymonster.ygfamily.com'], keywords: ['베이비몬스터', 'babymonster', '베비몬'], color: '#eab308', comparative_pairs: ['illit', 'newjeans'] },
  { slug: 'treasure', name: 'TREASURE', name_en: 'TREASURE', domains: ['treasure.ygfamily.com'], keywords: ['트레저', 'treasure'], color: '#facc15', comparative_pairs: ['riize', 'boynextdoor'] },
  // ── Others ──
  { slug: 'ive', name: 'IVE', name_en: 'IVE', domains: ['ive-official.com', 'ivestarship.com'], keywords: ['아이브', 'ive'], color: '#22c55e', comparative_pairs: ['newjeans', 'aespa'] },
  { slug: 'zerobaseone', name: 'ZEROBASEONE', name_en: 'ZEROBASEONE', domains: ['zerobaseone.com', 'weverse.io/zerobaseone'], keywords: ['제로베이스원', 'zerobaseone', 'zb1'], color: '#0ea5e9', comparative_pairs: ['boynextdoor', 'riize'] },
  { slug: 'ateez', name: 'ATEEZ', name_en: 'ATEEZ', domains: ['ateez-official.com'], keywords: ['에이티즈', 'ateez'], color: '#1d4ed8', comparative_pairs: ['stray-kids', 'treasure'] },
  { slug: 'g-idle', name: '(G)I-DLE', name_en: '(G)I-DLE', domains: ['cubeent.co.kr/gidle'], keywords: ['아이들', '여자아이들', 'g i-dle', 'gidle'], color: '#db2777', comparative_pairs: ['le-sserafim', 'ive'] },
  { slug: 'kiss-of-life', name: 'KISS OF LIFE', name_en: 'KISS OF LIFE', domains: ['kissoflife-official.com'], keywords: ['키스오브라이프', 'kiss of life', '키오프'], color: '#be185d', comparative_pairs: ['le-sserafim', 'babymonster'] },
  { slug: 'stayc', name: 'STAYC', name_en: 'STAYC', domains: ['highup-ent.com/stayc'], keywords: ['스테이씨', 'stayc'], color: '#ec4899', comparative_pairs: ['ive', 'nmixx'] }
];

const SEOUL_DISTRICTS_BRANDS = [
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
];

export const JEJU_COMPETITOR_BRANDS = [
  { slug: 'jeju', name: '제주도', name_en: 'Jeju Island', domains: ['visitjeju.net', 'ijeto.or.kr'], keywords: ['제주', '제주도', 'jeju', 'jeju island'], color: '#ef4444', comparative_pairs: ['okinawa', 'bali', 'hawaii'] },
  { slug: 'okinawa', name: '오키나와', name_en: 'Okinawa', domains: ['visitokinawa.jp'], keywords: ['오키나와', 'okinawa', 'visit okinawa'], color: '#f59e0b', comparative_pairs: ['jeju', 'bali'] },
  { slug: 'bali', name: '발리', name_en: 'Bali', domains: ['indonesia.travel', 'balitourismboard.org'], keywords: ['발리', 'bali', 'visit bali'], color: '#10b981', comparative_pairs: ['jeju', 'phuket'] },
  { slug: 'phuket', name: '푸켓', name_en: 'Phuket', domains: ['tourismthailand.org', 'phuket.net'], keywords: ['푸켓', 'phuket', 'visit phuket'], color: '#ec4899', comparative_pairs: ['bali', 'langkawi'] },
  { slug: 'langkawi', name: '랑카위', name_en: 'Langkawi', domains: ['langkawi.gov.my', 'naturallylangkawi.my'], keywords: ['랑카위', 'langkawi'], color: '#06b6d4', comparative_pairs: ['phuket', 'bali'] },
  { slug: 'hokkaido', name: '홋카이도', name_en: 'Hokkaido', domains: ['visit-hokkaido.jp'], keywords: ['홋카이도', 'hokkaido', 'visit hokkaido'], color: '#eab308', comparative_pairs: ['jeju', 'tasmania'] },
  { slug: 'hawaii', name: '하와이', name_en: 'Hawaii', domains: ['gohawaii.com'], keywords: ['하와이', 'hawaii', 'go hawaii'], color: '#3b82f6', comparative_pairs: ['jeju', 'maldives'] },
  { slug: 'maldives', name: '몰디브', name_en: 'Maldives', domains: ['visitmaldives.com'], keywords: ['몰디브', 'maldives', 'visit maldives'], color: '#14b8a6', comparative_pairs: ['hawaii', 'fiji'] },
  { slug: 'santorini', name: '산토리니', name_en: 'Santorini', domains: ['visitgreece.gr', 'santorini.gr'], keywords: ['산토리니', 'santorini', 'visit santorini'], color: '#0ea5e9', comparative_pairs: ['mallorca', 'sardinia'] },
  { slug: 'mallorca', name: '마요르카', name_en: 'Mallorca', domains: ['infomallorca.net', 'spain.info'], keywords: ['마요르카', 'mallorca', 'majorca'], color: '#8b5cf6', comparative_pairs: ['santorini', 'sardinia'] },
  { slug: 'fiji', name: '피지', name_en: 'Fiji', domains: ['fiji.travel'], keywords: ['피지', 'fiji', 'tourism fiji'], color: '#c084fc', comparative_pairs: ['maldives', 'hawaii'] },
  { slug: 'tenerife', name: '테네리페', name_en: 'Tenerife', domains: ['webtenerife.com'], keywords: ['테네리페', 'tenerife', 'visit tenerife'], color: '#a855f7', comparative_pairs: ['azores', 'jeju'] },
  { slug: 'iceland', name: '아이슬란드', name_en: 'Iceland', domains: ['visiticeland.com'], keywords: ['아이슬란드', 'iceland', 'visit iceland'], color: '#6366f1', comparative_pairs: ['jeju', 'tasmania'] },
  { slug: 'azores', name: '아조레스', name_en: 'Azores', domains: ['visitazores.com'], keywords: ['아조레스', 'azores'], color: '#0284c7', comparative_pairs: ['tenerife', 'mallorca'] },
  { slug: 'tasmania', name: '태즈메이니아', name_en: 'Tasmania', domains: ['discovertasmania.com.au'], keywords: ['태즈메이니아', 'tasmania', 'discover tasmania'], color: '#15803d', comparative_pairs: ['hokkaido', 'queenstown'] },
  { slug: 'mauritius', name: '모리셔스', name_en: 'Mauritius', domains: ['mymauritius.travel'], keywords: ['모리셔스', 'mauritius'], color: '#b91c1c', comparative_pairs: ['maldives', 'fiji'] },
  { slug: 'palawan', name: '팔라완', name_en: 'Palawan', domains: ['palawan.gov.ph'], keywords: ['팔라완', 'palawan'], color: '#0f766e', comparative_pairs: ['phuket', 'da-nang'] },
  { slug: 'sardinia', name: '사르데냐', name_en: 'Sardinia', domains: ['sardegnaturismo.it'], keywords: ['사르데냐', 'sardinia', 'sardegna'], color: '#4338ca', comparative_pairs: ['mallorca', 'santorini'] },
  { slug: 'sri-lanka', name: '스리랑카', name_en: 'Sri Lanka', domains: ['srilanka.travel'], keywords: ['스리랑카', 'sri lanka', 'srilanka'], color: '#a21caf', comparative_pairs: ['bali', 'da-nang'] },
  { slug: 'da-nang', name: '다낭', name_en: 'Da Nang', domains: ['danangfantasticity.com'], keywords: ['다낭', 'da nang', 'danang'], color: '#be123c', comparative_pairs: ['phuket', 'sri-lanka'] },
  { slug: 'queenstown', name: '퀸스타운', name_en: 'Queenstown', domains: ['queenstownnz.co.nz'], keywords: ['퀸스타운', 'queenstown'], color: '#1e3a8a', comparative_pairs: ['tasmania', 'hokkaido'] }
];

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
        product_categories: ['세라마이드 크림', '더마 크림', '보습 크림', '민감성 피부 크림', '피부장벽 강화 크림'],
        brand_identity: '피부과 전문의가 개발한 더마코스메틱 브랜드. 주력 제품은 세라마이드 기반 더마리셋 크림. 민감성·건조 피부 장벽 강화에 특화. 클렌저, 시카(CICA), 선케어, 세트 상품은 미보유.',
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

  seoul_district_ko: {
    slug: 'seoul_district_ko',
    name: '서울 자치구 (국문)',
    icon: '🏛️',
    description: '서울시 25개 자치구 AI 가시성 지표 (국문)',
    industryType: 'place_brand_ko',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 45,
    sampleQuestionsForFull: 80,
    repetitionCount: 1,
    brands: SEOUL_DISTRICTS_BRANDS
  },
  seoul_district_en: {
    slug: 'seoul_district_en',
    name: '서울 자치구 (영문)',
    icon: '🏛️',
    description: '서울시 25개 자치구 AI 가시성 지표 (영문)',
    industryType: 'place_brand_en',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 45,
    sampleQuestionsForFull: 80,
    repetitionCount: 1,
    brands: SEOUL_DISTRICTS_BRANDS
  },
  kpop_idol_ko: {
    slug: 'kpop_idol_ko',
    name: 'K-pop 아이돌 (국문)',
    icon: '🎤',
    description: '4세대+ K-pop 아이돌 그룹 AI 가시성 벤치마크 (국문)',
    industryType: 'kpop_idol_ko',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 50,
    sampleQuestionsForFull: 80,
    repetitionCount: 1,
    brands: KPOP_BRANDS
  },
  kpop_idol_en: {
    slug: 'kpop_idol_en',
    name: 'K-pop 아이돌 (영문)',
    icon: '🎤',
    description: '4세대+ K-pop 아이돌 그룹 AI 가시성 벤치마크 (영문)',
    industryType: 'kpop_idol_en',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 50,
    sampleQuestionsForFull: 80,
    repetitionCount: 1,
    brands: KPOP_BRANDS
  },

  jeju_smb: {
    slug: 'jeju_smb',
    name: '제주 소상공인',
    icon: '🏝️',
    description: '제주도 지역×업종 소상공인 브랜드 AI 가시성 지표',
    industryType: 'jeju_smb',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 50,
    sampleQuestionsForFull: 94,
    repetitionCount: 1,
    brands: [
      // ── 맛집 / 식당 ──
      { slug: 'donsadon', name: '돈사돈', name_en: 'Donsadon', domains: ['donsadon.com', 'donsadon'], keywords: ['돈사돈', 'donsadon', '제주 흑돼지'], color: '#ef4444', comparative_pairs: ['heukdonga', 'sukseongdo'] },
      { slug: 'heukdonga', name: '흑돈가', name_en: 'Heukdonga', domains: ['heukdonga.com', 'heukdonga'], keywords: ['흑돈가', '제주 흑돼지 맛집'], color: '#f97316', comparative_pairs: ['donsadon', 'sukseongdo'] },
      { slug: 'haenyeo-kitchen', name: '해녀의부엌', name_en: 'Haenyeo Kitchen', domains: ['haenyeokitchen.com', 'haenyeo-kitchen'], keywords: ['해녀의부엌', '해녀 해산물', 'haenyeo'], color: '#0ea5e9', comparative_pairs: ['donsadon', 'chunsimne'] },
      { slug: 'sukseongdo', name: '숙성도', name_en: 'Sukseongdo', domains: ['sukseongdo'], keywords: ['숙성도', 'sukseongdo'], color: '#3b82f6', comparative_pairs: ['donsadon', 'gobdeullak'] },
      { slug: 'ujin-haejangguk', name: '우진해장국', name_en: 'Ujin Haejangguk', domains: ['woojinhj', 'ujin-haejangguk'], keywords: ['우진해장국', '고사리육개장'], color: '#10b981', comparative_pairs: ['ollae-guksu', 'jamae-guksu'] },
      { slug: 'chunsimne', name: '춘심이네', name_en: 'Chunsimne', domains: ['chunsimne'], keywords: ['춘심이네', 'chunsimne'], color: '#84cc16', comparative_pairs: ['haenyeo-kitchen'] },
      { slug: 'hyeopjae-kalguksu', name: '협재칼국수', name_en: 'Hyeopjae Kalguksu', domains: ['hyeopjae-kalguksu'], keywords: ['협재칼국수', '협재 칼국수'], color: '#06b6d4', comparative_pairs: ['ollae-guksu'] },
      { slug: 'gobdeullak', name: '곱들락', name_en: 'Gobdeullak', domains: ['gobdeullak'], keywords: ['곱들락', 'gobdeullak'], color: '#a855f7', comparative_pairs: ['sukseongdo'] },
      { slug: 'ollae-guksu', name: '올래국수', name_en: 'Ollae Guksu', domains: ['ollae-guksu'], keywords: ['올래국수', '올래 국수'], color: '#d946ef', comparative_pairs: ['ujin-haejangguk', 'jamae-guksu'] },
      { slug: 'mungae-eomung', name: '문개어멍', name_en: 'Mungae Eomung', domains: ['mungae-eomung'], keywords: ['문개어멍', '문개어머'], color: '#ec4899', comparative_pairs: ['haenyeo-kitchen'] },
      { slug: 'matna-sikdang', name: '맛나식당', name_en: 'Matna Sikdang', domains: ['matna-sikdang'], keywords: ['맛나식당', '맛나 식당'], color: '#f43f5e', comparative_pairs: ['chunsimne'] },
      { slug: 'sinseol-oreum', name: '신설오름', name_en: 'Sinseol Oreum', domains: ['sinseol-oreum'], keywords: ['신설오름', '신설 오름'], color: '#fb7185', comparative_pairs: ['ujin-haejangguk'] },
      { slug: 'oneunjeong-gimbap', name: '오는정김밥', name_en: 'Oneunjeong Gimbap', domains: ['oneunjeong'], keywords: ['오는정김밥', '오는정'], color: '#fbbf24', comparative_pairs: ['yeondon'] },
      { slug: 'jamae-guksu', name: '자매국수', name_en: 'Jamae Guksu', domains: ['jamae-guksu'], keywords: ['자매국수', '자매 국수'], color: '#f97316', comparative_pairs: ['ollae-guksu', 'ujin-haejangguk'] },
      { slug: 'yeondon', name: '연돈', name_en: 'Yeondon', domains: ['yeondon'], keywords: ['연돈', 'yeondon'], color: '#eab308', comparative_pairs: ['oneunjeong-gimbap'] },
      { slug: 'suwoondong', name: '수우동', name_en: 'Suwoondong', domains: ['suwoondong.com', 'suwoondong'], keywords: ['수우동', '협재 수우동'], color: '#14b8a6', comparative_pairs: ['hyeopjae-kalguksu'] },
      { slug: 'bbolsaljib', name: '뽈살집', name_en: 'Bbolsaljib', domains: ['bbolsaljib'], keywords: ['뽈살집', '서귀포 뽈살집'], color: '#8b5cf6', comparative_pairs: ['donsadon'] },
      // ── 카페 / 베이커리 / 기타 ──
      { slug: 'mongsang-aewol', name: '몽상드애월', name_en: 'Mongsang de Aewol', domains: ['mongsang.co.kr', 'mongsang-aewol'], keywords: ['몽상드애월', '몽상', '애월 카페'], color: '#8b5cf6', comparative_pairs: ['cafe-delmundo', 'cafe-gongbaek'] },
      { slug: 'cafe-delmundo', name: '카페 델문도', name_en: 'Cafe Delmundo', domains: ['cafedelmundo.kr', 'cafe-delmundo'], keywords: ['카페 델문도', '델문도', '제주 카페'], color: '#6366f1', comparative_pairs: ['mongsang-aewol', 'hotel-sand'] },
      { slug: 'cafe-gongbaek', name: '카페 공백', name_en: 'Cafe Gongbaek', domains: ['cafegongbaek.com', 'cafe-gongbaek'], keywords: ['카페 공백', '공백카페'], color: '#a855f7', comparative_pairs: ['mongsang-aewol'] },
      { slug: 'osulloc', name: '오설록 티뮤지엄', name_en: 'Osulloc Tea Museum', domains: ['osulloc.com', 'osulloc'], keywords: ['오설록', 'osulloc', '녹차 체험'], color: '#22c55e', comparative_pairs: ['innisfree-jeju'] },
      { slug: 'innisfree-jeju', name: '이니스프리 제주하우스', name_en: 'Innisfree Jeju House', domains: ['innisfree.com', 'innisfree-jeju'], keywords: ['이니스프리 제주하우스', '이니스프리 제주'], color: '#84cc16', comparative_pairs: ['osulloc'] },
      { slug: 'anthracite-hallim', name: '앤트러사이트 한림', name_en: 'Anthracite Hallim', domains: ['anthracite', 'anthracite-hallim'], keywords: ['앤트러사이트 한림', '앤트러사이트'], color: '#10b981', comparative_pairs: ['cafe-gongbaek'] },
      { slug: 'the-cliff', name: '더클리프', name_en: 'The Cliff', domains: ['thecliff', 'the-cliff'], keywords: ['더클리프', 'the cliff'], color: '#ef4444', comparative_pairs: ['cafe-delmundo'] },
      { slug: 'oasis80', name: '오아시스80', name_en: 'Oasis 80', domains: ['oasis80'], keywords: ['오아시스80', 'oasis80'], color: '#f59e0b', comparative_pairs: ['lazypump'] },
      { slug: 'lazypump', name: '레이지펌프', name_en: 'Lazy Pump', domains: ['lazypump'], keywords: ['레이지펌프', 'lazypump'], color: '#eab308', comparative_pairs: ['oasis80'] },
      { slug: 'cafe-orrn', name: '카페 오른', name_en: 'Cafe Orrn', domains: ['orrn', 'cafe-orrn'], keywords: ['카페 오른', '카페오른', 'orrn'], color: '#fca5a5', comparative_pairs: ['cafe-gongbaek'] },
      { slug: 'hotel-sand', name: '호텔샌드', name_en: 'Hotel Sand', domains: ['hotelsand', 'hotel-sand'], keywords: ['호텔샌드', '호텔 샌드'], color: '#fdba74', comparative_pairs: ['cafe-delmundo'] },
      { slug: 'bomnal-cafe', name: '봄날카페', name_en: 'Bomnal Cafe', domains: ['bomnal-cafe'], keywords: ['봄날카페', '봄날 카페'], color: '#fcd34d', comparative_pairs: ['mongsang-aewol'] },
      { slug: 'ultramarine', name: '울트라마린', name_en: 'Ultramarine', domains: ['ultramarine'], keywords: ['울트라마린', 'ultramarine'], color: '#fde047', comparative_pairs: ['hotel-sand'] },
      { slug: 'azulejo', name: '아줄레주', name_en: 'Azulejo', domains: ['azulejo'], keywords: ['아줄레주', 'azulejo'], color: '#bef264', comparative_pairs: ['cafe-orrn'] },
      { slug: 'abebe-bakery', name: '아베베 베이커리', name_en: 'Abebe Bakery', domains: ['abebe', 'abebe-bakery'], keywords: ['아베베 베이커리', '아베베'], color: '#86efac', comparative_pairs: ['randys-donut-jeju'] },
      { slug: 'randys-donut-jeju', name: '랜디스도넛 제주', name_en: 'Randys Donut Jeju', domains: ['randys-donut', 'randys-donut-jeju'], keywords: ['랜디스도넛', '랜디스 도넛'], color: '#6ee7b7', comparative_pairs: ['abebe-bakery'] },
      { slug: 'jeju-beer', name: '제주맥주', name_en: 'Jeju Beer', domains: ['jejubeer.co.kr', 'jeju-beer'], keywords: ['제주맥주', 'jeju beer', '크래프트 맥주'], color: '#f59e0b', comparative_pairs: ['magpie'] },
      { slug: 'nohyeong-supermaket', name: '노형슈퍼마켙', name_en: 'Nohyeong Supermaket', domains: ['nohyeongsupermaket.com', 'nohyeong-supermaket'], keywords: ['노형슈퍼마켙', '노형슈퍼마켓'], color: '#ec4899', comparative_pairs: ['jeju-beer'] },
    ],
  },

  jeju_place_en: {
    slug: 'jeju_place_en',
    name: '제주 글로벌 경쟁 (영문)',
    icon: '🏝️',
    description: 'Jeju Island vs 20 Global Resort Destination AI Visibility Benchmark (EN)',
    industryType: 'jeju_place_en',
    deep_dive_enabled: true,
    sampleQuestionsForLight: 50,
    sampleQuestionsForFull: 80,
    repetitionCount: 1,
    brands: JEJU_COMPETITOR_BRANDS
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
