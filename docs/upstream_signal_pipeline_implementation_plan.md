# 상류 시그널 수집 파이프라인 구축 전략 — 다이아몬드 사고 기반

> **BSW-OS Upstream Signal Collection Pipeline — Multi-Phase Implementation Plan v1.0**
>
> 최종 업데이트: 2026-06-18

---

## 1차 다이아몬드: 문제 공간 재정의

### 발산 — 질문이 만들어지는 모든 경로

현재 시스템은 "LLM에게 질문을 만들어 달라"고 요청하는 **합성(Synthetic) 경로 1가지**만 존재합니다. 그러나 실제로 유의미한 질문이 만들어지는 경로는 훨씬 다양합니다:

| # | 수집 경로 | 데이터 성격 | 현재 상태 |
|---|---|---|---|
| 1 | **AI 합성 질문** | LLM이 상상한 질문 | ✅ 구현 |
| 2 | **검색 데이터** | 사람들이 실제로 검색한 질문 (GSC, Trends) | ❌ 목업 |
| 3 | **커뮤니티 질문** | 포럼/카페에서 사람들이 실제로 물은 질문 | ❌ 목업 |
| 4 | **리뷰 마이닝** | 제품 리뷰에서 추출한 질문형 문장 | ❌ 미구축 |
| 5 | **AI 메타질문** | "소비자가 묻는 질문의 패턴은?" | ❌ 미구축 |
| 6 | **AI 탐색질문** | 답변에서 파생되는 후속 질문 체인 | ❌ 미구축 |
| 7 | **AI 재귀질문** | 질문→답변→후속→답변…의 심화 루프 | ❌ 미구축 |
| 8 | **경쟁사 역공학** | 경쟁사 컨텐츠에서 추출한 타겟 질문 | ⚠️ 부분적 (크롤러 존재) |
| 9 | **People Also Ask** | 구글/빙의 "사람들이 묻는 질문" 데이터 | ❌ 미구축 |
| 10 | **벤치마크 역류** | 벤치마크 GAP/BLIND_SPOT에서 역발굴 | ✅ 방금 구현 |
| 11 | **고객 상담 로그** | CS 문의/FAQ에서 추출 | ❌ 미구축 |
| 12 | **학술/임상 문헌** | 논문에서 소비자 관심 질문 추출 | ❌ 미구축 |

### 수렴 — 핵심 문제는 "데이터 출처의 다양성 부재"

```
현재: LLM 상상(1) + 벤치마크 역류(10) = 2개 경로
이상: 12개 경로가 모두 시그널 풀로 수렴

근본 원인: 질문을 "만드는" 것과 "발견하는" 것을 구분하지 않았음
```

> **핵심 인사이트**: "질문 수집"은 단일 기능이 아니라, **관측(Observe) + 생성(Generate) + 심화(Deepen) + 평가(Evaluate)**의 4단계 파이프라인이어야 합니다.

---

## 2차 다이아몬드: 솔루션 도출

### 발산 — 가능한 아키텍처 접근법

| 접근 | 특징 | 장점 | 한계 |
|---|---|---|---|
| A. 외부 API 우선 | 모든 수집기를 실 API로 교체 | 실데이터 | API 키 필요, 비용, 속도 제한 |
| B. LLM 자율 에이전트 | 멀티 에이전트가 자율 탐색 | 구현 빠름 | 여전히 합성 데이터 |
| C. 하이브리드 | LLM 구조화 + 외부 검증 | 균형잡힘 | 복잡도 |
| D. 크롤링 중심 | 웹 스크래핑 집중 | 실데이터 | 법적 리스크, 유지보수 |
| E. HITL 중심 | 전문가가 직접 수집·분류 | 품질 최고 | 확장 불가 |

### 수렴 — **하이브리드 4단계 파이프라인 (C + B)**

LLM-네이티브 기능을 먼저 구축하여 **즉시 가치**를 창출하고, 외부 데이터 커넥터를 점진적으로 연결하며, HITL 게이트를 핵심 의사결정 지점에만 배치합니다.

---

## 아키텍처: OGDE 파이프라인

```
┌─────────────────────────────────────────────────────────────────┐
│                   OGDE 파이프라인                                 │
│                                                                 │
│   O ── Observe ──→ G ── Generate ──→ D ── Deepen ──→ E ── Eval  │
│   (관측)           (생성)            (심화)           (평가)      │
│                                                                 │
│   외부 데이터       LLM 메타질문      재귀 심화        LLM+HITL   │
│   ├─ 검색 트렌드    ├─ 패턴 질문       ├─ 탐색 체인     ├─ 자동 분류│
│   ├─ 커뮤니티       ├─ 역발상 질문     ├─ 깊이 N 루프   ├─ 중복 검출│
│   ├─ 리뷰           ├─ 시나리오 질문   └─ 수렴 판정     ├─ 배치 리뷰│
│   └─ PAA/관련검색   └─ 대비 질문                       └─ CQ 승격 │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
                   시맨틱 코어 시그널 풀
                   ├─ Question Signals (mined)
                   ├─ Question Capital (promoted)
                   ├─ Canonical Questions (approved)
                   └─ Probe Panel (benchmarked)
```

---

## 멀티 페이스 구현 계획

### Phase 1: LLM 네이티브 질문 지능 엔진 (Generate + Deepen)

> **외부 API 키 없이 LLM만으로** 즉시 구현 가능한 고가치 기능.
> 기존의 "1회성 합성 질문 생성"을 "다단계 전략적 질문 발굴 시스템"으로 업그레이드.

#### 1-1. 메타질문 엔진 (Meta-Question Engine)

**개념**: "소비자가 어떤 질문을 하는지" 직접 묻는 것이 아니라, "이 업종에서 소비자 질문의 패턴/구조/동기는 무엇인지"를 먼저 분석하는 상위 계층 질문.

**구현 위치**: `lib/signal-collection/meta-question-engine.ts` (신규)

```typescript
// 메타질문 유형 5가지
type MetaQuestionType = 
  | 'pattern'        // "이 업종에서 소비자 질문의 패턴은?"
  | 'motivation'     // "왜 이런 질문을 하게 되는가?"
  | 'journey_stage'  // "구매 여정의 어느 단계에서 묻는가?"
  | 'fear_desire'    // "숨겨진 불안/욕구는 무엇인가?"
  | 'counter'        // "이 업종에서 아무도 묻지 않지만 물어야 할 질문은?"
```

**LLM 프롬프트 전략**:

```
[SYSTEM] 당신은 소비자 심리 분석 전문가입니다.
{도메인} 업종에서 소비자가 AI 검색에 묻는 질문의 숨겨진 패턴을 분석하세요.

메타분석 관점:
1. 패턴: 반복되는 질문 구조 (비교형? 안전성? 추천형?)
2. 동기: 질문 뒤에 숨겨진 불안/욕구
3. 여정: 인지→관심→비교→구매→사용→재구매 중 어느 단계?
4. 역발상: 소비자가 "묻지 않지만 물어야 하는" 블라인드 스팟 질문
5. 대비: 경쟁사가 답하고 있지만 {브랜드}는 대비하지 못한 질문 패턴

각 패턴에서 구체적인 질문 5개씩을 도출하세요.
```

**기대 효과**: 기존 `discoverTargetQuestions()`가 "어떤 질문이 좋을까?"를 바로 묻는 반면, 메타질문은 "질문의 질문"을 통해 더 깊은 인사이트를 도출합니다.

#### 1-2. 탐색질문 체인 (Exploratory Question Chain)

**개념**: LLM이 질문에 대해 답변한 후, 그 답변에서 자연스럽게 파생되는 후속 질문을 자동 생성하는 연쇄 패턴.

**구현 위치**: `lib/signal-collection/exploratory-chain.ts` (신규)

```typescript
interface ExploratoryStep {
  question: string;
  answer_summary: string;
  follow_up_questions: string[];
  depth: number;
}

// 탐색 체인 실행
async function runExploratoryChain(
  seedQuestion: string,
  brandName: string,
  maxDepth: number = 3  // 기본 깊이 3
): Promise<ExploratoryStep[]>
```

**실행 흐름**:
```
Seed: "나이아신아마이드 민감성 피부에 안전한가요?"
  ↓ LLM 답변 + 후속 질문 추출
Step 1: "그렇다면 어떤 농도가 안전한가요?"
  ↓ LLM 답변 + 후속 질문 추출
Step 2: "5% 이상 고농도 나이아신아마이드의 부작용은?"
  ↓ LLM 답변 + 후속 질문 추출
Step 3: "나이아신아마이드와 같이 쓰면 안 되는 성분은?"
  ↓ 수렴 판정 (깊이 3 도달 + 중복 검출)
[종료] → 총 4개의 연관 질문 발굴
```

#### 1-3. 재귀 심화 엔진 (Recursive Deepening Engine)

**개념**: 탐색 체인의 상위 버전. 단일 체인이 아니라, 각 단계에서 분기(branch)하여 트리 구조로 심화합니다. 수렴 조건을 설정하여 무한 루프를 방지합니다.

**구현 위치**: `lib/signal-collection/recursive-deepener.ts` (신규)

```typescript
interface RecursiveConfig {
  max_depth: number;       // 최대 재귀 깊이 (기본 3)
  branch_factor: number;   // 각 단계에서 생성할 후속 질문 수 (기본 3)
  convergence_rules: {
    max_total_questions: number;     // 최대 총 질문 수 (기본 30)
    similarity_threshold: number;    // 중복 판정 유사도 (기본 0.85)
    relevance_threshold: number;     // 브랜드 적합성 최소값 (기본 0.5)
    stop_on_domain_exit: boolean;    // 도메인 이탈 시 중단 (기본 true)
  };
}
```

**수렴 조건**:
- 시맨틱 유사도 0.85 이상인 질문은 중복으로 판정 → 해당 분기 가지치기
- 브랜드/도메인과의 적합성이 0.5 이하로 떨어지면 → 해당 분기 중단
- 총 질문 수 30개 도달 시 → 전체 중단
- 깊이 N 도달 시 → 해당 분기 중단

**트리 구조 예시**:
```
Seed: "DR.O 세럼 민감성 피부에 괜찮나요?"
├── D1-1: "DR.O 세럼 성분 중 자극 유발 성분은?"
│   ├── D2-1: "나이아신아마이드 플러싱 현상 원인은?" 
│   │   └── D3-1: "플러싱이 심할 때 응급 대처법은?" [수렴: 의료 도메인 이탈]
│   └── D2-2: "민감성 피부용 세럼 추천 성분 조합은?"
│       └── D3-2: "세라마이드+판테놀 세럼 DR.O vs 아이소이 비교"
├── D1-2: "민감성 피부 세럼 사용법과 순서는?"
│   └── D2-3: "세럼 바른 후 선크림 필수인가요?"
│       └── D3-3: "민감성 피부용 선크림 추천" [수렴: 유사도 0.87]
└── D1-3: "DR.O 세럼 실제 사용 후기 요약"
    └── D2-4: "DR.O 세럼 아토피 피부에도 안전한가요?"
        └── D3-4: "아토피 피부 스킨케어 루틴에서 DR.O 세럼 위치"

→ 총 11개의 구조화된 질문 트리 발굴
```

#### 1-4. 시그널 배치 리뷰 UI

**구현 위치**: `app/[locale]/(workspace)/[workspace_slug]/semantic-core/signals/page.tsx` (기존 수정)

- 시그널 목록에 **일괄 선택 체크박스** 추가
- **일괄 승인(Promote)** / **일괄 무시(Ignore)** 버튼
- LLM이 자동 부여한 **인텐트·적합성·전략 가치 스코어** 표시
- 소스 채널 필터 (어디서 수집된 시그널인지: `meta_question`, `exploratory_chain`, `recursive_tree`, `benchmark_gap` 등)

**Phase 1 예상 공수**: 5~7일

---

### Phase 2: 외부 데이터 관측 계층 (Observe)

> 목업 상태인 8개 수집기를 **실제 데이터 소스로 교체**합니다.
> API 키가 필요하며, 우선순위가 높은 소스부터 단계적으로 연결합니다.

#### 2-1. 한국 시장 필수 소스 (Tier 1)

| 소스 | 연결 방식 | 수집 대상 | 기존 스텁 |
|---|---|---|---|
| **Naver DataLab** | 공식 REST API (API 키) | 검색어 트렌드, 관련 검색어 | `search-trend-collector.ts` 교체 |
| **Naver 지식iN** | 비공식 크롤링 + LLM 추출 | 실제 사용자 질문 | `community-collector.ts` 확장 |
| **화해 앱 리뷰** | 비공식 크롤링 + LLM 추출 | 제품 리뷰 내 질문형 문장 | 신규 수집기 필요 |
| **Google Search Console** | GSC API (OAuth) | 실제 노출 쿼리·클릭 데이터 | `signal-mining-provider.ts` GSCProvider 교체 |

#### 2-2. 글로벌/보조 소스 (Tier 2)

| 소스 | 연결 방식 | 수집 대상 |
|---|---|---|
| **Google Trends** | Unofficial API / SerpAPI | 키워드 상승 트렌드 |
| **Google PAA** (People Also Ask) | SerpAPI 또는 크롤링 | AI 검색에 직접 노출되는 관련 질문 |
| **Reddit** | Reddit API (OAuth) | 영문 커뮤니티 질문·토론 |
| **YouTube 댓글** | YouTube Data API v3 | 영상 아래 질문형 댓글 |

#### 2-3. 수집기 통합 아키텍처

기존 `lib/prediction/signal-collectors/` 8개 파일의 인터페이스를 유지하면서 내부 로직만 실제 API 호출로 교체합니다.

```typescript
// 공통 인터페이스 (기존 유지)
interface SignalCollector {
  collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]>;
}

// 신규: 수집 결과에 원천(provenance) 메타데이터 추가
interface EnrichedSignal extends EmergenceSignal {
  provenance: {
    source_type: 'search_trend' | 'community' | 'review' | 'paa' | 'llm_meta' | 'llm_recursive';
    source_url?: string;
    collected_at: string;
    confidence: number;  // 0~1, 실데이터=1.0, LLM합성=0.6
  };
}
```

**Phase 2 예상 공수**: 10~14일 (API 키 확보·인증 포함)

---

### Phase 3: LLM+HITL 협업 평가 파이프라인 (Evaluate)

> 수집된 원시 질문(수백~수천 개)을 **LLM이 1차 분류 → 사람이 배치 승인 → 시스템이 자동 등록**하는 3단계 평가 체계.

#### 3-1. LLM 자동 평가 레이어

수집된 모든 시그널에 대해 LLM이 자동으로 5가지 차원을 평가합니다:

| 평가 차원 | 설명 | 자동 액션 |
|---|---|---|
| **중복 클러스터링** | 시맨틱 유사도 기반 질문 그룹핑 | 동일 클러스터의 대표 질문 1개만 유지 |
| **인텐트 분류** | informational / transactional / comparison / risk | QIS 씬 자동 매핑 |
| **브랜드 적합성** | fit / partial / unfit | unfit 자동 제외 |
| **전략 가치** | S-Score 4차원 예비 평가 | 우선순위 자동 정렬 |
| **YMYL 위험도** | 건강/금융 관련 위험 질문 탐지 | 고위험 플래그 부착 |

**구현 위치**: `lib/signal-collection/signal-evaluator.ts` (신규)

#### 3-2. HITL 배치 리뷰 대시보드

LLM이 분류한 결과를 사람이 효율적으로 검토하는 전용 UI:

```
┌──────────────────────────────────────────────────────────────┐
│  시그널 리뷰 대시보드                          총 127건 대기  │
│                                                              │
│  [필터: 소스 ▼] [필터: 인텐트 ▼] [필터: 적합성 ▼]            │
│                                                              │
│  ☐ "나이아신아마이드 5% 민감성 피부 안전한가요?"              │
│    📡 소스: naver_kin | 🎯 인텐트: informational              │
│    ⭐ 전략가치: 82 | 🏷️ 적합성: fit | ⚠️ YMYL: true          │
│    📊 유사 질문 3건 (클러스터 #7)                             │
│                                                              │
│  ☐ "세라마이드 크림 추천 겨울용"                              │
│    📡 소스: recursive_tree | 🎯 인텐트: transactional          │
│    ⭐ 전략가치: 65 | 🏷️ 적합성: partial | ⚠️ YMYL: false      │
│                                                              │
│  [✅ 선택 항목 승인 (CQ 등록)] [❌ 선택 항목 무시] [📋 전체 선택]│
└──────────────────────────────────────────────────────────────┘
```

#### 3-3. 자동 CQ 등록 + 프로브 패널 주입

HITL 승인된 시그널은 자동으로:
1. CQ(정규 질문) 등록 → 시맨틱 서명 부여
2. S-Score 초기 계산
3. 프로브 패널에 자동 추가 (벤치마크 질문 세트에 즉시 반영)
4. 질문 라이프사이클 `signal → cq` 단계 전환

**Phase 3 예상 공수**: 7~10일

---

### Phase 4: 자율 수집 오케스트레이터 (Autonomous Orchestrator)

> 위 3개 Phase의 기능을 하나의 자동 순환 시스템으로 통합하는 최종 단계.

#### 4-1. 수집 스케줄러

```typescript
interface CollectionSchedule {
  // 주기적 자동 수집 설정
  search_trends: { cron: '0 9 * * 1', provider: 'naver_datalab' };    // 매주 월 09시
  community: { cron: '0 9 * * 3', provider: 'naver_kin' };            // 매주 수 09시
  meta_questions: { cron: '0 9 1 * *', provider: 'llm_meta' };        // 매월 1일
  recursive_deepening: { cron: '0 9 15 * *', provider: 'llm_recursive' }; // 매월 15일
  paa_scraping: { cron: '0 9 * * 5', provider: 'google_paa' };        // 매주 금 09시
}
```

#### 4-2. 이상 탐지 및 트렌드 알림

```
수집된 시그널 볼륨이 전주 대비 +200% 이상 급등
  → "[트렌드 알림] '나이아신아마이드 플러싱' 관련 질문 급증"
  → 자동으로 재귀 심화 엔진 트리거
  → 심화 결과를 HITL 리뷰 큐에 우선 배치
```

#### 4-3. 피드백 루프 (Closed Loop)

```
수집(O) → 생성(G) → 심화(D) → 평가(E)
    ↑                                │
    │         ┌──────────────────────┘
    │         ↓
    │   CQ 등록 → 벤치마크 측정 → 딥다이브 공략
    │         │                       │
    │         ↓                       ↓
    └── GAP/니치 역류 ←───── 블루프린트/QIS
```

벤치마크에서 새로운 GAP이 발견되면 그 질문이 다시 수집 파이프라인의 Seed가 되어 재귀 심화됩니다. 이것이 **완전한 플라이휠 순환**입니다.

**Phase 4 예상 공수**: 5~7일

---

### Phase 5: 업종별 커스터마이징 + 품질 벤치마크

> 파이프라인이 업종별로 최적화되고, 수집 품질을 정량적으로 측정합니다.

#### 5-1. 업종별 수집 전략 프로파일

```typescript
interface IndustryCollectionProfile {
  industry: string;
  primary_sources: string[];           // 핵심 수집 소스
  meta_question_focus: MetaQuestionType[];  // 강조할 메타질문 유형
  recursive_depth: number;             // 권장 재귀 깊이
  convergence_similarity: number;      // 수렴 유사도 기준
  community_channels: string[];        // 주요 커뮤니티 채널
  review_platforms: string[];          // 리뷰 플랫폼
  ymyl_sensitivity: 'high' | 'medium' | 'low';
}

// 예시: 스킨케어 업종
const skincareProfile: IndustryCollectionProfile = {
  industry: 'skincare',
  primary_sources: ['naver_kin', 'hwahae', 'google_paa', 'naver_datalab'],
  meta_question_focus: ['fear_desire', 'pattern', 'counter'],
  recursive_depth: 4,
  convergence_similarity: 0.80,
  community_channels: ['화해', '파우더룸', '디시인사이드 화장품갤'],
  review_platforms: ['화해', '올리브영', '쿠팡'],
  ymyl_sensitivity: 'high'
};
```

#### 5-2. 수집 품질 지표 (Collection Quality Metrics)

| 지표 | 설명 | 목표 |
|---|---|---|
| **Signal Diversity Index (SDI)** | 수집 소스의 다양성 (몇 개 소스에서 왔나) | ≥ 4개 소스 |
| **Real Data Ratio (RDR)** | 실데이터 vs 합성데이터 비율 | ≥ 60% 실데이터 |
| **Duplication Rate** | 중복 질문 비율 | ≤ 15% |
| **Brand Fit Rate** | 브랜드 적합 질문 비율 | ≥ 70% |
| **HITL Approval Rate** | 사람이 승인한 비율 | ≥ 50% |
| **CQ Conversion Rate** | 시그널 → CQ 전환율 | ≥ 20% |

**Phase 5 예상 공수**: 3~5일

---

## 전체 로드맵 요약

| Phase | 핵심 내용 | 의존성 | 공수 | 가치 |
|---|---|---|---|---|
| **1** | 메타질문 + 탐색질문 + 재귀 심화 + 배치 리뷰 UI | 없음 (LLM만) | 5~7일 | 🔥🔥🔥🔥🔥 |
| **2** | 외부 데이터 커넥터 실연결 (Naver, GSC, PAA) | API 키 | 10~14일 | 🔥🔥🔥🔥 |
| **3** | LLM+HITL 협업 평가 파이프라인 | Phase 1, 2 | 7~10일 | 🔥🔥🔥🔥 |
| **4** | 자율 수집 오케스트레이터 + 피드백 루프 | Phase 1, 2, 3 | 5~7일 | 🔥🔥🔥 |
| **5** | 업종별 커스터마이징 + 품질 벤치마크 | Phase 4 | 3~5일 | 🔥🔥 |

**총 예상 공수**: 30~43일 (점진적 배포 가능)

---

## Phase 1 즉시 시작 시 기대 효과

| 현재 | Phase 1 완료 후 |
|---|---|
| LLM에게 "질문 5개 만들어줘" | 메타질문으로 질문 패턴 분석 → 패턴별 질문 25개 도출 |
| 1회성 니치 발굴 | 재귀 심화로 트리 구조 30개 질문 체계적 발굴 |
| 시그널 하나씩 수동 승인 | 배치 리뷰 UI로 100개 시그널 10분 내 처리 |
| 질문 수집 경로 2개 | 질문 수집 경로 5개 (메타, 탐색, 재귀, 벤치마크역류, 합성) |
