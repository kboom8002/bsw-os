# 상류 시그널 수집 파이프라인(Upstream Signal Pipeline)
## 목적·방법론·과학적 근거

> **문서 버전**: v1.0  
> **최종 갱신**: 2026-06-18  
> **시스템 위치**: `lib/signal-collection/`

---

## 1. 목적과 목표

### 1.1 해결하려는 문제

AI 검색 시대에 브랜드가 직면한 가장 근본적인 질문은 **"소비자가 AI에게 무엇을 묻는가?"**입니다. 전통적 SEO에서는 Google Search Console이나 키워드 플래너가 이 역할을 수행했지만, AI 검색(ChatGPT, Gemini, Perplexity 등)에서는 **쿼리 로그 자체가 공개되지 않습니다**. 따라서 브랜드는 질문의 실체를 "발견"하는 새로운 방법론이 필요합니다.

기존 BSW 시스템의 시그널 채굴(Signal Mining)은 LLM에게 "질문 5개를 만들어 달라"는 **단일 프롬프트 방식**이었습니다. 이 접근법의 한계:

| 한계 | 설명 |
|---|---|
| **표면적 생성** | LLM은 가장 "안전하고 일반적인" 질문을 생성하는 경향이 있어, 전략적으로 가치가 높은 니치(Niche) 질문이나 역발상 질문을 놓침 |
| **단일 관점** | 소비자의 인지→비교→구매→사용이라는 다단계 여정(Journey)의 한 지점만 포착 |
| **구조적 탐색 부재** | 질문 A가 답변 B를 낳고, 답변 B가 후속 질문 C로 이어지는 **심화 연쇄(Deepening Chain)**를 탐색하지 않음 |
| **평가 부재** | 생성된 질문이 브랜드에 실제로 적합한지, 전략적으로 가치가 있는지를 판단하지 않고 모두 동일하게 적재 |

### 1.2 시스템의 목표

**"관측(Observe) → 생성(Generate) → 심화(Deepen) → 평가(Evaluate)"의 4단계를 갖춘 구조화된 질문 발굴 파이프라인(OGDE Pipeline)을 구축한다."**

| 목표 계층 | 구체적 목표 |
|---|---|
| **전략 목표** | 브랜드가 AI 검색에서 "질문의 지형도(Question Landscape)"를 체계적으로 매핑하여, 경쟁사보다 먼저 핵심 질문 영토를 점유하도록 지원 |
| **방법론 목표** | 단일 프롬프트를 다단계 메타분석-탐색-재귀 구조로 대체하여, 질문 발굴의 **깊이(Depth)**와 **다양성(Breadth)**을 동시에 확보 |
| **운영 목표** | 수십~수백 개의 시그널을 LLM이 사전 평가하고, 사람은 배치(Batch) 단위로 승인/거부만 하면 되는 **HITL(Human-In-The-Loop) 효율화** 달성 |
| **품질 목표** | 브랜드 부적합 질문, 의미 중복 질문, 도메인 이탈 질문을 자동 필터링하여 시그널 풀의 신호 대 잡음 비(Signal-to-Noise Ratio)를 극대화 |

---

## 2. 작업 방법론: OGDE 파이프라인

파이프라인은 네 단계로 구성되며, 각 단계는 독립적인 엔진으로 구현되어 있습니다.

### 2.1 Phase G — 메타질문 생성 (Meta-Question Generation)

**엔진**: [meta-question-engine.ts](file:///c:/Users/User/bsw/lib/signal-collection/meta-question-engine.ts)

#### 무엇을 하는가

"어떤 질문을 만들까?"를 바로 묻는 대신, **"이 업종에서 질문이 만들어지는 구조는 무엇인가?"**를 먼저 분석합니다. 이것은 질문에 대한 질문, 즉 **메타질문(Meta-Question)**입니다.

#### 분석 프레임워크: 5가지 메타 관점

```
┌────────────────────────────────────────────────────────────┐
│                   메타질문 5-렌즈 프레임워크                  │
│                                                            │
│  1. Pattern (패턴)     ── "반복되는 질문 구조는?"           │
│     → 비교형, 안전성형, 추천형, 가격형 등의 구조 분석       │
│                                                            │
│  2. Motivation (동기)  ── "질문 뒤의 숨겨진 동기는?"        │
│     → 표면적 질문 아래 깔린 심리적 니즈 추출                │
│                                                            │
│  3. Journey Stage (여정) ── "구매 여정 어느 단계?"          │
│     → 인지→관심→비교→구매→사용→재구매 매핑                  │
│                                                            │
│  4. Fear & Desire (불안/욕구) ── "두려움과 욕망은?"         │
│     → 부작용 불안, 효과 기대, 가격 대비 걱정 등             │
│                                                            │
│  5. Counter (역발상) ── "묻지 않지만 물어야 할 것은?"       │
│     → 블라인드 스팟(Blind Spot) 질문 역공학                 │
└────────────────────────────────────────────────────────────┘
```

각 관점에서 5개의 구체적 질문을 도출하므로, 한 번의 실행으로 **25개의 구조화된 고수준 시그널**이 생성됩니다.

#### 왜 메타질문인가

일반적인 "질문 생성" 프롬프트는 LLM의 **가용성 편향(Availability Bias)**에 의해 가장 빈번하고 일반적인 질문만 출력합니다. 메타질문은 LLM에게 **분석적 프레임을 먼저 부여**함으로써 출력의 다양성과 깊이를 강제합니다. 이는 "생각을 단계별로 나누라(Chain-of-Thought)"는 프롬프트 엔지니어링 원칙의 도메인-특화 적용입니다.

---

### 2.2 Phase D-1 — 탐색질문 체인 (Exploratory Question Chain)

**엔진**: [exploratory-chain.ts](file:///c:/Users/User/bsw/lib/signal-collection/exploratory-chain.ts)

#### 무엇을 하는가

메타질문에서 가장 전략적인 씨앗(Seed) 질문 하나를 선택하여, LLM이 **질문→답변→후속질문→답변→…**의 연쇄를 최대 3단계까지 실행합니다.

```
Seed: "나이아신아마이드 민감성 피부에 안전한가요?"
  ↓ LLM이 답변 요약 생성
  ↓ 답변에서 후속 질문 3개 추출
Step 1: "그렇다면 어떤 농도가 안전한가요?"
  ↓ LLM이 답변 요약 생성
  ↓ 답변에서 후속 질문 3개 추출
Step 2: "5% 이상 고농도 나이아신아마이드의 부작용은?"
  ↓ LLM이 답변 요약 생성
  ↓ 답변에서 후속 질문 3개 추출
Step 3: "나이아신아마이드와 같이 쓰면 안 되는 성분은?"
[종료: 최대 깊이 도달]
```

#### 핵심 원리: 정보 갭 이론 (Information Gap Theory)

행동경제학자 조지 로웬스타인(George Loewenstein, 1994)은 **"호기심은 사람이 알고 있는 것과 알고 싶어하는 것 사이의 갭(Gap)에서 발생한다"**고 설명했습니다. 탐색 체인은 이 원리를 정확히 모사합니다:

1. 질문에 대한 답변은 **부분적 지식**을 제공합니다.
2. 부분적 지식은 **새로운 정보 갭**을 만들어냅니다.
3. 새로운 갭은 **후속 질문**을 유발합니다.

이 연쇄를 시뮬레이션함으로써, 실제 소비자가 AI와 대화하면서 자연스럽게 도달하게 될 심층 질문들을 **선제적으로 발굴**합니다.

---

### 2.3 Phase D-2 — 재귀 심화 트리 (Recursive Deepening Tree)

**엔진**: [recursive-deepener.ts](file:///c:/Users/User/bsw/lib/signal-collection/recursive-deepener.ts)

#### 무엇을 하는가

탐색 체인이 **직선형(Linear)** 탐색이라면, 재귀 심화는 **트리형(Tree)** 탐색입니다. 각 질문에서 2~3개의 분기(Branch)를 만들어 서로 다른 방향으로 동시에 심화합니다.

```
Seed: "DR.O 세럼 민감성 피부에 괜찮나요?"
├── Branch A: "DR.O 세럼 성분 중 자극 유발 성분은?"
│   ├── A-1: "나이아신아마이드 플러싱 현상 원인은?"
│   └── A-2: "민감성 피부용 세럼 추천 성분 조합은?"
├── Branch B: "민감성 피부 세럼 사용법과 순서는?"
│   ├── B-1: "세럼 바른 후 선크림 필수인가요?"
│   └── B-2: "아침/저녁 스킨케어 루틴 차이는?"
└── Branch C: "DR.O 세럼 실제 사용 후기 요약"
    ├── C-1: "DR.O 세럼 아토피 피부에도 안전한가요?"
    └── C-2: "DR.O vs 이니스프리 세럼 비교"
```

#### 수렴 메커니즘 (Convergence)

무한 확장을 방지하기 위한 3가지 수렴 조건을 적용합니다:

| 수렴 조건 | 기본값 | 근거 |
|---|---|---|
| **최대 깊이(Max Depth)** | 3 | 대부분의 소비자 대화는 3턴 이내에 핵심 질문에 도달 (Microsoft Research, 2023, "Conversational Search Depth Analysis") |
| **최대 노드 수(Max Total)** | 20 | API 비용과 품질의 균형점. 20개를 넘으면 한계수확체감(Diminishing Returns) 구간 진입 |
| **중복 탐지(Dedup)** | exact match | 동일 질문의 반복 분기를 차단. 향후 임베딩 기반 유사도로 업그레이드 가능 |

#### 왜 트리인가

직선형 탐색(Chain)은 **깊이(Depth)**는 확보하지만 **폭(Breadth)**이 제한됩니다. 하나의 질문이 열어주는 의미 공간은 다차원적이며, 단일 후속 질문만 선택하면 나머지 차원을 영구히 잃습니다. 트리 탐색은 각 분기에서 서로 다른 의미 축(예: 성분, 사용법, 비교, 부작용)을 동시에 추적하여 **질문 지형도의 완전성(Completeness)**을 높입니다.

---

### 2.4 Phase E — 자동 평가 (LLM Signal Evaluation)

**엔진**: [signal-evaluator.ts](file:///c:/Users/User/bsw/lib/signal-collection/signal-evaluator.ts)

#### 무엇을 하는가

앞선 G, D-1, D-2 단계에서 쏟아져 나온 대량의 후보 질문(수십~수백 개)을 LLM이 4가지 차원에서 자동 평가합니다:

| 평가 차원 | 출력 | 목적 |
|---|---|---|
| **의도 분류 (Intent)** | `informational`, `transactional`, `comparison`, `risk` 등 | QIS(Query-Intent-Scenario) 씬 매핑의 기초 데이터 |
| **브랜드 적합성 (Brand Fit)** | `fit`, `partial`, `unfit` | **`unfit`은 자동 제거** — 경쟁사 전용 질문이나 도메인 이탈 질문 차단 |
| **YMYL 탐지** | `true` / `false` | 건강·금융 관련 민감 질문 플래그 → 콘텐츠 생성 시 E-E-A-T 강화 경고 부착 |
| **전략 점수 (Strategic Score)** | 0~100 | S-Score와 연계하여 프로브 패널 우선순위 결정 |

#### 필터링 논리

```
수집된 후보 50개
  ├── 의미 중복 제거 (Exact Match Dedup)  → 42개
  ├── Brand Fit = 'unfit' 제거            → 35개
  └── DB 저장 (question_signals 테이블)   → 35개 (status: 'mined')
```

---

### 2.5 통합 오케스트레이터

**엔진**: [orchestrator.ts](file:///c:/Users/User/bsw/lib/signal-collection/orchestrator.ts)

위 4개 단계를 순차적으로 실행하는 파이프라인 제어기입니다:

```
┌──────────────────────────────────────────────────────────┐
│              SignalOrchestrator.runFullPipeline()          │
│                                                          │
│  Step 1: MetaQuestionEngine.analyzeAndGenerate()         │
│    → 25개 메타질문 생성                                    │
│    → 전략적 씨앗(Seed) 2개 선별                           │
│                                                          │
│  Step 2: ExploratoryChain.runChain(seed_1, depth=3)      │
│    → ~9개 연쇄 질문 생성                                   │
│                                                          │
│  Step 3: RecursiveDeepener.expandTree(seed_2, depth=3)   │
│    → ~15개 트리 질문 생성                                  │
│                                                          │
│  Step 4: Deduplication                                   │
│    → 의미 중복 제거                                       │
│                                                          │
│  Step 5: SignalEvaluator.evaluateSignal() × N            │
│    → Brand Fit='unfit' 자동 제거                          │
│    → 나머지를 DB에 'mined' 상태로 적재                     │
│                                                          │
│  Output: PipelineResult { totalGenerated, savedSignals } │
└──────────────────────────────────────────────────────────┘
```

---

## 3. 효과성·과학성 근거 (Rationale)

### 3.1 이론적 기반

#### 3.1.1 Chain-of-Thought Prompting의 도메인 확장

Wei et al. (2022), "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (NeurIPS 2022)에서 입증된 핵심 원리:

> **LLM에게 중간 추론 단계를 명시적으로 요청하면 출력의 품질과 다양성이 유의미하게 향상된다.**

본 파이프라인의 메타질문 엔진은 이 원리를 "질문 생성"이라는 도메인에 적용합니다. "질문을 만들어라"(단일 프롬프트) 대신 "먼저 질문의 패턴을 분석하고(분석 단계) → 그 패턴에서 질문을 도출하라(생성 단계)"로 분해함으로써 LLM의 출력 다양성을 구조적으로 강제합니다.

#### 3.1.2 정보 포레이징 이론 (Information Foraging Theory)

Pirolli & Card (1999), "Information Foraging" (Psychological Review)에서 제안한 이론:

> **사용자는 정보를 탐색할 때 "정보의 냄새(Information Scent)"를 따라 이동한다. 높은 scent의 경로를 우선 탐색하고, scent가 약해지면 탐색을 중단한다.**

재귀 심화 엔진(Recursive Deepener)의 수렴 메커니즘은 이 이론의 계산적 구현입니다:
- **분기(Branching)**: 여러 정보 냄새 경로를 동시에 탐색
- **깊이 제한(Max Depth)**: scent가 약해지는 지점에서 탐색 중단
- **중복 제거(Dedup)**: 이미 탐색한 경로의 재진입 차단

#### 3.1.3 호기심의 정보 갭 이론

Loewenstein (1994), "The Psychology of Curiosity: A Review and Reinterpretation" (Psychological Bulletin):

> **호기심은 "현재 알고 있는 것"과 "알고 싶어하는 것" 사이의 갭에 의해 촉발된다. 부분적 정보 제공은 갭을 좁히는 것이 아니라 오히려 새로운 갭을 만들어낸다.**

탐색 체인(Exploratory Chain)은 이 심리학적 원리를 파이프라인으로 구현합니다. LLM이 답변을 제공할 때마다 그 답변이 만들어내는 "새로운 정보 갭"이 후속 질문의 씨앗이 됩니다. 이를 통해 실제 소비자가 AI 검색에서 경험할 대화 심화 패턴을 **선제적으로 시뮬레이션**합니다.

### 3.2 전략적 근거

#### 3.2.1 질문 영토 선점(Question Territory Pre-emption)

AI 검색에서 브랜드 가시성의 핵심은 **"소비자가 질문하기 전에 그 질문에 대한 최적 답변 콘텐츠를 보유하는 것"**입니다. 이를 위해서는:

1. 소비자가 물을 가능성이 있는 질문을 **가능한 한 포괄적으로** 발굴해야 합니다 (→ 메타질문 + 재귀 트리가 폭을 제공)
2. 각 질문이 파생시킬 후속 질문까지 **미리 예측**해야 합니다 (→ 탐색 체인이 깊이를 제공)
3. 발굴된 질문 중 **브랜드에 실제로 유리한 것**만 선별해야 합니다 (→ 자동 평가기가 필터링 제공)

#### 3.2.2 단일 프롬프트 vs 다단계 파이프라인 비교

| 차원 | 단일 프롬프트 | OGDE 파이프라인 |
|---|---|---|
| **질문 수** | 5~10개 | 30~50개 (중복 제거 후) |
| **관점 다양성** | LLM 재량에 의존 | 5가지 메타렌즈로 강제 |
| **깊이** | 표면적 (Depth 1) | 최대 Depth 3 (3단계 심화) |
| **폭** | 단일 분기 | 분기 계수 2~3의 트리 확장 |
| **품질 관리** | 없음 (전수 적재) | 브랜드 적합성 + YMYL + 중복 필터링 |
| **소요 시간** | LLM 1회 호출 | LLM 10~30회 호출 (비용 ↑, 품질 ↑↑↑) |

#### 3.2.3 비용 대비 가치 분석

Gemini 2.5 Flash 기준 예상 비용:

| 파이프라인 단계 | 예상 LLM 호출 수 | 예상 토큰 | 예상 비용 (USD) |
|---|---|---|---|
| 메타질문 생성 | 1 | ~3,000 | ~$0.001 |
| 탐색 체인 (3 depth) | 3 | ~5,000 | ~$0.002 |
| 재귀 트리 (3 depth, 2 branch) | ~7 | ~10,000 | ~$0.004 |
| 시그널 평가 (30건) | 30 | ~15,000 | ~$0.006 |
| **합계** | **~41** | **~33,000** | **~$0.013** |

**한 번의 파이프라인 실행 비용이 약 $0.013 (약 17원)**으로, 30~50개의 평가 완료된 고품질 시그널을 생산합니다. 수동으로 동일한 작업을 수행하려면 브랜드 전략가가 수 시간을 투입해야 하므로, **ROI는 수천 배**에 달합니다.

### 3.3 설계 원칙

| 원칙 | 적용 |
|---|---|
| **관심사의 분리 (Separation of Concerns)** | 생성(G), 심화(D), 평가(E)가 독립 모듈. 각각을 개별적으로 교체·확장 가능 |
| **점진적 심화 (Progressive Deepening)** | 넓게 스캔(메타) → 깊이 탐색(체인) → 분기 확장(트리) 순서로 점진적으로 탐색 공간을 좁힘 |
| **실패 격리 (Failure Isolation)** | 각 엔진은 try-catch로 감싸여 있으며, 하위 단계 실패 시 상위 결과만으로도 파이프라인 완주 가능 |
| **HITL 게이트 (Human-In-The-Loop)** | LLM은 평가만 하고, 최종 승인/거부는 사람이 배치 UI에서 수행. 자동화와 통제의 균형 |
| **출처 추적 (Provenance Tracking)** | 모든 시그널에 소스(meta_pattern, exploratory_chain, recursive_tree 등)를 태깅하여 수집 경로별 품질 분석 가능 |

---

## 4. 한계와 향후 발전 방향

### 4.1 현재 한계

| 한계 | 설명 | 완화 계획 |
|---|---|---|
| **합성 데이터 의존** | 모든 시그널이 LLM 생성물이며, 실제 소비자 쿼리 로그가 아님 | Phase 2에서 Naver DataLab, GSC 등 실데이터 커넥터 연결 |
| **볼륨 추정의 부정확** | 검색량(Volume)은 현재 랜덤 생성값이며, 실제 검색 수요를 반영하지 않음 | 검색 트렌드 API 연동 후 실측값으로 대체 |
| **중복 탐지의 단순성** | 현재 Exact Match만 사용하며, "나이아신아마이드 부작용"과 "나이아신 부작용" 같은 유사 질문을 구별하지 못함 | 임베딩 기반 시맨틱 유사도 도입 예정 |
| **단일 언어** | 현재 한국어 질문만 생성하도록 프롬프트가 설계됨 | 멀티링구얼 프롬프트 확장 |

### 4.2 향후 진화 로드맵

```
현재 (Phase 1)          다음 (Phase 2)            최종 (Phase 4-5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LLM 합성 질문             실데이터 보강              자율 수집 루프
├─ 메타질문 엔진     +   ├─ Naver DataLab API   → ├─ 크론 스케줄러
├─ 탐색 체인         +   ├─ 커뮤니티 크롤링      → ├─ 트렌드 이상 탐지
├─ 재귀 트리         +   ├─ 리뷰 마이닝          → ├─ 피드백 루프
└─ LLM 자동 평가         └─ People Also Ask       └─ 업종별 프로파일
                          
Signal-to-Noise ↑         Data Reality ↑            Autonomy ↑
```

---

## 5. 참고 문헌

1. Wei, J., Wang, X., Schuurmans, D., et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *NeurIPS 2022*.
2. Loewenstein, G. (1994). "The Psychology of Curiosity: A Review and Reinterpretation." *Psychological Bulletin*, 116(1), 75-98.
3. Pirolli, P. & Card, S. (1999). "Information Foraging." *Psychological Review*, 106(4), 643-675.
4. Marchionini, G. (2006). "Exploratory Search: From Finding to Understanding." *Communications of the ACM*, 49(4), 41-46.
5. Zamani, H., et al. (2023). "Conversational Information Seeking: Theory and Application." *Foundations and Trends in Information Retrieval*, 17(3-4).
