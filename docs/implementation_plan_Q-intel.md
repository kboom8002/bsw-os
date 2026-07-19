# Q-Intelligence UI 부재 해결 구현 계획

## 감사 결과 재정리: 문제는 생각보다 작다

> [!IMPORTANT]
> 정밀 감사 결과, Q-Intelligence의 **백엔드 + 관리자 UI + API가 이미 대규모로 구현**되어 있었습니다.
> 부재한 것은 **"고객(테넌트)용 대시보드"** — 즉 AEO 올인원/Brand MRI/Enterprise 고객이 직접 보는 화면입니다.

### 기존 구현 현황 (재감사)

| 계층 | 구현 현황 | 코드 볼륨 |
|------|----------|:--------:|
| **백엔드 엔진** | 🟢 100% 완전 | QEP 529줄 + QVS 179줄 + PAT 305줄 + 8개 보조 모듈 |
| **Server Actions** | 🟢 100% 완전 | [qis-actions.ts](file:///c:/Users/User/aihompyhub/apps/web/app/actions/qis-actions.ts) — **1,602줄 (60KB)** |
| **관리자 UI** | 🟢 100% 완전 | [HubQisTab.tsx](file:///c:/Users/User/aihompyhub/apps/web/app/admin/hub/%5BhubSlug%5D/HubQisTab.tsx) — **1,687줄 (84KB)** |
| **팩토리 UI** | 🟢 100% 완전 | [factory/qis/page.tsx](file:///c:/Users/User/aihompyhub/apps/web/app/factory/qis/page.tsx) — **758줄 (38KB)** |
| **API 라우트** | 🟢 12개 라우트 | canonicalize, golden-sets, layers, metrics, signals, gap-matrix, link-content, harvest, probe, provision, rebalance, matching |
| **테넌트 스튜디오** | 🟡 페이지 존재하나 비어있음 | `tenant/[tenantId]/studio/foundation/qis/`, `qis-gap/`, `qis-registry/`, `observatory/qis-performance/` |
| **고객용 대시보드** | 🔴 **미구현** | AEO 올인원/Brand MRI 고객이 직접 보는 "주간 추천 질문" 화면 없음 |

### 핵심 인사이트

```
기존:                                   필요:
┌──────────────────┐                   ┌──────────────────┐
│ 관리자(Admin)     │                   │ 고객(Tenant)      │
│ HubQisTab 84KB   │ → 데이터 동일 → │ Q-Intelligence    │
│ 1,687줄          │                   │ Dashboard         │
│ 3탭(hub/pool/gap)│                   │ "주간 추천 질문"   │
│ 클러스터링/배치   │                   │ QVS 우선순위      │
│ BSW 동기화       │                   │ 원클릭 콘텐츠 생산 │
└──────────────────┘                   └──────────────────┘
      관리/운영용                          고객 자가서비스용
```

**결론: 새로 만들 것은 "고객 뷰" 프론트엔드 1~2개 페이지**이며, 백엔드/API/Server Action은 모두 재사용합니다.

---

## 구현 계획

### Phase 1: MVP (3일) — AEO 올인원 Basic 고객용

> 8/3 런칭 최소 요구사항

#### [NEW] `tenant/[tenantId]/studio/foundation/qis/page.tsx`

**기존 빈 페이지를 "주간 추천 질문 대시보드"로 구현**

```
┌──────────────────────────────────────────────────────────┐
│ 📊 Q-Intelligence — 이번 주 추천 질문                      │
│ [2026.08.04 ~ 08.10]     티어: Pro (7개/주)               │
│                                                          │
│ ┌─ 요약 카드 ────────────────────────────────────┐        │
│ │ 추천 질문: 7개 | AI 공백: 4개 | 평균 QVS: ★3.8 │        │
│ └────────────────────────────────────────────────┘        │
│                                                          │
│ ┌─ 질문 리스트 (QVS 내림차순) ─────────────────────┐       │
│ │                                                │       │
│ │ 1. "민감성 피부 클렌징 순서"                      │       │
│ │    QVS: ★★★★★ | 커버리지: 🔴 AI 공백            │       │
│ │    QC: QC-04 시술/과정 | Layer: A               │       │
│ │    [AI 초안 생성] [상세 보기]                     │       │
│ │                                                │       │
│ │ 2. "세라마이드 크림 효과"                         │       │
│ │    QVS: ★★★★ | 커버리지: 🟡 희박                │       │
│ │    QC: QC-03 성분/원료 | Layer: A               │       │
│ │    [AI 초안 생성] [상세 보기]                     │       │
│ │                                                │       │
│ │ 3. "여름 자외선 차단제 SPF 차이"                  │       │
│ │    QVS: ★★★ | 커버리지: 🟠 보통                 │       │
│ │    시즌 부스트: ☀️ +120%                        │       │
│ │    [AI 초안 생성] [상세 보기]                     │       │
│ │                                                │       │
│ │ ...                                            │       │
│ └────────────────────────────────────────────────┘        │
│                                                          │
│ ┌─ 하단 CTA ─────────────────────────────────────┐       │
│ │ Pro로 업그레이드하면 주 15개까지 추천 ↑           │       │
│ └────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

**구현 세부사항:**

| 요소 | 데이터 소스 | 재사용 코드 |
|------|----------|-----------|
| 추천 질문 목록 | `question_clusters` 테이블 | `fetchQisGapAnalysis` (qis-actions.ts) |
| QVS 점수 | `qvs_score` 컬럼 | HubQisTab의 `qvs_score` 렌더링 로직 |
| 커버리지 상태 | `coverage_status` 컬럼 | `COVERAGE_META` 상수 + `CoverageBadge` 컴포넌트 |
| QC Family / KL Layer | `qc_family`, `kl_layer` 컬럼 | `QC_FAMILIES`, `KL_LAYERS` 상수 |
| AI 초안 생성 버튼 | `generateAnswerDraftForQisAction` | qis-actions.ts (이미 구현됨) |
| 티어별 질문 수 제한 | `tierGate.ts` | 기존 5-tier 게이팅 시스템 |
| 시즌 부스트 | QEP 시그널의 `season_boost` | industry-templates.ts |

**재사용 가능한 기존 코드:**

```typescript
// qis-actions.ts에서 직접 재사용
import {
  fetchQisGapAnalysis,           // Gap 분석 데이터
  fetchQisPerformanceDataAction, // 성과 데이터
  generateAnswerDraftForQisAction, // AI 초안 생성
  fetchGlobalQisPool,            // 글로벌 풀 조회
} from '@/app/actions/qis-actions';

// HubQisTab에서 추출할 UI 컴포넌트
// - CoverageBadge: 커버리지 상태 배지
// - rateColor/rateBg: 점수 색상 유틸
// - statusColor: 상태 색상 유틸
```

**파일 생성 계획:**

```
apps/web/app/tenant/[tenantId]/studio/foundation/qis/
├── page.tsx              [NEW] 서버 컴포넌트 (데이터 패칭)
└── QisRecommendClient.tsx [NEW] 클라이언트 컴포넌트 (~300줄)

apps/web/components/qis/
├── QisBadges.tsx          [NEW] CoverageBadge, QvsBadge 등 공통 배지 (HubQisTab에서 추출)
└── QisQuestionCard.tsx    [NEW] 질문 카드 컴포넌트 (~80줄)
```

**예상 공수:** 2~3일 (기존 코드 재사용으로 신규 작성량 ~500줄)

---

### Phase 2: Pro (5일) — Gap 분석 + AI 초안 연동

> 9월 출시 (AEO 올인원 Pro/Premium + Brand MRI)

#### [NEW] `tenant/[tenantId]/studio/foundation/qis-gap/page.tsx`

기존 빈 `qis-gap/` 디렉토리에 Gap 분석 대시보드 구현

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Answer Gap 분석 — [브랜드명]                            │
│                                                          │
│ [전체] [AI 공백] [희박] [보통] [포화]  검색: [________]     │
│                                                          │
│ ┌─ Gap 히트맵 (CQ × AI 엔진) ────────────────────┐       │
│ │                                                │       │
│ │          ChatGPT  Gemini  Perplexity           │       │
│ │ CQ 01    🟢 인용   🟡 부분  🔴 없음              │       │
│ │ CQ 02    🔴 없음   🔴 없음  🔴 없음              │       │
│ │ CQ 03    🟡 부분   🟢 인용  🟡 부분              │       │
│ │ ...                                            │       │
│ └────────────────────────────────────────────────┘        │
│                                                          │
│ ┌─ 공백 질문 리스트 (우선순위순) ──────────────────┐        │
│ │                                                │       │
│ │ "민감성 피부 클렌징 순서" — QVS ★5 — 완전 공백    │       │
│ │ [AI 초안 생성] → Writer Hub → AI홈피 발행        │       │
│ │                                                │       │
│ │ 경쟁사 현황: A사 인용 2건 / B사 인용 1건          │       │
│ │                                                │       │
│ └────────────────────────────────────────────────┘        │
│                                                          │
│ ┌─ 성과 요약 ────────────────────────────────────┐        │
│ │ 커버리지: 42% | 인용률: 18% | 신선도: 85%       │        │
│ │ 평균 우선순위: 67 | 변화: +5% vs 전주           │        │
│ └────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

**재사용 코드:**

| 요소 | 재사용 소스 |
|------|----------|
| Gap 데이터 | `fetchQisGapAnalysis` — 이미 `GapItem` 인터페이스 + Supabase 쿼리 완전 구현 |
| 성과 데이터 | `fetchQisPerformanceDataAction` — coverageRate, citationRate, freshnessRate, avgPriority |
| Gap 히트맵 | `COVERAGE_META` + `CoverageBadge` 재사용 |
| AI 초안→Writer 연동 | `generateAnswerDraftForQisAction` → `submitQuestionToFactoryAction` 파이프라인 |
| QisGapClient.tsx | `qis-gap/QisGapClient.tsx` — **이미 파일이 존재** (내용 확인 필요) |

**추가 기능 (Phase 2 전용):**

- "AI 초안 생성 → Writer Hub로 이동" 워크플로우 연결
- 경쟁사 Gap 비교 (Observatory 데이터 연동)
- QVS 가치 환산 (원화) 시각화

**파일 계획:**

```
apps/web/app/tenant/[tenantId]/studio/foundation/qis-gap/
├── page.tsx              [MODIFY] 서버 컴포넌트
└── QisGapClient.tsx      [MODIFY] 이미 존재하는 파일 활용/확장

apps/web/app/tenant/[tenantId]/studio/foundation/qis-registry/
├── page.tsx              [NEW] 발행된 답변 레지스트리
└── QisRegistryClient.tsx [NEW] 발행 이력 관리
```

**예상 공수:** 4~5일

---

### Phase 3: Enterprise (5일) — 전체 Intelligence 대시보드

> 10~11월 출시 (AEO Enterprise Starter/Pro)

#### [NEW] `tenant/[tenantId]/studio/observatory/qis-performance/page.tsx`

기존 빈 `qis-performance/` 디렉토리에 성과 대시보드 구현

```
┌──────────────────────────────────────────────────────────┐
│ 📈 Q-Intelligence 성과 — [브랜드명]                        │
│                                                          │
│ [실시간] [주간] [월간]                                     │
│                                                          │
│ ┌── KPI 카드 4개 ─────────────────────────────────┐       │
│ │ 커버리지: 58% ↑  인용률: 23% ↑                   │       │
│ │ 신선도:   92% →  PAT 정확도: 72% ↑               │       │
│ └────────────────────────────────────────────────┘        │
│                                                          │
│ ┌── 예측 정확도 (PAT) 트렌드 ─────────────────────┐       │
│ │ [12주 추이 차트]                                 │       │
│ │ 현재: 72% | 편향: -2.3% (과대예측 경향)          │       │
│ └────────────────────────────────────────────────┘        │
│                                                          │
│ ┌── 시그널 소스 기여도 ──────────────────────────┐         │
│ │ GSC: 30% | 네이버SA: 25% | VOC: 20%            │        │
│ │ 외부수집: 15% | LLM예측: 10%                    │        │
│ └────────────────────────────────────────────────┘        │
│                                                          │
│ ┌── BSW 동기화 상태 ──────────────────────────────┐       │
│ │ 마지막 동기화: 3시간 전 | 상태: ✅ 정상           │        │
│ │ 예측: 45개 | 시그널: 24시간 내 127건             │        │
│ │ 벤치마크: BAIR 67 | AIPR 3위                    │        │
│ └────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

**재사용 코드:**

| 요소 | 재사용 소스 |
|------|----------|
| 성과 데이터 | `fetchQisPerformanceDataAction` (완전 구현) |
| BSW 동기화 상태 | `BswSyncData` 인터페이스 + `BswHealthBadge` 컴포넌트 |
| PAT 정확도 | `qis-local-pat.ts` — selfCalibrate/detectBias 함수 |
| 시그널 소스 통계 | `qis-metrics-collector.ts` + API `/api/v1/qis/metrics` |
| BAIR/AIPR | `BswSyncData.benchmark` — bairScore, aiprRank |

**파일 계획:**

```
apps/web/app/tenant/[tenantId]/studio/observatory/qis-performance/
├── page.tsx                    [NEW] 서버 컴포넌트
└── QisPerformanceClient.tsx    [NEW] 차트 + KPI (~400줄)
```

**예상 공수:** 4~5일

---

## 상품별 매핑

| Phase | 소요 | 활성화 상품 | 티어 게이팅 |
|:-----:|:----:|----------|----------|
| **Phase 1** | 3일 | AEO 올인원 Basic (3개/주) / Pro (7개) / Premium (15개) | `tierGate.ts` 활용 |
| **Phase 2** | 5일 | + Brand MRI (Gap 분석 + 경쟁사) / AEO 올인원 Pro+ | `growth` tier 이상 |
| **Phase 3** | 5일 | + AEO Enterprise (PAT/BSW 동기화/BAIR) | `pro` / `elite` tier |

---

## 구현 원칙

### 1. 신규 코드 최소화

```
기존 코드 재사용 목표:
• qis-actions.ts (1,602줄) → Server Action 100% 재사용
• HubQisTab.tsx (1,687줄) → UI 컴포넌트/유틸 추출 후 재사용
• API 12개 라우트 → 그대로 호출
• GapItem/PerformanceData/BswSyncData 인터페이스 → 타입 공유

신규 작성 예상:
• Phase 1: ~500줄 (페이지 + 클라이언트 컴포넌트 + 공통 배지)
• Phase 2: ~400줄 (Gap 대시보드 + 레지스트리)
• Phase 3: ~400줄 (성과 대시보드)
• 합계: ~1,300줄
```

### 2. 기존 HubQisTab에서 공통 컴포넌트 추출

```typescript
// AS-IS: HubQisTab.tsx 내부에 인라인으로 존재
function CoverageBadge({ coverage }: { coverage: string }) { ... }
function BswHealthBadge({ health }: { health: BswSyncData['health'] }) { ... }
const COVERAGE_META = { none: {...}, sparse: {...}, ... };
const QC_FAMILIES = [ ... ];
const KL_LAYERS = [ ... ];

// TO-BE: 공통 모듈로 추출
// apps/web/components/qis/QisBadges.tsx
export { CoverageBadge, BswHealthBadge, QvsBadge }
// apps/web/components/qis/qis-constants.ts
export { COVERAGE_META, QC_FAMILIES, KL_LAYERS, OBJECT_TYPES, RISK_LEVELS }
```

### 3. 티어 게이팅 연동

```typescript
// 기존 tierGate.ts의 게이팅 시스템 활용
import { checkFeatureAccess } from '@/lib/tierGate';

// 질문 수 제한
const tierLimits = {
  free: 0,        // 미표시
  starter: 3,     // Basic: 주 3개
  growth: 7,      // Pro: 주 7개
  pro: 15,        // Premium: 주 15개
  elite: Infinity  // Enterprise: 무제한
};

// Gap 분석 접근 제한
const gapAccess = checkFeatureAccess('gap_analysis_support', userTier);
// growth 이상만 접근 가능 → Basic은 업셀 CTA 표시
```

---

## Open Questions

> [!WARNING]
> **Q1: QisGapClient.tsx가 이미 존재하지만 비어있을 수 있습니다.**
> Phase 2 시작 전에 이 파일의 내용을 확인하여 기존 구현이 있으면 활용, 없으면 신규 작성해야 합니다.

> [!NOTE]
> **Q2: "AI 초안 생성" 버튼의 목적지**
> 현재 `generateAnswerDraftForQisAction`은 초안만 생성합니다. 이 초안이 Writer Hub의 PlatformWritePanel로 자동 이동해야 하는지, 아니면 인라인 편집기를 제공할지 결정이 필요합니다.
> → **권장: Writer Hub로 이동 (기존 4단계 위저드 재사용)**

> [!NOTE]
> **Q3: 관리자 UI(HubQisTab)와 고객 UI의 관계**
> 관리자 UI는 유지하면서 고객 UI를 별도로 만들 것인지, 아니면 하나로 통합하고 역할 기반으로 필터링할 것인지.
> → **권장: 별도 유지. 관리자는 클러스터링/배치/BSW동기화 등 운영 기능이 필요하고, 고객은 "추천 + 생산 + 성과" 뷰만 필요.**

---

## Verification Plan

### Phase 1 검증

1. **테넌트 스튜디오 접근**: `/tenant/[tenantId]/studio/foundation/qis` 페이지 로드 확인
2. **데이터 표시**: `question_clusters` 테이블에서 해당 테넌트의 질문이 QVS 순으로 정렬되어 표시
3. **티어 게이팅**: Basic 사용자는 3개만, Pro는 7개까지 표시 확인
4. **AI 초안 생성**: "AI 초안 생성" 클릭 → `generateAnswerDraftForQisAction` 호출 → 결과 표시
5. **반응형**: 모바일 레이아웃 정상 동작
