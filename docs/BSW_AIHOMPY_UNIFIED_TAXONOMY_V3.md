# BSW-OS × AIHOMPYHUB 통합 업종 분류 체계 최적 설계

> **Version:** 3.0 (2026-06-26)  
> **입력:** V1 BSW Taxonomy (11카테고리/22세부) + Gemini V2 제안 (4매크로/15세부) + AIHOMPYHUB 실사용 (48+코어/60+확장)  
> **목적:** 두 시스템 간 완전 호환되는 업종 분류 + BM 기반 동적 가중치 엔진

---

## 1. 현행 3시스템 업종 체계 교차 분석

### 1.1 현재 체계별 커버리지 매트릭스

```
┌──────────────────────┬──────────┬──────────┬──────────┬──────────────────────────┐
│ 업종 도메인            │ BSW V1   │ Gemini   │ AIHOMPY  │ 통합 설계 필요사항         │
│                      │ (22 sub) │ (15 sub) │ (48+key) │                          │
├──────────────────────┼──────────┼──────────┼──────────┼──────────────────────────┤
│ 스킨케어/뷰티          │ ✅ 2건   │ ✅ 1건   │ ✅ 3건   │ 프리미엄 분리 반영         │
│ 웨딩                  │ ✅ 2건   │ ❌       │ ✅ 12건  │ 세부 SDM 체계 흡수         │
│ 의료/건강              │ ✅ 2건   │ ✅ 1건   │ ✅ 4건   │ 한방/시니어 분리            │
│ 식음료                │ ✅ 3건   │ ❌       │ ✅ 1건   │ 카페/레스토랑 분리          │
│ 법률/금융              │ ✅ 3건   │ ✅ 2건   │ ❌       │ BSW 키 유지               │
│ IT/SaaS              │ ✅ 1건   │ ✅ 2건   │ ✅ 5건   │ 스타트업 세분화 흡수        │
│ 패션/이커머스          │ ✅ 1건   │ ✅ 1건   │ ✅ 1건   │ 통합                     │
│ 여행/관광              │ ✅ 1건   │ ❌       │ ✅ 1건   │ 호텔/호스피탈리티 추가      │
│ 부동산                │ ✅ 2건   │ ❌       │ ✅ 1건   │ 유지                     │
│ 교육                  │ ✅ 1건   │ ✅ 2건   │ ❌       │ 온/오프라인 분리           │
│ 자동차                │ ✅ 1건   │ ❌       │ ❌       │ 유지                     │
│ 엔터테인먼트           │ ✅ 1건   │ ❌       │ ✅ 3건   │ 음악/사진/콘텐츠 세분화     │
│ 헤어/네일              │ ❌       │ ✅ 1건   │ ✅ 1건   │ 신규 추가                 │
│ 피트니스               │ ❌       │ ✅ 1건   │ ❌       │ 신규 추가                 │
│ 전문가/컨설팅          │ ❌       │ ✅ 1건   │ ✅ 8건   │ 전문가 홈피 체계 흡수       │
│ 지역/플레이스           │ ❌       │ ❌       │ ✅ 6건   │ 지역 전문가 체계 신규       │
│ 홈/리빙               │ ❌       │ ✅ 1건   │ ❌       │ 신규 추가                 │
│ 반려동물               │ ✅ 1건   │ ❌       │ ❌       │ 유지                     │
└──────────────────────┴──────────┴──────────┴──────────┴──────────────────────────┘
```

### 1.2 핵심 설계 결정사항

> [!IMPORTANT]
> **Gemini 제안 vs 실제 구현 사이의 핵심 차이:**
> 
> 1. **4매크로는 너무 거칠다:** AIHOMPYHUB에는 웨딩(12개), 전문가(8개), 지역(6개) 등 세밀한 업종이 실사용 중. 4개 매크로로 묶으면 벤치마크 정밀도 손실.
> 2. **AIHOMPYHUB의 48+키는 너무 세밀하다:** BSW 진단에서 `gangnam_wedding_dress`와 `wedding_dress`를 구분할 벤치마크 데이터 확보 불가능.
> 3. **최적 해법:** **5대 BM 매크로 + 28개 BSW 세부업종 + AIHOMPY 매핑 테이블**의 3계층 구조.

---

## 2. 통합 업종 분류 체계 V3.0

### 2.1 아키텍처: 3계층 + 매핑 레이어

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   V3.0 통합 업종 분류 아키텍처                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Layer 1: BM 매크로 (5개)   ← AEPI 동적 가중치 결정 기준                   │
│  ┌──────┬──────┬──────┬──────┬──────┐                                    │
│  │ D2C  │LOCAL │YMYL  │B2B   │MEDIA │                                    │
│  │이커머│로컬  │고신뢰│기업   │미디어│                                    │
│  │스    │서비스│전문  │테크   │콘텐츠│                                    │
│  └──┬───┴──┬───┴──┬───┴──┬───┴──┬───┘                                    │
│     │      │      │      │      │                                        │
│  Layer 2: BSW 세부업종 (28개)  ← 벤치마크/진단 기준 단위                    │
│  ┌──────────────────────────────────────────────────────────────┐         │
│  │ skincare, fashion, food_product, home_living,               │         │
│  │ hair_nail, restaurant_cafe, fitness, wedding, hotel,        │         │
│  │ academy, auto_service, pet_care,                            │         │
│  │ medical_clinic, legal, finance_accounting, real_estate,     │         │
│  │ it_saas, consulting, online_education, startup,             │         │
│  │ photography, entertainment, k_culture_content,              │         │
│  │ expert_professional, place_brand,                           │         │
│  │ hanbang, senior_care, travel_tourism                        │         │
│  └──────────────────────────────────────────────────────────────┘         │
│     │                                                                    │
│  Layer 3: AIHOMPY 세부 변형 (48+)  ← AI홈피 디자인/GNB/콘텐츠 결정         │
│  ┌──────────────────────────────────────────────────────────────┐         │
│  │ skincare_premium, gangnam_wedding_sdm, jeju_food_expert,    │         │
│  │ startup_ir_ready, k_rock_ballad, ...                        │         │
│  └──────────────────────────────────────────────────────────────┘         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer 1: BM 매크로 카테고리 (5개)

Gemini의 4대 분류를 수용하되, AIHOMPYHUB 생태계의 핵심 축인 **미디어/콘텐츠 허브**를 5번째 매크로로 추가합니다.

| # | 매크로 Key | 한글명 | 설명 | AEPI 핵심 가중 영역 |
|---|----------|--------|------|-------------------|
| M1 | `ecommerce_d2c` | 이커머스/D2C 제품형 | 온라인 결제, 상품 배송, 리뷰 관리 | 기술인프라 25%, 구조화데이터(Product) 25% |
| M2 | `local_services` | 지역 기반 오프라인 서비스형 | 지리적 위치, 매장 방문, 예약 | E-E-A-T(리뷰/소셜) 30%, 구조화데이터(LocalBus) 20% |
| M3 | `ymyl_professional` | 고신뢰 전문직 (YMYL) | 자산·건강 관련, 극도의 전문성 | E-E-A-T(전문성) 30%, 엔티티(인물/자격) 25% |
| M4 | `b2b_tech_saas` | B2B 테크/SaaS 플랫폼 | 기업 대상 SW, 기술 문서 | 콘텐츠시맨틱(클러스터) 35%, 기술인프라 20% |
| M5 | `media_content_hub` | 미디어/콘텐츠 허브 | 지식 콘텐츠, 크리에이터, 미디어 | 콘텐츠시맨틱 30%, 엔티티 25%, E-E-A-T 20% |

### 2.3 Layer 2: BSW 세부업종 (28개) + Layer 3 매핑

---

#### M1. 이커머스/D2C 제품형 (`ecommerce_d2c`)

| BSW 세부업종 Key | 한글명 | 영문명 | 아이콘 | AIHOMPY 매핑 키 |
|-----------------|--------|--------|------|----------------|
| `skincare` | 스킨케어/뷰티 제품 | Skincare & Beauty Products | ✨ | `skincare`, `skincare_premium`, `haircare` |
| `fashion` | 패션/의류 D2C | Fashion & Apparel | 👗 | `k_style` |
| `food_product` | 식품/음료 제조판매 | Food & Beverage Products | 🧃 | `korean_food` |
| `home_living` | 홈/리빙 | Home & Living | 🏠 | — (신규 매핑 필요) |

**AEPI 동적 가중치:**

| 평가 영역 | 가중치 | 핵심 메트릭 |
|----------|--------|-----------|
| 엔티티 점수 | 20% | Product 엔티티, 성분/재료 엔티티 |
| 콘텐츠 시맨틱 | 20% | 상품 설명 깊이, How-to 콘텐츠 |
| 기술 인프라 | **25%** | CWV(LCP/CLS), 이미지 WebP, 페이지 속도 |
| 구조화 데이터 | **25%** | Product, AggregateRating, Offer, BreadcrumbList |
| E-E-A-T 신뢰도 | 10% | 리뷰 수, 평점, 브랜드 인지도 |

---

#### M2. 지역 기반 오프라인 서비스형 (`local_services`)

| BSW 세부업종 Key | 한글명 | 영문명 | 아이콘 | AIHOMPY 매핑 키 |
|-----------------|--------|--------|------|----------------|
| `hair_nail` | 헤어/네일 살롱 | Hair & Nail Salon | 💇 | — (신규) |
| `restaurant_cafe` | 레스토랑/카페 | Restaurant & Cafe | 🍽️ | `korean_food`, `mixture_poi` |
| `fitness` | 피트니스/웰니스 | Fitness & Wellness | 💪 | — (신규) |
| `wedding` | 웨딩 서비스 | Wedding Services | 💍 | `wedding_sdm`, `wedding_studio`, `wedding_photo_studio`, `wedding_snap`, `wedding_dress`, `wedding_makeup`, `wedding_hall`, `gangnam_wedding_*`, `kwedding_inbound`, `wedding_expert` |
| `hotel` | 호텔/호스피탈리티 | Hotel & Hospitality | 🏨 | `hotel_hospitality` |
| `academy` | 학원/교습소 | Academy & Tutoring | 📝 | — (신규) |
| `auto_service` | 자동차 서비스 | Automotive Service | 🚗 | — |
| `pet_care` | 반려동물 | Pet Care | 🐾 | — |

**AEPI 동적 가중치:**

| 평가 영역 | 가중치 | 핵심 메트릭 |
|----------|--------|-----------|
| 엔티티 점수 | 15% | 서비스 엔티티, 위치 엔티티 |
| 콘텐츠 시맨틱 | 15% | 서비스 설명, 시술 가이드, 후기 |
| 기술 인프라 | 20% | 모바일 최적화, 예약 시스템 연동 |
| 구조화 데이터 | **20%** | LocalBusiness, GeoCoordinates, OpeningHours |
| E-E-A-T 신뢰도 | **30%** | 네이버/구글 리뷰, 소셜증명, 자격증 |

---

#### M3. 고신뢰 전문직 YMYL (`ymyl_professional`)

| BSW 세부업종 Key | 한글명 | 영문명 | 아이콘 | AIHOMPY 매핑 키 |
|-----------------|--------|--------|------|----------------|
| `medical_clinic` | 의원/병원 | Medical Clinic | 🏥 | `clinic` |
| `hanbang` | 한의원/한방 | Korean Traditional Medicine | 🌿 | `hanbang`, `guchim` |
| `senior_care` | 시니어케어 | Senior Care | 🤝 | `senior_care` |
| `legal` | 법률사무소 | Legal Services | ⚖️ | — |
| `finance_accounting` | 세무/회계/금융 | Finance & Accounting | 💰 | — |
| `real_estate` | 부동산 | Real Estate | 🏗️ | `real_estate` |

**AEPI 동적 가중치:**

| 평가 영역 | 가중치 | 핵심 메트릭 |
|----------|--------|-----------|
| 엔티티 점수 | **25%** | Person(의사/변호사), Certification, 자격 |
| 콘텐츠 시맨틱 | 15% | 전문 칼럼, 판례/시술 설명 |
| 기술 인프라 | 15% | HTTPS, 보안, 접근성 |
| 구조화 데이터 | 15% | MedicalOrganization, Attorney, Person 마크업 |
| E-E-A-T 신뢰도 | **30%** | 전문가 프로필, 인증, 학술 인용 |

---

#### M4. B2B 테크/SaaS 플랫폼 (`b2b_tech_saas`)

| BSW 세부업종 Key | 한글명 | 영문명 | 아이콘 | AIHOMPY 매핑 키 |
|-----------------|--------|--------|------|----------------|
| `it_saas` | IT/SaaS | IT & SaaS | 💻 | — |
| `consulting` | 비즈니스 컨설팅 | Business Consulting | 📊 | `consulting`, `dual_brain_vortex` |
| `online_education` | 온라인 교육/EdTech | Online Education | 🎓 | — |
| `startup` | 스타트업 | Startup | 🚀 | `startup`, `startup_ir_ready`, `startup_product_led`, `startup_b2b_saas`, `startup_growth_stage`, `startup_deeptech` |

**AEPI 동적 가중치:**

| 평가 영역 | 가중치 | 핵심 메트릭 |
|----------|--------|-----------|
| 엔티티 점수 | 20% | 제품 기능 엔티티, 기술 용어 |
| 콘텐츠 시맨틱 | **35%** | 토픽 클러스터, 기술 블로그, FAQ 매핑 |
| 기술 인프라 | 20% | 페이지 속도, SSR, API 문서 |
| 구조화 데이터 | 15% | SoftwareApplication, FAQPage, HowTo |
| E-E-A-T 신뢰도 | 10% | 케이스 스터디, 고객 후기 |

---

#### M5. 미디어/콘텐츠 허브 (`media_content_hub`)

| BSW 세부업종 Key | 한글명 | 영문명 | 아이콘 | AIHOMPY 매핑 키 |
|-----------------|--------|--------|------|----------------|
| `photography` | 사진/스튜디오 | Photography Studio | 📷 | `photography` |
| `entertainment` | 엔터테인먼트 | Entertainment | 🎭 | `indie_band`, `k_rock_ballad` |
| `k_culture_content` | K-컬처 콘텐츠 | K-Culture Content | 🎬 | `k_cosmetics_media`, `book_knowledge`, `accessibility_media`, `k_experience` |
| `expert_professional` | 전문가 AI홈피 | Expert AI Homepage | 👨‍💼 | `expert_aihompy`, `participant_aihompy`, `bfw_expert`, `jeju_expert`, `jeju_food_expert`, `jeju_experience_expert`, `jeju_local_expert`, `wedding_expert` |
| `place_brand` | 지역/플레이스 | Place Brand | 📍 | `place`, `place_dao`, `regional`, `mixture_poi` |
| `travel_tourism` | 여행/관광 | Travel & Tourism | ✈️ | `k_experience` |

**AEPI 동적 가중치:**

| 평가 영역 | 가중치 | 핵심 메트릭 |
|----------|--------|-----------|
| 엔티티 점수 | **25%** | 인물, 작품, 지역, 콘텐츠 엔티티 |
| 콘텐츠 시맨틱 | **30%** | 토픽 커버리지, 콘텐츠 깊이/빈도 |
| 기술 인프라 | 10% | 미디어 최적화, 이미지/비디오 성능 |
| 구조화 데이터 | 15% | Article, Person, CreativeWork, Event |
| E-E-A-T 신뢰도 | 20% | 저자 프로필, 전문 분야 인증, 출처 |

---

## 3. AIHOMPY ↔ BSW 양방향 매핑 테이블

### 3.1 정방향 매핑: AIHOMPY Key → BSW 세부업종

```typescript
// BSW 세부업종 → 매크로 매핑 (N:1)
export const SUB_TO_MACRO: Record<string, MacroCategoryKey> = {
  // M1: ecommerce_d2c
  skincare: 'ecommerce_d2c',
  fashion: 'ecommerce_d2c',
  food_product: 'ecommerce_d2c',
  home_living: 'ecommerce_d2c',
  
  // M2: local_services
  hair_nail: 'local_services',
  restaurant_cafe: 'local_services',
  fitness: 'local_services',
  wedding: 'local_services',
  hotel: 'local_services',
  academy: 'local_services',
  auto_service: 'local_services',
  pet_care: 'local_services',
  
  // M3: ymyl_professional
  medical_clinic: 'ymyl_professional',
  hanbang: 'ymyl_professional',
  senior_care: 'ymyl_professional',
  legal: 'ymyl_professional',
  finance_accounting: 'ymyl_professional',
  real_estate: 'ymyl_professional',
  
  // M4: b2b_tech_saas
  it_saas: 'b2b_tech_saas',
  consulting: 'b2b_tech_saas',
  online_education: 'b2b_tech_saas',
  startup: 'b2b_tech_saas',
  
  // M5: media_content_hub
  photography: 'media_content_hub',
  entertainment: 'media_content_hub',
  k_culture_content: 'media_content_hub',
  expert_professional: 'media_content_hub',
  place_brand: 'media_content_hub',
  travel_tourism: 'media_content_hub',
};

// AIHOMPY 세부변형 → BSW 세부업종 매핑 (N:1)
export const AIHOMPY_TO_BSW: Record<string, string> = {
  // 스킨케어/뷰티
  skincare: 'skincare',
  skincare_premium: 'skincare',
  haircare: 'skincare',
  k_style: 'fashion',
  
  // 웨딩 (12종 → 1종)
  wedding_sdm: 'wedding',
  wedding_studio: 'wedding',
  wedding_photo_studio: 'wedding',
  kwedding_inbound: 'wedding',
  wedding_snap: 'wedding',
  wedding_dress: 'wedding',
  wedding_makeup: 'wedding',
  wedding_hall: 'wedding',
  gangnam_wedding_dress: 'wedding',
  gangnam_wedding_makeup: 'wedding',
  gangnam_wedding_sdm: 'wedding',
  wedding_expert: 'wedding',
  
  // 의료/건강
  clinic: 'medical_clinic',
  hanbang: 'hanbang',
  senior_care: 'senior_care',
  
  // 식음료
  korean_food: 'restaurant_cafe',
  mixture_poi: 'restaurant_cafe',
  
  // 부동산
  real_estate: 'real_estate',
  
  // B2B/컨설팅
  consulting: 'consulting',
  dual_brain_vortex: 'consulting',
  
  // 스타트업
  startup: 'startup',
  startup_ir_ready: 'startup',
  startup_product_led: 'startup',
  startup_b2b_saas: 'startup',
  startup_growth_stage: 'startup',
  startup_deeptech: 'startup',
  
  // 호텔
  hotel_hospitality: 'hotel',
  
  // 엔터테인먼트
  indie_band: 'entertainment',
  k_rock_ballad: 'entertainment',
  
  // 미디어/콘텐츠
  k_cosmetics_media: 'k_culture_content',
  book_knowledge: 'k_culture_content',
  accessibility_media: 'k_culture_content',
  k_experience: 'k_culture_content',
  
  // 사진
  photography: 'photography',
  
  // 전문가
  expert_aihompy: 'expert_professional',
  participant_aihompy: 'expert_professional',
  bfw_expert: 'expert_professional',
  jeju_expert: 'expert_professional',
  jeju_food_expert: 'expert_professional',
  jeju_experience_expert: 'expert_professional',
  jeju_local_expert: 'expert_professional',
  
  // 지역/플레이스
  place: 'place_brand',
  place_dao: 'place_brand',
  regional: 'place_brand',
  
  // 여행
  travel: 'travel_tourism',
  
  // 일반
  general: 'consulting', // 기본 폴백
};
```

### 3.2 역방향 매핑: BSW 세부업종 → AIHOMPY 기본 Key

```typescript
// BSW 세부업종 → AIHOMPY 기본(default) 업종 매핑
// GENESIS 개설 시 기본 IndustryConfig 결정에 사용
export const BSW_TO_AIHOMPY_DEFAULT: Record<string, string> = {
  skincare: 'skincare',
  fashion: 'k_style',
  food_product: 'korean_food',
  home_living: 'general',
  hair_nail: 'general',
  restaurant_cafe: 'korean_food',
  fitness: 'general',
  wedding: 'wedding_sdm',
  hotel: 'hotel_hospitality',
  academy: 'general',
  auto_service: 'general',
  pet_care: 'general',
  medical_clinic: 'clinic',
  hanbang: 'hanbang',
  senior_care: 'senior_care',
  legal: 'general',
  finance_accounting: 'general',
  real_estate: 'real_estate',
  it_saas: 'startup',
  consulting: 'consulting',
  online_education: 'general',
  startup: 'startup',
  photography: 'photography',
  entertainment: 'indie_band',
  k_culture_content: 'k_cosmetics_media',
  expert_professional: 'expert_aihompy',
  place_brand: 'place',
  travel_tourism: 'k_experience',
};
```

---

## 4. AEPI 가중치 레지스트리 V3.0

### 4.1 2단계 가중치 시스템

**기존 V1:** 업종별 7차원(factoid~local_geo) 고정 가중치  
**Gemini V2:** BM별 5차원 동적 가중치 (엔티티/콘텐츠/기술/스키마/EEAT)  
**V3.0 통합:** 2단계 — (1) BM 매크로 → 5영역 가중치 (2) 세부업종 → 7차원 서피스 가중치

```
AEPI V3.0 = Σ(5영역 가중합) × tech_modifier × eeat_modifier

5영역 = { entity, content, technical, schema, eeat }
  ↑ BM 매크로별 가중치 (Layer 1)

각 영역 내부 = 기존 7차원 서피스 점수의 가중합
  ↑ 세부업종별 가중치 (Layer 2, 기존 WEIGHT_PRESETS 유지)
```

### 4.2 매크로별 5영역 가중치 매트릭스

| 매크로 | 엔티티(e) | 콘텐츠(c) | 기술(t) | 스키마(s) | EEAT(r) | 합계 |
|-------|----------|----------|--------|----------|---------|------|
| `ecommerce_d2c` | 0.20 | 0.20 | **0.25** | **0.25** | 0.10 | 1.00 |
| `local_services` | 0.15 | 0.15 | 0.20 | 0.20 | **0.30** | 1.00 |
| `ymyl_professional` | **0.25** | 0.15 | 0.15 | 0.15 | **0.30** | 1.00 |
| `b2b_tech_saas` | 0.20 | **0.35** | 0.20 | 0.15 | 0.10 | 1.00 |
| `media_content_hub` | **0.25** | **0.30** | 0.10 | 0.15 | 0.20 | 1.00 |

### 4.3 세부업종별 7차원 서피스 가중치 (기존 호환)

기존 `AepiCalculator.WEIGHT_PRESETS` 구조 유지 + 신규 업종 추가:

| 세부업종 | factoid | procedural | comparative | authority | schema_org | topical_cluster | local_geo |
|---------|---------|-----------|------------|----------|------------|----------------|----------|
| skincare | 0.20 | 0.15 | 0.25 | 0.15 | 0.10 | 0.10 | 0.05 |
| fashion | 0.10 | 0.10 | 0.30 | 0.10 | 0.10 | 0.25 | 0.05 |
| food_product | 0.20 | 0.15 | 0.20 | 0.10 | 0.15 | 0.10 | 0.10 |
| hair_nail | 0.15 | 0.20 | 0.15 | 0.10 | 0.10 | 0.05 | 0.25 |
| restaurant_cafe | 0.15 | 0.15 | 0.20 | 0.10 | 0.10 | 0.05 | 0.25 |
| fitness | 0.15 | 0.20 | 0.15 | 0.10 | 0.10 | 0.10 | 0.20 |
| wedding | 0.10 | 0.10 | 0.15 | 0.10 | 0.10 | 0.15 | 0.30 |
| hotel | 0.15 | 0.15 | 0.15 | 0.10 | 0.10 | 0.10 | 0.25 |
| academy | 0.25 | 0.15 | 0.15 | 0.20 | 0.10 | 0.10 | 0.05 |
| medical_clinic | 0.25 | 0.20 | 0.10 | 0.25 | 0.10 | 0.05 | 0.05 |
| hanbang | 0.20 | 0.20 | 0.10 | 0.25 | 0.10 | 0.10 | 0.05 |
| senior_care | 0.20 | 0.15 | 0.10 | 0.25 | 0.10 | 0.10 | 0.10 |
| legal | 0.15 | 0.15 | 0.10 | 0.30 | 0.10 | 0.05 | 0.15 |
| finance_accounting | 0.20 | 0.15 | 0.15 | 0.25 | 0.10 | 0.10 | 0.05 |
| real_estate | 0.15 | 0.10 | 0.15 | 0.15 | 0.10 | 0.05 | 0.30 |
| it_saas | 0.15 | 0.20 | 0.20 | 0.10 | 0.10 | 0.20 | 0.05 |
| consulting | 0.15 | 0.15 | 0.15 | 0.20 | 0.10 | 0.20 | 0.05 |
| online_education | 0.25 | 0.15 | 0.15 | 0.20 | 0.10 | 0.10 | 0.05 |
| startup | 0.15 | 0.20 | 0.20 | 0.10 | 0.10 | 0.20 | 0.05 |
| photography | 0.10 | 0.10 | 0.25 | 0.10 | 0.15 | 0.20 | 0.10 |
| entertainment | 0.10 | 0.10 | 0.20 | 0.10 | 0.10 | 0.30 | 0.10 |
| k_culture_content | 0.15 | 0.15 | 0.15 | 0.15 | 0.10 | 0.25 | 0.05 |
| expert_professional | 0.15 | 0.15 | 0.15 | 0.25 | 0.10 | 0.15 | 0.05 |
| place_brand | 0.15 | 0.10 | 0.15 | 0.10 | 0.10 | 0.10 | 0.30 |
| travel_tourism | 0.15 | 0.15 | 0.15 | 0.10 | 0.10 | 0.10 | 0.25 |
| auto_service | 0.15 | 0.15 | 0.20 | 0.15 | 0.10 | 0.05 | 0.20 |
| pet_care | 0.20 | 0.20 | 0.20 | 0.15 | 0.10 | 0.10 | 0.05 |
| home_living | 0.15 | 0.15 | 0.25 | 0.10 | 0.15 | 0.15 | 0.05 |

---

## 5. V1 → V3 마이그레이션 매핑

### 기존 BSW V1 키 → V3 키 변환

| V1 Key | V3 BSW Key | V3 매크로 | 변경사항 |
|--------|-----------|----------|---------|
| `skincare` | `skincare` | ecommerce_d2c | 유지 |
| `beauty` | `skincare` | ecommerce_d2c | 병합 |
| `wedding_studio` | `wedding` | local_services | 통합 |
| `wedding` | `wedding` | local_services | 유지 |
| `clinic` | `medical_clinic` | ymyl_professional | 키 변경 |
| `healthcare` | `medical_clinic` | ymyl_professional | 병합 |
| `restaurant` | `restaurant_cafe` | local_services | 키 변경 |
| `food_beverage` | `food_product` | ecommerce_d2c | 키 변경 |
| `convenience_retail` | `food_product` | ecommerce_d2c | 병합 |
| `legal` | `legal` | ymyl_professional | 유지 |
| `finance` | `finance_accounting` | ymyl_professional | 키 변경 |
| `insurance` | `finance_accounting` | ymyl_professional | 병합 |
| `consulting_b2b` | `consulting` | b2b_tech_saas | 키 변경 |
| `it_software` | `it_saas` | b2b_tech_saas | 키 변경 |
| `travel` | `travel_tourism` | media_content_hub | 키 변경 |
| `pet` | `pet_care` | local_services | 키 변경 |
| `fashion_ecommerce` | `fashion` | ecommerce_d2c | 키 변경 |
| `real_estate` | `real_estate` | ymyl_professional | 유지 |
| `construction` | `real_estate` | ymyl_professional | 병합 |
| `education` | `academy` | local_services | 키 변경 |
| `auto` | `auto_service` | local_services | 키 변경 |
| `entertainment` | `entertainment` | media_content_hub | 유지 |

### AEPI 가중치 프리셋 키 매핑

| V1 AEPI Key | V3 BSW Key | 비고 |
|-------------|-----------|------|
| `skincare` | `skincare` | 유지 |
| `wedding_studio` | `wedding` | 키 변경 |
| `medical` | `medical_clinic` | 키 변경 |
| `k_beauty` | `skincare` | 병합 |
| `food_bev` | `food_product` | 키 변경 |
| `education` | `academy` | 키 변경 |
| `pet_care` | `pet_care` | 유지 |
| `legal` | `legal` | 유지 |
| `finance` | `finance_accounting` | 키 변경 |
| `fashion` | `fashion` | 유지 |
| `travel` | `travel_tourism` | 키 변경 |
| `real_estate` | `real_estate` | 유지 |

---

## 6. 통합 QIS 3축 × 매크로 교차 매트릭스

BSW QIS의 3축(Industry/Place/Vortex)과 5대 BM 매크로의 교차에서 발생하는 콘텐츠 전략:

| | Industry 축 | Place 축 | Vortex 축 |
|---|---|---|---|
| **ecommerce_d2c** | 상품 리뷰/비교 콘텐츠 | 지역 특산물 연계 | 트렌드/시즌 콘텐츠 |
| **local_services** | 업종 표준 서비스 FAQ | **핵심:** 지역 리뷰+예약 | 시술/메뉴 트렌드 |
| **ymyl_professional** | 전문 칼럼/판례 분석 | 지역 의료/법률 안내 | 건강/법률 이슈 트렌드 |
| **b2b_tech_saas** | 산업별 솔루션 가이드 | (약함) | **핵심:** 기술 토픽 클러스터 |
| **media_content_hub** | 업종 지식 아카이브 | 지역 전문가 콘텐츠 | **핵심:** 테마 미디어 허브 |

---

## 7. 구현 우선순위

| 순서 | 작업 | 영향 범위 | 난이도 |
|------|------|---------|-------|
| 1 | `industry-taxonomy.ts` V3 리팩터링 | BSW 전체 | ★★★ |
| 2 | `aepi-calculator.ts` 2단계 가중치 엔진 | BSW 진단 | ★★★ |
| 3 | `AIHOMPY_TO_BSW` / `BSW_TO_AIHOMPY_DEFAULT` 매핑 | 연동 | ★★ |
| 4 | `SUB_TO_MACRO` 매핑 함수 | 전체 | ★ |
| 5 | V1→V3 마이그레이션 스크립트 | DB | ★★ |
| 6 | UI 드롭다운 컴포넌트 업데이트 | 프론트엔드 | ★★ |
| 7 | 업종별 대시보드 다이나믹 레이아웃 | 프론트엔드 | ★★★ |
