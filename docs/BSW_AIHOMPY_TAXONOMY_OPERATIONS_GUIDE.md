# BSW-OS × AIHOMPYHUB 통합 업종 분류 체계 — 운영 가이드

> **Version:** 3.0 | **작성일:** 2026-06-26  
> **대상:** 관리자, 개발자, 콘텐츠 운영자

---

## 1. 운영 개요

### 1.1 시스템 구성 요약

BSW-OS × AIHOMPYHUB 통합 업종 분류 V3 시스템은 **3계층 아키텍처**로 설계되어, 진단(BSW)과 운영(AIHOMPY)이 하나의 택소노미로 매끄럽게 소통합니다.

```
Layer 1: 5 BM 매크로         ← AEPI 동적 가중치 결정 / 벤치마크 그룹핑
  ├── ecommerce_d2c (4)      "이커머스/D2C 제품형"
  ├── local_services (8)     "지역 기반 오프라인 서비스형"
  ├── ymyl_professional (6)  "고신뢰 전문직 (YMYL)"
  ├── b2b_tech_saas (4)      "B2B 테크/SaaS"
  └── media_content_hub (6)  "미디어/콘텐츠 허브"
       │
Layer 2: 28 BSW 세부업종      ← 진단/벤치마크/전략 단위
       │
Layer 3: 48+ AIHOMPY 변형    ← AI홈피 디자인/GNB/콘텐츠 레이아웃
```

### 1.2 핵심 운영 원칙

| 원칙 | 설명 |
|------|------|
| **단일 진실 원천** | BSW V3 택소노미가 진단/평가의 표준 기준 |
| **매핑 레이어 분리** | AIHOMPY 키는 변경하지 않음 — BSW 측 매핑 레이어가 변환 |
| **옵셔널 확장** | 모든 V3 필드(macroKey 등)는 optional → 점진적 채택 |
| **자유 문자열 호환** | QIS `industry` 필드는 자유 문자열 → 어떤 키도 수용 |

---

## 2. 업종 선택/변경 가이드

### 2.1 BSW-OS에서 업종 선택

**사용 위치:** 사이트 감사 대시보드 → 벤치마크 탭 / 전략 탭

**드롭다운 구조:**
```
🛒 이커머스/D2C 제품형
  ├── 스킨케어/뷰티 제품    (skincare)
  ├── 패션/의류 D2C         (fashion)
  ├── 식품/음료 제조판매     (food_product)
  └── 홈/리빙              (home_living)
  
📍 지역 기반 오프라인 서비스형
  ├── 헤어/네일 살롱        (hair_nail)
  ├── 레스토랑/카페         (restaurant_cafe)
  ├── 피트니스/웰니스       (fitness)
  ├── 웨딩 서비스           (wedding)
  ├── 호텔/호스피탈리티     (hotel)
  ├── 학원/교습소           (academy)
  ├── 자동차 서비스         (auto_service)
  └── 반려동물             (pet_care)

🛡️ 고신뢰 전문직 (YMYL)
  ├── 의원/병원            (medical_clinic)
  ├── 한의원/한방           (hanbang)
  ├── 시니어케어            (senior_care)
  ├── 법률사무소            (legal)
  ├── 세무/회계/금융        (finance_accounting)
  └── 부동산               (real_estate)

💻 B2B 테크/SaaS
  ├── IT/SaaS              (it_saas)
  ├── 비즈니스 컨설팅       (consulting)
  ├── 온라인 교육/EdTech    (online_education)
  └── 스타트업             (startup)

🎬 미디어/콘텐츠 허브
  ├── 사진/스튜디오        (photography)
  ├── 엔터테인먼트         (entertainment)
  ├── K-컬처 콘텐츠        (k_culture_content)
  ├── 전문가 AI홈피        (expert_professional)
  ├── 지역/플레이스        (place_brand)
  └── 여행/관광           (travel_tourism)
```

### 2.2 업종별 AEPI 가중치가 달라지는 이유

동일한 웹사이트라도 **비즈니스 모델에 따라 중요한 서피스가 다릅니다:**

| 매크로 | 가장 중요한 서피스 | 가장 낮은 서피스 | 이유 |
|--------|-----------------|----------------|------|
| 이커머스/D2C | 기술(T) + 스키마(S) | E-E-A-T(R) | 상품 크롤링·스키마가 매출 직결 |
| 로컬 서비스 | E-E-A-T(R) | 콘텐츠(C) | 리뷰·신뢰·지역 SEO가 핵심 |
| YMYL 전문직 | E-E-A-T(R) + 엔티티(E) | 기술(T) | 전문성·권위·경험 증명 필수 |
| B2B/SaaS | 콘텐츠(C) | E-E-A-T(R) | 기술 문서·토피컬 클러스터 중심 |
| 미디어/콘텐츠 | 콘텐츠(C) + 엔티티(E) | 기술(T) | 콘텐츠 자산과 엔티티 그래프 |

### 2.3 AIHOMPY 업종과의 관계

AIHOMPYHUB에서 `industry_type`으로 설정한 키는 BSW 진단 시 자동 변환됩니다:

```
AIHOMPY 테넌트 (gangnam_wedding_sdm)
  → resolveAihompyKey('gangnam_wedding_sdm')
  → BSW V3: 'wedding'
  → MacroKey: 'local_services'
  → AEPI 가중치: E-E-A-T + 로컬 강조
```

**변환이 필요한 시나리오:**
1. BSW 진단 결과를 AIHOMPY AI홈피 개설에 연계할 때
2. QIS 예측 질문을 특정 허브로 라우팅할 때
3. 벤치마크 데이터를 허브별로 집계할 때

---

## 3. QIS 3축 연동 운영

### 3.1 Signal 흐름 (Hub→BSW)

```
AIHOMPY Hub에서 신호 발생
  ↓
signal-emitter.ts: 버퍼에 저장
  ↓
flushSignals(): 배치 전송
  ↓
BSW /api/v1/qis/signals/ingest 수신
  ↓
tri-axis-router.ts: 축 분류
  ├── industry: 업종 허브 (키워드 매칭)
  ├── place: 지역 허브 (지역 키워드 → slug)
  ├── vortex: 테마 허브 (테마 키워드 → slug)
  └── cross_axis: 교차 (복수 축 감지)
  ↓
QIS 예측 엔진: 질문 생성
```

### 3.2 Prediction 흐름 (BSW→Hub)

```
BSW QIS 예측 질문 생성
  ↓
hub-client.ts: pushPredictedQuestions()
  ├── industry: BSW V3 세부업종 키
  ├── macro_industry: 매크로 키 (V3 신규)
  ├── target_axis: industry | place | vortex | cross_axis
  ├── place_slug: 'jeju', 'gangnam' 등 (place축)
  └── vortex_slug: 'k-wedding', 'k-beauty' 등 (vortex축)
  ↓
AIHOMPY pullPredictions(): 수신
  ↓
콘텐츠 제작 미션 발행
```

### 3.3 현재 등록된 QIS Hub

| Hub Slug | 업종코드 | BSW 매크로 | 상태 |
|----------|---------|-----------|------|
| k-wedding | wedding | local_services | ✅ 운영 |
| k-beauty | beauty | ecommerce_d2c | ✅ 운영 |
| k-hanbang | hanbang | ymyl_professional | ✅ 운영 |
| k-book | book | media_content_hub | ✅ 운영 |
| k-expert | expert | media_content_hub | ✅ 운영 |
| k-music | music | media_content_hub | ✅ 운영 |
| k-food | food | local_services | ✅ 운영 |

> [!NOTE]
> 신규 Hub 추가 시 `hub-qis-config.ts`에 레지스트리 항목을 추가해야 합니다.

---

## 4. 신규 업종 추가 절차

### 4.1 BSW-OS 측 추가

**Step 1.** `lib/industry/industry-taxonomy.ts`

```typescript
// 1. MACRO_CATEGORIES에서 해당 매크로의 subIndustries에 추가
{ 
  key: 'new_industry', 
  displayNameKo: '새 업종', 
  displayNameEn: 'New Industry',
  macroKey: 'local_services',  // 적절한 매크로 선택
  parentKey: 'local_services' 
}

// 2. AIHOMPY_TO_BSW에 AIHOMPY 키 매핑 추가
aihompy_new_industry: 'new_industry',

// 3. BSW_TO_AIHOMPY_DEFAULT에 역방향 매핑 추가
new_industry: 'aihompy_new_industry',
```

**Step 2.** `lib/benchmark/aepi-calculator.ts`

```typescript
// WEIGHT_PRESETS에 7차원 가중치 추가
new_industry: { 
  factoid: 0.15, procedural: 0.15, comparative: 0.15, 
  authority: 0.15, schema_org: 0.15, topical_cluster: 0.15, 
  local_geo: 0.10 
},
```

**Step 3.** (선택) `lib/industry/reference-sites-registry.ts`에 레퍼런스 사이트 추가

### 4.2 AIHOMPYHUB 측 추가

**Step 1.** `storefront/lib/industries/configs/`에 `IndustryConfig` 작성  
**Step 2.** `storefront/lib/industries/index.ts`의 `INDUSTRY_CONFIG`에 등록  
**Step 3.** `packages/gnb-config/src/index.ts`에 GNB 노드 추가  
**Step 4.** (선택) `storefront/lib/qis/hub-qis-config.ts`에 QIS Hub 등록

### 4.3 양쪽 동기화 체크리스트

```
□ BSW taxonomy에 세부업종 추가
□ BSW AEPI 가중치 추가
□ BSW AIHOMPY_TO_BSW 매핑 추가
□ BSW BSW_TO_AIHOMPY_DEFAULT 매핑 추가
□ AIHOMPY IndustryConfig 작성
□ AIHOMPY GNB 노드 추가
□ (선택) QIS Hub 레지스트리 추가
□ (선택) BSW 레퍼런스 사이트 추가
□ 빌드 검증 (BSW + AIHOMPY 양쪽)
```

---

## 5. 키 변환 운영 레퍼런스

### 5.1 자주 사용하는 변환

| 시나리오 | 함수 | 입력 | 출력 |
|---------|------|------|------|
| BSW 진단 시 업종 해석 | `findSubIndustry('skincare')` | V3 키 | SubIndustry 객체 |
| 레거시 키 자동 전환 | `migrateV1Key('clinic')` | V1 키 | `'medical_clinic'` |
| AIHOMPY 키→BSW 진단용 | `resolveAihompyKey('gangnam_wedding_sdm')` | AIHOMPY 키 | `'wedding'` |
| BSW 결과→AI홈피 개설 | `resolveBswKey('wedding')` | BSW V3 키 | `'wedding_sdm'` |
| 매크로 그룹 확인 | `getMacroKey('skincare')` | 아무 키 | `'ecommerce_d2c'` |
| AEPI 가중치 조회 | `AepiCalculator.getWeights('skincare')` | 세부업종 키 | 7차원 가중치 |
| 매크로 가중치 조회 | `AepiCalculator.getMacroWeights('ecommerce_d2c')` | 매크로 키 | 5영역 가중치 |

### 5.2 V1 레거시 키 마이그레이션 표

| V1 키 (구) | V3 키 (신) | 자동 변환 |
|-----------|-----------|---------|
| `beauty` | `skincare` | ✅ |
| `wedding_studio` | `wedding` | ✅ |
| `clinic` | `medical_clinic` | ✅ |
| `healthcare` | `medical_clinic` | ✅ |
| `restaurant` | `restaurant_cafe` | ✅ |
| `food_beverage` | `food_product` | ✅ |
| `finance` | `finance_accounting` | ✅ |
| `insurance` | `finance_accounting` | ✅ |
| `consulting_b2b` | `consulting` | ✅ |
| `it_software` | `it_saas` | ✅ |
| `travel` | `travel_tourism` | ✅ |
| `pet` | `pet_care` | ✅ |
| `fashion_ecommerce` | `fashion` | ✅ |
| `construction` | `real_estate` | ✅ |
| `education` | `academy` | ✅ |
| `auto` | `auto_service` | ✅ |

---

## 6. 향후 AIHOMPYHUB 완전 연동 로드맵

### Phase A: QIS 산업코드 확장 (🔴 우선)

```
현행 7종 → 28종 확장
파일: storefront/lib/qis/schemas.ts (QIS_INDUSTRY_CODES)
파일: storefront/lib/qis/hub-qis-config.ts (HUB_QIS_REGISTRY)
```

**효과:** 모든 BSW V3 세부업종의 QIS 라우팅 가능

### Phase B: IndustryConfig BSW 매핑 필드 (🟡 권장)

```
IndustryConfig에 추가:
  bswSubIndustryKey?: string    // BSW V3 세부업종 키
  bswMacroCategoryKey?: string  // BSW V3 BM 매크로

파일: storefront/lib/industries/types.ts
파일: storefront/lib/industries/index.ts (48+ config에 반영)
```

**효과:** BSW 진단→GENESIS 개설 자동 연계

### Phase C: Hub/Tenant BSW 변환 레이어 (🟡 권장)

```
Hub 해석 후 BSW 키 자동 부착:
  resolveHub() → HubData.bswIndustryKey

파일: storefront/lib/hub.ts
파일: storefront/lib/tenant.ts
```

**효과:** 양방향 업종 동기화 완성

### Phase D: Archetype 표준화 (🟢 선택)

```
industry_types 배열을 INDUSTRY_CONFIG 표준 키로 통일
파일: web/data/archetypes/index.ts
```

---

## 7. 트러블슈팅

### 7.1 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| "업종을 찾을 수 없습니다" | V1 레거시 키 사용 | `migrateV1Key()` 호출 확인 |
| AEPI 점수가 이상하게 낮음 | 매크로 가중치 미적용 | `industryType` 키가 WEIGHT_PRESETS에 있는지 확인 |
| QIS 예측 질문이 Hub에 미도착 | QIS Hub 미등록 | `hub-qis-config.ts`에 Hub 등록 |
| AIHOMPY 키가 BSW에서 인식 안됨 | AIHOMPY_TO_BSW 매핑 누락 | 매핑 테이블에 키 추가 |
| `findSubIndustry()` undefined 반환 | 미등록 키 | V1 키이면 `V1_TO_V3_KEY_MAP`에 추가 |

### 7.2 검증 명령어

```bash
# BSW TypeScript 컴파일 검증
cd c:\Users\User\bsw && npx tsc --noEmit

# BSW 전체 빌드
cd c:\Users\User\bsw && npm run build

# AIHOMPYHUB 전체 빌드
cd c:\Users\User\aihompyhub && npx turbo build

# 특정 키 매핑 확인 (Node.js REPL)
node -e "const t = require('./lib/industry/industry-taxonomy'); console.log(t.resolveAihompyKey('gangnam_wedding_sdm'))"
```

---

## 부록: 전체 업종 분류 빠른 참조표

| # | BSW V3 Key | 한글명 | 매크로 | AIHOMPY 대표 키 |
|---|-----------|--------|--------|----------------|
| 1 | `skincare` | 스킨케어/뷰티 | 🛒 M1 | `skincare` |
| 2 | `fashion` | 패션/의류 | 🛒 M1 | `k_style` |
| 3 | `food_product` | 식품/음료 | 🛒 M1 | `korean_food` |
| 4 | `home_living` | 홈/리빙 | 🛒 M1 | `general` |
| 5 | `hair_nail` | 헤어/네일 | 📍 M2 | `general` |
| 6 | `restaurant_cafe` | 레스토랑/카페 | 📍 M2 | `korean_food` |
| 7 | `fitness` | 피트니스 | 📍 M2 | `general` |
| 8 | `wedding` | 웨딩 | 📍 M2 | `wedding_sdm` |
| 9 | `hotel` | 호텔 | 📍 M2 | `hotel_hospitality` |
| 10 | `academy` | 학원/교습소 | 📍 M2 | `general` |
| 11 | `auto_service` | 자동차 서비스 | 📍 M2 | `general` |
| 12 | `pet_care` | 반려동물 | 📍 M2 | `general` |
| 13 | `medical_clinic` | 의원/병원 | 🛡️ M3 | `clinic` |
| 14 | `hanbang` | 한의원/한방 | 🛡️ M3 | `hanbang` |
| 15 | `senior_care` | 시니어케어 | 🛡️ M3 | `senior_care` |
| 16 | `legal` | 법률사무소 | 🛡️ M3 | `general` |
| 17 | `finance_accounting` | 세무/회계 | 🛡️ M3 | `general` |
| 18 | `real_estate` | 부동산 | 🛡️ M3 | `real_estate` |
| 19 | `it_saas` | IT/SaaS | 💻 M4 | `startup` |
| 20 | `consulting` | 컨설팅 | 💻 M4 | `consulting` |
| 21 | `online_education` | 온라인 교육 | 💻 M4 | `general` |
| 22 | `startup` | 스타트업 | 💻 M4 | `startup` |
| 23 | `photography` | 사진/스튜디오 | 🎬 M5 | `photography` |
| 24 | `entertainment` | 엔터테인먼트 | 🎬 M5 | `indie_band` |
| 25 | `k_culture_content` | K-컬처 콘텐츠 | 🎬 M5 | `k_cosmetics_media` |
| 26 | `expert_professional` | 전문가 AI홈피 | 🎬 M5 | `expert_aihompy` |
| 27 | `place_brand` | 지역/플레이스 | 🎬 M5 | `place` |
| 28 | `travel_tourism` | 여행/관광 | 🎬 M5 | `k_experience` |
