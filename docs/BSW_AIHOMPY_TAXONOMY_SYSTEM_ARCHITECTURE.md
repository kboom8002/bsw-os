# BSW-OS × AIHOMPYHUB 통합 업종 분류 체계 — 시스템 아키텍처

> **Version:** 3.0 | **최종 감사:** 2026-06-26  
> **대상 프로젝트:** BSW-OS (`c:\Users\User\bsw`), AIHOMPYHUB (`c:\Users\User\aihompyhub`)

---

## 1. 시스템 전체 현황 매트릭스

### 1.1 구현 상태 총괄

```
┌─────────────────────────────────────────────────────────────────┐
│           BSW-OS × AIHOMPYHUB 업종 분류 연동 현황                  │
├──────────────────────────────┬──────────┬──────────┬────────────┤
│ 컴포넌트                      │ BSW-OS   │ AIHOMPY  │ 연동 상태   │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 3계층 택소노미 정의             │ ✅ 완료   │ —        │ BSW 단독   │
│ 5매크로/28세부 레지스트리        │ ✅ 완료   │ —        │ BSW 단독   │
│ AIHOMPY→BSW 정방향 매핑        │ ✅ 완료   │ ❌ 미소비  │ ⚠️ 단방향  │
│ BSW→AIHOMPY 역방향 매핑        │ ✅ 완료   │ ❌ 미소비  │ ⚠️ 단방향  │
│ 2단계 동적 AEPI 가중치          │ ✅ 완료   │ —        │ BSW 단독   │
│ IndustryConfig 레지스트리       │ —        │ ✅ 48+키  │ AIHOMPY 독립│
│ GNB 노드 매핑                  │ —        │ ✅ 25+키  │ AIHOMPY 독립│
│ SSoT 콘텐츠 레지스트리          │ —        │ ✅ 25+키  │ AIHOMPY 독립│
│ Archetype→업종 매핑            │ —        │ ✅ 12타입  │ AIHOMPY 독립│
│ QIS API 클라이언트             │ ✅ 완료   │ ✅ 완료   │ ✅ 양방향    │
│ QIS Hub 매핑 (산업코드)         │ ✅ 28종   │ ⚠️ 7종   │ ⚠️ 불일치   │
│ QIS Signal 송수신              │ ✅ 수신   │ ✅ 발신   │ ✅ 연동     │
│ QIS Prediction 송수신          │ ✅ 발신   │ ✅ 수신   │ ✅ 연동     │
│ QIS Auth (HMAC)              │ ✅ 검증   │ ✅ 서명   │ ✅ 연동     │
└──────────────────────────────┴──────────┴──────────┴────────────┘
```

### 1.2 핵심 진단

> [!WARNING]
> **AIHOMPYHUB에 BSW V3 택소노미가 아직 소비(consume)되지 않고 있습니다.**
> 
> BSW-OS 측에 완전한 양방향 매핑 레이어(`AIHOMPY_TO_BSW`, `BSW_TO_AIHOMPY_DEFAULT`)가 구축되어 있지만, AIHOMPYHUB 측에서는:
> 1. `IndustryConfig` 인터페이스에 BSW 키 필드가 없음
> 2. `hub.ts`/`tenant.ts` 해석 로직에 BSW 변환 레이어 없음
> 3. QIS 산업코드가 7종으로, BSW V3의 28종과 불일치

---

## 2. 아키텍처 구조도

### 2.1 전체 시스템 토폴로지

```
┌───────────────────────────────────────────────────────────────────────┐
│                        BSW-OS (진단/평가/예측)                         │
│                                                                       │
│  ┌─────────────────────┐    ┌──────────────────────┐                  │
│  │ industry-taxonomy.ts │    │ aepi-calculator.ts    │                  │
│  │                     │    │                      │                  │
│  │ ┌─────────────────┐ │    │ Layer 1: 매크로 5영역 │                  │
│  │ │ L1: 5 MacroKeys │ │    │ Layer 2: 세부 28 7차원│                  │
│  │ │ L2: 28 SubKeys  │ │    │                      │                  │
│  │ │ L3: 48+ AihmpyMap│ │    └──────────────────────┘                  │
│  │ └─────────────────┘ │                                              │
│  │                     │    ┌──────────────────────┐                  │
│  │ AIHOMPY_TO_BSW  ◄───┼───┤ QIS API Endpoints    │                  │
│  │ BSW_TO_AIHOMPY  ────┼──►│ /api/v1/qis/*        │                  │
│  │ V1_TO_V3_KEY_MAP    │    └──────────┬───────────┘                  │
│  └─────────────────────┘               │                              │
│                                        │ HTTP (HMAC Auth)             │
└────────────────────────────────────────┼──────────────────────────────┘
                                         │
                    ╔════════════════════╧════════════════════╗
                    ║          QIS 양방향 API 파이프라인         ║
                    ║  Signal(Hub→BSW) / Prediction(BSW→Hub)  ║
                    ╚════════════════════╤════════════════════╝
                                         │
┌────────────────────────────────────────┼──────────────────────────────┐
│                     AIHOMPYHUB (구축/운영/성장)                        │
│                                        │                              │
│  ┌─────────────────────┐    ┌──────────┴───────────┐                  │
│  │ industries/index.ts │    │ qis/bsw-client.ts    │                  │
│  │                     │    │                      │                  │
│  │ INDUSTRY_CONFIG     │    │ pushSignals()     ✅ │                  │
│  │ 48+ entries         │    │ pullPredictions() ✅ │                  │
│  │ (AIHOMPY 키 체계)    │    │ pushFeedback()    ✅ │                  │
│  │                     │    │ pushRealMetrics() ✅ │                  │
│  │ ❌ BSW 키 매핑 없음  │    └──────────────────────┘                  │
│  └──────┬──────────────┘                                              │
│         │                                                             │
│  ┌──────┴──────────────┐    ┌──────────────────────┐                  │
│  │ hub.ts              │    │ qis/hub-qis-config.ts│                  │
│  │ resolveHub()        │    │                      │                  │
│  │ → industry_type     │    │ ⚠️ 7 QIS codes only │                  │
│  │ ❌ BSW 변환 없음     │    │ (vs BSW 28 codes)    │                  │
│  └─────────────────────┘    └──────────────────────┘                  │
│                                                                       │
│  ┌─────────────────────┐    ┌──────────────────────┐                  │
│  │ tenant.ts           │    │ archetypes/index.ts  │                  │
│  │ TenantInfo          │    │ 12 archetypes        │                  │
│  │ .industry_type      │    │ .industry_types[]    │                  │
│  │ ❌ BSW 필드 없음     │    │ ❌ 비표준 키 포함     │                  │
│  └─────────────────────┘    └──────────────────────┘                  │
└───────────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름 (현재)

```
[진단 요청] → BSW Audit Engine
                 ↓
         industry auto-detect → subIndustryKey (V3)
                 ↓
         getMacroKey() → MacroCategoryKey
                 ↓
         AEPI 2단계 가중치 계산
                 ↓
         QIS 예측 질문 생성
                 ↓
    ┌────────────────────────────────┐
    │  BSW→Hub: pushPredictions()   │
    │  industry: 'wedding'          │  ← BSW V3 세부업종 키
    │  macro_industry: 'local_svcs' │  ← V3 매크로 키 (NEW)
    └────────────┬───────────────────┘
                 ↓
    Hub QIS Client: pullPredictions()
                 ↓
    ⚠️ Hub은 industry='wedding'만 참조
    ⚠️ macro_industry 무시 (필드 미소비)
    ⚠️ QIS_INDUSTRY_CODES에 7종만 등록
```

---

## 3. BSW-OS 측 구현 완료 상세

### 3.1 `lib/industry/industry-taxonomy.ts` (353 lines)

#### Layer 1: 5대 BM 매크로 카테고리

| # | Key | 한글명 | 세부업종 수 |
|---|-----|--------|----------|
| M1 | `ecommerce_d2c` | 이커머스/D2C 제품형 | 4 |
| M2 | `local_services` | 지역 기반 오프라인 서비스형 | 8 |
| M3 | `ymyl_professional` | 고신뢰 전문직 (YMYL) | 6 |
| M4 | `b2b_tech_saas` | B2B 테크/SaaS | 4 |
| M5 | `media_content_hub` | 미디어/콘텐츠 허브 | 6 |
| | | **합계** | **28** |

#### Layer 2: 28개 세부업종

```
ecommerce_d2c:     skincare, fashion, food_product, home_living
local_services:    hair_nail, restaurant_cafe, fitness, wedding, hotel, academy, auto_service, pet_care
ymyl_professional: medical_clinic, hanbang, senior_care, legal, finance_accounting, real_estate
b2b_tech_saas:     it_saas, consulting, online_education, startup
media_content_hub: photography, entertainment, k_culture_content, expert_professional, place_brand, travel_tourism
```

#### Layer 3: AIHOMPY 매핑 (48+키 → 28키)

| AIHOMPY 키 (예시) | → BSW V3 키 | 비고 |
|------------------|-----------|------|
| `skincare_premium` | `skincare` | 프리미엄 구분은 AIHOMPY 전용 |
| `gangnam_wedding_sdm` | `wedding` | 지역 특화는 QIS place축으로 |
| `startup_ir_ready` | `startup` | 스타트업 세분화는 AIHOMPY 전용 |
| `expert_aihompy` | `expert_professional` | AI홈피 전문가 통합 |
| `jeju_food_expert` | `expert_professional` | 지역 전문가 통합 |

#### 유틸리티 함수

| 함수 | 용도 | 입출력 예시 |
|------|------|-----------|
| `findMacroCategory(subKey)` | 세부→매크로 카테고리 | `'skincare'` → `MacroCategory{ecommerce_d2c}` |
| `getMacroKey(subKey)` | 세부→매크로 키만 | `'wedding'` → `'local_services'` |
| `resolveAihompyKey(key)` | AIHOMPY→BSW | `'gangnam_wedding_sdm'` → `'wedding'` |
| `resolveBswKey(key)` | BSW→AIHOMPY | `'wedding'` → `'wedding_sdm'` |
| `migrateV1Key(key)` | V1→V3 전환 | `'clinic'` → `'medical_clinic'` |

### 3.2 `lib/benchmark/aepi-calculator.ts` — 2단계 AEPI

```
AEPI V3 = Σ(7차원 가중합) × tech_modifier × eeat_modifier × macro_multiplier

Layer 2 (세부업종별):   factoid | procedural | comparative | authority | schema_org | topical | local_geo
Layer 1 (BM 매크로):   entity(e) | content(c) | technical(t) | schema(s) | eeat(r)
```

### 3.3 QIS 스키마 확장

`qis-shared-schemas.ts`에 `macro_industry` 옵셔널 필드 추가:
- `qisSignalPayloadSchema.macro_industry` — Signal 발송 시 BM 컨텍스트
- `qisRealMetricsSchema.macro_industry` — 실측 데이터 BM 컨텍스트

---

## 4. AIHOMPYHUB 측 현황 및 미완 사항

### 4.1 QIS 연동 (✅ 완료)

| 파일 | 기능 | 상태 |
|------|------|------|
| `storefront/lib/qis/bsw-client.ts` | BSW API 5개 메서드 | ✅ 완전 구현 |
| `storefront/lib/qis/signal-emitter.ts` | Signal 버퍼링+배치 전송 | ✅ 완전 구현 |
| `storefront/lib/qis/auth.ts` | HMAC-SHA256 인증 | ✅ 완전 구현 |
| `storefront/lib/qis/hub-qis-config.ts` | 7 Hub QIS 레지스트리 | ⚠️ 7종 (28종 필요) |
| `storefront/lib/qis/schemas.ts` | QIS 산업코드 enum | ⚠️ 7종 (28종 필요) |

### 4.2 업종 분류 인프라 (✅ 완료, BSW 무연동)

| 파일 | 키 수 | BSW 연동 |
|------|------|---------|
| `storefront/lib/industries/index.ts` | 48+ IndustryConfig | ❌ BSW 키 필드 없음 |
| `storefront/lib/industries/types.ts` | IndustryConfig 인터페이스 | ❌ BSW 필드 없음 |
| `storefront/lib/hub.ts` | Hub 해석 | ❌ BSW 변환 없음 |
| `storefront/lib/tenant.ts` | TenantInfo | ❌ BSW 필드 없음 |
| `packages/gnb-config/src/index.ts` | 25+ GNB 노드셋 | ❌ BSW 무관 |
| `web/data/archetypes/index.ts` | 12 Archetype | ❌ 비표준 키 사용 |

### 4.3 미완성 연동 포인트 (5건)

| # | 미완 사항 | 영향 | 우선순위 | 작업량 |
|---|----------|------|---------|-------|
| G1 | QIS 산업코드 7종→28종 확장 | QIS 라우팅 정밀도 | 🔴 높음 | ★★ |
| G2 | IndustryConfig에 `bswSubIndustryKey` 추가 | BSW 진단→개설 자동 연계 | 🟡 중간 | ★ |
| G3 | Hub/Tenant 해석에 BSW 변환 레이어 | 양방향 업종 동기화 | 🟡 중간 | ★★ |
| G4 | Archetype `industry_types` 표준화 | GENESIS→BSW 역매핑 | 🟢 낮음 | ★ |
| G5 | DB 테이블 BSW 컬럼 추가 | 영속적 양방향 매핑 | 🟢 낮음 | ★★ |

> [!IMPORTANT]
> **현재 상태에서도 QIS 파이프라인은 작동합니다.** Signal/Prediction/Feedback의 `industry` 필드가 자유 문자열이므로 BSW V3 키를 그대로 전송·수신할 수 있습니다. 다만 AIHOMPYHUB의 `HUB_QIS_REGISTRY`가 7종만 매핑하므로, 미등록 업종의 QIS 라우팅이 누락됩니다.

---

## 5. 데이터 모델 크로스 레퍼런스

### 5.1 BSW V3 키 → AIHOMPY IndustryConfig 매핑 완전 목록

| BSW V3 Key | 매크로 | AIHOMPY Config Keys | IndustryConfig 존재 |
|-----------|--------|--------------------|--------------------|
| `skincare` | M1 | `skincare`, `skincare_premium`, `haircare` | ✅ 3건 |
| `fashion` | M1 | `k_style` | ✅ 1건 |
| `food_product` | M1 | `korean_food` | ✅ 1건 |
| `home_living` | M1 | — | ❌ 0건 (general 폴백) |
| `hair_nail` | M2 | — | ❌ 0건 (신규 필요) |
| `restaurant_cafe` | M2 | `korean_food`, `mixture_poi` | ✅ 2건 |
| `fitness` | M2 | — | ❌ 0건 (신규 필요) |
| `wedding` | M2 | `wedding_sdm` 외 12건 | ✅ 12건 |
| `hotel` | M2 | `hotel_hospitality` | ✅ 1건 |
| `academy` | M2 | — | ❌ 0건 (신규 필요) |
| `auto_service` | M2 | — | ❌ 0건 (general 폴백) |
| `pet_care` | M2 | — | ❌ 0건 (general 폴백) |
| `medical_clinic` | M3 | `clinic` | ✅ 1건 |
| `hanbang` | M3 | `hanbang` | ✅ 1건 |
| `senior_care` | M3 | `senior_care` | ✅ 1건 |
| `legal` | M3 | — | ❌ 0건 (general 폴백) |
| `finance_accounting` | M3 | — | ❌ 0건 (general 폴백) |
| `real_estate` | M3 | `real_estate` | ✅ 1건 |
| `it_saas` | M4 | — | ❌ 0건 (startup 폴백) |
| `consulting` | M4 | `consulting`, `dual_brain_vortex` | ✅ 2건 |
| `online_education` | M4 | — | ❌ 0건 (general 폴백) |
| `startup` | M4 | `startup` + 5 aliases | ✅ 6건 |
| `photography` | M5 | `photography` | ✅ 1건 |
| `entertainment` | M5 | `indie_band`, `k_rock_ballad` | ✅ 2건 |
| `k_culture_content` | M5 | `k_cosmetics_media`, `book_knowledge`, `accessibility_media`, `k_experience` | ✅ 4건 |
| `expert_professional` | M5 | `expert_aihompy`, `bfw_expert`, `jeju_expert` 등 8건 | ✅ 8건 |
| `place_brand` | M5 | `place`, `place_dao`, `regional`, `mixture_poi` | ✅ 4건 |
| `travel_tourism` | M5 | `k_experience` | ✅ 1건 (공유) |

**커버리지:** 28개 BSW V3 키 중 **20개**가 AIHOMPY IndustryConfig에 1개 이상 매핑, **8개**는 `general` 폴백

### 5.2 QIS 산업코드 ↔ BSW V3 크로스 맵

| QIS Code (현행 7종) | BSW V3 Key | 매크로 | Hub Slug |
|--------------------|-----------|--------|----------|
| `wedding` | `wedding` | local_services | k-wedding |
| `beauty` | `skincare` | ecommerce_d2c | k-beauty |
| `hanbang` | `hanbang` | ymyl_professional | k-hanbang |
| `book` | `k_culture_content` | media_content_hub | k-book |
| `expert` | `expert_professional` | media_content_hub | k-expert |
| `music` | `entertainment` | media_content_hub | k-music |
| `food` | `restaurant_cafe` | local_services | k-food |
| ❌ 미등록 | `fashion` | ecommerce_d2c | — |
| ❌ 미등록 | `consulting` | b2b_tech_saas | — |
| ❌ 미등록 | `startup` | b2b_tech_saas | — |
| ❌ 미등록 | `medical_clinic` | ymyl_professional | — |
| ❌ 미등록 | `real_estate` | ymyl_professional | — |
| ❌ 미등록 | (그 외 16종) | — | — |

---

## 6. 파일 인벤토리

### 6.1 BSW-OS 핵심 파일

| 파일 | 역할 | V3 상태 |
|------|------|--------|
| [industry-taxonomy.ts](file:///c:/Users/User/bsw/lib/industry/industry-taxonomy.ts) | 3계층 택소노미 + 양방향 매핑 | ✅ 완료 |
| [aepi-calculator.ts](file:///c:/Users/User/bsw/lib/benchmark/aepi-calculator.ts) | 2단계 동적 가중치 AEPI | ✅ 완료 |
| [qis-shared-schemas.ts](file:///c:/Users/User/bsw/lib/qis-shared-schemas.ts) | QIS 스키마 (macro_industry) | ✅ 완료 |
| [tri-axis-router.ts](file:///c:/Users/User/bsw/lib/qis/tri-axis-router.ts) | 3축 라우터 (V3 키워드) | ✅ 완료 |
| [hub-client.ts](file:///c:/Users/User/bsw/lib/qis/hub-client.ts) | BSW→Hub QIS 클라이언트 | ✅ 기존 |
| [batch-audit-runner.ts](file:///c:/Users/User/bsw/lib/industry/batch-audit-runner.ts) | 배치 감사 (macroKey 전파) | ✅ 완료 |
| [benchmark-aggregator.ts](file:///c:/Users/User/bsw/lib/industry/benchmark-aggregator.ts) | 벤치마크 집계 (macroKey) | ✅ 완료 |
| [relative-positioner.ts](file:///c:/Users/User/bsw/lib/industry/relative-positioner.ts) | 포지셔닝 (macroKey) | ✅ 완료 |
| [strategy-generator.ts](file:///c:/Users/User/bsw/lib/industry/strategy-generator.ts) | 전략 생성 (macroKey) | ✅ 완료 |
| [reference-sites-registry.ts](file:///c:/Users/User/bsw/lib/industry/reference-sites-registry.ts) | 레퍼런스 사이트 (macroKey) | ✅ 완료 |

### 6.2 AIHOMPYHUB 핵심 파일

| 파일 | 역할 | BSW 연동 |
|------|------|---------|
| `storefront/lib/industries/index.ts` | IndustryConfig 레지스트리 | ❌ |
| `storefront/lib/industries/types.ts` | IndustryConfig 인터페이스 | ❌ |
| `storefront/lib/hub.ts` | Hub 해석 | ❌ |
| `storefront/lib/tenant.ts` | 테넌트 해석 | ❌ |
| `packages/gnb-config/src/index.ts` | GNB 노드 레지스트리 | ❌ 무관 |
| `storefront/lib/qis/bsw-client.ts` | BSW API 클라이언트 | ✅ |
| `storefront/lib/qis/hub-qis-config.ts` | QIS Hub 레지스트리 | ⚠️ 7종 |
| `storefront/lib/qis/schemas.ts` | QIS 스키마 | ⚠️ 7종 |
| `storefront/lib/qis/signal-emitter.ts` | Signal 발신 | ✅ |
| `storefront/lib/qis/auth.ts` | HMAC 인증 | ✅ |
| `web/data/archetypes/index.ts` | Archetype→업종 | ❌ |
