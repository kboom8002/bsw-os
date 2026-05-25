# BSW-OS 기능별 활용법 가이드

> **Brand Semantic Website OS (BSW-OS) v1.0**  
> 최종 업데이트: 2026-05-23

---

## 목차

1. [시작하기 — 초기 설정](#1-시작하기--초기-설정)
2. [워크스페이스 & 도메인 관리](#2-워크스페이스--도메인-관리)
3. [Brand Truth Studio 활용법](#3-brand-truth-studio-활용법)
4. [Semantic Core Studio 활용법](#4-semantic-core-studio-활용법)
5. [Object Factory & Website 활용법](#5-object-factory--website-활용법)
6. [Persona & Vibe Studio 활용법](#6-persona--vibe-studio-활용법)
7. [AI Observatory 활용법](#7-ai-observatory-활용법)
8. [Report Publisher 활용법](#8-report-publisher-활용법)
9. [Fix-It Studio 활용법](#9-fix-it-studio-활용법)
10. [Demo Dashboard 활용법](#10-demo-dashboard-활용법)
11. [전체 워크플로우 — 처음부터 끝까지](#11-전체-워크플로우--처음부터-끝까지)
12. [FAQ & 문제 해결](#12-faq--문제-해결)

---

## 1. 시작하기 — 초기 설정

### 1.1 필수 소프트웨어 설치

| 소프트웨어 | 버전 | 설치 확인 |
|---|---|---|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Supabase CLI | 최신 | `supabase --version` (선택) |

### 1.2 프로젝트 설치

```bash
# 1. 프로젝트 폴더로 이동
cd c:/Users/User/bsw

# 2. 의존성 설치
npm install
```

### 1.3 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```env
# Supabase 연결 정보
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ **보안 주의:** `SUPABASE_SERVICE_ROLE_KEY`는 절대로 클라이언트 코드에 노출되면 안 됩니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

### 1.4 데이터베이스 마이그레이션

마이그레이션을 **순서대로** 적용합니다:

```bash
# Supabase CLI 사용 시:
supabase db push

# 또는 SQL 에디터에서 수동 적용:
# 0001 → 0002 → 0003 → ... → 0008 순서
```

### 1.5 개발 서버 시작

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속합니다.

---

## 2. 워크스페이스 & 도메인 관리

### 2.1 워크스페이스 생성

워크스페이스는 BSW-OS의 **최상위 조직 단위**입니다. 하나의 브랜드 팀이나 에이전시 계정이 하나의 워크스페이스를 사용합니다.

```
워크스페이스 예시:
┌──────────────────────────────┐
│  "PureBarrier Brand Lab"     │
│  slug: purebarrier-lab       │
│                              │
│  멤버:                       │
│  ├── 김전략 (owner)          │
│  ├── 이설계 (semantic_arch)  │
│  └── 박분석 (observatory)    │
│                              │
│  도메인:                     │
│  ├── K-Beauty                │
│  └── Wedding                 │
└──────────────────────────────┘
```

### 2.2 도메인 생성

도메인은 워크스페이스 내의 **사업 영역**입니다.

**예시 도메인 구성:**

| 도메인 | slug | 설명 |
|---|---|---|
| K-Beauty | `k-beauty` | 스킨케어 브랜드 관리 |
| Convenience Retail | `convenience-retail` | 편의점 프랜차이즈 |
| Wedding | `wedding` | 웨딩 서비스 |

### 2.3 팀원 역할 배정

각 팀원에게 적절한 역할을 배정합니다:

| 시나리오 | 권장 역할 |
|---|---|
| 브랜드 전략 담당자 | `brand_strategist` |
| 시맨틱 설계/개발자 | `semantic_architect` |
| 콘텐츠 작가 | `content_editor` |
| 증거 검증 담당자 | `evidence_reviewer` |
| AI 성과 분석가 | `observatory_analyst` |
| 경영진 (조회만) | `executive_viewer` |
| 에이전시 총괄 | `agency_operator` |

---

## 3. Brand Truth Studio 활용법

### 3.1 접속 경로

```
http://localhost:3000/{workspace_slug}/truth
```

### 3.2 Step 1: Strategic Truth 정의

**무엇을 하는가?** 브랜드의 핵심 비전과 전략적 선언을 정의합니다.

**방법:**
1. Truth Studio에 접속합니다
2. "Strategic Truth 추가" 클릭
3. 핵심 선언(statement) 입력:

```
예시: "PureBarrier는 피부과학에 기반한 민감성 피부 전문 스킨케어 브랜드입니다."
```

4. 비전 입력 (선택):
```
예시: "모든 피부 타입의 사람들이 자신감을 가질 수 있도록"
```

5. 핵심 기둥(Core Pillars) 설정:
```
- 피부과학 근거
- 순수 성분
- 임상 검증
- 민감성 피부 전문성
```

### 3.3 Step 2: Operational Truth 등록

**무엇을 하는가?** 입증 가능한 개별 클레임(주장)을 등록합니다.

**방법:**
1. "Operational Truth 추가" 클릭
2. 구체적인 클레임 입력:

```
예시: "레티놀 0.05% 함유 크림이 4주 임상시험에서 피부 수분량 23% 향상"
```

3. 위험 수준 설정:
   - `low` — 일반적 정보
   - `medium` — 경쟁 비교 포함
   - `high` — YMYL (건강/금융) 관련
   - `critical` — 법적 리스크 존재

4. 검토 상태를 `in_review`로 설정 후 검증 진행

### 3.4 Step 3: Evidence 연결

**무엇을 하는가?** Operational Truth에 증거를 연결합니다.

**증거 유형:**

| 유형 | 설명 | 예시 |
|---|---|---|
| `clinical_trial` | 임상시험 결과 | "Global Derm 2024 Phase 3 결과" |
| `lab_report` | 실험실 보고서 | "SGS 성분 분석 보고서" |
| `certificate` | 인증서 | "KFDA 기능성 화장품 인증" |
| `manual_verify` | 수동 검증 | "내부 QA 팀 검증 완료" |

### 3.5 Step 4: Boundary Rule 설정

**무엇을 하는가?** 콘텐츠에서 사용해서는 안 되는 표현과 반드시 포함해야 하는 고지사항을 정의합니다.

**YMYL 경계 규칙 예시:**

| 설정 | 값 |
|---|---|
| 규칙 이름 | YMYL 스킨케어 경계 |
| 금지 표현 | "치료", "완치", "의학적 효과 보장", "기적" |
| 필수 고지 | "개인차가 있을 수 있습니다", "피부과 전문의 상담 권장" |
| 위험 수준 | `critical` |

### 3.6 Step 5: Observed Truth 모니터링

**무엇을 하는가?** AI가 실제로 재구성한 브랜드 관련 클레임을 기록하고, Operational Truth와의 차이(Delta)를 분석합니다.

```
Operational Truth:  "레티놀 0.05% 크림이 수분량 23% 향상"
Observed Truth:     "PureBarrier의 레티놀 크림이 피부 수분을 개선한다"
Delta:              구체적 수치(23%)와 농도(0.05%)가 누락됨
```

### 3.7 Step 6: Truth Lock 평가

모든 진실이 정리되면 **Truth Lock Gate**를 실행합니다:

```
L0 → L1 → L2 → L3 → L4 (최종 잠금)
```

L4에 도달하면 해당 진실 세트는 잠기며, 수정 시 새 버전이 필요합니다.

---

## 4. Semantic Core Studio 활용법

### 4.1 접속 경로

```
http://localhost:3000/{workspace_slug}/semantic-core
```

### 4.2 Step 1: Question Signal 수집

**무엇을 하는가?** 검색 엔진에서 관련 검색 질문들을 수집합니다.

```
수집된 질문 신호 예시:
├── "민감성 피부 레티놀 추천" (volume: 5400, intent: commercial)
├── "레티놀 사용법 순서" (volume: 3200, intent: informational)
├── "레티놀 부작용" (volume: 2800, intent: informational)
└── "레티놀 농도 차이" (volume: 1500, intent: informational)
```

각 신호의 상태를 관리합니다:
- `mined` → 수집됨
- `promoted` → 전략적 질문 자산으로 승격
- `ignored` → 무관하여 제외

### 4.3 Step 2: Question Capital 구축

**무엇을 하는가?** 전략적 가치가 높은 질문들을 클러스터링합니다.

```
Question Capital Tree:
├── [가중치 90] 민감성 피부 레티놀
│   ├── [가중치 85] 레티놀 루틴
│   └── [가중치 75] 레티놀 부작용 관리
└── [가중치 70] 스킨케어 성분 비교
    └── [가중치 65] 레티놀 vs 나이아신아마이드
```

### 4.4 Step 3: Canonical Question 생성

**무엇을 하는가?** 동일 의도의 질문들을 하나의 정규(Canonical) 질문으로 통합합니다.

```
여러 검색 쿼리:
- "민감성 피부 레티놀 어떻게 써요?"
- "레티놀 민감한 피부 사용 방법"
- "민감성 피부에 좋은 레티놀 사용법"

→ Canonical Question:
  "민감성 피부에 좋은 레티놀 사용법"
  slug: sensitive-skin-retinol-usage
  signature: a1b2c3d4...
```

### 4.5 Step 4: QIS Scene 설계

**무엇을 하는가?** Canonical Question에서 파생된 구체적인 검색 장면을 설계합니다.

```json
{
  "scene_name": "레티놀 루틴 추천 장면",
  "query_template": "민감성 피부 레티놀 루틴 추천해줘",
  "intent_model": "informational_routine",
  "scenario_context": "사용자가 민감성 피부에 적합한 레티놀 사용 순서와 제품 조합을 찾는 상황. PureBarrier 브랜드가 권위 있는 답변을 제공할 수 있어야 함.",
  "risk_level": "high"
}
```

### 4.6 Step 5: TCO Concept 정의

**무엇을 하는가?** 단순 태그가 아닌, 정의와 관계를 가진 의미론적 개념을 정의합니다.

```
개념 예시:
├── "레티놀 농도 가이드라인"
│   definition: "피부 타입별 레티놀 적정 농도 범위와 사용 빈도 지침"
│   is_strategic: true
│
├── "민감성 피부 배리어"
│   definition: "피부 장벽(barrier) 기능이 저하된 피부 유형의 특성"
│   is_strategic: true
│
└── "나이트 루틴 프로토콜"
    definition: "야간 스킨케어 루틴의 적용 순서와 대기 시간 가이드"
    is_strategic: false
```

### 4.7 Step 6: Claim Lineage 구축

최종적으로, 진실 → 클레임 → 증거 → 경계 규칙 간의 **추적 가능한 계보(lineage)**를 구축합니다.

```
Operational Truth: "레티놀 0.05% 크림 수분량 23% 향상"
    ↓
Claim Node: "PureBarrier 레티놀 크림의 수분 향상 효과"
    ↓
Evidence: "Global Derm 2024 임상시험 결과"
    ↓
Boundary: "YMYL 스킨케어 경계"
    ↓
is_publishable: true ✅
```

---

## 5. Object Factory & Website 활용법

### 5.1 접속 경로

```
Objects:   http://localhost:3000/{workspace_slug}/objects
Surfaces:  http://localhost:3000/{workspace_slug}/surfaces
Website:   http://localhost:3000/{workspace_slug}/website
```

### 5.2 Step 1: Representation Object 생성

**무엇을 하는가?** 페이지의 원자적 사실 단위를 정의합니다.

> 📌 **핵심 원칙: Object-first, Page-later**  
> 먼저 사실을 정의하고, 그 다음에 페이지를 조립합니다.

```
Object: "PureBarrier 레티놀 루틴"
├── object_type: "ingredient"
├── qis_refs: [레티놀 루틴 추천 장면]
├── claim_refs: [수분량 23% 향상 클레임]
├── evidence_refs: [Global Derm 임상시험]
├── boundary_refs: [YMYL 스킨케어 경계]
└── readiness_status: "ready" ✅
```

**준비 상태 흐름:**
```
draft → (안전 검사) → ready     ← 성공
                    → failed_safety  ← 안전 검사 실패
```

### 5.3 Step 2: Surface Contract 정의

**무엇을 하는가?** 페이지가 **어떤 객체를 포함해야 하고, 어떤 블록이 필수인지** 계약합니다.

```
Surface Contract: "레티놀 루틴 가이드 계약"
├── allowed_objects: [PureBarrier 레티놀 루틴 Object]
├── qis_refs: [레티놀 루틴 추천 장면]
├── required_blocks:
│   ├── "clinical_facts"      ← 임상 사실 블록 필수
│   ├── "safety_notice"       ← 안전 고지 블록 필수
│   └── "ingredient_details"  ← 성분 상세 블록 필수
└── is_valid: true ✅
```

### 5.4 Step 3: Semantic Page 생성

**무엇을 하는가?** Surface Contract에 기반하여 실제 웹 페이지를 조립합니다.

```
Semantic Page: "민감성 피부를 위한 레티놀 루틴 가이드"
├── surface_contract: [레티놀 루틴 가이드 계약]
├── visible_content: (사용자에게 보이는 전체 콘텐츠)
├── source_content: (원본/출처 콘텐츠)
├── object_refs: [PureBarrier 레티놀 루틴]
├── qis_refs: [레티놀 루틴 추천 장면]
└── claim_refs: [수분량 23% 향상]
```

### 5.5 Step 4: Schema JSON-LD 매핑

**무엇을 하는가?** 페이지에 구조화 데이터(JSON-LD)를 매핑합니다.

```json
{
  "schema_type": "Product",
  "jsonld_mapping": {
    "@type": "Product",
    "name": "PureBarrier Retinol Cream",
    "description": "민감성 피부를 위한 레티놀 0.05% 수분 크림",
    "brand": {
      "@type": "Brand",
      "name": "PureBarrier"
    }
  },
  "is_valid": true
}
```

### 5.6 Step 5: SEO/AEO/GEO Export

최종적으로 페이지를 SEO/AEO/GEO 형식으로 내보냅니다. 모든 내보내기에는 `traceability_carrier`가 포함됩니다.

---

## 6. Persona & Vibe Studio 활용법

### 6.1 접속 경로

```
Persona:  http://localhost:3000/{workspace_slug}/persona
Vibe:     http://localhost:3000/{workspace_slug}/vibe
```

### 6.2 Step 1: PersonaSpec 정의

**무엇을 하는가?** 브랜드가 "응답자로서 누구인지" 정의합니다.

```
PersonaSpec: "피부과학 어드바이저"
├── governance_layer:
│   ├── tone: "전문적이면서 따뜻함"
│   └── citation_required: true
├── authority_scope: ["민감성 피부", "레티놀", "스킨케어 루틴"]
├── legal_guardrails: ["의학적 진단 불가", "처방 권고 불가"]
├── allowed_modes: ["standard", "advisory", "crisis"]
├── current_mode: "standard"
└── prompt_text: "당신은 PureBarrier의 피부과학 어드바이저입니다..."
```

**모드 전환 시나리오:**

| 상황 | 모드 | 효과 |
|---|---|---|
| 일반 문의 | `standard` | 정상적인 톤과 CTA |
| 피부 부작용 문의 | `advisory` | 보수적 톤, 전문가 상담 권유 |
| 리콜/안전 이슈 | `crisis` | 공격적 CTA 억제, 공식 안내만 |

### 6.3 Step 2: VibeSpec 정의

**무엇을 하는가?** 콘텐츠의 경험적 벡터를 정의합니다.

```
VibeSpec: "신뢰 우선 임상"
├── target_vector:
│   ├── clinical: 50   ← 임상/과학적 느낌
│   ├── warm: 30       ← 따뜻함/친근함
│   └── luxury: 20     ← 프리미엄/고급감
│
└── anti_vibe_keywords: ["마법", "기적", "즉시", "100%", "완벽한"]
```

### 6.4 Step 3: Vibe Rating 실행

**무엇을 하는가?** 페이지/섹션의 실제 바이브를 측정합니다.

> ⚠️ **필수 조건:** 증거(Evidence Item) 없이는 바이브 점수를 매길 수 없습니다.

```
Vibe Rating:
├── target: "민감성 피부 레티놀 루틴 가이드" 페이지
├── rating_scores:
│   ├── clinical: 45   (목표: 50 → 차이: -5)
│   ├── warm: 35       (목표: 30 → 차이: +5)
│   └── luxury: 20     (목표: 20 → 차이: 0)
└── evidence_item: "내부 UX 리서치 2024Q2 보고서" ✅
```

### 6.5 Step 4: Vibe Alignment 분석

VPA(Vibe-Page Alignment)와 VCS(Vibe Consistency Score)를 확인합니다.

### 6.6 Dark Pattern Rule 설정

콘텐츠에서 다크 패턴 표현을 차단합니다:

```
Dark Pattern Rule: "긴급 구매 유도 차단"
├── forbidden_triggers: ["지금 아니면 없어요", "마지막 기회", "한정 수량"]
└── is_active: true
```

---

## 7. AI Observatory 활용법

### 7.1 접속 경로

```
http://localhost:3000/{workspace_slug}/observatory
```

### 7.2 Step 1: Probe Panel 생성

**무엇을 하는가?** AI에게 물어볼 질문들의 세트를 정의합니다.

```
Probe Panel: "K-Beauty ARS Panel v1"
├── version: 1
├── is_locked: false  ← 편집 가능
│
├── Probe Question 1:
│   ├── "민감성 피부에 좋은 레티놀 크림 추천해줘"
│   ├── intent: "commercial"
│   └── target_keyword: "민감성 피부 레티놀"
│
├── Probe Question 2:
│   ├── "레티놀 스킨케어 루틴 순서가 어떻게 돼?"
│   ├── intent: "informational"
│   └── target_keyword: "레티놀 루틴"
│
└── Probe Question 3:
    ├── "레티놀 부작용 없는 스킨케어 브랜드"
    ├── intent: "commercial"
    └── target_keyword: "레티놀 부작용"
```

### 7.3 Step 2: Panel 잠금(Lock)

패널이 완성되면 **잠금**하여 관측의 일관성을 보장합니다.

```
Panel v1 → is_locked: true → 더 이상 수정 불가
수정이 필요하면 → Panel v2 생성 (새 버전)
```

> 📌 **왜 잠금하는가?** 같은 질문 세트로 반복 관측해야 시간에 따른 추이를 비교할 수 있습니다.

### 7.4 Step 3: AI Observation Run 실행

**무엇을 하는가?** 잠긴 패널의 모든 질문을 AI 엔진에 보내고 응답을 수집합니다.

```
AI Observation Run: "2026-Q2 K-Beauty Run #1"
├── probe_panel: "K-Beauty ARS Panel v1" (locked)
├── engine: "mock_provider" (또는 "google_sge", "perplexity")
│
├── Probe Run 1:
│   ├── question: "민감성 피부에 좋은 레티놀 크림 추천해줘"
│   ├── raw_response: "민감성 피부에는 저농도 레티놀이 좋습니다. PureBarrier의..."
│   └── metadata: { model: "mock_v1", timestamp: "..." }
│
├── Probe Run 2: ...
└── Probe Run 3: ...
```

> ⚠️ **원시 응답은 반드시 저장됩니다.** 나중에 판정(Judgment)을 검토하거나 재평가할 때 원본이 필요합니다.

### 7.5 Step 4: Response Judgment (응답 판정)

**무엇을 하는가?** 각 Probe Run의 응답을 분석하여 판정합니다.

```
Response Judgment for Probe Run 1:
├── is_citation_found: true           ← PureBarrier가 인용되었는가?
├── brand_semantic_fidelity: 0.78     ← 의미가 정확히 전달되었는가?
├── question_territory_covered: true  ← 질문 영역이 커버되었는가?
├── geo_concept_transferred: true     ← GEO 개념이 전이되었는가?
└── review_status: "candidate"        ← AI 판정은 기본 후보 상태
```

> 📌 AI가 자동으로 판정을 생성하더라도, **review_status는 `candidate`**입니다. 인간 검토자가 `approved`로 전환해야 합니다.

### 7.6 Step 5: Metric Snapshot 확인

판정 결과를 종합하여 메트릭 스냅샷이 생성됩니다:

```
Metric Snapshots for Run "2026-Q2 #1":
├── AAS (AI Answer Share): 0.35
├── OCR (Official Citation Rate): 0.12
├── BSF (Brand Semantic Fidelity): 0.78
├── QTC (Question Territory Coverage): 0.67
├── GCTR (GEO Concept Transfer Rate): 0.45
└── ARS (AEO Readiness Score): 0.47
```

### 7.7 메트릭 해석 가이드

| 메트릭 | 좋은 수준 | 주의 수준 | 위험 수준 | 해석 |
|---|---|---|---|---|
| **AAS** | > 0.5 | 0.3-0.5 | < 0.3 | AI 응답에서 브랜드 언급 빈도 |
| **OCR** | > 0.3 | 0.1-0.3 | < 0.1 | 공식 출처 인용 빈도 |
| **BSF** | > 0.7 | 0.5-0.7 | < 0.5 | 브랜드 의미 전달 정확도 |
| **QTC** | > 0.6 | 0.4-0.6 | < 0.4 | 전략적 질문 영역 커버율 |
| **ARS** | > 0.5 | 0.3-0.5 | < 0.3 | AEO 준비 종합 점수 |

> ⚠️ 이 수준은 **참고 기준**이며, 도메인과 패널에 따라 달라질 수 있습니다.

---

## 8. Report Publisher 활용법

### 8.1 접속 경로

```
http://localhost:3000/{workspace_slug}/reports
```

### 8.2 Step 1: Benchmark Report 생성

```
Benchmark Report: "2026 Q2 K-Beauty AI Visibility Report"
├── panel_version: 1
├── scores: { AAS: 0.35, OCR: 0.12, BSF: 0.78, ... }
└── methodology_disclosure: [연결됨] ✅
```

### 8.3 Step 2: Report Section 작성

| 섹션 | 내용 |
|---|---|
| `executive_summary` | 경영진을 위한 핵심 결과 요약 |
| `metrics_analysis` | 각 메트릭의 상세 분석 |
| `competitive_landscape` | 경쟁 브랜드 관측 비교 (주의: 프록시 표현 사용) |
| `methodology_appendix` | 방법론 상세 및 프록시 주의사항 |

### 8.4 Step 3: Methodology Disclosure 작성

**필수 구성 요소:**

```
Methodology Disclosure:
├── 사용된 프로브 패널: K-Beauty ARS Panel v1
├── 질문 수: 15개
├── 반복 횟수: 3회
├── AI 엔진: mock_provider
├── 관측 기간: 2026-04-01 ~ 2026-06-30
│
└── Proxy Caveat:
    "본 보고서의 메트릭은 특정 프로브 패널과 방법론 하에서의
     패널 기반 프록시 측정치이며, 실제 AI 시장 점유율이나
     소비자 선호도를 나타내지 않습니다."
```

### 8.5 Step 4: Unsafe Wording Scan

보고서 내보내기 전, 안전하지 않은 표현이 자동으로 검사됩니다:

```
✅ 통과: "관측된 답변 점유율 기준으로..."
✅ 통과: "이 프로브 패널 내에서 측정된 결과는..."

❌ 차단: "실제 시장 점유율이 35%입니다" → 수정 필요
❌ 차단: "AI가 PureBarrier를 선호합니다" → 수정 필요
❌ 차단: "보장된 AI 가시성" → 수정 필요
❌ 차단: "확정적 순위" → 수정 필요
```

### 8.6 Step 5: Export (내보내기)

**내보내기 게이트 체크리스트:**

```
□ Methodology Disclosure 첨부?            → ✅
□ Proxy Caveat 포함?                       → ✅
□ Unsafe Wording 검사 통과?                → ✅
□ 실제 브랜드 순위 포함 시 리뷰 완료?      → ✅
□ AI 초안이 candidate 상태로 유지?         → ✅

→ 모두 통과 시에만 markdown/html 내보내기 허용
```

---

## 9. Fix-It Studio 활용법

### 9.1 접속 경로

```
http://localhost:3000/{workspace_slug}/fixit
```

### 9.2 전체 Fix-It 루프

```
    메트릭 약점 발견
         │
    ┌────▼────┐
    │ RCA Case │ ← 원인 가설 수립
    └────┬────┘
         │
    ┌────▼────────┐
    │ Patch Ticket │ ← 패치 가설 수립
    └────┬────────┘
         │
    ┌────▼──────────────┐
    │ Artifact Changes   │ ← 실제 변경 사항
    └────┬──────────────┘
         │
    ┌────▼───────────┐
    │ Retest Plan     │ ← 재검증 계획
    └────┬───────────┘
         │
    ┌────▼───────────┐
    │ Retest Run      │ ← 재검증 실행
    └────┬───────────┘
         │
    ┌────▼──────────────────┐
    │ Post-Patch Lift       │ ← 성과 분석
    │ ├── 리프트 계산        │
    │ └── 가드레일 회귀 확인 │
    └────┬──────────────────┘
         │
    ┌────▼─────────────────┐
    │ Factory Reuse?        │ ← 재사용 후보 여부
    │ ├── promoted (승격)   │
    │ └── rejected (기각)   │
    └──────────────────────┘
```

### 9.3 Step 1: RCA Case 생성

**시나리오:** ARS가 0.23으로 낮음

```
RCA Case:
├── metric_name: "ARS"
├── metric_value: 0.23
├── cause_hypothesis: "PureBarrier 레티놀 루틴 페이지의 JSON-LD 
│   스키마에 dosage 정보가 누락되어 AI가 복용량을 정확히 
│   인용하지 못하고 있음. 또한 FAQ 구조가 없어 AI가 질문-답변 
│   형식으로 콘텐츠를 추출하기 어려움."
└── status: "candidate"
```

### 9.4 Step 2: Patch Ticket 생성

```
Patch Ticket:
├── rca_case: [위의 RCA]
├── patch_name: "레티놀 루틴 페이지 스키마 보강"
├── patch_hypothesis: "JSON-LD에 dosage, applicationCategory, 
│   recipeInstructions를 추가하고, FAQ 섹션을 Schema.org 
│   FAQPage 구조로 마크업하면 AI의 콘텐츠 추출 정확도가 
│   향상되어 ARS 0.35 이상으로 개선될 것이다."
└── status: "approved" ← 인간이 가설을 승인
```

### 9.5 Step 3: Artifact Changes 기록

```
Patch Artifact Change:
├── target: "레티놀 루틴 가이드 페이지"
├── original: { schema_type: "Product", ... }
├── modified: { schema_type: "Product", 
│              additionalType: "FAQPage",
│              dosage: "0.05%", ... }
└── status: "applied"
```

### 9.6 Step 4: Retest Plan & Run

```
Retest Plan:
├── patch_ticket: [레티놀 스키마 보강]
├── probe_panel: "K-Beauty ARS Panel v1" (같은 패널!)
├── baseline_run: "2026-Q2 Run #1" (패치 전 관측)
└── description: "동일 패널로 패치 효과 재검증"

Retest Run:
├── status: "completed"
├── retest_scores: { ARS: 0.41, OCR: 0.18, BSF: 0.82 }
└── retest_verdict: "pass" ✅
```

### 9.7 Step 5: Post-Patch Lift 분석

```
Post-Patch Lift:
├── baseline: { ARS: 0.23, OCR: 0.12, BSF: 0.78 }
├── retest:   { ARS: 0.41, OCR: 0.18, BSF: 0.82 }
├── lift:     { ARS: +0.18, OCR: +0.06, BSF: +0.04 }
│
├── is_guardrail_regressed: false ✅
│   (어떤 메트릭도 하락하지 않음)
│
└── final_verdict: "pass" ✅
```

> ⚠️ **가드레일 회귀 시나리오:** 만약 BSF가 0.78 → 0.65로 하락했다면, ARS가 올랐더라도 `is_guardrail_regressed: true`가 되며 `final_verdict: "fail"`이 됩니다.

### 9.8 Step 6: Factory Reuse 판정

성공한 패치 패턴을 다른 도메인에서도 재사용할 수 있습니다:

```
Factory Reuse Candidate:
├── candidate_name: "FAQ 스키마 마크업 패턴"
├── artifact_type: "schema_mapping_pattern"
├── artifact_payload: { template: "FAQPage", ... }
└── status: "promoted" ← 팩토리에 승격됨!
```

---

## 10. Demo Dashboard 활용법

### 10.1 접속 경로

```
http://localhost:3000/demo-brand-semantic-lab/demo
```

### 10.2 3개 데모 도메인

| 도메인 | URL | 브랜드 | 핵심 특성 |
|---|---|---|---|
| **K-Beauty** | `.../demo/k-beauty` | PureBarrier | YMYL, 증거, 경계, 루틴 |
| **Convenience** | `.../demo/convenience-retail` | Quick25 | 로컬 액션, 메뉴, 프로모션 |
| **Wedding** | `.../demo/wedding` | Lumiere Hall | 벤더 비교, 계약, 바이브 |

### 10.3 K-Beauty Demo (PureBarrier)

전체 트레이스 루프를 체험할 수 있습니다:

```
1. Brand Truth → "임상 검증된 민감성 피부 케어"
2. Semantic Core → "민감성 피부 레티놀 사용법" CQ
3. Objects → PureBarrier 레티놀 루틴 Object
4. Persona → 피부과학 어드바이저
5. Observatory → 잠긴 패널 + 모의 관측
6. Report → 방법론 + 프록시 주의사항 포함
7. Fix-It → 낮은 ARS → RCA → 패치 → 리프트
```

### 10.4 데모 시드 실행

```bash
# 테스트 러너를 통한 시드 검증
npx vitest run tests/demo.test.ts

# 또는 대시보드에서 "Launch Full Demo Seed" 클릭
```

### 10.5 데모 초기화

```sql
-- Supabase SQL 에디터에서:
DELETE FROM workspaces WHERE slug = 'demo-brand-semantic-lab';
-- 캐스케이드 삭제로 관련 데이터 자동 정리
```

---

## 11. 전체 워크플로우 — 처음부터 끝까지

### 11.1 단계별 체크리스트

```
Phase 1: 의미 정의 (Brand MeaningOps)
□ 1.1  워크스페이스 생성
□ 1.2  도메인 생성 및 브랜드 등록
□ 1.3  Strategic Truth 정의
□ 1.4  Operational Truth 등록 (클레임)
□ 1.5  Evidence 연결 (증거)
□ 1.6  Boundary Rule 설정 (경계 규칙)
□ 1.7  Truth Lock 평가 (L0 → L4)

Phase 2: 질문/개념 체계 (Semantic Core)
□ 2.1  Question Signal 수집
□ 2.2  Question Capital 구축
□ 2.3  Canonical Question 생성
□ 2.4  QIS Scene 설계
□ 2.5  TCO Concept 정의
□ 2.6  Claim Lineage 구축

Phase 3: 시맨틱 웹사이트 (Website Factory)
□ 3.1  Representation Object 생성
□ 3.2  Surface Contract 정의
□ 3.3  Semantic Page 생성
□ 3.4  Schema JSON-LD 매핑
□ 3.5  SEO/AEO/GEO Export

Phase 4: 페르소나 & 바이브 (Persona & Vibe)
□ 4.1  PersonaSpec 정의
□ 4.2  Persona 도메인 할당
□ 4.3  VibeSpec 정의
□ 4.4  Vibe Rating 실행
□ 4.5  Dark Pattern Rule 설정

Phase 5: AI 관측 (Observatory)
□ 5.1  Probe Panel 생성
□ 5.2  Probe Question 추가
□ 5.3  Panel 잠금 (Lock)
□ 5.4  AI Observation Run 실행
□ 5.5  Response Judgment 검토
□ 5.6  Metric Snapshot 확인

Phase 6: 보고서 발행 (Report Publisher)
□ 6.1  Benchmark Report 생성
□ 6.2  Report Section 작성
□ 6.3  Methodology Disclosure 작성
□ 6.4  Unsafe Wording Scan 실행
□ 6.5  Report Export (내보내기)

Phase 7: 개선 루프 (Fix-It OS)
□ 7.1  RCA Case 생성 (원인 분석)
□ 7.2  Patch Ticket 생성 (패치 가설)
□ 7.3  Artifact Changes 기록
□ 7.4  Retest Plan 수립
□ 7.5  Retest Run 실행
□ 7.6  Post-Patch Lift 확인
□ 7.7  Factory Reuse 후보 판정

→ Phase 5로 돌아가 반복 (지속적 개선 루프)
```

### 11.2 시각적 흐름도

```
┌─────────────┐
│  Phase 1    │
│  Brand      │
│  Truth      │──────┐
└─────────────┘      │
                     ▼
┌─────────────┐  ┌─────────────┐
│  Phase 2    │  │  Phase 4    │
│  Semantic   │  │  Persona    │
│  Core       │  │  & Vibe     │
└──────┬──────┘  └──────┬──────┘
       │                │
       ▼                ▼
┌─────────────────────────────┐
│         Phase 3              │
│   Object → Surface → Page   │
│   → Schema → Export          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│         Phase 5              │
│   Probe Panel → Observation  │◄──── (반복)
│   → Judgment → Metrics       │         │
└──────────────┬──────────────┘         │
               │                         │
               ▼                         │
┌─────────────────────────────┐         │
│         Phase 6              │         │
│   Report + Methodology       │         │
│   + Caveat + Wording Scan    │         │
└──────────────┬──────────────┘         │
               │                         │
               ▼                         │
┌─────────────────────────────┐         │
│         Phase 7              │         │
│   RCA → Patch → Retest       │─────────┘
│   → Lift → Factory           │
└─────────────────────────────┘
```

---

## 12. FAQ & 문제 해결

### Q1: 개발 서버가 시작되지 않아요

```bash
# 의존성 재설치
rm -rf node_modules
npm install

# .env.local 파일 존재 확인
# Supabase URL과 키 값 확인
```

### Q2: 테스트가 실패합니다

```bash
# 전체 테스트 실행
npm test

# 특정 테스트 파일만 실행
npx vitest run tests/truth.test.ts

# 테스트 결과 상세 보기
npx vitest run --reporter=verbose
```

### Q3: 마이그레이션 에러가 발생합니다

마이그레이션은 **반드시 순서대로** 적용해야 합니다. 순서를 건너뛰면 외래 키(foreign key) 에러가 발생합니다.

```
올바른 순서:
0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0008
```

### Q4: 보고서를 내보낼 수 없어요

다음을 확인하세요:
1. Methodology Disclosure가 첨부되었는가?
2. Proxy Caveat 텍스트가 포함되었는가?
3. Unsafe Wording Scan을 통과했는가?
4. 실제 브랜드 순위 포함 시 리뷰가 완료되었는가?

### Q5: AI 판정(Judgment)이 자동으로 approved 되지 않아요

**이것은 의도된 동작입니다.** AI가 생성한 모든 판정은 기본적으로 `candidate` 상태이며, 인간 검토자가 `approved`로 전환해야 합니다. 이는 AI 안전 모델의 핵심 원칙입니다.

### Q6: 패치가 성공했는데 final_verdict가 fail이에요

가드레일 회귀(guardrail regression)가 감지되었을 수 있습니다. 하나의 메트릭이 개선되었더라도, 다른 메트릭이 하락하면 가드레일이 발동하여 전체 결과가 `fail`이 됩니다.

```
확인 방법:
Post-Patch Lift Snapshot
└── is_guardrail_regressed: true ← 이것이 원인
```

### Q7: 데모 데이터를 초기화하고 싶어요

```sql
-- Supabase SQL 에디터에서:
DELETE FROM workspaces WHERE slug = 'demo-brand-semantic-lab';
-- 그 후 시더를 다시 실행
```

### Q8: Mock Provider 대신 실제 AI를 사용하고 싶어요

현재 MVP는 Mock Provider를 사용합니다. 실제 AI 엔진 통합은 향후 계획입니다:

| 상태 | 엔진 |
|---|---|
| ✅ 현재 사용 가능 | `mock_provider` |
| 🔜 향후 통합 예정 | Google SGE, Perplexity, ChatGPT |

### Q9: 여러 워크스페이스를 동시에 관리할 수 있나요?

현재 MVP에서는 URL로 워크스페이스를 전환합니다. `agency_operator` 역할은 여러 워크스페이스에 걸쳐 운영할 수 있도록 설계되어 있습니다. 다중 워크스페이스 전환 UI는 향후 개선 예정입니다.

### Q10: 시스템의 불변 규칙은 무엇인가요?

어떤 개발이나 확장에서도 반드시 지켜야 하는 10가지 규칙:

1. ✅ 워크스페이스가 테넌트 경계
2. ✅ RLS 필수
3. ✅ AI 출력은 candidate가 기본
4. ✅ Object-first, Page-later
5. ✅ 증거 없이 바이브 점수 없음
6. ✅ 방법론 + 프록시 주의사항 없이 보고서 내보내기 없음
7. ✅ 재검증 없이 패치 성공 없음
8. ✅ 릴리즈 게이트 없이 릴리즈 없음
9. ✅ 서비스 역할 키는 클라이언트에 절대 노출 금지
10. ✅ 가드레일 회귀가 긍정적 리프트를 무효화

---

> **이전 문서:** 주요 개념과 용어 정의 → [`user_guide_concepts.md`](./user_guide_concepts.md)  
> **아키텍처 참조:** 시스템 아키텍처 → [`user_guide_architecture.md`](./user_guide_architecture.md)
