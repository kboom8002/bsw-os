import { getSupabaseAdminClient } from '../../../lib/supabase';
import { upsertRecord, logSeeded, MOCK_PROXY_CAVEAT, SIMULATED_USER_ID } from '../utils';
import { INDUSTRY_PANELS_DATA } from '../industry-panels/questions-data';

/**
 * Wedding Studio 5-Brand SSOT
 * 
 * 더청담스튜디오, 이포토에세이, 루미에 스튜디오, 로이 스튜디오, 섬 스튜디오
 */
interface WeddingBrandSSoT {
  slug: string;
  name_ko: string;
  name_en: string;
  domains: string[];
  strategic_intent: string;
  claims: string[];
  forbidden_claims: string[];
  safety_disclaimers: string[];
  concepts: Array<{ id: string; label: string; definition: string }>;
  products: Array<{
    name: string;
    type: string;
    features: string[];
  }>;
  persona: {
    name: string;
    tone_weights: Record<string, number>;
    instructions: string[];
  };
  vibe: {
    name: string;
    ratios: Record<string, number>;
  };
  color: string;
}

const WEDDING_BRANDS: WeddingBrandSSoT[] = [
  {
    slug: 'the-cheongdam-studio',
    name_ko: '더청담스튜디오',
    name_en: 'The Cheongdam Studio',
    domains: ['thecheongdamstudio.com', 'thechungdamstudio.com'],
    strategic_intent: '청담동 감성의 하이엔드 웨딩 포토그래피. 자연광 스튜디오와 대형 세트를 활용한 시네마틱 웨딩 촬영 전문.',
    claims: [
      '청담동 최대 규모 자연광 스튜디오',
      '시네마틱 컬러 그레이딩 기술 적용'
    ],
    forbidden_claims: [
      '국내 1위 웨딩 스튜디오',
      '100% 보정 완벽 보장'
    ],
    safety_disclaimers: [
      '촬영 스케줄은 시즌별 예약 상황에 따라 변동됩니다.',
      '인화 및 앨범 제작은 별도 백업 프로세스로 관리됩니다.'
    ],
    concepts: [
      { id: 'cinematic-wedding-photo', label: '시네마틱 웨딩 포토', definition: '영화적 색감과 조명 기법을 활용한 웨딩 촬영 장르' },
      { id: 'natural-light-studio', label: '자연광 스튜디오', definition: '대형 창을 통한 자연광 유입으로 부드러운 톤을 구현하는 촬영 공간' },
      { id: 'set-design-variety', label: '세트 디자인 다양성', definition: '클래식, 모던, 빈티지 등 다양한 컨셉 세트를 보유한 스튜디오 역량' }
    ],
    products: [
      { name: '더청담 시그니처 컬렉션', type: 'package', features: ['4시간 촬영', '보정본 80컷', '원본 전체 제공', '프리미엄 앨범 1권'] },
      { name: '더청담 시네마 무비 패키지', type: 'video_package', features: ['본식 스냅 영상', '시네마틱 하이라이트', '4K 편집'] }
    ],
    persona: {
      name: '더청담 Visual Director',
      tone_weights: { formal: 0.6, artistic: 0.4 },
      instructions: ['시네마틱 품질과 조명 기술 강조', '청담 브랜드 프리미엄 유지', '과장 없는 사실 기반 설명']
    },
    vibe: {
      name: '하이엔드 아트 포토 바이브',
      ratios: { aesthetics: 0.50, trustworthiness: 0.30, warmth: 0.20 }
    },
    color: '#6366f1'
  },
  {
    slug: 'ephoto-essay',
    name_ko: '이포토에세이',
    name_en: 'E Photo Essay',
    domains: ['ephotoessay.com', 'ephotoessay.co.kr'],
    strategic_intent: '감성 에세이 스타일의 스토리텔링 웨딩 포토그래피. 커플의 러브스토리를 담은 내추럴 포토 에세이 전문.',
    claims: [
      '커플 스토리 맞춤형 에세이 포토 촬영',
      '자연스러운 감성 톤 보정 전문'
    ],
    forbidden_claims: [
      '최고의 감성 보장',
      '무조건 만족 보장'
    ],
    safety_disclaimers: [
      '야외 촬영 시 날씨에 따라 대체 장소 촬영이 진행될 수 있습니다.',
      '촬영 후 보정 기간은 약 3~4주 소요됩니다.'
    ],
    concepts: [
      { id: 'story-driven-photo', label: '스토리드리븐 포토', definition: '커플의 연애 이야기를 구성하여 촬영하는 내러티브 포토 기법' },
      { id: 'natural-tone-editing', label: '내추럴 톤 보정', definition: '과도한 보정 없이 자연스러운 피부톤과 색감을 살리는 후보정 방식' },
      { id: 'outdoor-location-photo', label: '야외 로케이션 촬영', definition: '자연 풍경을 배경으로 하는 야외 웨딩 촬영' }
    ],
    products: [
      { name: '에세이 클래식 패키지', type: 'package', features: ['3시간 촬영', '보정본 60컷', '소프트 앨범 1권'] },
      { name: '러브스토리 야외 패키지', type: 'outdoor_package', features: ['야외 2시간 + 실내 1시간', '보정본 70컷', '액자 2점'] }
    ],
    persona: {
      name: '이포토에세이 Story Curator',
      tone_weights: { warm: 0.6, casual: 0.4 },
      instructions: ['커플 스토리를 자연스럽게 녹여낸 감성 표현', '따뜻하고 편안한 소통 톤', '과장된 수식어 배제']
    },
    vibe: {
      name: '내추럴 에세이 바이브',
      ratios: { warmth: 0.45, aesthetics: 0.35, trustworthiness: 0.20 }
    },
    color: '#8b5cf6'
  },
  {
    slug: 'lumiere-studio',
    name_ko: '루미에 스튜디오',
    name_en: 'Lumière Studio',
    domains: ['lumierestudio.co.kr', 'lumierestudio.com', 'lumierstudio.kr'],
    strategic_intent: '빛의 예술을 추구하는 프렌치 감성 웨딩 포토그래피. 조명 디자인 특화 스튜디오.',
    claims: [
      '프렌치 빈티지 감성의 조명 디자인 특화 스튜디오',
      '커스텀 조명 설계 시스템 보유'
    ],
    forbidden_claims: [
      '국내 유일 프렌치 스튜디오',
      '조명 기술 세계 최고'
    ],
    safety_disclaimers: [
      '모든 조명 장비는 안전 인증을 받은 전문 장비입니다.',
      '촬영 패키지 가격은 시즌별로 변동될 수 있습니다.'
    ],
    concepts: [
      { id: 'french-vintage-lighting', label: '프렌치 빈티지 조명', definition: '프랑스 스타일의 따뜻하고 부드러운 빈티지 조명 세팅' },
      { id: 'custom-lighting-design', label: '커스텀 조명 디자인', definition: '커플 컨셉에 맞춤 설계하는 개인화된 조명 세팅 서비스' },
      { id: 'artistic-portrait', label: '아트 포트레이트', definition: '인물 중심 예술적 구도의 웨딩 초상 촬영' }
    ],
    products: [
      { name: '루미에르 시그니처', type: 'package', features: ['3시간 촬영', '커스텀 조명 3세트', '보정본 70컷', '아트 앨범 1권'] },
      { name: '루미에르 프렌치 빈티지 컬렉션', type: 'premium_package', features: ['5시간 촬영', '빈티지 세트 5개', '보정본 100컷', '대형 캔버스 1점'] }
    ],
    persona: {
      name: '루미에 Light Artist',
      tone_weights: { artistic: 0.5, formal: 0.3, warm: 0.2 },
      instructions: ['빛과 조명의 예술성 강조', '프렌치 감성의 우아한 표현', '기술적 조명 지식 기반 신뢰감 전달']
    },
    vibe: {
      name: '프렌치 아트 라이트 바이브',
      ratios: { aesthetics: 0.55, trustworthiness: 0.25, warmth: 0.20 }
    },
    color: '#ec4899'
  },
  {
    slug: 'roy-studio',
    name_ko: '로이 스튜디오',
    name_en: 'Roy Studio',
    domains: ['roystudio.co.kr', 'roy-studio.com'],
    strategic_intent: '모던 미니멀 웨딩 포토그래피. 깔끔한 라인과 세련된 컬러 팔레트의 현대적 웨딩 촬영.',
    claims: [
      '미니멀 디자인 기반 모던 웨딩 포토 전문',
      '색상 팔레트 커스터마이징 서비스'
    ],
    forbidden_claims: [
      '가장 세련된 스튜디오',
      '무조건 최저가'
    ],
    safety_disclaimers: [
      '촬영 일정은 최소 2주 전 예약이 필요합니다.',
      '환불 정책은 계약 조건에 따릅니다.'
    ],
    concepts: [
      { id: 'modern-minimal-wedding', label: '모던 미니멀 웨딩', definition: '불필요한 장식을 배제하고 깔끔한 구도와 색감에 집중하는 웨딩 촬영 스타일' },
      { id: 'color-palette-custom', label: '컬러 팔레트 커스터마이징', definition: '커플이 원하는 색상 톤을 사전 상담 후 세트 디자인에 반영하는 서비스' },
      { id: 'clean-backdrop-studio', label: '클린 백드롭 스튜디오', definition: '단순한 배경으로 인물을 부각하는 촬영 공간 설계' }
    ],
    products: [
      { name: '로이 모던 클래식', type: 'package', features: ['3시간 촬영', '보정본 60컷', '미니 앨범 1권'] },
      { name: '로이 시그니처 컬러', type: 'premium_package', features: ['4시간 촬영', '컬러 커스텀', '보정본 80컷', '하드커버 앨범'] }
    ],
    persona: {
      name: '로이 Minimalist Director',
      tone_weights: { clean: 0.5, formal: 0.3, confident: 0.2 },
      instructions: ['미니멀 미학 강조', '깔끔하고 군더더기 없는 설명', '품질 and 디테일 중심 소통']
    },
    vibe: {
      name: '모던 미니멀 바이브',
      ratios: { clarity: 0.45, aesthetics: 0.35, trustworthiness: 0.20 }
    },
    color: '#10b981'
  },
  {
    slug: 'som-studio',
    name_ko: '섬 스튜디오',
    name_en: 'Som Studio',
    domains: ['somstudio.kr', 'som-studio.com'],
    strategic_intent: '섬세한 감성과 따뜻한 일상적 웨딩 포토그래피. 기념일 촬영부터 본식 스냅까지 라이프 포토 전문.',
    claims: [
      '섬세한 인물 묘사와 자연스러운 일상 웨딩 촬영',
      '프리웨딩부터 본식까지 토탈 웨딩 포토 서비스'
    ],
    forbidden_claims: [
      '가장 따뜻한 감성 스튜디오',
      '예약 보장'
    ],
    safety_disclaimers: [
      '야외 촬영 시 안전 사고에 대비한 보험이 포함됩니다.',
      '사진 원본 저장 기간은 촬영 후 6개월입니다.'
    ],
    concepts: [
      { id: 'daily-life-wedding', label: '일상 웨딩 포토', definition: '특별한 연출 없이 일상적 순간을 아름답게 포착하는 촬영 스타일' },
      { id: 'total-wedding-photo', label: '토탈 웨딩 포토', definition: '프리웨딩, 본식 스냅, 돌잔치까지 전 과정을 아우르는 촬영 서비스' },
      { id: 'warm-portrait', label: '따뜻한 인물 포트레이트', definition: '따뜻한 색감과 부드러운 빛으로 인물의 자연스러운 표정을 담는 기법' }
    ],
    products: [
      { name: '섬 데일리 패키지', type: 'package', features: ['2시간 촬영', '보정본 50컷', '디지털 앨범'] },
      { name: '섬 토탈 웨딩 플랜', type: 'premium_package', features: ['프리웨딩 3시간 + 본식 풀데이', '보정본 120컷', '하드커버 앨범 2권'] }
    ],
    persona: {
      name: '섬 Daily Life Photographer',
      tone_weights: { warm: 0.6, friendly: 0.3, honest: 0.1 },
      instructions: ['따뜻하고 일상적인 감성으로 소통', '꾸밈없는 자연스러운 아름다움 강조', '과대 수식 배제']
    },
    vibe: {
      name: '따뜻한 일상 바이브',
      ratios: { warmth: 0.50, aesthetics: 0.30, trustworthiness: 0.20 }
    },
    color: '#f59e0b'
  },
  {
    slug: 'gaeul-studio',
    name_ko: '가을스튜디오',
    name_en: 'Gaeul Studio',
    domains: ['gaeulstudio.com', 'gaeulstudio.co.kr'],
    strategic_intent: '화려하고 웅장한 배경의 야간 전구 씬이 대표적인 로맨틱 웨딩 포토그래피.',
    claims: [
      '시그니처 야간 전구 씬 보유',
      '웅장하고 로맨틱한 세트 디자인'
    ],
    forbidden_claims: [
      '가장 저렴한 야간 촬영',
      '최고의 로맨틱 스튜디오'
    ],
    safety_disclaimers: [
      '야간 촬영 패키지는 추가 요금이 발생할 수 있습니다.'
    ],
    concepts: [
      { id: 'night-light-photo', label: '야간 전구 씬', definition: '전구 불빛을 배경으로 야간에 연출하는 로맨틱 포토 기법' },
      { id: 'romantic-backdrop', label: '로맨틱 세트 디자인', definition: '웅장하고 환상적인 동화 느낌의 로맨틱 세트 구성' }
    ],
    products: [
      { name: '가을 클래식 패키지', type: 'package', features: ['4시간 촬영', '보정본 70컷', '로맨틱 앨범 1권'] },
      { name: '가을 프리미엄 나이트 씬', type: 'premium_package', features: ['야간 1시간 추가 촬영', '보정본 80컷', '대형 액자 제공'] }
    ],
    persona: {
      name: '가을 Visual Director',
      tone_weights: { formal: 0.5, artistic: 0.5 },
      instructions: ['야간 촬영 기술 및 웅장한 로맨틱 배경 강조']
    },
    vibe: {
      name: '로맨틱 판타지 바이브',
      ratios: { aesthetics: 0.55, warmth: 0.25, trustworthiness: 0.20 }
    },
    color: '#f43f5e'
  },
  {
    slug: 'wonkyu-studio',
    name_ko: '원규스튜디오',
    name_en: 'Wonkyu Studio',
    domains: ['wonkyu.co.kr', 'wonkyu.com'],
    strategic_intent: '독창적이고 빈티지한 아날로그 감성과 트렌디한 인물 중심 구도를 아우르는 명품 웨딩 스튜디오.',
    claims: [
      '20년 전통의 독창적 아날로그 라이팅 기법',
      '다양한 서브 브랜드(노블레스/디퍼런스) 보유'
    ],
    forbidden_claims: [
      '국내 유일의 20년 전통',
      '무조건 인생샷 보장'
    ],
    safety_disclaimers: [
      '지점 및 브랜드 라인에 따라 촬영 콘셉트가 다릅니다.'
    ],
    concepts: [
      { id: 'analog-vintage', label: '아날로그 라이팅', definition: '빈티지한 광원을 설계하여 독특한 질감을 연출하는 촬영 기술' },
      { id: 'trendy-portrait', label: '인물 중심 구도', definition: '클래식하면서도 감각적으로 인물을 돋보이게 하는 트렌디 레이아웃' }
    ],
    products: [
      { name: '원규 노블레스 시그니처', type: 'package', features: ['3시간 촬영', '보정본 60컷', '클래식 노블레스 앨범'] },
      { name: '원규 디퍼런스 마스터피스', type: 'premium_package', features: ['4시간 촬영', '커스텀 색보정', '보정본 90컷'] }
    ],
    persona: {
      name: '원규 Creative Director',
      tone_weights: { formal: 0.6, artistic: 0.4 },
      instructions: ['독창적인 빈티지 무드와 명품 역사 강조']
    },
    vibe: {
      name: '빈티지 클래식 바이브',
      ratios: { aesthetics: 0.50, trustworthiness: 0.30, warmth: 0.20 }
    },
    color: '#0ea5e9'
  },
  {
    slug: 'sullem-studio',
    name_ko: '설렘매력주의보',
    name_en: 'Sullem Studio',
    domains: ['sullem.co.kr', 'sullemstudio.com'],
    strategic_intent: '자연스러운 미소와 러블리한 파스텔 톤의 화사한 인물 중심 스튜디오.',
    claims: [
      '화사한 파스텔 톤 색감',
      '러블리하고 내추럴한 인물 부각 촬영'
    ],
    forbidden_claims: [
      '가장 화사한 색감 보유',
      '연예인 단골 스튜디오'
    ],
    safety_disclaimers: [
      '개인 피부 톤에 따른 색감 보정 차이가 있을 수 있습니다.'
    ],
    concepts: [
      { id: 'pastel-tone-portrait', label: '파스텔 톤 보정', definition: '부드럽고 맑은 핑크/피치 계열 파스텔 색감 후보정 기법' },
      { id: 'lovely-vibe', label: '내추럴 인물 부각', definition: '자연스러운 표정과 눈빛을 따뜻하게 연출하는 인물 화보 구도' }
    ],
    products: [
      { name: '설렘 시그니처 핑크', type: 'package', features: ['3시간 촬영', '보정본 60컷', '파스텔 포토북'] },
      { name: '설렘 내추럴 화이트', type: 'premium_package', features: ['4시간 촬영', '보정본 80컷', '액자 3점 세트'] }
    ],
    persona: {
      name: '설렘 Lovely Director',
      tone_weights: { warm: 0.6, casual: 0.4 },
      instructions: ['사랑스럽고 따뜻한 소통 및 화사한 감성 연출']
    },
    vibe: {
      name: '러블리 파스텔 바이브',
      ratios: { warmth: 0.50, aesthetics: 0.30, trustworthiness: 0.20 }
    },
    color: '#fb7185'
  },
  {
    slug: 'may-studio',
    name_ko: '메이스튜디오',
    name_en: 'May Studio',
    domains: ['maystudio.co.kr', 'maystudio.com'],
    strategic_intent: '도심 속 정원과 루프탑 야외 촬영 등 자연 친화적인 그리너리 연출 전문.',
    claims: [
      '도심 속 정원 및 그리너리 테라스 세트',
      '화사한 자연광 루프탑 촬영'
    ],
    forbidden_claims: [
      '가장 넓은 가든 스튜디오',
      '루프탑 촬영 국내 최초'
    ],
    safety_disclaimers: [
      '루프탑 및 야외 촬영은 날씨 및 안전 지침에 따라 제한될 수 있습니다.'
    ],
    concepts: [
      { id: 'greenery-garden', label: '그리너리 테라스', definition: '도심 속 실외 정원과 식물이 조화된 자연 친화 테라스 씬' },
      { id: 'rooftop-outdoor', label: '루프탑 자연광', definition: '하늘과 도심 전경을 배경으로 자연광 하에서 수행하는 루프탑 촬영' }
    ],
    products: [
      { name: '메이 가든 시그니처', type: 'package', features: ['3시간 촬영', '보정본 60컷', '가든 앨범 1권'] },
      { name: '메이 루프탑 스타라이트', type: 'premium_package', features: ['4시간 촬영', '보정본 80컷', '스타라이트 야간 포함'] }
    ],
    persona: {
      name: '메이 Garden Director',
      tone_weights: { warm: 0.5, clean: 0.5 },
      instructions: ['그리너리 감성의 화사한 자연미 부각']
    },
    vibe: {
      name: '내추럴 그리너리 바이브',
      ratios: { warmth: 0.40, aesthetics: 0.40, trustworthiness: 0.20 }
    },
    color: '#10b981'
  },
  {
    slug: 'forevermine-studio',
    name_ko: '포에버마인스튜디오',
    name_en: 'Forever Mine Studio',
    domains: ['forevermine.co.kr', 'foreverminestudio.com'],
    strategic_intent: '심플함 속에 담긴 깊이 있는 흑백 사진과 세련된 인물 중심의 웨딩 앨범.',
    claims: [
      '인물 중심의 세련된 모던 흑백 사진 전문',
      '유행을 타지 않는 심플한 구도'
    ],
    forbidden_claims: [
      '가장 오래가는 앨범',
      '국내 유일의 흑백 전문'
    ],
    safety_disclaimers: [
      '흑백과 컬러 사진의 비율은 사전 조율이 필요합니다.'
    ],
    concepts: [
      { id: 'monochrome-portrait', label: '모던 흑백 사진', definition: '빛과 음영의 극명한 대비로 클래식한 감정을 표현하는 흑백 촬영' },
      { id: 'timeless-simple', label: '심플 구도', definition: '배경 요소를 극도로 절제하여 시간이 지나도 촌스럽지 않은 심플한 인물 연출' }
    ],
    products: [
      { name: '포에버 흑백 시그니처', type: 'package', features: ['3시간 촬영', '보정본 60컷', '시그니처 블랙앤화이트 앨범'] },
      { name: '포에버 모던 컬러 팩', type: 'premium_package', features: ['4시간 촬영', '보정본 80컷', '모던 컬러 하드커버'] }
    ],
    persona: {
      name: '포에버마인 Art Director',
      tone_weights: { clean: 0.6, confident: 0.4 },
      instructions: ['클래식하고 기품 있는 흑백 인물 중심 기법 소개']
    },
    vibe: {
      name: '클래식 모노크롬 바이브',
      ratios: { aesthetics: 0.50, clarity: 0.30, trustworthiness: 0.20 }
    },
    color: '#4b5563'
  },
  {
    slug: 'dalbit-scooter',
    name_ko: '달빛스쿠터',
    name_en: 'Dalbit Scooter',
    domains: ['dalbitscooter.co.kr', 'dalbit-scooter.com'],
    strategic_intent: '빈티지하고 힙한 뉴트로 스타일과 다채로운 색감의 유니크한 웨딩 비주얼.',
    claims: [
      '감각적인 뉴트로 빈티지 무드',
      '유니크한 색감과 연출'
    ],
    forbidden_claims: [
      '가장 힙한 웨딩 스튜디오',
      '젊은 층 선호도 1위'
    ],
    safety_disclaimers: [
      '뉴트로 색감 톤은 모니터 사양에 따라 다르게 보일 수 있습니다.'
    ],
    concepts: [
      { id: 'newtro-vintage', label: '뉴트로 빈티지 무드', definition: '과거 복고풍 디자인 요소와 감각적 레이아웃이 융합된 힙한 비주얼' },
      { id: 'unique-coloring', label: '유니크 색감', definition: '선명하고 세련된 시그니처 시네마 필터 컬러 후보정' }
    ],
    products: [
      { name: '달빛 스쿠터 힙 세션', type: 'package', features: ['3시간 촬영', '보정본 60컷', '스쿠터 빈티지 앨범'] },
      { name: '달빛 로맨티크 앨범', type: 'premium_package', features: ['4시간 촬영', '보정본 80컷', '대형 아크릴 액자'] }
    ],
    persona: {
      name: '달빛 비주얼 디렉터',
      tone_weights: { casual: 0.6, artistic: 0.4 },
      instructions: ['자유롭고 감각적인 트렌디 뉴트로 라이프 스타일 강조']
    },
    vibe: {
      name: '유니크 뉴트로 바이브',
      ratios: { aesthetics: 0.50, warmth: 0.30, clarity: 0.20 }
    },
    color: '#fbbf24'
  },
  {
    slug: 'terrace-studio',
    name_ko: '테라스스튜디오',
    name_en: 'Terrace Studio',
    domains: ['terracestudio.co.kr', 'terracestudio.com'],
    strategic_intent: '야외 테라스에서 진행되는 자연스러운 자연광 촬영과 데이트 스냅 감성의 야외 웨딩.',
    claims: [
      '탁 트인 야외 테라스 세트장',
      '자연스러운 커플 감성 스냅'
    ],
    forbidden_claims: [
      '가장 넓은 테라스',
      '날씨 변수 100% 극복'
    ],
    safety_disclaimers: [
      '테라스 야외 촬영은 우천 시 실내 대체 세트장에서 진행됩니다.'
    ],
    concepts: [
      { id: 'terrace-snap', label: '야외 테라스 촬영', definition: '개방형 테라스 가든을 배경으로 햇살 아래 자연스러운 연출' },
      { id: 'casual-love-story', label: '커플 데이트 스냅', definition: '형식적이지 않은 파파라치 혹은 커플 일상 스냅 감성의 웨딩' }
    ],
    products: [
      { name: '테라스 테라스 팩', type: 'package', features: ['3시간 촬영', '보정본 60컷', '테라스 전용 앨범'] },
      { name: '테라스 데이트 스냅 패키지', type: 'premium_package', features: ['4시간 촬영', '보정본 80컷', '스냅 포토북'] }
    ],
    persona: {
      name: '테라스 Snap Curator',
      tone_weights: { warm: 0.6, friendly: 0.4 },
      instructions: ['자연광 스냅과 자유롭고 가벼운 소통 방식 강조']
    },
    vibe: {
      name: '캐주얼 테라스 바이브',
      ratios: { warmth: 0.50, trustworthiness: 0.30, aesthetics: 0.20 }
    },
    color: '#f97316'
  },
  {
    slug: 'spazio-studio',
    name_ko: '스파지오스튜디오',
    name_en: 'Spazio Studio',
    domains: ['spaziostudio.co.kr', 'spazio-studio.com'],
    strategic_intent: '단독 주택 스튜디오의 장점을 살린 아늑하고 이국적인 정원 및 실내 연출.',
    claims: [
      '아늑한 이국적 단독 정원 세트',
      '하루 소수 팀 단독 촬영 보장'
    ],
    forbidden_claims: [
      '국내 최고급 정원',
      '가장 이국적인 스튜디오'
    ],
    safety_disclaimers: [
      '단독 정원 촬영은 사전 동의된 스케줄에 한해 보장됩니다.'
    ],
    concepts: [
      { id: 'exotic-garden-studio', label: '이국적 단독 정원', definition: '담장과 푸른 정원 속에서 자연스러운 해외 빌라 느낌의 무드 구현' },
      { id: 'private-single-house', label: '소수 팀 단독 촬영', definition: '혼잡하지 않게 조용한 환경을 보장하며 인물에 집중하는 시스템' }
    ],
    products: [
      { name: '스파지오 프라이빗 가든', type: 'package', features: ['3시간 촬영', '보정본 60컷', '아늑한 가든 포토북'] },
      { name: '스파지오 단독주택 패키지', type: 'premium_package', features: ['4시간 촬영', '보정본 80컷', '최고급 양장 앨범'] }
    ],
    persona: {
      name: '스파지오 Space Designer',
      tone_weights: { warm: 0.5, formal: 0.5 },
      instructions: ['프라이빗하고 조용한 환경의 퀄리티 중심 연출']
    },
    vibe: {
      name: '아늑한 이국적 바이브',
      ratios: { aesthetics: 0.45, warmth: 0.35, trustworthiness: 0.20 }
    },
    color: '#84cc16'
  },
  {
    slug: 'julies-garden',
    name_ko: '줄리의정원',
    name_en: 'Julies Garden',
    domains: ['juliesgarden.co.kr', 'juliesgarden.com'],
    strategic_intent: '싱그럽고 자연스러운 야외 정원 느낌의 인물 중심 웨딩 포토그래피.',
    claims: [
      '싱그러운 야외 가든과 인물 조화',
      '자연스럽고 편안한 디렉팅'
    ],
    forbidden_claims: [
      '가장 싱그러운 화보',
      '재촬영 100% 무료'
    ],
    safety_disclaimers: [
      '생화 장식 추가 시 별도 비용이 청구될 수 있습니다.'
    ],
    concepts: [
      { id: 'fresh-green-garden', label: '싱그러운 야외 가든', definition: '사계절 초록 숲과 꽃들이 조화를 이루는 그리너리 야외 세트장' },
      { id: 'comfortable-directing', label: '편안한 디렉팅', definition: '자연스러운 포즈와 미소를 이끌어내기 위한 1:1 리얼 소통 디렉팅' }
    ],
    products: [
      { name: '줄리 시그니처 그리너리', type: 'package', features: ['3시간 촬영', '보정본 60컷', '그린 리프 앨범'] },
      { name: '줄리 가든 앤 플라워', type: 'premium_package', features: ['4시간 촬영', '생화 데코 포함', '보정본 80컷'] }
    ],
    persona: {
      name: '줄리 Directing Artist',
      tone_weights: { warm: 0.6, casual: 0.4 },
      instructions: ['싱그러운 야외 가든과 부드러운 분위기 연출 유도']
    },
    vibe: {
      name: '싱그러운 정원 바이브',
      ratios: { warmth: 0.50, aesthetics: 0.35, trustworthiness: 0.15 }
    },
    color: '#10b981'
  },
  {
    slug: 'be-for-one-studio',
    name_ko: '비포원스튜디오',
    name_en: 'Be For One Studio',
    domains: ['beforone.co.kr', 'be-for-one.com'],
    strategic_intent: '오직 두 사람만을 위한 공간과 완벽한 인물 구도로 클래식하고 세련된 웨딩 사진.',
    claims: [
      '유행을 타지 않는 클래식 인물 구도',
      '인물 중심의 세련된 연출'
    ],
    forbidden_claims: [
      '가장 완벽한 인물 구도',
      '최저가 보장'
    ],
    safety_disclaimers: [
      '촬영 진행 세부 가이드는 사전 예약 확정 후 개별 전달됩니다.'
    ],
    concepts: [
      { id: 'classic-portrait-structure', label: '클래식 인물 구도', definition: '대칭과 정렬을 통한 고풍스럽고 세련된 사진 앵글' },
      { id: 'two-only-space', label: '두 사람만을 위한 공간', definition: '완전한 몰입을 위해 독립 설계된 전용 프라이빗 룸 촬영 세션' }
    ],
    products: [
      { name: '비포원 클래식 원', type: 'package', features: ['3시간 촬영', '보정본 60컷', '클래식 포토북'] },
      { name: '비포원 마스터 컬렉션', type: 'premium_package', features: ['4시간 촬영', '보정본 90컷', '프리미엄 가죽 앨범'] }
    ],
    persona: {
      name: '비포원 Master Director',
      tone_weights: { formal: 0.6, confident: 0.4 },
      instructions: ['클래식하고 기품 넘치는 정밀 구도 중심 설명']
    },
    vibe: {
      name: '클래식 모던 세션 바이브',
      ratios: { clarity: 0.45, aesthetics: 0.35, trustworthiness: 0.20 }
    },
    color: '#6366f1'
  }
];

/**
 * Idempotent seeder for Wedding Studio domain — 5 actual brands
 */
export async function seedWeddingStudio(workspaceId: string, domainId: string) {
  console.log('═══════════════════════════════════════════════════');
  console.log('Seeding Wedding Studio Domain — 5 Brands Full-Loop');
  console.log('═══════════════════════════════════════════════════');
  const supabase = getSupabaseAdminClient();

  // Shared Methodology Disclosure
  const disclosure = await upsertRecord('methodology_disclosures', {
    workspace_id: workspaceId,
    disclosure_name: 'Wedding Studio Standard Crawl Disclosure v1',
    slug: 'wedding-studio-standard-crawl-disclosure',
    methodology_description: 'Aggregates 80 standard Goldilocks questions across 7 layers for wedding photo studio industry.',
    proxy_caveat_text: MOCK_PROXY_CAVEAT
  }, 'workspace_id,slug');
  logSeeded('methodology_disclosures', disclosure.id, 'Wedding Methodology Disclosure');

  // Shared Probe Panel
  const panel = await upsertRecord('probe_panels', {
    workspace_id: workspaceId,
    panel_name: 'BSW-WeddingStudio-Goldilocks-80Q-v1',
    slug: 'bsw-wedding-studio-goldilocks-80q-v1',
    is_locked: true
  }, 'workspace_id,slug');
  logSeeded('probe_panels', panel.id, 'Wedding Studio 80Q Panel');

  // Seed shared 80Q probe questions from INDUSTRY_PANELS_DATA
  const weddingPanelData = INDUSTRY_PANELS_DATA['wedding_studio'];
  if (weddingPanelData && weddingPanelData.questions) {
    console.log(`[Seeder] Inserting ${weddingPanelData.questions.length} shared wedding probe questions...`);
    let qCount = 0;

    for (const qSpec of weddingPanelData.questions) {
      const question = await upsertRecord('probe_questions', {
        workspace_id: workspaceId,
        probe_panel_id: panel.id,
        question_text: qSpec.question_text,
        intent_context: qSpec.intent_context,
        target_keyword: qSpec.target_keyword
      }, 'workspace_id,probe_panel_id,question_text');

      // Expected Layers (generic, without brand substitution)
      await upsertRecord('expected_layers', {
        workspace_id: workspaceId,
        probe_question_id: question.id,
        must_include: qSpec.must_include,
        should_include: qSpec.should_include,
        must_not_do: qSpec.must_not_do,
        expected_layer_version: 1
      }, 'workspace_id,probe_question_id');

      qCount++;
      if (qCount % 20 === 0) {
        console.log(`  ...seeded ${qCount}/${weddingPanelData.questions.length} questions.`);
      }
    }
    console.log(`  ✓ Completed seeding all ${qCount} shared questions and expected layers.`);
  }

  // Per-brand full loop
  for (const brand of WEDDING_BRANDS) {
    console.log(`\n──── Seeding Brand: ${brand.name_ko} (${brand.name_en}) ────`);

    // 1. Brand Truth
    const truth = await upsertRecord('brand_truths', {
      workspace_id: workspaceId,
      brand_name: brand.name_ko,
      strategic_intent: brand.strategic_intent,
      claims: { strategic: brand.claims[0], secondary: brand.claims.slice(1) },
      status: 'locked'
    }, 'workspace_id,brand_name');
    logSeeded('brand_truths', truth.id, brand.name_ko);

    // 2. Evidence
    const evidence = await upsertRecord('truth_evidence', {
      workspace_id: workspaceId,
      evidence_name: `${brand.name_ko} Portfolio & Studio Certificate 2026`,
      evidence_type: 'portfolio',
      raw_payload: { studio: brand.name_en, verified_year: 2026, portfolio_count: 500 },
      is_verified: true
    }, 'workspace_id,evidence_name');
    logSeeded('truth_evidence', evidence.id, `${brand.name_ko} Portfolio`);

    // 3. Boundary
    const boundary = await upsertRecord('claim_boundaries', {
      workspace_id: workspaceId,
      boundary_name: `${brand.name_ko} 마케팅 제한 바운더리`,
      restricted_claims: brand.forbidden_claims,
      safety_disclaimers: brand.safety_disclaimers
    }, 'workspace_id,boundary_name');
    logSeeded('claim_boundaries', boundary.id, `${brand.name_ko} Boundaries`);

    // 4. Question Capital
    const capital = await upsertRecord('question_capitals', {
      workspace_id: workspaceId,
      capital_name: `${brand.name_ko} 웨딩 촬영 탐색 인텐트`,
      target_demographics: ['engaged_couples', 'wedding_planners'],
      market_sizing: { cohort_size: 15000 }
    }, 'workspace_id,capital_name');
    logSeeded('question_capitals', capital.id, `${brand.name_ko} Intents`);

    // 5. Canonical Question
    const cq = await upsertRecord('canonical_questions', {
      workspace_id: workspaceId,
      question_capital_id: capital.id,
      unique_signature: `cq-wedding-${brand.slug}`,
      question_text: `${brand.name_ko} 웨딩 촬영 패키지와 포트폴리오 스타일은 어떤가요?`
    }, 'unique_signature');
    logSeeded('canonical_questions', cq.id, `${brand.name_ko} CQ`);

    // 6. QIS
    const qis = await upsertRecord('qis_scenes', {
      workspace_id: workspaceId,
      canonical_question_id: cq.id,
      scene_name: `${brand.name_en} wedding photo inquiry scene`,
      query_template: `What are the wedding photo packages at ${brand.name_en}?`,
      intent_model: 'informational'
    }, 'workspace_id,scene_name');
    logSeeded('qis_scenes', qis.id, `${brand.name_en} QIS`);

    // 7. TCO Concepts & 8. KG Nodes
    for (const conceptSpec of brand.concepts) {
      const concept = await upsertRecord('tco_concepts', {
        workspace_id: workspaceId,
        concept_name: conceptSpec.label,
        slug: `${brand.slug}-${conceptSpec.id}`,
        classification: 'wedding_photography'
      }, 'workspace_id,slug');
      logSeeded('tco_concepts', concept.id, `Concept: ${conceptSpec.label}`);

      const node = await upsertRecord('kg_nodes', {
        workspace_id: workspaceId,
        concept_id: concept.id,
        node_label: `${conceptSpec.label} Node`,
        attributes: { definition: conceptSpec.definition }
      }, 'workspace_id,concept_id');
      logSeeded('kg_nodes', node.id, `KG Node: ${conceptSpec.label}`);
    }

    // 9. Claim Lineage
    const lineage = await upsertRecord('claim_lineages', {
      workspace_id: workspaceId,
      truth_id: truth.id,
      unique_hash: `lineage-hash-wedding-${brand.slug}-001`,
      status: 'valid'
    }, 'workspace_id,unique_hash');
    logSeeded('claim_lineages', lineage.id, `${brand.name_ko} Claim Lineage`);

    // 10. Representation Objects (products/packages)
    for (const product of brand.products) {
      const slug = `${brand.slug}-${product.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-')}`;
      const repObject = await upsertRecord('representation_objects', {
        workspace_id: workspaceId,
        domain_id: domainId,
        object_name: product.name,
        slug,
        object_type: product.type,
        payload: { features: product.features, brand: brand.name_ko },
        is_ready: true
      }, 'workspace_id,slug');
      logSeeded('representation_objects', repObject.id, `Product: ${product.name}`);

      // 11. Surface Contract
      const contract = await upsertRecord('surface_contracts', {
        workspace_id: workspaceId,
        representation_object_id: repObject.id,
        contract_name: `${product.name} Surface Contract`,
        slug: `${slug}-contract`,
        structured_schema: { jsonld: 'Product', brand: brand.name_en }
      }, 'workspace_id,slug');
      logSeeded('surface_contracts', contract.id, `Contract: ${product.name}`);

      // 12. Semantic Page
      await upsertRecord('semantic_pages', {
        workspace_id: workspaceId,
        surface_contract_id: contract.id,
        page_title: `${product.name} 상세 안내`,
        slug: `${slug}-guide`,
        page_body: `${brand.name_ko}의 ${product.name} (${product.type}). 구성: ${product.features.join(', ')}.`
      }, 'workspace_id,slug');
    }

    // 13. PersonaSpec
    const persona = await upsertRecord('persona_specs', {
      workspace_id: workspaceId,
      persona_name: brand.persona.name,
      slug: `${brand.slug}-persona`,
      tone_weights: brand.persona.tone_weights,
      instructions: brand.persona.instructions
    }, 'workspace_id,slug');
    logSeeded('persona_specs', persona.id, `${brand.name_ko} Persona`);

    // 14. VibeSpec
    const vibe = await upsertRecord('vibe_specs', {
      workspace_id: workspaceId,
      vibe_name: brand.vibe.name,
      slug: `${brand.slug}-vibe`,
      vibe_ratios: brand.vibe.ratios,
      evidence_links_count: 3
    }, 'workspace_id,slug');
    logSeeded('vibe_specs', vibe.id, `${brand.name_ko} Vibe`);

    // 15. Observation Run (shared panel)
    const run = await upsertRecord('ai_observation_runs', {
      workspace_id: workspaceId,
      probe_panel_id: panel.id,
      observation_model: `${brand.name_en} Baseline Observation`,
      status: 'completed'
    }, 'workspace_id,observation_model');
    logSeeded('ai_observation_runs', run.id, `${brand.name_ko} Observation Run`);

    // 16. Mock Probe Run
    const firstQ = await supabase.from('probe_questions')
      .select('id')
      .eq('probe_panel_id', panel.id)
      .limit(1)
      .single();

    if (firstQ.data) {
      const probeRun = await upsertRecord('probe_runs', {
        workspace_id: workspaceId,
        ai_observation_run_id: run.id,
        probe_question_id: firstQ.data.id,
        raw_response_text: `${brand.name_ko}의 대표 웨딩 촬영 패키지와 포트폴리오 분석 결과를 포함합니다.`,
        status: 'success'
      }, 'workspace_id,ai_observation_run_id,probe_question_id');

      await upsertRecord('response_judgments', {
        workspace_id: workspaceId,
        probe_run_id: probeRun.id,
        reviewer_id: SIMULATED_USER_ID,
        is_citation_found: true,
        brand_semantic_fidelity_score: 85.0,
        geo_concept_transferred: true,
        question_territory_covered: true
      }, 'workspace_id,probe_run_id');
    }

    // 17. Metric Snapshot
    const snapshot = await upsertRecord('metric_snapshots', {
      workspace_id: workspaceId,
      ai_observation_run_id: run.id,
      metric_name: 'ARS',
      metric_value: 85.0
    }, 'workspace_id,ai_observation_run_id,metric_name');
    logSeeded('metric_snapshots', snapshot.id, `${brand.name_ko} ARS Snapshot`);

    // 18. Benchmark Report
    const report = await upsertRecord('benchmark_reports', {
      workspace_id: workspaceId,
      report_name: `${brand.name_ko} Wedding Photo Trust Report`,
      panel_version: 1,
      scores: { ARS: 85.0, OCR: 60.0, AAS: 55.0, BSF: 78.0 },
      methodology_disclosure_id: disclosure.id,
      is_published: true
    }, 'workspace_id,report_name');
    logSeeded('benchmark_reports', report.id, `${brand.name_ko} Report`);

    console.log(`  ✓ ${brand.name_ko} Full-Loop seeding completed.`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('SUCCESS: Wedding Studio 5-Brand Full-Loop Seeding Done!');
  console.log('═══════════════════════════════════════════════════');
}
