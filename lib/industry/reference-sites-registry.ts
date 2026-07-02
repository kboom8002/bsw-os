// lib/industry/reference-sites-registry.ts
// 업종별 벤치마크 레퍼런스 사이트 레지스트리 V2.0
// 4그룹 큐레이션: Traffic Giant / AEO Monster / Rising Star / Anchor Baseline

import { MacroCategoryKey } from './industry-taxonomy';
import { getSupabaseAdminClient } from '../supabase';

// ═══════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════

/** 큐레이션 소스 태그 */
export type CurationSource = 'traffic_giant' | 'aeo_monster' | 'rising_star' | 'anchor_poor';

/** 특성 태그 */
export type FeatureTag =
  | CurationSource
  | 'd2c_brand' | 'content_leader' | 'expert_persona' | 'tech_leader'
  | 'nextjs' | 'pwa' | 'ssr' | 'spa'
  | 'global' | 'korea'
  | 'schema_rich' | 'blog_strong' | 'review_strong' | 'local_seo';

export interface ReferenceSite {
  id: string;
  url: string;
  brandName: string;
  tier: 'excellent' | 'average' | 'poor';
  subIndustryKey: string;
  macroKey?: MacroCategoryKey;
  /** V2.0: 큐레이션 소스 + 특성 태그 */
  tags: string[];
  curatorNotes?: string;
}

// ═══════════════════════════════════════════════════════════════
// Wave 1 시드 데이터: 6업종 × ~25사이트
// ═══════════════════════════════════════════════════════════════

export const REFERENCE_SITES: Record<string, ReferenceSite[]> = {

  // ─────────────────────────────────────────────────────────
  // 1. 스킨케어/뷰티 제품 (skincare) — ecommerce_d2c
  // ─────────────────────────────────────────────────────────
  skincare: [
    // === Traffic Giants ===
    { id: 'laneige', url: 'https://www.laneige.com', brandName: 'LANEIGE', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'schema_rich', 'ssr'], curatorNotes: '아모레퍼시픽. Organization + Product 스키마 완비, 다국어 hreflang' },
    { id: 'drjart', url: 'https://www.drjart.com', brandName: 'Dr.Jart+', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'review_strong'], curatorNotes: '에스티로더 산하. Product + FAQ + AggregateRating' },
    { id: 'innisfree', url: 'https://www.innisfree.com', brandName: 'Innisfree', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'content_leader'], curatorNotes: '아모레퍼시픽. HowTo 스키마, 토픽 클러스터 우수' },
    { id: 'sulwhasoo', url: 'https://www.sulwhasoo.com', brandName: '설화수', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'schema_rich'], curatorNotes: '아모레퍼시픽 프리미엄. Organization sameAs 풍부, 다국어' },
    { id: 'whoo', url: 'https://www.thehistoryofwhoo.com', brandName: '후 (The History of Whoo)', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'expert_persona'], curatorNotes: 'LG 프리미엄. 풍부한 비주얼 + 콘텐츠 클러스터' },
    { id: 'theordinary', url: 'https://theordinary.com', brandName: 'The Ordinary', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'content_leader', 'tech_leader'], curatorNotes: 'DECIEM. 성분 교육 콘텐츠 최강, FAQ 스키마 우수' },
    { id: 'cerave', url: 'https://www.cerave.com', brandName: 'CeraVe', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'expert_persona'], curatorNotes: "L'Oréal. 피부과 전문의 E-E-A-T 최강" },
    { id: 'larochep', url: 'https://www.laroche-posay.com', brandName: 'La Roche-Posay', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'global', 'expert_persona'], curatorNotes: "L'Oréal 더마. 임상 데이터 기반 콘텐츠" },
    // === AEO Monsters ===
    { id: 'paulaschoice', url: 'https://www.paulaschoice.com', brandName: "Paula's Choice", tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['aeo_monster', 'global', 'content_leader', 'blog_strong'], curatorNotes: 'AI 검색 인용 최다급. Ingredient Dictionary, 성분 리뷰 콘텐츠' },
    { id: 'skinceuticals', url: 'https://www.skinceuticals.com', brandName: 'SkinCeuticals', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['aeo_monster', 'global', 'expert_persona'], curatorNotes: "L'Oréal 메디컬. 피부과 권위 E-E-A-T" },
    { id: 'beautyofjoseon', url: 'https://beautyofjoseon.com', brandName: '조선미녀', tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['aeo_monster', 'global', 'd2c_brand'], curatorNotes: 'K-Beauty AI 인용 빈도 급상승. 성분 스토리텔링' },
    { id: 'kiehls', url: 'https://www.kiehls.com', brandName: "Kiehl's", tier: 'excellent', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['aeo_monster', 'global', 'schema_rich'], curatorNotes: "L'Oréal. AI 스킨케어 루틴 인용 빈도 높음" },
    // === Rising Stars ===
    { id: 'torriden', url: 'https://torriden.com', brandName: 'Torriden', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['rising_star', 'korea', 'd2c_brand'], curatorNotes: '다이브인 히알루론산 히트. 급성장 D2C' },
    { id: 'skin1004', url: 'https://skin1004.com', brandName: 'SKIN1004', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['rising_star', 'global', 'd2c_brand'], curatorNotes: '마다가스카르 센텔라. 글로벌 확장 중' },
    { id: 'tirtir', url: 'https://www.tirtir.com', brandName: 'TIRTIR', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['rising_star', 'global', 'd2c_brand'], curatorNotes: '마스크핏 쿠션 글로벌 바이럴. TikTok 성장' },
    { id: 'numbuzin', url: 'https://numbuzin.com', brandName: '넘버즈인', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['rising_star', 'korea', 'd2c_brand'], curatorNotes: '넘버링 시스템. 올리브영 TOP' },
    { id: 'medicube', url: 'https://www.medicube.com', brandName: 'MEDICUBE', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['rising_star', 'korea', 'd2c_brand', 'tech_leader'], curatorNotes: '에이피알. AGE-R 디바이스+스킨케어 융합' },
    { id: 'roundlab', url: 'https://www.roundlab.co.kr', brandName: '라운드랩', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['rising_star', 'korea', 'd2c_brand'], curatorNotes: '독도 토너 히트. 성분 중심 브랜딩' },
    // === Average (중견) ===
    { id: 'cnpcosmetics', url: 'https://www.cnpcosmetics.com', brandName: 'CNP Laboratory', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['korea', 'expert_persona'], curatorNotes: '더마 코스메틱. Product 스키마 일부' },
    { id: 'goodal', url: 'https://www.goodal.com', brandName: 'Goodal', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['korea'], curatorNotes: '클리오 산하. OG 부분 적용' },
    { id: 'hera', url: 'https://www.hera.com', brandName: 'HERA', tier: 'average', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['traffic_giant', 'korea', 'schema_rich'], curatorNotes: '아모레퍼시픽 프리미엄. 비주얼 중심' },
    // === Anchor Poor ===
    { id: 'cosrx', url: 'https://www.cosrx.com', brandName: 'COSRX', tier: 'poor', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['anchor_poor', 'global'], curatorNotes: '해외 유명세 대비 웹 최적화 미흡. JSON-LD 부재, CSR' },
    { id: 'anua', url: 'https://anuaofficial.com', brandName: 'ANUA', tier: 'poor', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['anchor_poor', 'korea'], curatorNotes: '스키마 미적용, E-E-A-T 신호 전무' },
    { id: 'mixsoon', url: 'https://www.mixsoon.co.kr', brandName: 'MIXSOON', tier: 'poor', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['anchor_poor', 'korea'], curatorNotes: 'HTML only, Organization 스키마 없음, TTFB 느림' },
    { id: 'beplain', url: 'https://www.bfriendbeplain.com', brandName: 'beplain', tier: 'poor', subIndustryKey: 'skincare', macroKey: 'ecommerce_d2c', tags: ['anchor_poor', 'korea'], curatorNotes: '클린 뷰티. 기본 Shopify, 스키마 미설정' },
  ],

  // ─────────────────────────────────────────────────────────
  // 2. 웨딩 서비스 (wedding) — local_services
  // ─────────────────────────────────────────────────────────
  wedding: [
    // === Traffic Giants ===
    { id: 'theknot', url: 'https://www.theknot.com', brandName: 'The Knot', tier: 'excellent', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['traffic_giant', 'global', 'content_leader', 'schema_rich'], curatorNotes: '글로벌 #1 웨딩 플랫폼. Article + FAQPage + HowTo 스키마 완비' },
    { id: 'brides', url: 'https://www.brides.com', brandName: 'Brides', tier: 'excellent', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['traffic_giant', 'global', 'blog_strong', 'content_leader'], curatorNotes: 'Dotdash Meredith. 체크리스트·가이드 콘텐츠 최강' },
    { id: 'marthastewartweddings', url: 'https://www.marthastewartweddings.com', brandName: 'Martha Stewart Weddings', tier: 'excellent', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['traffic_giant', 'global', 'expert_persona'], curatorNotes: '전문가 E-E-A-T 강력. 에디토리얼 콘텐츠' },
    { id: 'weddingbook', url: 'https://www.weddingbook.com', brandName: '웨딩북', tier: 'excellent', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'tech_leader', 'review_strong'], curatorNotes: '국내 #1 웨딩 플랫폼. 실시간 견적·리뷰 시스템' },
    { id: 'duclass', url: 'https://www.duclass.com', brandName: '듀클래스', tier: 'excellent', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'review_strong', 'local_seo'], curatorNotes: '강남 웨딩 #1. 스드메 비교·리뷰 콘텐츠 풍부' },
    // === AEO Monsters ===
    { id: 'zola', url: 'https://www.zola.com', brandName: 'Zola', tier: 'excellent', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['aeo_monster', 'global', 'tech_leader', 'schema_rich'], curatorNotes: '올인원 웨딩. 체크리스트+레지스트리+웹사이트. AI 인용 빈도 높음' },
    { id: 'weddingwire', url: 'https://www.weddingwire.com', brandName: 'WeddingWire', tier: 'excellent', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['aeo_monster', 'global', 'review_strong', 'local_seo'], curatorNotes: 'The Knot 자매사. 벤더 리뷰 + 지역 검색 최적화' },
    { id: 'hitchd', url: 'https://www.hitchd.com', brandName: 'Hitchd', tier: 'average', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['aeo_monster', 'global', 'tech_leader'], curatorNotes: '허니문 펀드 특화. 모던 웹 기술 + FAQ 콘텐츠' },
    // === Rising Stars (Korea) ===
    { id: 'bobbijin', url: 'https://www.bobbijin.com', brandName: '바비진스튜디오', tier: 'average', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '웨딩 스튜디오. 포트폴리오 중심 자사몰' },
    { id: 'studioida', url: 'https://studioida.co.kr', brandName: '스튜디오아이다', tier: 'average', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '웨딩 촬영 전문. 비주얼 포트폴리오' },
    { id: 'roywedding', url: 'https://www.roywedding.co.kr', brandName: '로이 웨딩', tier: 'average', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '웨딩홀 + 서비스 통합. 지역 SEO' },
    { id: 'junewedding', url: 'https://www.junewedding.co.kr', brandName: '쥬네웨딩', tier: 'average', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '웨딩 플래너. 커스텀 패키지 콘텐츠' },
    { id: 'studiochungsam', url: 'https://chungsam.co.kr', brandName: '청샘스튜디오', tier: 'average', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '한국 웨딩 촬영 전문 스튜디오' },
    // === Anchor Poor ===
    { id: 'localwedding1', url: 'https://www.jejuwedding.co.kr', brandName: '제주웨딩', tier: 'poor', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '제주 로컬 웨딩. 기본 HTML, 스키마 없음' },
    { id: 'localwedding2', url: 'https://www.weddingmaru.co.kr', brandName: '웨딩마루', tier: 'poor', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['anchor_poor', 'korea'], curatorNotes: '소규모 웨딩홀. 기본 웹사이트, 모바일 미대응' },
    { id: 'localwedding3', url: 'https://www.mywedding.co.kr', brandName: '마이웨딩', tier: 'poor', subIndustryKey: 'wedding', macroKey: 'local_services', tags: ['anchor_poor', 'korea'], curatorNotes: '레거시 웨딩 포탈. 올드 디자인, 스키마 미적용' },
  ],

  // ─────────────────────────────────────────────────────────
  // 3. 의원/병원 (medical_clinic) — ymyl_professional
  // ─────────────────────────────────────────────────────────
  medical_clinic: [
    // === Traffic Giants ===
    { id: 'mayoclinic', url: 'https://www.mayoclinic.org', brandName: 'Mayo Clinic', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['traffic_giant', 'global', 'expert_persona', 'content_leader', 'schema_rich'], curatorNotes: '글로벌 #1 YMYL. MedicalWebPage 스키마, 의사 프로필, 임상 콘텐츠 최강' },
    { id: 'clevelandclinic', url: 'https://my.clevelandclinic.org', brandName: 'Cleveland Clinic', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['traffic_giant', 'global', 'content_leader', 'blog_strong'], curatorNotes: 'Health Essentials 블로그 #1. 토픽 클러스터 + 의사 E-E-A-T' },
    { id: 'hopkinsmedicine', url: 'https://www.hopkinsmedicine.org', brandName: 'Johns Hopkins Medicine', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['traffic_giant', 'global', 'expert_persona'], curatorNotes: 'JHU 의료원. 연구 기반 콘텐츠, 풍부한 시맨틱 마크업' },
    { id: 'snuh', url: 'https://www.snuh.org', brandName: '서울대학교병원', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['traffic_giant', 'korea', 'expert_persona'], curatorNotes: '국내 #1 대학병원. Organization 스키마, 의료진 프로필' },
    { id: 'samsunghospital', url: 'https://www.samsunghospital.com', brandName: '삼성서울병원', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['traffic_giant', 'korea', 'expert_persona', 'tech_leader'], curatorNotes: '삼성 의료원. 건강정보 콘텐츠 풍부' },
    { id: 'amcseoul', url: 'https://www.amc.seoul.kr', brandName: '서울아산병원', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['traffic_giant', 'korea', 'content_leader'], curatorNotes: '아산 의료원. 질환백과 콘텐츠 최다' },
    // === AEO Monsters ===
    { id: 'healthline', url: 'https://www.healthline.com', brandName: 'Healthline', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['aeo_monster', 'global', 'content_leader', 'blog_strong', 'schema_rich'], curatorNotes: 'AI 건강 검색 인용 #1. 의학 리뷰어 E-E-A-T + FAQ 스키마' },
    { id: 'webmd', url: 'https://www.webmd.com', brandName: 'WebMD', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['aeo_monster', 'global', 'content_leader'], curatorNotes: '건강 정보 레거시. AI 오버뷰 단골 인용' },
    { id: 'medicalnewstoday', url: 'https://www.medicalnewstoday.com', brandName: 'Medical News Today', tier: 'excellent', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['aeo_monster', 'global', 'blog_strong'], curatorNotes: 'Healthline 자매사. 의학 뉴스+가이드 AI 인용 빈도 높음' },
    { id: 'hidoc', url: 'https://www.hidoc.co.kr', brandName: '하이닥', tier: 'average', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['aeo_monster', 'korea', 'content_leader'], curatorNotes: '국내 건강 정보 #1. 의사 답변 콘텐츠 AI 인용' },
    // === Rising Stars ===
    { id: 'gangnamderm', url: 'https://www.gangnamderm.com', brandName: '강남피부과', tier: 'average', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '강남 피부과. 시술 정보 콘텐츠 + 지역 SEO' },
    { id: 'izanagi', url: 'https://www.izanagiclinic.com', brandName: '이자나기 클리닉', tier: 'average', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '모던 디자인 의원. 비주얼 중심' },
    { id: 'bfriendderm', url: 'https://www.bfriend.co.kr', brandName: '뷰티프렌드 피부과', tier: 'average', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['rising_star', 'korea', 'local_seo', 'blog_strong'], curatorNotes: '블로그 마케팅 강자. 시술 후기 콘텐츠' },
    // === Anchor Poor ===
    { id: 'localclinic1', url: 'https://www.hanilclinic.co.kr', brandName: '한일의원', tier: 'poor', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '동네 의원. 기본 HTML, 진료 안내만 게재' },
    { id: 'localclinic2', url: 'https://www.samwonclinic.co.kr', brandName: '삼원의원', tier: 'poor', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['anchor_poor', 'korea'], curatorNotes: '소규모 의원. 올드 디자인, 스키마 없음' },
    { id: 'localclinic3', url: 'https://www.mychild-clinic.co.kr', brandName: '우리아이 소아과', tier: 'poor', subIndustryKey: 'medical_clinic', macroKey: 'ymyl_professional', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '동네 소아과. 모바일 미대응, HTTPS 미적용 가능' },
  ],

  // ─────────────────────────────────────────────────────────
  // 4. 레스토랑/카페 (restaurant_cafe) — local_services
  // ─────────────────────────────────────────────────────────
  restaurant_cafe: [
    // === Traffic Giants ===
    { id: 'starbucks', url: 'https://www.starbucks.co.kr', brandName: '스타벅스 코리아', tier: 'excellent', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'schema_rich', 'tech_leader'], curatorNotes: '카페 #1. LocalBusiness + Menu 스키마, 모바일 앱 연동' },
    { id: 'bluebottlekr', url: 'https://bluebottlecoffee.kr', brandName: '블루보틀 코리아', tier: 'excellent', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'content_leader'], curatorNotes: '프리미엄 카페. 원두 스토리텔링 + 매장 콘텐츠' },
    { id: 'shakeshack', url: 'https://www.shakeshack.kr', brandName: 'Shake Shack Korea', tier: 'excellent', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'schema_rich', 'local_seo'], curatorNotes: '프리미엄 버거. 매장 위치 + Menu 스키마' },
    { id: 'mcdonaldskr', url: 'https://www.mcdonalds.co.kr', brandName: '맥도날드 코리아', tier: 'excellent', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'schema_rich'], curatorNotes: 'QSR #1. Organization + Product + Store locator' },
    { id: 'chipotlemx', url: 'https://www.chipotle.com', brandName: 'Chipotle', tier: 'excellent', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['traffic_giant', 'global', 'tech_leader', 'schema_rich'], curatorNotes: 'D2C 레스토랑 모델. 온라인 주문 + 지역 SEO 최강' },
    // === AEO Monsters ===
    { id: 'bonappetit', url: 'https://www.bonappetit.com', brandName: 'Bon Appétit', tier: 'excellent', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['aeo_monster', 'global', 'content_leader', 'blog_strong'], curatorNotes: '식음료 콘텐츠 미디어. Recipe + HowTo 스키마, AI 인용 최다' },
    { id: 'seriouseats', url: 'https://www.seriouseats.com', brandName: 'Serious Eats', tier: 'excellent', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['aeo_monster', 'global', 'content_leader', 'expert_persona'], curatorNotes: 'Dotdash Meredith. 과학적 요리법 콘텐츠, AI 인용 빈도 높음' },
    { id: 'mangoplate', url: 'https://www.mangoplate.com', brandName: '망고플레이트', tier: 'average', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['aeo_monster', 'korea', 'review_strong', 'local_seo'], curatorNotes: '국내 맛집 리뷰. 지역 기반 콘텐츠' },
    // === Rising Stars ===
    { id: 'ediyacoffee', url: 'https://www.ediya.com', brandName: '이디야커피', tier: 'average', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '카페 프랜차이즈 #1 매장 수. 매장 찾기 + 메뉴' },
    { id: 'megacoffee', url: 'https://www.mega-mgccoffee.com', brandName: '메가MGC커피', tier: 'average', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '초저가 대형 카페. 급속 확장 중' },
    { id: 'companionkr', url: 'https://www.companionkitchen.co.kr', brandName: '컴패니언 키친', tier: 'average', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '프리미엄 레스토랑. 모던 자사몰' },
    // === Anchor Poor ===
    { id: 'localcafe1', url: 'https://www.cafeon.co.kr', brandName: '카페온', tier: 'poor', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '동네 카페. 기본 웹사이트, 메뉴 이미지만' },
    { id: 'localrest1', url: 'https://www.hansikdang.co.kr', brandName: '한식당', tier: 'poor', subIndustryKey: 'restaurant_cafe', macroKey: 'local_services', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '동네 한식당. 간단한 메뉴·위치 안내' },
  ],

  // ─────────────────────────────────────────────────────────
  // 5. 호텔/호스피탈리티 (hotel) — local_services
  // ─────────────────────────────────────────────────────────
  hotel: [
    // === Traffic Giants ===
    { id: 'marriott', url: 'https://www.marriott.com', brandName: 'Marriott International', tier: 'excellent', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['traffic_giant', 'global', 'schema_rich', 'tech_leader'], curatorNotes: '글로벌 #1. Hotel + LocalBusiness 스키마, 지역 SEO 최강' },
    { id: 'hilton', url: 'https://www.hilton.com', brandName: 'Hilton', tier: 'excellent', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['traffic_giant', 'global', 'schema_rich'], curatorNotes: '글로벌 #2. LodgingBusiness 스키마, AggregateRating' },
    { id: 'ihg', url: 'https://www.ihg.com', brandName: 'IHG Hotels', tier: 'excellent', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['traffic_giant', 'global', 'tech_leader'], curatorNotes: 'Holiday Inn·InterContinental. 직예약 전환 최적화' },
    { id: 'lottehotel', url: 'https://www.lottehotel.com', brandName: '롯데호텔', tier: 'excellent', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'schema_rich', 'local_seo'], curatorNotes: '국내 #1 호텔 체인. 다국어, 지역별 페이지 최적화' },
    { id: 'shillahotel', url: 'https://www.shillahotels.com', brandName: '신라호텔', tier: 'excellent', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['traffic_giant', 'korea', 'expert_persona'], curatorNotes: '삼성 프리미엄. 럭셔리 콘텐츠 + 다이닝 스키마' },
    // === AEO Monsters ===
    { id: 'fourseasons', url: 'https://www.fourseasons.com', brandName: 'Four Seasons', tier: 'excellent', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['aeo_monster', 'global', 'content_leader', 'expert_persona'], curatorNotes: '럭셔리 #1. Magazine 콘텐츠, 지역 가이드 AI 인용' },
    { id: 'amanresorts', url: 'https://www.aman.com', brandName: 'Aman Resorts', tier: 'excellent', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['aeo_monster', 'global', 'content_leader'], curatorNotes: '울트라 럭셔리. 목적지 스토리텔링 콘텐츠 최강' },
    { id: 'josunhotel', url: 'https://www.josunhotel.com', brandName: '조선호텔', tier: 'average', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['aeo_monster', 'korea', 'local_seo'], curatorNotes: '한국 역사 호텔. 웨딩+다이닝 콘텐츠' },
    // === Rising Stars ===
    { id: 'rysehotel', url: 'https://www.rysehotel.com', brandName: 'RYSE Autograph Collection', tier: 'average', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['rising_star', 'korea', 'tech_leader'], curatorNotes: '홍대 부티크. 모던 웹 디자인, 아트 콘텐츠' },
    { id: 'signielseoul', url: 'https://www.lottehotel.com/signielseoul', brandName: 'Signiel Seoul', tier: 'average', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['rising_star', 'korea', 'expert_persona'], curatorNotes: '롯데 럭셔리. 프리미엄 콘텐츠' },
    { id: 'gladlive', url: 'https://www.glad-hotels.com', brandName: 'GLAD Hotels', tier: 'average', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '대상그룹 라이프스타일 호텔. 모던 UX' },
    // === Anchor Poor ===
    { id: 'localhotel1', url: 'https://www.jejupension.com', brandName: '제주 펜션 모음', tier: 'poor', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '로컬 펜션. 기본 HTML, 사진 갤러리만' },
    { id: 'localhotel2', url: 'https://www.sokchomotel.co.kr', brandName: '속초 모텔', tier: 'poor', subIndustryKey: 'hotel', macroKey: 'local_services', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '로컬 숙박. 예약 폼만, 스키마 없음' },
  ],

  // ─────────────────────────────────────────────────────────
  // 6. 지역/플레이스 (place_brand) — media_content_hub
  // ─────────────────────────────────────────────────────────
  place_brand: [
    // === Traffic Giants ===
    { id: 'visitkorea', url: 'https://korean.visitkorea.or.kr', brandName: '대한민국 구석구석', tier: 'excellent', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['traffic_giant', 'korea', 'content_leader', 'schema_rich'], curatorNotes: '한국관광공사. TouristAttraction + Place 스키마, 다국어' },
    { id: 'visitjeju', url: 'https://www.visitjeju.net', brandName: '비짓제주', tier: 'excellent', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['traffic_giant', 'korea', 'content_leader', 'local_seo'], curatorNotes: '제주관광공사. 지역 관광 콘텐츠 #1, 다국어' },
    { id: 'visitjapan', url: 'https://www.japan.travel', brandName: 'Visit Japan', tier: 'excellent', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['traffic_giant', 'global', 'schema_rich', 'content_leader'], curatorNotes: 'JNTO. TouristDestination 스키마, 지역 허브 콘텐츠 최강' },
    { id: 'visitsingapore', url: 'https://www.visitsingapore.com', brandName: 'Visit Singapore', tier: 'excellent', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['traffic_giant', 'global', 'tech_leader', 'content_leader'], curatorNotes: '싱가포르 관광청. AI 추천 + 인터랙티브 맵 + 시맨틱 콘텐츠' },
    { id: 'discoverla', url: 'https://www.discoverlosangeles.com', brandName: 'Discover LA', tier: 'excellent', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['traffic_giant', 'global', 'content_leader', 'blog_strong'], curatorNotes: 'LA 관광청. 이벤트·명소 콘텐츠 클러스터' },
    // === AEO Monsters ===
    { id: 'timeout', url: 'https://www.timeout.com', brandName: 'Time Out', tier: 'excellent', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['aeo_monster', 'global', 'content_leader', 'blog_strong'], curatorNotes: '글로벌 도시 가이드. AI "best restaurants in" 인용 #1' },
    { id: 'cntraveler', url: 'https://www.cntraveler.com', brandName: 'Condé Nast Traveler', tier: 'excellent', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['aeo_monster', 'global', 'expert_persona', 'content_leader'], curatorNotes: '프리미엄 여행 미디어. 전문 에디터 E-E-A-T' },
    { id: 'seoulkorea', url: 'https://www.visitseoul.net', brandName: '비짓서울', tier: 'average', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['aeo_monster', 'korea', 'content_leader', 'local_seo'], curatorNotes: '서울관광재단. 서울 관광 콘텐츠, AI 인용' },
    // === Rising Stars ===
    { id: 'seongsu', url: 'https://www.seongsu.kr', brandName: '성수 지역 브랜드', tier: 'average', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '성수동 지역 브랜딩. 힙 콘텐츠' },
    { id: 'busanone', url: 'https://www.bto.or.kr', brandName: '부산관광공사', tier: 'average', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['rising_star', 'korea', 'content_leader', 'local_seo'], curatorNotes: '부산 관광. 해운대 등 지역 콘텐츠' },
    { id: 'gyeongjuworld', url: 'https://www.gyeongju.go.kr', brandName: '경주시', tier: 'average', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['rising_star', 'korea', 'local_seo'], curatorNotes: '역사 도시 브랜딩. 유네스코 콘텐츠' },
    // === Anchor Poor ===
    { id: 'localplace1', url: 'https://www.yeongwol.go.kr', brandName: '영월군청', tier: 'poor', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '소도시 지자체. 관광 콘텐츠 부족, 레거시 CMS' },
    { id: 'localplace2', url: 'https://www.yangyang.go.kr', brandName: '양양군청', tier: 'poor', subIndustryKey: 'place_brand', macroKey: 'media_content_hub', tags: ['anchor_poor', 'korea', 'local_seo'], curatorNotes: '지자체 기본 사이트. 관광 섹션 분리 미흡' },
  ],
};


// ═══════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════

/** 세부 업종 키로 레퍼런스 사이트 목록을 반환 */
export function getReferenceSitesBySubIndustry(subIndustryKey: string): ReferenceSite[] {
  return REFERENCE_SITES[subIndustryKey] ?? [];
}

/** 태그로 필터링하여 레퍼런스 사이트 반환 */
export function getReferenceSitesByTags(subIndustryKey: string, tags: string[]): ReferenceSite[] {
  const sites = REFERENCE_SITES[subIndustryKey] ?? [];
  if (tags.length === 0) return sites;
  return sites.filter(site =>
    tags.some(tag => site.tags.includes(tag))
  );
}

/** 매크로 카테고리 키로 전체 레퍼런스 사이트 반환 */
export function getReferenceSitesByMacro(macroKey: MacroCategoryKey): ReferenceSite[] {
  return Object.values(REFERENCE_SITES).flat().filter(site => site.macroKey === macroKey);
}

/** 특정 tier만 필터링 */
export function getReferenceSitesByTier(subIndustryKey: string, tier: 'excellent' | 'average' | 'poor'): ReferenceSite[] {
  return (REFERENCE_SITES[subIndustryKey] ?? []).filter(site => site.tier === tier);
}

/** 활성 레퍼런스 사이트가 있는 업종 키 목록 반환 */
export function getSeededSubIndustryKeys(): string[] {
  return Object.entries(REFERENCE_SITES)
    .filter(([, sites]) => sites.length >= 3)
    .map(([key]) => key);
}

/** 업종별 시드 통계 요약 */
export function getSeedStatistics(): Record<string, { total: number; excellent: number; average: number; poor: number }> {
  const stats: Record<string, { total: number; excellent: number; average: number; poor: number }> = {};
  for (const [key, sites] of Object.entries(REFERENCE_SITES)) {
    if (sites.length === 0) continue;
    stats[key] = {
      total: sites.length,
      excellent: sites.filter(s => s.tier === 'excellent').length,
      average: sites.filter(s => s.tier === 'average').length,
      poor: sites.filter(s => s.tier === 'poor').length,
    };
  }
  return stats;
}

// ═══════════════════════════════════════════════════════════════
// DB CRUD (reference_sites 테이블 연동)
// ═══════════════════════════════════════════════════════════════

export interface NewReferenceSite {
  url: string;
  brandName: string;
  tier: 'excellent' | 'average' | 'poor';
  subIndustryKey: string;
  macroKey?: MacroCategoryKey;
  tags?: string[];
  curatorNotes?: string;
}

/** 레퍼런스 사이트 추가 (DB) — DB 스키마에 있는 컬럼만 삽입 */
export async function addReferenceSite(site: NewReferenceSite): Promise<{ id: string }> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('reference_sites')
    .insert({
      url: site.url,
      brand_name: site.brandName,
      tier: site.tier,
      sub_industry_key: site.subIndustryKey,
      curator_notes: site.curatorNotes ?? null,
      active: true,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`레퍼런스 사이트 추가 실패: ${error?.message ?? '알 수 없는 오류'}`);
  }
  return { id: data.id as string };
}

/**
 * DB에 저장된 레퍼런스 사이트 조회 (하드코딩 시드 데이터 제외)
 * 업종 벤치마크 페이지에서 사용자가 추가한 사이트를 읽기 위해 사용.
 */
export async function getDbReferenceSites(subIndustryKey: string): Promise<ReferenceSite[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('reference_sites')
      .select('id, url, brand_name, tier, sub_industry_key, curator_notes')
      .eq('sub_industry_key', subIndustryKey)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id as string,
      url: row.url as string,
      brandName: row.brand_name as string,
      tier: row.tier as 'excellent' | 'average' | 'poor',
      subIndustryKey: row.sub_industry_key as string,
      tags: [],
      curatorNotes: row.curator_notes as string | undefined,
    }));
  } catch (err) {
    console.warn('[reference-sites] getDbReferenceSites failed:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/** 레퍼런스 사이트 삭제 (DB) */
export async function deleteReferenceSite(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('reference_sites').delete().eq('id', id);
    if (error) {
      console.warn('[reference-sites] deleteReferenceSite failed:', error.message);
      return false;
    }
    return true;
  } catch (err: unknown) {
    console.warn('[reference-sites] deleteReferenceSite error:', err instanceof Error ? err.message : String(err));
    return false;
  }
}
