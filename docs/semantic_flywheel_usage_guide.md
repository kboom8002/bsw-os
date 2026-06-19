# 시맨틱 플라이휠 활용 가이드

> **BSW-OS Semantic Flywheel Usage Guide v1.0**
> 
> 최종 업데이트: 2026-06-18

---

## 목차

1. [개요](#1-개요)
2. [아키텍처 이해](#2-아키텍처-이해)
3. [질문 라이프사이클 파이프라인](#3-질문-라이프사이클-파이프라인)
4. [S-Score (시맨틱 스코어)](#4-s-score-시맨틱-스코어)
5. [오토파일럿 파이프라인](#5-오토파일럿-파이프라인)
6. [실전 운영 시나리오](#6-실전-운영-시나리오)
7. [API 레퍼런스](#7-api-레퍼런스)
8. [관련 파일 맵](#8-관련-파일-맵)
9. [FAQ](#9-faq)

---

## 1. 개요

### 시맨틱 플라이휠이란?

시맨틱 플라이휠(Semantic Flywheel)은 BSW-OS의 3대 핵심 모듈인 **시맨틱 코어(Semantic Core)**, **벤치마크(Benchmark)**, **클라이언트 딥 다이브(Client Deep Dive)**를 하나의 자동 순환 파이프라인으로 통합한 시스템입니다.

기존에는 3개 모듈이 독립적으로 동작하여, 브랜드 매니저가 수동으로 데이터를 이동시켜야 했습니다. 플라이휠은 이 **"순환 단절"** 을 해소합니다.

### 핵심 가치

| 기존 (단절 상태) | 플라이휠 (순환 상태) |
|---|---|
| 벤치마크에서 GAP 발견 → 수동으로 시그널 추가 | GAP 발견 → **자동** 시그널 생성 |
| CQ 등록 후 벤치마크 질문 세트에 수동 추가 | CQ 등록 → **자동** 측정 대상 포함 |
| 딥 다이브에서 니치 질문 발굴 → 기록 없이 유실 | 니치 질문 → **자동** 시그널 적재 |
| 블루프린트 설계 → QIS 씬 수동 생성 | 블루프린트 완료 → **자동** QIS 씬 생성 |
| 질문별 진행 상태 파악 불가 | **라이프사이클 파이프라인 UI**에서 한눈에 조회 |
| 우선순위 판단이 주관적 | **S-Score**로 전략적 가치 정량화 |

---

## 2. 아키텍처 이해

### 3개 모듈의 역할

```
┌─────────────────────────────────────────────────────────┐
│                  시맨틱 플라이휠                           │
│                                                         │
│  🧠 KNOW (시맨틱 코어)                                    │
│  ├─ Question Signals: 질문 시그널 채굴                    │
│  ├─ Question Capital: 질문 자본 트리                      │
│  ├─ Canonical Questions: 정규 질문 (CQ)                  │
│  ├─ QIS Scenes: 질의-인텐트-시나리오                      │
│  ├─ TCO Concepts: 개념 사전                              │
│  └─ Claims & Lineage: 클레임 및 계보                      │
│                                                         │
│  📊 MEASURE (벤치마크)                                    │
│  ├─ Probe Panels: 질문 세트                              │
│  ├─ AI Observation Runs: AI 엔진별 측정                   │
│  ├─ Opportunity Analyzer: 기회/갭 분석                    │
│  └─ AAS / OCR / BSF: 핵심 지표                           │
│                                                         │
│  ⚡ ACT (딥 다이브)                                       │
│  ├─ Target QIS Engine: 공략 대상 발굴                     │
│  ├─ Content Blueprint: 컨텐츠 설계도                      │
│  ├─ Simulate Engine: 효과 시뮬레이션                      │
│  └─ Niche Discovery: 니치 질문 발굴                       │
│                                                         │
│  🔄 LEARN (플라이휠 역류)                                 │
│  ├─ GAP → Signal 자동 생성                               │
│  ├─ Niche → Signal 자동 적재                             │
│  ├─ Blueprint → QIS Scene 자동 생성                      │
│  └─ S-Score → Strategic Weight 자동 조정                 │
└─────────────────────────────────────────────────────────┘
```

### 데이터 흐름도

```
시그널 채굴 ──→ CQ 등록 ──→ 벤치마크 측정 ──→ 기회 분석
     ↑                                            │
     │            ┌──────────────────────────────┘
     │            ↓
     │      타겟 발굴(딥 다이브) ──→ 블루프린트 설계
     │            │                       │
     │            ↓                       ↓
     └──── 니치 질문 역류         QIS 씬 자동 생성
           GAP 질문 역류          클레임/개념 주입
```

---

## 3. 질문 라이프사이클 파이프라인

### 개념

하나의 질문이 시스템 내에서 거치는 **6단계 생애주기**를 추적합니다.

| 단계 | 상태값 | 설명 | 담당 모듈 |
|---|---|---|---|
| 1️⃣ Signal | `signal` | 검색 트렌드, 벤치마크 GAP 등에서 원시 질문 채굴 | 시맨틱 코어 |
| 2️⃣ CQ Registered | `cq` | 정규 질문으로 정제 및 등록 (시맨틱 서명 부여) | 시맨틱 코어 |
| 3️⃣ Benchmarked | `benchmarked` | AI 엔진별 노출도 측정 완료 | 벤치마크 |
| 4️⃣ Targeted | `targeted` | 딥 다이브에서 공략 대상으로 선정 | 딥 다이브 |
| 5️⃣ Blueprinted | `blueprinted` | 컨텐츠 설계도(Blueprint) 생성 완료 | 딥 다이브 |
| 6️⃣ Verified | `verified` | 재벤치마크를 통한 개선 효과 검증 | 벤치마크 |

### UI 사용법

1. **시맨틱 코어 스튜디오** → **Canonical Questions** 페이지 이동
2. 각 CQ 카드 하단의 **[Lifecycle]** 버튼 클릭
3. 확장되는 패널에서 다음 정보 확인:
   - **파이프라인 진행 바**: 현재 어느 단계에 있는지 시각적으로 표시
   - **S-Score**: 해당 질문의 전략적 가치 점수
   - **Weight Boosted 경고**: S-Score < 40 & 기회 크기 높을 때 자동 가중치 상향 표시
   - **바로가기 링크**: 벤치마크 / 딥 다이브 화면으로 즉시 이동

### 데이터 스키마

`question_lifecycle` 테이블 (Supabase):

```typescript
{
  id: UUID,
  workspace_id: UUID,
  canonical_question_id: UUID | null,    // 연결된 정규 질문
  signal_id: UUID | null,                // 원본 시그널 ID
  blueprint_id: UUID | null,             // 생성된 블루프린트 ID
  benchmark_snapshot_ids: UUID[],        // 연관 벤치마크 스냅샷
  deep_dive_session_ids: UUID[],         // 연관 딥 다이브 세션
  stage: 'signal' | 'cq' | 'benchmarked' | 'targeted' | 'blueprinted' | 'verified',
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 4. S-Score (시맨틱 스코어)

### 개념

S-Score는 하나의 정규 질문(CQ)이 가진 **전략적 가치를 0~100 단일 점수**로 정량화합니다.

### 4차원 평가 공식

$$S\text{-}Score = 0.25 \times Completeness + 0.30 \times Visibility + 0.25 \times Opportunity + 0.20 \times Readiness$$

| 차원 | 가중치 | 측정 기준 | 소스 모듈 |
|---|---|---|---|
| **Completeness** (시맨틱 완성도) | 25% | CQ 존재 여부, QIS 씬 개수, 클레임 연결 수, 계보 검증 상태 | 시맨틱 코어 |
| **Visibility** (AI 가시성) | 30% | AAS, OCR, BSF 점수의 엔진별 가중 평균 | 벤치마크 |
| **Opportunity** (기회 크기) | 25% | 검색 볼륨 × GAP 심각도 × 경쟁 공백 정도 | 벤치마크 + 딥 다이브 |
| **Readiness** (컨텐츠 준비도) | 20% | 블루프린트 존재 여부, expected_layer 커버리지, Boundary Rule 준수 | 딥 다이브 + 시맨틱 코어 |

### S-Score 해석 가이드

| 구간 | 색상 | 의미 | 추천 액션 |
|---|---|---|---|
| **70~100** | 🟢 녹색 | 전략적으로 안정. AI 검색에서 잘 노출 중 | 현 상태 유지, 모니터링 |
| **40~69** | 🟡 노란색 | 개선 여지가 있음. 일부 차원에서 약점 존재 | 약한 차원 집중 보강 |
| **0~39** | 🔴 빨간색 | 전략적 위험. 기회는 크지만 준비 부족 | 즉시 블루프린트 생성 + 컨텐츠 배포 |

### 자동 가중치 상향 (Auto-Boost)

S-Score가 **40 미만**이면서 기회(Opportunity) 차원이 **70 초과**인 경우, 시스템이 자동으로 해당 CQ의 `strategic_weight`를 **+20** 상향합니다. 이를 통해 리소스 할당 시 "기회가 크지만 아직 공략하지 못한 질문"이 우선순위에 올라옵니다.

```typescript
// lib/s-score/calculator.ts
static evaluateStrategicWeightAction(scoreResult, currentWeight) {
  if (scoreResult.total_score < 40 && scoreResult.dimensions.opportunity > 70) {
    return Math.min(100, currentWeight + 20);  // Auto-boost
  }
  return currentWeight;
}
```

---

## 5. 오토파일럿 파이프라인

### 개념

브랜드 매니저의 수동 클릭 6단계를 자동화합니다. **시스템은 "제안/실행"하고, 사람은 "승인"만** 합니다.

### 자동화 트리거 상세

#### 트리거 1: GAP → Signal (역류 자동화)

- **발동 위치**: `lib/benchmark/opportunity-analyzer.ts`
- **발동 조건**: `severity === 'high'`인 GAP 또는 BLIND_SPOT 감지 시
- **수행 동작**: `auto_generated_signals` 배열에 해당 질문을 적재 → 시맨틱 코어의 `question_signals`로 전송
- **소스 태그**: `benchmark_opportunity_gap` 또는 `benchmark_opportunity_blind_spot`

```
벤치마크 실행
  → OpportunityAnalyzer.analyze() 호출
    → GAP 감지 (경쟁사만 노출, 자사 누락)
      → severity === 'high' 확인
        → autoSignals.push({ query, intent, source })
          → 시맨틱 코어 Signal 자동 생성
```

**실무 예시**:
벤치마크 실행 결과 "나이아신아마이드 민감성 피부에 안전한가요?"라는 질문에서 Dr.Jart+와 CNP만 언급되고 DR.O가 누락되면, 이 질문이 자동으로 시맨틱 코어의 시그널 풀에 `mined` 상태로 등록됩니다.

#### 트리거 2: Niche → Signal (역류 자동화)

- **발동 위치**: `lib/deep-dive/target-qis-engine.ts`
- **발동 조건**: `LlmAnalyst.discoverNicheQuestions()` 실행 후
- **수행 동작**: 발굴된 니치 질문들을 시맨틱 코어 시그널로 적재

```
딥 다이브 Discover 단계
  → TargetQisEngine.discoverTargets() 호출
    → canonicalSeeds에서 니치 변형 LLM 생성
      → 각 니치 질문에 대해:
        → console.log("[Auto-Pilot] Mined Niche Question...")
          → 시맨틱 코어 Signal 자동 생성
```

**실무 예시**:
"피부장벽 손상 시 나이아신아마이드 vs 판테놀 어떤 게 나은가요?"라는 정규 질문(GAP)에서 파생된 "아토피 피부 나이아신아마이드 5% 농도 괜찮을까요?"라는 니치 질문이 자동으로 시그널에 등록됩니다.

#### 트리거 3: Blueprint → QIS Scene (전진 자동화)

- **발동 위치**: `app/api/deep-dive/blueprint/route.ts`
- **발동 조건**: LLM이 `ContentBlueprint`를 성공적으로 생성한 직후
- **수행 동작**: 블루프린트의 `expected_layer`, `heading_structure`를 기반으로 QIS Scene 자동 생성

```
딥 다이브 Blueprint 단계
  → ContentBlueprintGenerator.generate() 완료
    → 블루프린트 응답 수신
      → console.log("[Auto-Pilot] Mapped Blueprint to QIS Scene...")
        → 시맨틱 코어 QIS Scene 자동 생성
```

#### 트리거 4: Claim/Concept Injection (로직 강화)

- **발동 위치**: `lib/deep-dive/content-blueprint-gen.ts`
- **발동 조건**: 블루프린트 생성 시 항상
- **수행 동작**: `truthRules.approvedClaims` (검증된 클레임)과 TCO 개념이 LLM 프롬프트에 자동 주입 → 팩트 기반 설계도 도출

### 자동화 등급 요약

| 기능 | 인간 개입 | 설명 |
|---|---|---|
| 벤치마크 GAP → 시그널 | ❌ 없음 | 자동 적재 |
| 니치 질문 → 시그널 | ❌ 없음 | 자동 적재 |
| 시그널 → CQ 등록 | ✅ **승인 필요** | 제안 후 사람이 승인 |
| 블루프린트 → QIS 씬 | ❌ 없음 | 자동 생성 |
| 클레임/개념 → 블루프린트 | ❌ 없음 | 자동 주입 |
| 타겟 질문 선정 | ✅ **승인 필요** | 후보 제시 후 사람이 선택 |

---

## 6. 실전 운영 시나리오

### 시나리오 A: 신규 브랜드 온보딩

```
1. 시맨틱 코어에서 도메인/브랜드 등록
2. 초기 시그널 채굴 (검색 트렌드, 경쟁사 분석)
3. 핵심 CQ 20~30개 등록
4. 벤치마크 최초 실행
   → 오토파일럿이 GAP/BLIND_SPOT에서 추가 시그널 자동 생성
5. 딥 다이브 Discover 실행
   → 타겟 질문 후보 검토 및 승인
6. 블루프린트 생성
   → QIS Scene 자동 생성, 클레임 자동 주입
7. 라이프사이클 파이프라인에서 전체 진행 상태 확인
```

### 시나리오 B: 주간 운영 루틴

```
매주 월요일:
1. 벤치마크 재실행 (주간 크론 또는 수동)
2. 기회 분석 리포트 확인
   → 새로운 GAP이 있으면 자동으로 시그널에 추가됨
3. 시맨틱 코어 → Signals 화면에서 신규 시그널 확인
   → 유의미한 시그널을 CQ로 승인
4. S-Score 대시보드 확인
   → 빨간색(< 40) 질문에 대해 딥 다이브 실행
5. 블루프린트 기반 컨텐츠 배포

매주 금요일:
6. 라이프사이클 파이프라인에서 전체 진행 추적
   → 'blueprinted' 단계의 질문들이 실제 컨텐츠로 전환되었는지 확인
```

### 시나리오 C: 경쟁사 대응 (긴급)

```
1. 벤치마크 임시 실행
2. 오토파일럿이 VOLATILE 유형 감지
   → "[경고] 이전 측정에서는 언급되었으나 이번 실행에서는 누락"
3. 해당 질문 S-Score 확인 → Weight 자동 Boosted 상태
4. 딥 다이브 즉시 실행 → 긴급 블루프린트 생성
5. 컨텐츠 우선 배포
6. 2주 후 재벤치마크로 효과 검증 → stage가 'verified'로 전환
```

---

## 7. API 레퍼런스

### GET `/api/lifecycle/status`

질문의 라이프사이클 상태와 S-Score를 조회합니다.

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `question_id` | string (UUID) | ✅ | 조회할 Canonical Question ID |

**Response**:

```json
{
  "question_id": "cq-1",
  "lifecycle": {
    "stage": "blueprinted",
    "signal_mined": true,
    "cq_approved": true,
    "benchmark_snapshot_id": "snap-abc",
    "deep_dive_session_id": "sess-def",
    "blueprint_id": "bp-ghi"
  },
  "metrics": {
    "s_score": 62,
    "dimensions": {
      "completeness": 75,
      "visibility": 55,
      "opportunity": 68,
      "readiness": 50
    },
    "aas": 72,
    "ocr": 45,
    "gap_severity": "high"
  }
}
```

### POST `/api/deep-dive/blueprint`

딥 다이브 블루프린트를 생성합니다. 오토파일럿이 연동되어, 생성 완료 시 QIS Scene이 자동 생성됩니다.

**Request Body**:

```json
{
  "session_id": "sess-123",
  "workspace_id": "ws-abc",
  "candidates": [{ "question_text": "...", "composite_priority": 85 }],
  "brand_slug": "dr-o",
  "domain_slug": "skincare"
}
```

---

## 8. 관련 파일 맵

### 스키마 & 타입

| 파일 | 역할 |
|---|---|
| `lib/schema.ts` | `questionLifecycleSchema` (스키마 #97), `questionCapitalNodeSchema`의 `s_score` 필드 |

### S-Score 엔진

| 파일 | 역할 |
|---|---|
| `lib/s-score/calculator.ts` | S-Score 4차원 계산 엔진, Auto-Boost 로직 |

### 라이프사이클 API & UI

| 파일 | 역할 |
|---|---|
| `app/api/lifecycle/status/route.ts` | 라이프사이클 상태 + S-Score 조회 API |
| `components/question-lifecycle-pipeline.tsx` | 6단계 파이프라인 시각화 UI 컴포넌트 |
| `app/[locale]/(workspace)/[workspace_slug]/semantic-core/canonical-questions/page.tsx` | CQ 목록에 라이프사이클 UI 통합 |

### 오토파일럿 로직

| 파일 | 트리거 | 자동화 동작 |
|---|---|---|
| `lib/benchmark/opportunity-analyzer.ts` | GAP/BLIND_SPOT 감지 | → Signal 자동 생성 (`auto_generated_signals`) |
| `lib/deep-dive/target-qis-engine.ts` | 니치 질문 발굴 | → Signal 자동 적재 |
| `app/api/deep-dive/blueprint/route.ts` | 블루프린트 생성 완료 | → QIS Scene 자동 생성 |
| `lib/deep-dive/content-blueprint-gen.ts` | 블루프린트 LLM 호출 시 | → Claim/Concept 자동 주입 |

---

## 9. FAQ

### Q: S-Score가 자동으로 갱신되나요?
현재 버전에서는 라이프사이클 API 호출 시 계산됩니다. 향후 벤치마크 완료 시 자동 갱신되도록 크론 트리거를 추가할 예정입니다.

### Q: 오토파일럿이 잘못된 시그널을 생성하면 어떻게 되나요?
자동 생성된 시그널은 `status: 'mined'`로 적재되므로, 시맨틱 코어의 Signals 화면에서 검토 후 `promoted`(CQ 승격) 또는 `ignored`(무시)로 수동 분류합니다. **CQ 등록은 반드시 사람의 승인이 필요합니다.**

### Q: 브랜드와 맞지 않는 질문이 타겟으로 올라오진 않나요?
딥 다이브의 `TargetQisEngine` 5단계에서 `LlmAnalyst.filterByBrandFit()`이 브랜드 제품 카테고리와 아이덴티티에 부합하지 않는 질문을 자동으로 필터링합니다.

### Q: 라이프사이클 단계가 자동으로 전환되나요?
현재는 각 모듈의 액션 완료 시 단계가 업데이트됩니다. 예를 들어, 벤치마크를 실행하면 `cq` → `benchmarked`로 전환됩니다. 향후 이벤트 기반 자동 전환을 구현할 계획입니다.

### Q: S-Score의 가중치를 커스터마이징할 수 있나요?
`lib/s-score/calculator.ts`의 `calculate()` 메서드에서 `completeness * 0.25`, `visibility * 0.30` 등의 상수를 수정하면 됩니다. 업종별로 다른 가중치를 적용하려면 `DomainConfig`에 `s_score_weights` 필드를 추가하는 것을 권장합니다.

---

> **문의**: 이 가이드에 대한 질문이나 개선 제안이 있으면, 프로젝트 관리자에게 문의하세요.
