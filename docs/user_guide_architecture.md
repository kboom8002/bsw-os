# BSW-OS 시스템 아키텍처 가이드

> **Brand Semantic Website OS (BSW-OS) v1.0**  
> 최종 업데이트: 2026-05-23

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [4대 운영 기둥](#2-4대-운영-기둥-four-pillars)
3. [기술 스택](#3-기술-스택)
4. [디렉토리 구조](#4-디렉토리-구조)
5. [데이터 흐름 아키텍처](#5-데이터-흐름-아키텍처)
6. [멀티 테넌트 모델](#6-멀티-테넌트-모델)
7. [보안 아키텍처](#7-보안-아키텍처)
8. [AI 안전 모델](#8-ai-안전-모델)
9. [릴리즈 게이트 아키텍처](#9-릴리즈-게이트-아키텍처)
10. [추적성(Traceability) 모델](#10-추적성traceability-모델)
11. [배포 및 인프라](#11-배포-및-인프라)

---

## 1. 시스템 개요

### BSW-OS란 무엇인가?

**Brand Semantic Website OS (BSW-OS)**는 브랜드가 SEO/AEO/GEO에 최적화된 **의미론적 웹사이트(Semantic Website)**를 생성하고, **AI 검색 엔진에서의 브랜드 노출 성과를 측정·개선**하는 SaaS 플랫폼입니다.

### 핵심 가치 제안

```
기존 방식:  브랜드 → 웹사이트 → SEO 최적화 → 결과 관찰
BSW-OS:    브랜드 진실(Truth) → 질문/개념 체계 → 의미론적 웹사이트 → AI 응답 관측 → 보고서 → 패치 → 재검증
```

BSW-OS는 단순한 웹사이트 빌더가 아닙니다. **브랜드의 의미를 정의하고, 그 의미가 AI 검색 결과에 어떻게 반영되는지 과학적으로 측정하며, 개선 루프를 자동화**하는 엔드투엔드 시스템입니다.

### 주요 사용자

| 역할 | 설명 | 주 사용 모듈 |
|---|---|---|
| **Brand Strategist** | 브랜드 전략/진실 관리 | Brand Truth Studio |
| **Semantic Architect** | 질문/개념/온톨로지 설계 | Semantic Core Studio |
| **Content Editor** | 콘텐츠 편집 및 페이지 관리 | Object Factory, Website |
| **Evidence Reviewer** | 증거 검증 및 경계 규칙 관리 | Brand Truth Studio |
| **Persona/Vibe Designer** | 페르소나·분위기 설계 | Persona & Vibe Studio |
| **Observatory Analyst** | AI 응답 관측 및 메트릭 분석 | Observatory, Reports |
| **Agency Operator** | 대행사 수준 다중 워크스페이스 운영 | 전체 |
| **Executive Viewer** | 요약 대시보드 조회 | Reports, Demo Dashboard |

---

## 2. 4대 운영 기둥 (Four Pillars)

BSW-OS의 전체 시스템은 4개의 운영 기둥으로 구성됩니다:

### 🏛️ Pillar 1: Brand MeaningOps (의미 운영)

> "브랜드가 의미하고자 하는 바를 정의하고, 증명하며, AI가 재구성하는 방식을 관찰한다."

```
┌─────────────────────────────────────────────┐
│              Brand MeaningOps               │
├─────────────────────────────────────────────┤
│  Strategic Truth  (브랜드의 비전/핵심 기둥)  │
│       ↓                                     │
│  Operational Truth (입증 가능한 클레임)       │
│       ↓                                     │
│  Evidence Item (증거: 임상시험, 인증서 등)    │
│       ↓                                     │
│  Boundary Rule (YMYL 경계: 금지 표현, 고지)  │
│       ↓                                     │
│  Observed Truth (AI가 실제 재구성한 클레임)   │
│       ↓                                     │
│  Truth Delta (관찰-운영 간 차이 분석)         │
│       ↓                                     │
│  Truth Lock (L0~L4 게이트 평가)              │
└─────────────────────────────────────────────┘
```

**핵심 원칙:**
- Strategic/Operational/Observed Truth는 엄격히 분리됩니다.
- Observed Truth는 Operational Truth를 자동으로 덮어쓸 수 없습니다.
- Evidence와 Boundary는 일급 객체(first-class citizen)입니다.
- Truth Lock Gate (L0~L4)를 통과해야 다음 단계로 진행할 수 있습니다.

---

### 🏭 Pillar 2: Semantic Website Factory (의미론적 웹사이트 공장)

> "사실(Object)을 먼저 정의하고, 그 다음에 페이지(Page)를 생성한다."

```
┌─────────────────────────────────────────────────┐
│           Semantic Website Factory               │
├─────────────────────────────────────────────────┤
│  Question Signal (검색 신호 수집)                │
│       ↓                                          │
│  Question Capital (전략적 질문 자산)              │
│       ↓                                          │
│  Canonical Question (정규화된 질문)               │
│       ↓                                          │
│  QIS Scene (질문 의도 장면)                       │
│       ↓                                          │
│  TCO Concept (주제 개념 온톨로지)                 │
│       ↓                                          │
│  Representation Object (표현 객체)               │
│       ↓                                          │
│  Surface Contract (표면 계약)                     │
│       ↓                                          │
│  Semantic Page (의미론적 페이지)                  │
│       ↓                                          │
│  Schema JSON-LD + SEO/AEO/GEO Export             │
└─────────────────────────────────────────────────┘
```

**핵심 원칙:**
- **Object-first, Page-later** — 페이지는 객체로부터 파생됩니다.
- Surface Contract가 페이지보다 먼저 정의됩니다.
- Schema JSON-LD는 실제 보이는 콘텐츠와 일치해야 합니다.
- 고위험 장면(High-risk QIS)에는 Boundary Block이 적용됩니다.

---

### 🔭 Pillar 3: AI Answer Observatory (AI 응답 관측소)

> "AI 검색 엔진의 응답에서 브랜드가 어떻게 언급되는지 과학적으로 관측한다."

```
┌─────────────────────────────────────────────────┐
│             AI Answer Observatory                │
├─────────────────────────────────────────────────┤
│  Probe Panel (관측 질문 패널: 버전 관리)          │
│       ↓                                          │
│  Probe Question (개별 관측 질문)                  │
│       ↓                                          │
│  AI Observation Run (AI 관측 실행)                │
│       ↓                                          │
│  Probe Run (개별 질문 실행 + 원시 응답 저장)      │
│       ↓                                          │
│  Response Judgment (응답 판정: 후보 상태)         │
│       ↓                                          │
│  Metric Snapshot (메트릭 스냅샷)                  │
│       ↓                                          │
│  Domain Index (도메인 종합 지수)                  │
│       ↓                                          │
│  Benchmark Report + Methodology Disclosure       │
└─────────────────────────────────────────────────┘
```

**핵심 원칙:**
- 모든 메트릭은 **패널 기반 프록시 측정치**입니다 (실제 시장 점유율이 아님).
- 원시 응답(raw response)은 반드시 저장됩니다.
- 패널은 버전 관리되며, 잠긴 패널은 수정할 수 없습니다.
- 보고서에는 방법론 공개와 프록시 주의사항이 필수입니다.

---

### 🔧 Pillar 4: Fix-It OS (개선 운영 체계)

> "메트릭 약점에서 RCA, 패치, 재검증, 그리고 재사용 가능한 패턴까지."

```
┌─────────────────────────────────────────────────┐
│                  Fix-It OS                       │
├─────────────────────────────────────────────────┤
│  RCA Case (근본 원인 분석 케이스)                 │
│       ↓                                          │
│  Patch Ticket (패치 티켓: 가설 기반)              │
│       ↓                                          │
│  Patch Artifact Change (변경 사항 추적)           │
│       ↓                                          │
│  Retest Plan (재검증 계획)                       │
│       ↓                                          │
│  Retest Run (재검증 실행)                        │
│       ↓                                          │
│  Post-Patch Lift Snapshot (패치 후 성과 분석)     │
│       ↓                                          │
│  Factory Reuse Candidate (재사용 후보)            │
└─────────────────────────────────────────────────┘
```

**핵심 원칙:**
- 모든 패치는 **가설(hypothesis)**입니다.
- 패치 성공은 **재검증(retest) 없이 선언할 수 없습니다**.
- 가드레일 회귀(regression)가 감지되면 긍정적 리프트도 무효화됩니다.
- Factory 승격(promotion)은 게이트를 통과해야 합니다.

---

## 3. 기술 스택

| 계층 | 기술 | 역할 |
|---|---|---|
| **프레임워크** | Next.js 16.2.6 (App Router, Turbopack) | 서버 사이드 렌더링 + API |
| **언어** | TypeScript 5 (strict mode) | 타입 안전성 |
| **데이터베이스** | Supabase PostgreSQL | 데이터 영속화 |
| **인증/인가** | Supabase Auth + RLS | 멀티 테넌트 격리 |
| **유효성 검증** | Zod 4 | 런타임 스키마 검증 |
| **스타일링** | Tailwind CSS 4 | 반응형 UI |
| **UI 아이콘** | Lucide React | 벡터 아이콘 |
| **테스트** | Vitest 4.1.7 | 단위/통합 테스트 |
| **AI** | Mock Provider (확장 가능) | AI 응답 시뮬레이션 |

### 왜 이 스택인가?

```
Next.js App Router → 서버 액션으로 안전한 뮤테이션
Supabase RLS      → 데이터베이스 수준 테넌트 격리 (UI 숨김이 아닌 백엔드 보안)
Zod               → 런타임에서 모든 입력/출력의 형태 검증
Mock AI Provider   → API 키 없이 재현 가능한 관측 테스트
```

---

## 4. 디렉토리 구조

```
c:/Users/User/bsw/
│
├── app/                              # Next.js App Router
│   ├── actions/                      # 서버 액션 (모든 데이터 변경)
│   │   ├── truth.ts                  # 브랜드 진실 CRUD
│   │   ├── semantic.ts               # 시맨틱 코어 CRUD
│   │   ├── objects.ts                # 객체/표면/페이지 CRUD
│   │   ├── persona.ts                # 페르소나 & 바이브 CRUD
│   │   ├── observatory.ts            # 관측소 & 메트릭 CRUD
│   │   ├── reports.ts                # 보고서 발행 & 내보내기
│   │   ├── fixit.ts                  # Fix-It, RCA, 패치, 리테스트
│   │   └── release.ts                # 릴리즈 게이트 감사
│   │
│   └── [locale]/(workspace)/
│       └── [workspace_slug]/         # 동적 워크스페이스 라우트
│           ├── truth/                # Brand Truth Studio
│           ├── semantic-core/        # Semantic Core Studio
│           ├── objects/              # Objects Studio
│           ├── surfaces/             # Surface Contracts
│           ├── website/              # Semantic Website Hub
│           ├── persona/              # Persona Specs
│           ├── vibe/                 # Vibe OS Studio
│           ├── observatory/          # Observatory & Metrics
│           ├── reports/              # Benchmark Reports
│           ├── fixit/                # Fix-It Studio
│           ├── demo/                 # Domain Demo Flow
│           └── release/              # Release Gate Dashboard
│
├── db/
│   ├── migrations/                   # SQL 마이그레이션 (순서대로 적용)
│   │   ├── 0001_core.sql             # 코어 스키마 + RLS
│   │   ├── 0002_brand_truth.sql      # 브랜드 진실 테이블
│   │   ├── 0003_semantic_core.sql    # 시맨틱 코어 테이블
│   │   ├── 0004_representation_surface.sql  # 객체/표면/페이지
│   │   ├── 0005_persona_vibe.sql     # 페르소나 & 바이브
│   │   ├── 0006_observatory_metrics.sql  # 관측소 & 메트릭
│   │   ├── 0007_report_publisher_patch.sql  # 보고서 발행
│   │   └── 0008_fixit_factory.sql    # Fix-It & Factory
│   │
│   └── seed/                         # 데모 데이터 시더 (멱등)
│       ├── demo-core.ts              # 워크스페이스 & 도메인 뼈대
│       ├── demo-full.ts              # 마스터 오케스트레이터
│       ├── utils.ts                  # 공용 upsert 헬퍼
│       └── domains/
│           ├── k-beauty.ts           # K-뷰티(PureBarrier) 시드
│           ├── convenience-retail.ts # 편의점(Quick25) 시드
│           └── wedding.ts            # 웨딩(Lumiere Hall) 시드
│
├── lib/
│   ├── schema.ts                     # 74개 Zod 스키마 & TS 인터페이스
│   ├── logging.ts                    # 감사 뮤테이션 & 에러 로깅
│   ├── auth.ts                       # RBAC 권한 헬퍼
│   ├── supabase.ts                   # Supabase 클라이언트 팩토리
│   └── ai/                           # AI 에이전트 스캐폴드
│
├── tests/                            # 10개 테스트 파일, 68개 테스트
│
├── docs/                             # 문서화
│
└── handoff/                          # 원본 사양서
```

---

## 5. 데이터 흐름 아키텍처

### 전체 데이터 라이프사이클

```
사용자 브라우저
    ↓ (HTTP Request)
Next.js App Router
    ↓ (Server Component / API Route)
Server Action ("use server")
    ↓ (Zod 유효성 검증)
    ↓ (RBAC 권한 확인)
Supabase Client (auth.ts → supabase.ts)
    ↓ (RLS 정책 적용)
PostgreSQL Database
    ↓ (RLS → workspace_id 격리)
    ↓ (응답)
Server Action (결과 정리)
    ↓ (React Server Component 렌더링)
사용자 브라우저
```

### 서버 액션 패턴

모든 데이터 변경(mutation)은 Next.js **Server Action**을 통해 수행됩니다:

```typescript
// 예시: app/actions/truth.ts
"use server";

export async function createStrategicTruth(data: BrandStrategicTruth) {
  // 1. Zod 유효성 검증
  const validated = brandStrategicTruthSchema.parse(data);
  
  // 2. RBAC 권한 확인
  await requireRole('brand_strategist');
  
  // 3. Supabase RLS를 통한 DB 삽입
  const result = await supabase
    .from('brand_strategic_truths')
    .insert(validated);
  
  // 4. 감사 이벤트 기록
  await logAuditEvent('create', 'brand_strategic_truth', result.id);
  
  return result;
}
```

### AI 관측 데이터 흐름

```
                Probe Panel (v3, locked)
                    │
                    ├── Probe Question 1
                    ├── Probe Question 2
                    └── Probe Question N
                         │
                    AI Observation Run
                         │
                    ┌────┴────┐
                    │         │
              Probe Run 1  Probe Run 2  ...
              (raw response) (raw response)
                    │         │
              Judgment 1   Judgment 2   ...
              (candidate)  (candidate)
                    │
              Metric Snapshots
              ├── AAS: 0.35
              ├── OCR: 0.12
              ├── BSF: 0.78
              └── ...
                    │
              Domain Index Snapshot
              (weighted composite)
                    │
              Benchmark Report
              + Methodology Disclosure
              + Proxy Caveat
```

---

## 6. 멀티 테넌트 모델

### Workspace = 테넌트 경계

```
┌────────────────────────────────────────┐
│           Workspace A                   │
│  ┌─────────┐  ┌─────────┐             │
│  │Domain A1│  │Domain A2│  ...         │
│  │(K-Beauty)│  │(Wedding)│             │
│  └─────────┘  └─────────┘             │
│                                        │
│  Members:                              │
│  ├── user1 (owner)                     │
│  ├── user2 (brand_strategist)          │
│  └── user3 (observatory_analyst)       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│           Workspace B                   │
│  ┌──────────────┐                      │
│  │ Domain B1    │  ...                 │
│  │(Convenience) │                      │
│  └──────────────┘                      │
│                                        │
│  (완전히 격리됨 — 교차 접근 불가)        │
└────────────────────────────────────────┘
```

### 핵심 엔티티 계층

```
Workspace
  ├── Workspace Membership (역할 기반)
  ├── Domain
  │     ├── Domain Pack (도메인별 설정 번들)
  │     └── Brand Entity (브랜드)
  ├── Action Policy (RBAC 정책)
  └── Audit Event (감사 추적)
```

### 역할(Roles) 체계

| 역할 | 읽기 | 진실 수정 | 관측 | 보고서 발행 | 릴리즈 |
|---|:---:|:---:|:---:|:---:|:---:|
| `owner` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `brand_strategist` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `semantic_architect` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `content_editor` | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| `evidence_reviewer` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `persona_vibe_designer` | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| `observatory_analyst` | ✅ | ❌ | ✅ | ✅ | ❌ |
| `executive_viewer` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `agency_operator` | ✅ | ✅ | ✅ | ✅ | ✅ |

> ⚠️ 제한적 수정 — 해당 역할의 담당 영역만 수정 가능

---

## 7. 보안 아키텍처

### 3중 보안 계층

```
┌──────────────────────────────────────┐
│  Layer 1: Application (Next.js)      │
│  ├── Server Action ("use server")    │
│  ├── RBAC 권한 확인 (auth.ts)        │
│  └── Zod 유효성 검증 (schema.ts)     │
├──────────────────────────────────────┤
│  Layer 2: Database (Supabase RLS)    │
│  ├── 모든 테이블에 RLS 활성화        │
│  ├── workspace_id 기반 정책           │
│  └── 교차 워크스페이스 접근 차단      │
├──────────────────────────────────────┤
│  Layer 3: Infrastructure             │
│  ├── SUPABASE_SERVICE_ROLE_KEY       │
│  │   → 서버 전용 (클라이언트 노출 금지)│
│  ├── NEXT_PUBLIC_* → 안전한 공개 키만  │
│  └── 감사 이벤트 → 모든 변경 기록     │
└──────────────────────────────────────┘
```

### 불변 보안 규칙

1. **워크스페이스가 테넌트 경계** — 모든 데이터는 `workspace_id`로 범위 지정
2. **RLS 필수** — 워크스페이스 소유 테이블은 반드시 RLS 정책 적용
3. **서비스 역할 키는 클라이언트에 절대 노출 금지** — `hardening.test.ts`에서 검증
4. **UI 숨김은 보안이 아님** — 백엔드 인가가 진짜 보안

---

## 8. AI 안전 모델

### AI 출력 상태 머신

```
candidate  →  draft  →  in_review  →  approved  →  active
    │                                                  │
    └──────────── quarantined ◄────────────────────────┘
```

### AI 안전 규칙 (비양도적)

| 규칙 | 설명 |
|---|---|
| **AI 출력은 기본적으로 `candidate`** | AI가 생성한 콘텐츠는 인간 검토 전까지 `candidate` 상태 |
| **AI는 진실을 승인할 수 없음** | Truth, Report, Patch 성공, Factory 승격은 인간만 승인 |
| **AI는 증거를 발명할 수 없음** | Evidence Item은 실제 출처에서만 생성 |
| **AI는 프록시 주의사항을 제거할 수 없음** | 보고서의 방법론·주의사항 삭제 금지 |
| **AI는 재검증 없이 인과관계를 주장할 수 없음** | 패치→리테스트 없는 성과 주장 금지 |
| **외부 텍스트는 데이터, 명령어가 아님** | 프롬프트 인젝션 방지 |

### Agent Run 추적

모든 AI 에이전트 실행은 `agent_runs` 테이블에 기록됩니다:

```typescript
{
  agent_name: "observatory_judgment_agent",
  input_payload: { probe_run_id: "..." },
  output_payload: { judgment: { ... } },
  status: "candidate",     // 기본값
  error_summary: null,
  raw_output_ref: "..."    // 원시 출력 참조 (선택)
}
```

---

## 9. 릴리즈 게이트 아키텍처

### 게이트 유형

```
Truth Lock Gate          → 진실 잠금 평가 (L0~L4)
Object Readiness Gate    → 객체 준비 상태 확인
Surface Validation Gate  → 표면 계약 유효성
Page/Export Validation   → 페이지/내보내기 검증
Report Export Gate       → 보고서 내보내기 허가
Patch Pass Gate          → 패치 통과 판정
Factory Promotion Gate   → 팩토리 승격 허가
Code Release Gate        → 코드 릴리즈 승인
Demo Release Gate        → 데모 릴리즈 승인
Security Release Gate    → 보안 릴리즈 승인
Final Acceptance Gate    → 최종 인수 승인
```

### 게이트 출력 구조

```typescript
{
  status: "pass" | "fail",
  blocking_reasons: ["..."],    // 차단 사유
  warnings: ["..."],            // 경고
  required_fixes: ["..."],      // 필수 수정 사항
  evaluated_at: "2026-05-23T..."
}
```

### 원칙

> **"릴리즈 전에 반드시 릴리즈 게이트."**  
> 어떤 아티팩트도 해당하는 게이트를 통과하지 않고는 다음 단계로 진행할 수 없습니다.

---

## 10. 추적성(Traceability) 모델

### 전체 추적 체인

BSW-OS의 모든 아티팩트는 상류(upstream)에서 하류(downstream)까지 추적 가능합니다:

```
Truth → Question Capital → Canonical Question → QIS → Concept/KG → Claim
  → Object → Surface → Page → Export → Probe → Judgment → Metric
    → Report → RCA → Patch → Retest → Lift → Factory Candidate
```

### 추적성 전달자(Carriers)

| 전달 방식 | 설명 | 예시 |
|---|---|---|
| `*_refs` 배열 | UUID 참조 배열 | `qis_refs`, `claim_refs`, `evidence_refs` |
| JSONB `source_artifacts` | 구조화된 출처 메타데이터 | `{ "source_type": "probe_run", "id": "..." }` |
| `source_*_ids` | 직접 참조 | `source_observation_run_ids` |
| `audit_events` | 감사 이벤트 로그 | 모든 변경에 대한 누가/언제/무엇 |
| `agent_runs` | AI 에이전트 실행 로그 | AI가 생성한 콘텐츠의 출처 |
| `release_gate_results` | 게이트 평가 기록 | 통과/실패 이력 |

### 원칙

> **"발행, 메트릭, 보고서, 또는 패치 성공에 영향을 미치는 하류 아티팩트는 추적 불가능해서는 안 된다."**

---

## 11. 배포 및 인프라

### 로컬 개발 환경

```bash
# 필수 소프트웨어
- Node.js 20+
- npm 10+
- Supabase 프로젝트 (로컬 또는 클라우드)

# 설치 및 실행
cd c:/Users/User/bsw
npm install
npm run dev

# 접속
http://localhost:3000
```

### 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key         # 공개 가능
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # 서버 전용 (절대 공개 금지)
```

### 마이그레이션 적용 순서

```
0001_core.sql                    → 코어 스키마, RLS, 워크스페이스
0002_brand_truth.sql             → 브랜드 진실 모듈
0003_semantic_core.sql           → 시맨틱 코어 모듈
0004_representation_surface.sql  → 객체/표면/페이지 모듈
0005_persona_vibe.sql            → 페르소나 & 바이브 모듈
0006_observatory_metrics.sql     → 관측소 & 메트릭 모듈
0007_report_publisher_patch.sql  → 보고서 발행 모듈
0008_fixit_factory.sql           → Fix-It & Factory 모듈
```

> ⚠️ 반드시 순서대로 적용해야 합니다. 외래 키 의존성이 있습니다.

### 테스트 실행

```bash
# 전체 68개 테스트 실행
npm test

# 특정 모듈 테스트
npx vitest run tests/truth.test.ts
npx vitest run tests/observatory.test.ts
npx vitest run tests/hardening.test.ts
```

---

> **다음 문서:** 주요 개념과 용어 정의 → [`user_guide_concepts.md`](./user_guide_concepts.md)
