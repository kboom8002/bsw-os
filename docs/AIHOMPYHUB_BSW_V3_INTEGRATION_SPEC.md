# AIHOMPYHUB — BSW-OS V3 통합 업종 분류 연동 구현 명세서

> **발신:** BSW-OS 프로젝트  
> **수신:** AIHOMPYHUB 프로젝트  
> **작성일:** 2026-06-26  
> **BSW V3 기반 커밋:** `2f012d1` (bsw-os/master)

---

## 개요

BSW-OS에 3계층 통합 업종 분류 V3 시스템이 구현 완료되었습니다. AIHOMPYHUB에서 아래 작업을 수행하면 **BSW 진단↔AIHOMPY 운영** 양방향 매끄러운 연동이 완성됩니다.

### BSW-OS 측 완료 현황 (참고용)

| 모듈 | 파일 | 상태 |
|------|------|------|
| 3계층 택소노미 | `lib/industry/industry-taxonomy.ts` | ✅ |
| 양방향 매핑 테이블 | `AIHOMPY_TO_BSW` / `BSW_TO_AIHOMPY_DEFAULT` | ✅ |
| 2단계 AEPI 가중치 | `lib/benchmark/aepi-calculator.ts` | ✅ |
| QIS 스키마 | `lib/qis-shared-schemas.ts` (macro_industry 필드) | ✅ |
| 3축 라우터 | `lib/qis/tri-axis-router.ts` (V3 키워드 확장) | ✅ |

---

## 작업 목록 총괄

| # | 작업 | 우선순위 | 난이도 | 영향 범위 |
|---|------|---------|-------|---------|
| **W1** | QIS 산업코드 확장 (7종→28종) | 🔴 높음 | ★★ | QIS 전체 |
| **W2** | IndustryConfig에 BSW 매핑 필드 추가 | 🔴 높음 | ★ | industries/ |
| **W3** | QIS Hub 레지스트리 확장 | 🟡 중간 | ★★ | qis/ |
| **W4** | QIS 스키마 macro_industry 필드 추가 | 🟡 중간 | ★ | qis/schemas.ts |
| **W5** | Hub/Tenant 해석에 BSW 키 부착 | 🟡 중간 | ★★ | hub.ts, tenant.ts |
| **W6** | Archetype industry_types 표준화 | 🟢 낮음 | ★ | archetypes/ |

---

## W1. QIS 산업코드 확장 (🔴 높음)

### 현재 상태

```typescript
// apps/storefront/lib/qis/schemas.ts (L4-12)
export const QIS_INDUSTRY_CODES = [
  'wedding', 'beauty', 'hanbang', 'book', 'expert', 'music', 'food',
] as const;
```

**문제:** BSW V3은 28개 세부업종으로 Signal/Prediction을 라우팅하지만, AIHOMPY는 7개만 인식합니다. Signal 발송 시 `z.enum(QIS_INDUSTRY_CODES)`가 미등록 키를 거부합니다.

### 변경 내용

#### [MODIFY] `apps/storefront/lib/qis/schemas.ts`

```typescript
// ▼ 기존 7종을 BSW V3 28종으로 확장
export const QIS_INDUSTRY_CODES = [
  // ── M1: ecommerce_d2c ──
  'skincare',       // (기존 'beauty' → V3 표준 키 변경)
  'fashion',
  'food_product',
  'home_living',
  // ── M2: local_services ──
  'hair_nail',
  'restaurant_cafe',
  'fitness',
  'wedding',        // (기존 유지)
  'hotel',
  'academy',
  'auto_service',
  'pet_care',
  // ── M3: ymyl_professional ──
  'medical_clinic',
  'hanbang',        // (기존 유지)
  'senior_care',
  'legal',
  'finance_accounting',
  'real_estate',
  // ── M4: b2b_tech_saas ──
  'it_saas',
  'consulting',
  'online_education',
  'startup',
  // ── M5: media_content_hub ──
  'photography',
  'entertainment',
  'k_culture_content',
  'expert_professional', // (기존 'expert' → V3 표준 키 변경)
  'place_brand',
  'travel_tourism',
  // ── 하위 호환 (V1 별칭) ──
  'beauty',         // → skincare 매핑용 별칭
  'expert',         // → expert_professional 매핑용 별칭
  'book',           // → k_culture_content 매핑용 별칭
  'music',          // → entertainment 매핑용 별칭
  'food',           // → restaurant_cafe 매핑용 별칭
] as const;
```

> [!WARNING]
> **하위 호환 주의:** 기존 `'beauty'`, `'expert'`, `'book'`, `'music'`, `'food'` 키를 제거하면 기존 `signal-emitter.ts`/`hub-qis-config.ts`의 호출이 실패합니다. 하위 호환 별칭으로 유지하고, **Signal 수신 시 별칭→V3 표준 키 변환 유틸**을 추가하세요.

#### [NEW] `apps/storefront/lib/qis/industry-resolver.ts`

```typescript
/**
 * QIS 산업코드 별칭 → BSW V3 표준 키 변환
 * Signal 발송 전, Prediction 수신 후 호출
 */
const QIS_ALIAS_MAP: Record<string, string> = {
  beauty: 'skincare',
  expert: 'expert_professional',
  book: 'k_culture_content',
  music: 'entertainment',
  food: 'restaurant_cafe',
};

export function normalizeQisIndustry(code: string): string {
  return QIS_ALIAS_MAP[code] || code;
}
```

---

## W2. IndustryConfig에 BSW 매핑 필드 추가 (🔴 높음)

### 현재 상태

```typescript
// apps/storefront/lib/industries/types.ts (L21)
export interface IndustryConfig {
  parentType?: string;
  // ... 40+ 필드 ... BSW 관련 필드 없음
}
```

### 변경 내용

#### [MODIFY] `apps/storefront/lib/industries/types.ts`

`IndustryConfig` 인터페이스의 `parentType` 바로 아래에 추가:

```typescript
export interface IndustryConfig {
  parentType?: string;

  // ── BSW-OS V3 통합 업종 분류 매핑 (NEW) ─────────────────
  /** BSW V3 세부업종 키 (예: 'wedding', 'skincare', 'consulting') */
  bswSubIndustryKey?: string;
  /** BSW V3 BM 매크로 카테고리 (예: 'local_services', 'ecommerce_d2c') */
  bswMacroCategoryKey?: 'ecommerce_d2c' | 'local_services' | 'ymyl_professional' | 'b2b_tech_saas' | 'media_content_hub';

  // ... 기존 필드 유지 ...
}
```

#### [MODIFY] `apps/storefront/lib/industries/index.ts`

각 `IndustryConfig` 항목에 BSW 필드 추가. 매핑 레퍼런스:

| AIHOMPY Config Key | bswSubIndustryKey | bswMacroCategoryKey |
|-------|---------|---------|
| `skincare` | `'skincare'` | `'ecommerce_d2c'` |
| `skincare_premium` | `'skincare'` | `'ecommerce_d2c'` |
| `haircare` | `'skincare'` | `'ecommerce_d2c'` |
| `k_style` | `'fashion'` | `'ecommerce_d2c'` |
| `korean_food` | `'food_product'` | `'ecommerce_d2c'` |
| `wedding_sdm` | `'wedding'` | `'local_services'` |
| `wedding_photo_studio` | `'wedding'` | `'local_services'` |
| `wedding_snap` | `'wedding'` | `'local_services'` |
| `wedding_dress` | `'wedding'` | `'local_services'` |
| `wedding_makeup` | `'wedding'` | `'local_services'` |
| `wedding_hall` | `'wedding'` | `'local_services'` |
| `kwedding_inbound` | `'wedding'` | `'local_services'` |
| `gangnam_wedding_sdm` | `'wedding'` | `'local_services'` |
| `gangnam_wedding_dress` | `'wedding'` | `'local_services'` |
| `gangnam_wedding_makeup` | `'wedding'` | `'local_services'` |
| `hotel_hospitality` | `'hotel'` | `'local_services'` |
| `mixture_poi` | `'restaurant_cafe'` | `'local_services'` |
| `clinic` | `'medical_clinic'` | `'ymyl_professional'` |
| `hanbang` | `'hanbang'` | `'ymyl_professional'` |
| `senior_care` | `'senior_care'` | `'ymyl_professional'` |
| `real_estate` | `'real_estate'` | `'ymyl_professional'` |
| `consulting` | `'consulting'` | `'b2b_tech_saas'` |
| `dual_brain_vortex` | `'consulting'` | `'b2b_tech_saas'` |
| `startup` | `'startup'` | `'b2b_tech_saas'` |
| `startup_ir_ready` | `'startup'` | `'b2b_tech_saas'` |
| `startup_product_led` | `'startup'` | `'b2b_tech_saas'` |
| `startup_b2b_saas` | `'startup'` | `'b2b_tech_saas'` |
| `startup_growth_stage` | `'startup'` | `'b2b_tech_saas'` |
| `startup_deeptech` | `'startup'` | `'b2b_tech_saas'` |
| `photography` | `'photography'` | `'media_content_hub'` |
| `indie_band` | `'entertainment'` | `'media_content_hub'` |
| `k_rock_ballad` | `'entertainment'` | `'media_content_hub'` |
| `k_cosmetics_media` | `'k_culture_content'` | `'media_content_hub'` |
| `book_knowledge` | `'k_culture_content'` | `'media_content_hub'` |
| `accessibility_media` | `'k_culture_content'` | `'media_content_hub'` |
| `k_experience` | `'travel_tourism'` | `'media_content_hub'` |
| `expert_aihompy` | `'expert_professional'` | `'media_content_hub'` |
| `participant_aihompy` | `'expert_professional'` | `'media_content_hub'` |
| `bfw_expert` | `'expert_professional'` | `'media_content_hub'` |
| `jeju_expert` | `'expert_professional'` | `'media_content_hub'` |
| `jeju_food_expert` | `'expert_professional'` | `'media_content_hub'` |
| `jeju_experience_expert` | `'expert_professional'` | `'media_content_hub'` |
| `jeju_local_expert` | `'expert_professional'` | `'media_content_hub'` |
| `place` | `'place_brand'` | `'media_content_hub'` |
| `regional` | `'place_brand'` | `'media_content_hub'` |
| `general` | `'consulting'` | `'b2b_tech_saas'` |

#### 활용 예시

```typescript
// BSW 진단 결과로 AIHOMPY IndustryConfig 찾기
const bswResult = { subIndustryKey: 'wedding' };
const matchingConfigs = Object.entries(INDUSTRY_CONFIG)
  .filter(([_, config]) => config.bswSubIndustryKey === bswResult.subIndustryKey);

// AIHOMPY 테넌트에서 BSW V3 키 가져오기
const config = getIndustryConfig(tenant.industry_type);
const bswKey = config.bswSubIndustryKey; // 'wedding'
const macroKey = config.bswMacroCategoryKey; // 'local_services'
```

---

## W3. QIS Hub 레지스트리 확장 (🟡 중간)

### 현재 상태

```typescript
// apps/storefront/lib/qis/hub-qis-config.ts
// HUB_QIS_REGISTRY: 7개 허브만 등록
```

### 변경 내용

#### [MODIFY] `apps/storefront/lib/qis/hub-qis-config.ts`

**Phase 1 (즉시):** 기존 7개 Hub의 `industryCode`를 V3 표준 키로 변경:

```typescript
// 변경 전 → 변경 후
'skincare_hub': { industryCode: 'beauty',  ... }  → { industryCode: 'skincare', ... }
'k-expert':     { industryCode: 'expert',  ... }  → { industryCode: 'expert_professional', ... }
'k-book':       { industryCode: 'book',    ... }  → { industryCode: 'k_culture_content', ... }
'k-music':      { industryCode: 'music',   ... }  → { industryCode: 'entertainment', ... }
'k-food':       { industryCode: 'food',    ... }  → { industryCode: 'restaurant_cafe', ... }
```

**Phase 2 (점진):** 신규 허브가 추가될 때마다 V3 키로 등록. 예시:

```typescript
'k-consulting': {
  hubSlug: 'k-consulting',
  industryCode: 'consulting',          // BSW V3 키
  sourcePlatform: 'kconsultinghub',
  panelSlug: 'SBS-AIPR-Consulting-v1',
  ymylGrade: 'medium',
  expectedLayerIntensity: 'medium',
  cronFrequency: 'weekly',
  probeQuestionCount: 15,
  signalTypeMapping: {},
},
```

#### [MODIFY] `HubQisConfig` 인터페이스

```typescript
export interface HubQisConfig {
  hubSlug: string;
  industryCode: QisIndustryCode;
  bswMacroCategoryKey?: string;         // NEW: BSW V3 매크로 카테고리
  sourcePlatform: string;
  // ... 기존 필드 유지 ...
}
```

---

## W4. QIS 스키마 macro_industry 필드 추가 (🟡 중간)

### 현재 상태

BSW-OS 측 `qis-shared-schemas.ts`에 이미 `macro_industry: z.string().optional()` 추가 완료. AIHOMPY 측 `schemas.ts`에는 아직 반영되지 않음.

### 변경 내용

#### [MODIFY] `apps/storefront/lib/qis/schemas.ts`

```diff
 export const qisSignalPayloadSchema = z.object({
   source_platform: z.string(),
   signal_type: z.enum([...]),
   industry: z.enum(QIS_INDUSTRY_CODES),
+  macro_industry: z.string().optional(),    // BSW V3 BM 매크로 카테고리
   hub_slug: z.string().optional(),
   // ... 기존 필드 ...
 });

 export const qisRealMetricsSchema = z.object({
   metric_type: z.enum([...]),
   industry: z.enum(QIS_INDUSTRY_CODES),
+  macro_industry: z.string().optional(),    // BSW V3 BM 매크로 카테고리
   hub_slug: z.string().optional(),
   // ... 기존 필드 ...
 });
```

#### Signal 발송 시 macro_industry 자동 부착

```typescript
// signal-emitter.ts에서 Signal 생성 시 macro_industry 자동 추가
import { getIndustryConfig } from '../industries';

function enrichSignalWithMacro(signal: QisSignalPayload): QisSignalPayload {
  const config = getIndustryConfig(signal.industry);
  return {
    ...signal,
    macro_industry: config?.bswMacroCategoryKey,
  };
}
```

---

## W5. Hub/Tenant 해석에 BSW 키 부착 (🟡 중간)

### 현재 상태

```typescript
// hub.ts — resolveHub() 반환값
interface HubData {
  industry_type: string | null;  // AIHOMPY 키만
  // BSW 관련 필드 없음
}

// tenant.ts — TenantInfo
interface TenantInfo {
  industry_type: string;  // AIHOMPY 키만
  // BSW 관련 필드 없음
}
```

### 변경 내용

#### [MODIFY] `apps/storefront/lib/hub.ts`

```typescript
// HubData 인터페이스에 추가
export interface HubData {
  industry_type: string | null;
  bsw_industry_key?: string;         // NEW
  bsw_macro_category?: string;       // NEW
  // ... 기존 필드 유지 ...
}

// resolveHub() 반환 직전에 BSW 키 자동 부착
export async function resolveHub(...): HubData {
  // ... 기존 로직 ...
  const config = getIndustryConfig(hubData.industry_type);
  return {
    ...hubData,
    bsw_industry_key: config?.bswSubIndustryKey,
    bsw_macro_category: config?.bswMacroCategoryKey,
  };
}
```

#### [MODIFY] `apps/storefront/lib/tenant.ts`

```typescript
// TenantInfo 인터페이스에 추가
export interface TenantInfo {
  industry_type: string;
  bsw_industry_key?: string;         // NEW
  bsw_macro_category?: string;       // NEW
  // ... 기존 필드 유지 ...
}

// resolveTenant() 반환 직전에 BSW 키 자동 부착
export async function resolveTenant(...): TenantInfo {
  // ... 기존 로직 ...
  const config = getIndustryConfig(tenantInfo.industry_type);
  return {
    ...tenantInfo,
    bsw_industry_key: config?.bswSubIndustryKey,
    bsw_macro_category: config?.bswMacroCategoryKey,
  };
}
```

> [!NOTE]
> **DB 테이블 변경은 선택사항입니다.** `tenants`/`platform_hubs` 테이블에 `bsw_industry_key` 컬럼을 추가하면 영속적이지만, 위와 같이 해석 시점에 `IndustryConfig`에서 동적으로 부착하면 DB 변경 없이도 작동합니다.

---

## W6. Archetype industry_types 표준화 (🟢 낮음)

### 현재 상태

```typescript
// web/data/archetypes/index.ts
// 비표준 키 사용: 'aesthetics', 'studio', 'yoga', 'nail', 'it', 'education'
// → INDUSTRY_CONFIG에 없는 키 포함
```

### 변경 내용

#### [MODIFY] `apps/web/data/archetypes/index.ts`

`industry_types` 배열을 `INDUSTRY_CONFIG`에 등록된 표준 키로 변경:

| Archetype | 기존 (비표준) | 변경 (표준) |
|-----------|-----------|-----------|
| warm_healer | `['skincare', 'aesthetics']` | `['skincare', 'skincare_premium']` |
| clinical_expert | `['clinic', 'skincare']` | `['clinic', 'skincare']` (유지) |
| luxe_atelier | `['skincare', 'aesthetics', 'studio']` | `['skincare_premium', 'photography']` |
| creative_lens | `['studio', 'wedding', 'cafe']` | `['photography', 'wedding_sdm', 'korean_food']` |
| romantic_planner | `['wedding', 'studio']` | `['wedding_sdm', 'photography']` |
| wise_mentor | `['consulting', 'education']` | `['consulting', 'expert_aihompy']` |
| zen_master | `['yoga', 'consulting']` | `['consulting', 'expert_aihompy']` |
| taste_curator | `['cafe', 'general']` | `['korean_food', 'general']` |
| digital_maker | `['it', 'consulting']` | `['startup', 'consulting']` |
| caring_teacher | `['education', 'general']` | `['expert_aihompy', 'general']` |
| artisan_hand | `['nail', 'general']` | `['skincare', 'general']` |
| local_hero | `['general']` | `['general']` (유지) |

또한 각 Archetype에 BSW 매크로 참조 추가:

```typescript
{
  id: 'warm_healer',
  // ... 기존 필드 ...
  industry_types: ['skincare', 'skincare_premium'],
  bswMacroCategory: 'ecommerce_d2c',  // NEW
}
```

---

## 검증 체크리스트

### 빌드 검증

```bash
# AIHOMPY 전체 빌드
cd c:\Users\User\aihompyhub && npx turbo build

# Storefront만 빌드
cd c:\Users\User\aihompyhub && npx turbo build --filter=storefront
```

### 기능 검증

```
□ QIS Signal 발송 시 V3 28종 키가 z.enum 통과하는가?
□ 기존 'beauty', 'expert' 등 별칭 키도 발송 가능한가?
□ getIndustryConfig('skincare').bswSubIndustryKey === 'skincare'
□ getIndustryConfig('gangnam_wedding_sdm').bswSubIndustryKey === 'wedding'
□ getIndustryConfig('startup_ir_ready').bswMacroCategoryKey === 'b2b_tech_saas'
□ resolveHub() 반환값에 bsw_industry_key 포함되는가?
□ resolveTenant() 반환값에 bsw_macro_category 포함되는가?
□ BSW /api/v1/qis/signals/ingest에 macro_industry 필드 전달되는가?
```

### 회귀 검증

```
□ 기존 7개 Hub의 QIS 파이프라인 (Signal/Prediction/Feedback) 정상 작동
□ 기존 48+ IndustryConfig의 GNB/SSoT/디자인 렌더링 정상
□ SEED_TENANTS 15개 해석 정상
□ Archetype 12종 매칭 정상
```

---

## 구현 순서 권장

```
W1 (QIS 산업코드 확장)
 ↓
W4 (macro_industry 필드)     ← W1과 함께 schemas.ts 변경
 ↓
W2 (IndustryConfig BSW 필드) ← 핵심 매핑 기반
 ↓
W3 (Hub 레지스트리 확장)      ← W1+W2 후 industryCode 변경
 ↓
W5 (Hub/Tenant BSW 부착)     ← W2 완료 후 가능
 ↓
W6 (Archetype 표준화)        ← 독립적, 마지막
```

---

## 참고 문서

| 문서 | 경로 |
|------|------|
| BSW V3 택소노미 설계 | `bsw/docs/BSW_AIHOMPY_UNIFIED_TAXONOMY_V3.md` |
| BSW 시스템 아키텍처 | `bsw/docs/BSW_AIHOMPY_TAXONOMY_SYSTEM_ARCHITECTURE.md` |
| BSW 운영 가이드 | `bsw/docs/BSW_AIHOMPY_TAXONOMY_OPERATIONS_GUIDE.md` |
| BSW 양방향 매핑 코드 | `bsw/lib/industry/industry-taxonomy.ts` |
