# K-Culture Intelligence OS — Commercial PRD & SDD v1.0
**Repo-Ready Specification for AI-Pair Coding**

문서 목적: 이 문서는 `K-Culture Intelligence OS`를 상용 SaaS 수준으로 개발하기 위한 **PRD(Product Requirements Document)**와 **SDD(System Design Document)**를 하나의 LLM 레포 참조 문서로 통합한 것이다.  
AI-pair coding 도구가 바로 구현 명세로 사용할 수 있도록 제품 범위, 도메인 모델, 데이터 스키마, API, 워크플로우, LLM 프롬프트 계약, 지표 산식, 보안/거버넌스, 백로그를 구조화한다.

---

## 0. Executive Summary

### 0.1 Product Name
```text
K-Culture Intelligence OS
```

### 0.2 One-Line Definition
```text
K-Culture Intelligence OS는 K-beauty, K-food, K-local tourism, K-pop, K-drama, K-fashion, K-webtoon 등 K-컬처 도메인의 문화 개념·정체성·정동·소비·팬덤 패턴을 TCO 기반 문화 개념 텐서와 LLM 반복 평가 Harness로 측정하고, 글로벌 공명도·왜곡 위험·상품화/관광화/콘텐츠화 기회를 도출하는 문화 MeaningOps 플랫폼이다.
```

### 0.3 Core Thesis
```text
문화는 콘텐츠 목록이 아니라 집단의 의미 어트랙터 장이다.
K-컬처는 글로벌 플랫폼과 AI 응답공간에서 재구성되는 동적 문화 어트랙터 네트워크다.
```

### 0.4 Commercial Product Positioning
```text
K-Culture Intelligence OS는 K-컬처가 글로벌 소비자와 AI에게 어떻게 이해되고,
어디서 공명하며,
어디서 왜곡되고,
어떤 상품·관광·콘텐츠·브랜드 기회로 전이되는지를 측정하는
AI 문화 인텔리전스 OS다.
```

---

## 1. Strategic Context

### 1.1 Market Problem

K-컬처는 이미 글로벌 확산력을 갖고 있지만, 기관·브랜드·콘텐츠 기업은 다음 문제를 겪는다.

1. K-컬처의 핵심 문화 개념이 국가·문화권·세대별로 어떻게 다르게 이해되는지 구조적으로 측정하기 어렵다.
2. SNS 언급량이나 검색량은 알 수 있지만, 그 뒤의 욕망·불안·정체성·문화 공명 구조는 설명하기 어렵다.
3. LLM과 AI 검색이 K-컬처를 어떻게 설명·추천·왜곡하는지 측정하기 어렵다.
4. 문화 트렌드를 상품기획, 관광 코스, 브랜드 메시지, Answer Card, AI홈피 SSoT로 전환하기 어렵다.
5. 문화 왜곡, 고정관념, 오리엔탈리즘, 외모 일반화, 효능 과장, 정치·역사·종교 민감성 리스크를 사전에 감지하기 어렵다.

### 1.2 Product Opportunity

기존 트렌드 분석은 주로 “무엇이 뜨는가”를 묻는다.  
K-Culture Intelligence OS는 다음을 묻는다.

```text
어떤 문화 개념이 반복적으로 활성화되는가?
그 개념은 어떤 정동·정체성·소비 욕망과 공명하는가?
국가·문화권·마이크로그룹별로 어떻게 다르게 번역되는가?
AI 응답공간에서 어떤 방식으로 재구성·왜곡되는가?
상품·관광·콘텐츠·브랜드 전략으로 전이될 가능성은 얼마인가?
SSoT/Answer Card 개입 후 문화 개념 충실도와 Floor Risk는 개선되는가?
```

### 1.3 Differentiation

| 기존 접근 | 강점 | 한계 | K-Culture Intelligence OS의 보완 |
|---|---|---|---|
| 트렌드 리포트 | 해석력, 명명력 | 반복 측정·자동화·개입 효과 검증 부족 | 문화 어트랙터와 지표 기반 재현 가능 분석 |
| 빅데이터 분석 | 언급량·검색량·시계열 | 의미 구조·공명/상쇄 해석 약함 | TCO 기반 개념 정본화와 관계 분석 |
| 문화심리학 | 이론·척도·비교문화 연구 | 실시간 산업 적용·AI 응답공간 분석 부족 | LLM-mediated 문화 의미장 측정 |
| AEO/GEO 도구 | 노출·인용 지표 | 문화 개념 충실도·왜곡 위험 평가 약함 | Cultural GEO / AI Answer Intelligence |

---

## 2. Product Vision & Goals

### 2.1 Vision
```text
K-컬처를 단순 트렌드 키워드가 아니라 문화 개념 어트랙터와 글로벌 공명 분포로 분석하고,
이를 상품기획·관광전략·콘텐츠전략·브랜드 SSoT·AEO/GEO Answer Card로 전환하는 문화 MeaningOps 플랫폼을 구축한다.
```

### 2.2 Product Goals

#### G1. Cultural Concept Canonicalization
“감성”, “정”, “청량”, “자연스러움”, “K-로컬”, “루틴”, “힙함” 같은 다의적 문화 표현을 TCO 기반 개념 엔티티로 정본화한다.

#### G2. Cross-Cultural Resonance Measurement
문화권·국가·언어·세대·팬덤·소비자 마이크로그룹별 문화 공명도를 측정한다.

#### G3. Cultural GEO / AI Answer Evaluation
LLM과 AI 검색이 K-컬처를 어떻게 설명하고, 어디서 누락·왜곡·고정관념화하는지 반복 측정한다.

#### G4. Cultural Opportunity Generation
문화 어트랙터를 제품 콘셉트, 관광 코스, 콘텐츠 훅, 브랜드 메시지, AI홈피 Answer Card로 전환한다.

#### G5. Risk & Distortion Governance
문화 왜곡, 고정관념, 효능 과장, 정치·역사·종교 민감성, 규제 리스크를 Floor Risk 중심으로 관리한다.

---

## 3. Product Scope

### 3.1 MVP Domains

v1.0 MVP는 다음 3개 도메인에 집중한다.

```text
1. K-beauty
2. K-food
3. K-local tourism
```

선정 이유:

- **K-beauty**: 글로벌 커머스, 브랜드 SSoT, 제품 콘셉트, AEO/GEO와 직접 연결된다.
- **K-food**: 문화 번역, 패키지, 관광, 지역브랜드, 수출 마케팅과 연결된다.
- **K-local tourism**: 지자체 AI홈피, 지역 SSoT, 외국인 관광 Answer Card와 연결된다.

### 3.2 Post-MVP Domains

```text
K-pop
K-drama
K-webtoon
K-fashion
K-wellness
K-language learning
K-design
K-fandom
```

### 3.3 In Scope

- Project workspace
- Domain Pack Manager
- Cultural Concept Studio
- QBS Builder
- LLM Eval Runner
- Concept Extractor
- Cultural Judge
- Metrics Aggregator
- Attractor Map
- Cross-Cultural Resonance Dashboard
- Risk & Distortion Monitor
- Product/Tourism Opportunity Engine
- Cultural SSoT / Answer Card Studio
- Markdown/PDF report generation
- Human review workflow

### 3.4 Out of Scope for v1.0

- Full-scale social listening crawler
- Paid commerce/card transaction data integration
- Enterprise SSO
- Fully automated multilingual human panel
- Advanced image/video multimodal culture analysis
- Official government statistics certification
- Real-time alerting across all global platforms

---

## 4. User Personas

### 4.1 Persona A — K-Beauty Global Brand Manager

```yaml
goals:
  - 국가별 K-beauty 메시지 공명도 확인
  - 제품 콘셉트와 상세페이지 메시지 도출
  - AI 검색에서 브랜드가 올바르게 설명되도록 Answer Card 구축
pains:
  - K-beauty가 아이돌 외모나 10-step 루틴으로 단순화됨
  - 효능 표현 과장/규제 리스크
  - 글로벌 소비자가 실제로 어떤 문화 코드에 공명하는지 불명확
needed_outputs:
  - Cross-cultural resonance report
  - Product opportunity concepts
  - Cultural GEO audit
  - Answer Card backlog
```

### 4.2 Persona B — Local Tourism Officer

```yaml
goals:
  - 지역 문화 자산을 글로벌 관광 상품으로 전환
  - 외국인 대상 AI 관광 Answer Card 구축
  - 서울/부산/제주 외 지역만의 K-local 매력 설명
pains:
  - 지역 문화 코드가 글로벌 언어로 번역되지 않음
  - 지자체 홈페이지가 AI 검색에 적합하지 않음
  - 관광 코스와 문화 내러티브 연결 부족
needed_outputs:
  - Local cultural attractor map
  - Target traveler microgroup analysis
  - Tourism route concepts
  - Cultural SSoT / Answer Cards
```

### 4.3 Persona C — Content/IP Strategist

```yaml
goals:
  - K-drama/K-webtoon/K-pop IP의 글로벌 공명 코드 파악
  - 캐릭터·서사·팬덤·상품화 포인트 도출
pains:
  - 데이터는 많지만 왜 공명하는지 설명이 어려움
  - 국가별 오해/왜곡 위험이 존재
needed_outputs:
  - Narrative/character attractor map
  - Fandom identity analysis
  - IP product opportunity report
```

### 4.4 Persona D — Researcher / Policy Analyst

```yaml
goals:
  - K-culture global diffusion을 학술적으로 측정
  - 문화 개념과 AI 응답공간의 관계 분석
pains:
  - 문화심리학, 소비자학, 빅데이터 분석이 분절됨
  - LLM-mediated culture analysis 방법론 부족
needed_outputs:
  - Dataset / benchmark
  - Metric report
  - Reproducible eval logs
```

---

## 5. Product Modules

### 5.1 Module Overview

```text
M1. Project Workspace
M2. Domain Pack Manager
M3. Cultural Concept Studio
M4. QBS Builder
M5. Eval Runner
M6. Concept Extractor
M7. Cultural Judge
M8. Metrics Aggregator
M9. Attractor Map
M10. Cross-Cultural Resonance Engine
M11. Risk & Distortion Monitor
M12. Opportunity Engine
M13. Cultural SSoT / Answer Card Studio
M14. Report Generator
M15. Human Review Console
```

---

## 6. Functional Requirements

### FR1. Project Workspace

#### Description
사용자는 분석 대상 브랜드/기관/지역/IP를 프로젝트 단위로 생성하고 관리할 수 있어야 한다.

#### Core Fields
```yaml
project:
  id: uuid
  organization_id: uuid
  name: string
  client_name: string
  domain_pack_id: uuid
  target_markets: string[]
  languages: string[]
  analysis_goals: string[]
  status: draft | active | running | reviewed | delivered | archived
  created_by: uuid
  created_at: datetime
  updated_at: datetime
```

#### User Stories
- Analyst는 K-beauty 브랜드 분석 프로젝트를 생성할 수 있다.
- Analyst는 타깃 시장을 US, Japan, Southeast Asia 등으로 지정할 수 있다.
- Client는 전달 완료된 리포트만 볼 수 있다.

#### Acceptance Criteria
- 프로젝트 생성은 필수값 누락 시 저장되지 않는다.
- 프로젝트는 반드시 하나의 Domain Pack과 연결된다.
- 프로젝트 대시보드는 QBS 수, Run 수, 평균 점수, 리스크 상태를 표시한다.

---

### FR2. Domain Pack Manager

#### Description
Admin/Expert는 K-컬처 도메인별 개념 유형, 평가 축, 금지 표현, 기본 QBS 템플릿, 리스크 정책을 관리한다.

#### Domain Pack Schema
```yaml
domain_pack:
  id: uuid
  slug: string
  name: string
  description: string
  version: string
  supported_languages: string[]
  concept_types: json
  rating_axes: json
  forbidden_patterns: json
  risk_policies: json
  default_qbs_templates: json
  status: draft | active | archived
```

#### MVP Seed Domain Packs

##### K-Beauty
```yaml
concept_types:
  - aesthetic_code
  - skincare_ritual
  - product_benefit
  - trust_signal
  - influencer_signal
  - risk_signal
  - cultural_affect
rating_axes:
  - cultural_concept_fidelity
  - cross_cultural_resonance
  - purchase_appeal
  - stereotype_distortion
  - exaggeration_risk
  - commercial_transferability
```

##### K-Food
```yaml
concept_types:
  - taste_code
  - ingredient_culture
  - eating_ritual
  - communal_affect
  - wellness_association
  - packaging_signal
  - risk_signal
```

##### K-Local Tourism
```yaml
concept_types:
  - place_affect
  - local_story
  - food_place_link
  - drama_location_signal
  - photo_spot_signal
  - route_experience
  - risk_signal
```

#### Acceptance Criteria
- Admin은 도메인 팩을 draft에서 active로 변경할 수 있다.
- active 도메인 팩만 프로젝트 생성 시 선택 가능하다.
- 버전 변경 시 기존 프로젝트는 기존 버전을 유지한다.

---

### FR3. Cultural Concept Studio

#### Description
사용자는 문화 개념을 TCO Concept Entity로 생성·편집·검수할 수 있다.

#### Concept Entity Schema
```yaml
cultural_concept:
  id: uuid
  concept_id: string
  domain_pack_id: uuid
  version: string
  status: draft | active | deprecated

  preferred_label: json
  aliases: json
  concept_type: string

  definition: text
  defining_attributes: json
  boundary_conditions: json

  parent_concepts: string[]
  relation_edges: json

  affective_vector: json
  risk_vector: json
  commerce_vector: json
  identity_vector: json

  evidence_sources: json
  governance: json
  action_policies: json

  created_by: uuid
  reviewed_by: uuid
  created_at: datetime
  updated_at: datetime
```

#### Example
```yaml
concept_id: kbeauty.aesthetic.natural_glow
preferred_label:
  ko: 자연스러운 광채
  en: natural glow
concept_type: aesthetic_code
definition: 루틴 기반 자기관리와 건강한 피부감을 통해 느껴지는 과하지 않은 피부 광채 코드
defining_attributes:
  - non-heavy makeup
  - healthy-looking skin
  - routine-based skincare
  - subtle radiance
boundary_conditions:
  not_same_as:
    - artificial glitter
    - medical whitening claim
    - idol-only beauty standard
risk_vector:
  stereotype_risk: 0.20
  exaggeration_risk: 0.34
  medical_claim_risk: 0.42
commerce_vector:
  purchase_appeal: 0.76
  routine_fit: 0.81
  global_transferability: 0.72
action_policies:
  answer_policy:
    boundary_note_required: true
  cta_policy:
    product_guide: allowed
    medical_claim: restricted
```

#### LLM Draft Prompt
```text
You are a K-Culture TCO concept architect.

Task:
Convert the following cultural expression into a canonical TCO concept entity.

Input:
- term: {term}
- domain: {domain}
- target_market: {target_market}
- language: {language}

Return JSON:
{
  "concept_id": "...",
  "preferred_label": {"ko": "...", "en": "..."},
  "aliases": {"ko": [], "en": []},
  "concept_type": "...",
  "definition": "...",
  "defining_attributes": [],
  "boundary_conditions": {
    "not_same_as": [],
    "requires_boundary_note": []
  },
  "related_concepts": {
    "complements": [],
    "conflicts_with": []
  },
  "risk_vector": {
    "stereotype_risk": 0.0,
    "exaggeration_risk": 0.0,
    "sensitivity_risk": 0.0
  },
  "action_policies": {
    "answer_policy": {},
    "cta_policy": {},
    "geo_policy": {}
  }
}
```

#### Acceptance Criteria
- LLM draft는 반드시 JSON parse 가능해야 한다.
- Expert 승인 전 개념은 `draft` 상태이며 공식 Judge에 기본 사용되지 않는다.
- active concept은 QBS, Judge, Report에서 참조 가능하다.

---

### FR4. QBS Builder

#### Description
QBS(Question Benchmark Set)는 문화 개념이 LLM 응답에서 어떻게 재구성되는지 반복 측정하기 위한 표준 질문 세트다.

#### QBS Schema
```yaml
qbs_item:
  id: uuid
  project_id: uuid
  domain_pack_id: uuid
  query_text: string
  language: string
  intent_type: informational | comparison | trust | cultural_context | product_opportunity | risk | tourism | strategy
  target_market: string
  target_microgroup: string | null

  required_concepts: string[]
  optional_concepts: string[]
  forbidden_concepts: string[]

  expected_policy: json
  risk_level: low | medium | high | critical
  status: draft | active | archived
```

#### QBS Generation Prompt
```text
You are a K-Culture Intelligence QBS designer.

Generate {n} benchmark questions for the following analysis.

Domain: {domain}
Target market: {target_market}
Analysis goal: {analysis_goal}
Available concepts: {concept_list}

Requirements:
- Questions must reflect real user/AI-search queries.
- Cover informational, comparison, trust, risk, product opportunity, and strategy intents.
- For each question, assign required_concepts, optional_concepts, forbidden_concepts.
- Assign risk_level.
- Output valid JSON array only.
```

#### Acceptance Criteria
- Analyst는 QBS를 수동 생성/LLM 생성/CSV 업로드 방식으로 만들 수 있다.
- QBS는 intent_type별 필터링 가능하다.
- QBS는 required/forbidden concepts를 가져야 Eval에 포함된다.

---

### FR5. Eval Runner

#### Description
QBS 질문을 지정한 LLM API에 반복 실행하고, Baseline/Intervention 조건별 응답 로그를 저장한다.

#### Run Config
```yaml
run_config:
  id: uuid
  project_id: uuid
  condition: baseline | ssot_intervention | answer_card_intervention | policy_intervention
  models: string[]
  repetitions_per_query: integer
  temperature: number
  top_p: number
  max_tokens: integer
  system_prompt: string
  context_pack_id: uuid | null
  qbs_ids: string[]
```

#### Condition Types

| Condition | Meaning |
|---|---|
| baseline | 일반 모델 또는 기존 웹/브랜드 요약만 제공 |
| ssot_intervention | Cultural SSoT와 핵심 개념 정의 제공 |
| answer_card_intervention | SSoT + 질문별 Answer Card 제공 |
| policy_intervention | SSoT + Answer Card + risk/action policy 제공 |

#### Eval Run Schema
```yaml
eval_run:
  id: uuid
  project_id: uuid
  qbs_item_id: uuid
  condition: string
  model: string
  repetition_index: integer
  prompt_payload: json
  response_text: text
  token_usage: json
  latency_ms: integer
  status: success | failed | retried
  error: json | null
  created_at: datetime
```

#### Acceptance Criteria
- 동일 QBS를 모델별·조건별·반복횟수별 실행할 수 있다.
- 실패한 run은 재시도 가능하다.
- 모든 prompt/response는 감사 추적 가능해야 한다.
- 최소 v1.0은 OpenAI 및 Gemini provider abstraction을 지원한다.

---

### FR6. Cultural Concept Extractor

#### Description
LLM 응답에서 문화 개념, 관계, 위험 표현, CTA, 근거 문장을 추출한다.

#### Extractor Output
```yaml
concept_extraction:
  id: uuid
  eval_run_id: uuid
  extracted_concepts:
    - concept_id: string
      matched_expression: string
      confidence: number
      position_rank: integer
      span: string
  relations:
    - subject_concept: string
      relation: supports | conflicts_with | explains | causes | enables | risks | translates_to | commercializes_as
      object_concept: string
      confidence: number
  risk_expressions: json
  cta_expressions: json
  evidence_expressions: json
  extractor_model: string
  created_at: datetime
```

#### Extractor Prompt
```text
You are a K-Culture TCO concept extractor.

Given:
- Domain concept list
- QBS question
- AI response

Extract:
1. Cultural concepts that match the approved concept list.
2. Relation edges between concepts.
3. Risk expressions.
4. CTA expressions.
5. Evidence/source expressions.

Return valid JSON:
{
  "extracted_concepts": [
    {
      "concept_id": "...",
      "matched_expression": "...",
      "confidence": 0.0,
      "position_rank": 1,
      "span": "..."
    }
  ],
  "relations": [
    {
      "subject_concept": "...",
      "relation": "supports",
      "object_concept": "...",
      "confidence": 0.0
    }
  ],
  "risk_expressions": [],
  "cta_expressions": [],
  "evidence_expressions": []
}
```

---

### FR7. Cultural Judge

#### Description
응답의 문화 개념 충실도, 문화권 공명도, 왜곡 위험, 상품화 가능성, Floor Risk, 정책 정렬을 평가한다.

#### Judge Result Schema
```yaml
judge_result:
  id: uuid
  eval_run_id: uuid
  scores:
    cultural_concept_fidelity: number
    cross_cultural_resonance: number
    stereotype_distortion_rate: number
    commercial_transferability: number
    floor_risk: number
    policy_alignment: number
  missing_concepts: json
  distortion_items: json
  risk_items: json
  improvement_suggestions: json
  judge_model: string
  human_review_status: pending | approved | corrected | rejected
  created_at: datetime
```

#### Judge Prompt
```text
You are a K-Culture Intelligence evaluator.

Evaluate the AI response using the K-Culture TCO criteria.

Question:
{query_text}

Target market:
{target_market}

Required concepts:
{required_concepts}

Forbidden concepts:
{forbidden_concepts}

Concept definitions:
{concept_definitions}

Expected policy:
{expected_policy}

AI response:
{response_text}

Return valid JSON:
{
  "scores": {
    "cultural_concept_fidelity": 0.0,
    "cross_cultural_resonance": 0.0,
    "stereotype_distortion_rate": 0.0,
    "commercial_transferability": 0.0,
    "floor_risk": 0.0,
    "policy_alignment": 0.0
  },
  "missing_concepts": [],
  "distortion_items": [
    {
      "type": "...",
      "expression": "...",
      "severity": 0.0,
      "reason": "...",
      "safer_alternative": "..."
    }
  ],
  "risk_items": [],
  "improvement_suggestions": []
}
```

---

### FR8. Metrics Aggregator

#### Description
run-level Judge 결과를 question-level, condition-level, project-level 지표로 집계한다.

#### Core Metrics

| Metric | Definition |
|---|---|
| Cultural Concept Fidelity | 응답이 문화 개념 정의·경계·관계를 정확히 재구성한 정도 |
| Cross-Cultural Resonance | 특정 시장/문화권에서 정동·정체성·소비 맥락과 공명하는 정도 |
| Stereotype Distortion Rate | 고정관념·과장·일반화·오리엔탈리즘 왜곡 비율 |
| Missing Cultural Context Gap | 반복적으로 누락되는 필수 문화 개념 |
| Cultural Drift Score | 시간·모델·시장·질문 변화에 따른 개념 분포 이동 |
| Commercial Transferability | 상품·관광·콘텐츠 전략으로 전환될 가능성 |
| Floor Risk | 최악의 응답 tail에서 발생하는 위험도 |
| Policy Alignment | 답변·CTA·근거·안전 정책 정렬도 |

#### Metric Formulas

```text
Cultural Concept Fidelity =
0.40 * Required Concept Transfer
+ 0.20 * Relation Accuracy
+ 0.20 * Boundary Condition Respect
+ 0.10 * Evidence Fit
+ 0.10 * Policy Fit

Cross-Cultural Resonance =
0.30 * Affective Fit
+ 0.25 * Identity Fit
+ 0.20 * Context Translation Fit
+ 0.15 * Commercial Fit
+ 0.10 * Low Friction

Stereotype Distortion Rate =
distorted_cultural_claims / total_cultural_claims

Missing Cultural Context Gap =
required concepts with recall_rate below threshold
critical threshold: 0.80
important threshold: 0.60

Cultural Drift Score =
Distance(Concept Distribution A, Concept Distribution B)

Floor Risk =
average risk score of top 5-10% riskiest runs
```

#### Aggregated Summary Schema
```yaml
metric_summary:
  id: uuid
  project_id: uuid
  condition: string
  model: string | all
  scope: project | qbs_item | intent_type | market
  metrics: json
  top_missing_concepts: json
  top_risk_items: json
  top_opportunities: json
  created_at: datetime
```

---

### FR9. Attractor Map

#### Description
문화 개념의 중심/주변/위험/기회 노드와 관계를 시각화한다.

#### Node Types
```text
core_cultural_concept
peripheral_concept
risk_concept
product_opportunity_concept
tourism_opportunity_concept
market_specific_resonance_concept
```

#### Edge Types
```text
supports
conflicts_with
translates_to
commercializes_as
risks
requires_boundary_note
enables
```

#### Attractor Map Schema
```yaml
attractor_map:
  project_id: uuid
  nodes:
    - id: string
      label: string
      node_type: string
      score: number
      risk_score: number
      metadata: json
  edges:
    - source: string
      target: string
      edge_type: string
      weight: number
      evidence: json
```

#### Acceptance Criteria
- 사용자는 도메인/시장/리스크/기회 점수로 노드 필터링 가능하다.
- 노드 클릭 시 개념 정의, 등장 질문, 응답 예시, 리스크, 기회가 표시된다.
- 초기 구현은 React Flow 또는 Cytoscape.js 중 하나를 사용한다.

---

### FR10. Cross-Cultural Resonance Engine

#### Description
국가/문화권/마이크로그룹별 문화 개념 공명도를 비교한다.

#### Input
```yaml
resonance_request:
  project_id: uuid
  concept_ids: string[]
  markets: string[]
  microgroups: string[]
  evidence_context: text | null
```

#### Output
```yaml
resonance_result:
  concept_id: string
  market: string
  microgroup: string
  resonance_score: number
  translation_fit: number
  identity_adoption_potential: number
  misinterpretation_risk: number
  commercial_convertibility: number
  recommended_message: string
```

---

### FR11. Risk & Distortion Monitor

#### Description
문화 왜곡, 민감성, 고정관념, 과장 리스크를 탐지하고 개선안을 제안한다.

#### Risk Types
```text
stereotype_risk
orientalism_risk
overgeneralization_risk
medical_or_efficacy_claim_risk
gender_sensitivity_risk
political_historical_sensitivity_risk
religious_sensitivity_risk
cultural_appropriation_risk
brand_trust_risk
```

#### Risk Item Schema
```yaml
risk_item:
  id: uuid
  project_id: uuid
  eval_run_id: uuid
  risk_type: string
  severity: number
  expression: string
  reason: string
  safer_alternative: string
  human_review_required: boolean
  status: open | reviewed | resolved | ignored
```

#### Acceptance Criteria
- severity ≥ 0.7인 risk_item은 Human Review Required로 표시된다.
- Risk Monitor는 위험 표현과 안전한 대안 문장을 함께 보여준다.
- 정치·역사·종교 민감성은 기본적으로 human review required다.

---

### FR12. Opportunity Engine

#### Description
문화 어트랙터를 상품 콘셉트, 관광 코스, 콘텐츠 훅, Answer Card 주제로 전환한다.

#### Opportunity Types
```text
product_concept
tourism_route
content_hook
answer_card_topic
brand_message
package_message
campaign_idea
```

#### Opportunity Schema
```yaml
opportunity:
  id: uuid
  project_id: uuid
  opportunity_type: string
  title: string
  description: string
  target_market: string
  target_microgroup: string
  linked_concepts: string[]
  resonance_score: number
  commercial_transferability: number
  risk_score: number
  recommended_actions: string[]
  source_evidence: json
```

#### Opportunity Generation Prompt
```text
You are a K-Culture product and tourism strategist.

Given:
- Domain: {domain}
- Target market: {target_market}
- High-resonance cultural concepts: {concepts}
- Risk items: {risk_items}
- Analysis goal: {analysis_goal}

Generate actionable opportunities.

Return JSON:
{
  "opportunities": [
    {
      "opportunity_type": "product_concept | tourism_route | content_hook | answer_card_topic | brand_message",
      "title": "...",
      "description": "...",
      "target_microgroup": "...",
      "linked_concepts": [],
      "resonance_rationale": "...",
      "risk_notes": [],
      "recommended_actions": []
    }
  ]
}
```

---

### FR13. Cultural SSoT / Answer Card Studio

#### Description
공식 문화 지식 원장과 질문별 Answer Card를 생성·편집·승인한다.

#### Answer Card Schema
```yaml
answer_card:
  id: uuid
  project_id: uuid
  domain_pack_id: uuid
  question: string
  short_answer: string
  detailed_answer: string
  required_concepts: string[]
  evidence_sources: json
  cultural_boundary_notes: string[]
  cta_policy: json
  geo_metadata: json
  status: draft | reviewed | approved | published
```

#### Answer Card Generation Prompt
```text
You are a K-Culture Answer Card writer.

Create an Answer Card for the following question.

Question:
{question}

Required concepts:
{required_concepts}

Cultural boundaries:
{boundary_notes}

Target market:
{target_market}

Output:
{
  "question": "...",
  "short_answer": "...",
  "detailed_answer": "...",
  "required_concepts_used": [],
  "boundary_notes": [],
  "cta_policy": {},
  "geo_metadata": {}
}
```

---

### FR14. Report Generator

#### Description
분석 결과를 Markdown/PDF/PPTX-ready 구조로 생성한다.

#### Report Types
```text
K-Culture Attractor Report
K-Beauty Product Opportunity Report
K-Food Globalization Report
K-Local Tourism Strategy Report
Cultural GEO Audit Report
Risk & Distortion Report
Executive Briefing
```

#### Report Schema
```yaml
report:
  id: uuid
  project_id: uuid
  report_type: string
  title: string
  content_markdown: text
  source_metric_summary_id: uuid
  generated_by: uuid | ai
  status: draft | reviewed | delivered
  created_at: datetime
```

#### Report Template: Cultural GEO Audit
```markdown
# Cultural GEO Audit Report

## 1. Executive Summary
## 2. Analysis Scope
## 3. QBS and Run Configuration
## 4. Cultural Concept Fidelity
## 5. Missing Cultural Context Gap
## 6. Stereotype Distortion and Floor Risk
## 7. Baseline vs Intervention
## 8. Answer Card Backlog
## 9. Recommended Cultural SSoT Updates
## 10. 30-Day Action Plan
```

---

### FR15. Human Review Console

#### Description
전문가와 현지 리뷰어가 개념, Judge 결과, 위험 표현, Answer Card를 검수한다.

#### Review Object Types
```text
cultural_concept
judge_result
risk_item
answer_card
report
opportunity
```

#### Review Schema
```yaml
human_review:
  id: uuid
  object_type: string
  object_id: uuid
  reviewer_id: uuid
  review_status: approved | corrected | rejected | needs_discussion
  comments: text
  correction_payload: json
  created_at: datetime
```

#### Acceptance Criteria
- Reviewer는 자신에게 배정된 검수 항목만 볼 수 있다.
- 수정 payload는 원본과 분리 저장된다.
- 승인 이력은 audit log에 남는다.

---

## 7. Non-Functional Requirements

### 7.1 Performance

```text
Lite project: 20 QBS × 2 models × 3 repetitions = 120 runs, target completion < 20 min
Standard project: 50 QBS × 2 models × 5 repetitions = 500 runs, async completion < 2 hr
Pro project: 100 QBS × 3 models × 10 repetitions = 3000 runs, async batch mode
```

### 7.2 Reliability

- 모든 Eval Job은 idempotent하게 재시도 가능해야 한다.
- LLM provider 장애 시 job status를 `failed_provider_error`로 기록한다.
- 부분 완료 결과도 대시보드에서 볼 수 있어야 한다.

### 7.3 Explainability

- 모든 점수는 관련 run_id, response span, concept_id, judge reason을 가져야 한다.
- 리포트의 모든 주요 주장에는 supporting runs 또는 concept evidence가 연결되어야 한다.

### 7.4 Security

- Organization-level multi-tenancy
- Row Level Security in Supabase
- Client confidential data isolation
- API keys stored in server-side secret manager
- Audit logs for review/approval/report delivery

### 7.5 Governance

- 민감 문화 주제는 Human Review 필수
- 의료·효능·식품 기능성 관련 표현은 risk policy 적용
- 국가/민족/종교/성별에 대한 본질주의적 표현 제한
- 고위험 리포트는 Expert approval 전 delivery 불가

### 7.6 Localization

MVP:
```text
ko, en
```

Phase 2:
```text
ja, zh, th, vi, id, ar, es
```

---

## 8. System Design Document

## 8.1 Architecture Overview

```text
Frontend: Next.js + shadcn/ui + Tailwind
Backend API: Next.js Route Handlers or FastAPI
Database: Supabase Postgres
Auth: Supabase Auth
Storage: Supabase Storage
AI Providers: OpenAI API, Gemini API
Workflow: LangGraph or queue-based worker
Visualization: React Flow / Cytoscape.js, Recharts / ECharts
Deployment: Vercel + Supabase
```

## 8.2 Logical Architecture

```text
[Web App]
  ├─ Project Dashboard
  ├─ Concept Studio
  ├─ QBS Builder
  ├─ Eval Dashboard
  ├─ Attractor Map
  ├─ Risk Monitor
  ├─ Report Studio
  └─ Review Console

[API Layer]
  ├─ Project API
  ├─ Domain Pack API
  ├─ Concept API
  ├─ QBS API
  ├─ Eval Job API
  ├─ Judge API
  ├─ Metric API
  ├─ Report API
  └─ Review API

[AI Workflow Layer]
  ├─ QBS Generation Node
  ├─ Eval Runner Node
  ├─ Concept Extractor Node
  ├─ Cultural Judge Node
  ├─ Metric Aggregator Node
  ├─ Opportunity Generator Node
  └─ Report Writer Node

[Data Layer]
  ├─ Supabase Postgres
  ├─ Supabase Storage
  └─ Audit Logs
```

---

## 8.3 Recommended Repo Structure

```text
kculture-intelligence-os/
├─ README.md
├─ docs/
│  ├─ 00-product/
│  │  ├─ prd.md
│  │  ├─ commercial-positioning.md
│  │  └─ user-personas.md
│  ├─ 01-domain/
│  │  ├─ cultural-tco-schema.md
│  │  ├─ domain-packs.md
│  │  ├─ kbeauty-pack.md
│  │  ├─ kfood-pack.md
│  │  └─ klocal-tourism-pack.md
│  ├─ 02-metrics/
│  │  ├─ metrics-definition.md
│  │  ├─ eval-harness.md
│  │  └─ judge-rubrics.md
│  ├─ 03-system/
│  │  ├─ sdd.md
│  │  ├─ api-contracts.md
│  │  ├─ database-schema.md
│  │  ├─ state-machines.md
│  │  └─ security-governance.md
│  ├─ 04-prompts/
│  │  ├─ qbs-generation.md
│  │  ├─ concept-draft.md
│  │  ├─ concept-extractor.md
│  │  ├─ cultural-judge.md
│  │  ├─ opportunity-generator.md
│  │  └─ report-writer.md
│  ├─ 05-ux/
│  │  ├─ ia.md
│  │  ├─ screen-spec.md
│  │  └─ component-map.md
│  └─ 06-dev/
│     ├─ backlog.md
│     ├─ implementation-plan.md
│     └─ acceptance-tests.md
├─ app/
├─ components/
├─ lib/
│  ├─ ai/
│  ├─ metrics/
│  ├─ prompts/
│  ├─ db/
│  └─ workflows/
├─ supabase/
│  ├─ migrations/
│  └─ seed/
└─ tests/
```

---

## 8.4 Database Schema Draft

### organizations
```sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'starter',
  created_at timestamptz default now()
);
```

### profiles
```sql
create table profiles (
  id uuid primary key,
  organization_id uuid references organizations(id),
  email text not null,
  role text not null check (role in ('admin','analyst','expert','client','reviewer')),
  created_at timestamptz default now()
);
```

### projects
```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  client_name text,
  domain_pack_id uuid,
  target_markets text[] default '{}',
  languages text[] default '{ko,en}',
  analysis_goals text[] default '{}',
  status text default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### domain_packs
```sql
create table domain_packs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  version text not null default '0.1',
  supported_languages text[] default '{ko,en}',
  concept_types jsonb default '[]'::jsonb,
  rating_axes jsonb default '[]'::jsonb,
  forbidden_patterns jsonb default '[]'::jsonb,
  risk_policies jsonb default '{}'::jsonb,
  default_qbs_templates jsonb default '[]'::jsonb,
  status text default 'draft',
  created_at timestamptz default now()
);
```

### cultural_concepts
```sql
create table cultural_concepts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  domain_pack_id uuid references domain_packs(id),
  concept_id text not null,
  version text default '0.1',
  status text default 'draft',
  preferred_label jsonb not null,
  aliases jsonb default '{}'::jsonb,
  concept_type text not null,
  definition text,
  defining_attributes jsonb default '[]'::jsonb,
  boundary_conditions jsonb default '{}'::jsonb,
  parent_concepts text[] default '{}',
  relation_edges jsonb default '[]'::jsonb,
  affective_vector jsonb default '{}'::jsonb,
  risk_vector jsonb default '{}'::jsonb,
  commerce_vector jsonb default '{}'::jsonb,
  identity_vector jsonb default '{}'::jsonb,
  evidence_sources jsonb default '[]'::jsonb,
  governance jsonb default '{}'::jsonb,
  action_policies jsonb default '{}'::jsonb,
  created_by uuid references profiles(id),
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(domain_pack_id, concept_id, version)
);
```

### qbs_items
```sql
create table qbs_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  domain_pack_id uuid references domain_packs(id),
  query_text text not null,
  language text default 'en',
  intent_type text not null,
  target_market text,
  target_microgroup text,
  required_concepts text[] default '{}',
  optional_concepts text[] default '{}',
  forbidden_concepts text[] default '{}',
  expected_policy jsonb default '{}'::jsonb,
  risk_level text default 'low',
  status text default 'draft',
  created_at timestamptz default now()
);
```

### eval_jobs
```sql
create table eval_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  run_config jsonb not null,
  status text default 'queued',
  progress jsonb default '{}'::jsonb,
  error jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### eval_runs
```sql
create table eval_runs (
  id uuid primary key default gen_random_uuid(),
  eval_job_id uuid references eval_jobs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  qbs_item_id uuid references qbs_items(id) on delete cascade,
  condition text not null,
  model text not null,
  repetition_index int not null,
  prompt_payload jsonb not null,
  response_text text,
  token_usage jsonb default '{}'::jsonb,
  latency_ms int,
  status text default 'success',
  error jsonb,
  created_at timestamptz default now()
);
```

### concept_extractions
```sql
create table concept_extractions (
  id uuid primary key default gen_random_uuid(),
  eval_run_id uuid references eval_runs(id) on delete cascade,
  extracted_concepts jsonb default '[]'::jsonb,
  relations jsonb default '[]'::jsonb,
  risk_expressions jsonb default '[]'::jsonb,
  cta_expressions jsonb default '[]'::jsonb,
  evidence_expressions jsonb default '[]'::jsonb,
  extractor_model text,
  created_at timestamptz default now()
);
```

### judge_results
```sql
create table judge_results (
  id uuid primary key default gen_random_uuid(),
  eval_run_id uuid references eval_runs(id) on delete cascade,
  scores jsonb not null,
  missing_concepts jsonb default '[]'::jsonb,
  distortion_items jsonb default '[]'::jsonb,
  risk_items jsonb default '[]'::jsonb,
  improvement_suggestions jsonb default '[]'::jsonb,
  judge_model text,
  human_review_status text default 'pending',
  created_at timestamptz default now()
);
```

### metric_summaries
```sql
create table metric_summaries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  condition text,
  model text,
  scope text not null,
  scope_key text,
  metrics jsonb not null,
  top_missing_concepts jsonb default '[]'::jsonb,
  top_risk_items jsonb default '[]'::jsonb,
  top_opportunities jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
```

### answer_cards
```sql
create table answer_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  domain_pack_id uuid references domain_packs(id),
  question text not null,
  short_answer text,
  detailed_answer text,
  required_concepts text[] default '{}',
  evidence_sources jsonb default '[]'::jsonb,
  cultural_boundary_notes text[] default '{}',
  cta_policy jsonb default '{}'::jsonb,
  geo_metadata jsonb default '{}'::jsonb,
  status text default 'draft',
  created_at timestamptz default now()
);
```

### reports
```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  report_type text not null,
  title text not null,
  content_markdown text,
  source_metric_summary_id uuid references metric_summaries(id),
  generated_by uuid,
  status text default 'draft',
  created_at timestamptz default now()
);
```

### human_reviews
```sql
create table human_reviews (
  id uuid primary key default gen_random_uuid(),
  object_type text not null,
  object_id uuid not null,
  reviewer_id uuid references profiles(id),
  review_status text not null,
  comments text,
  correction_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

---

## 8.5 API Contracts

### POST /api/projects
Create project.

Request:
```json
{
  "name": "K-beauty US Market Analysis",
  "client_name": "Example Brand",
  "domain_pack_id": "uuid",
  "target_markets": ["US"],
  "languages": ["ko", "en"],
  "analysis_goals": ["product_strategy", "cultural_geo_audit"]
}
```

Response:
```json
{
  "project_id": "uuid",
  "status": "draft"
}
```

### GET /api/projects/{project_id}
Return project detail and summary metrics.

### POST /api/domain-packs
Create domain pack.

### POST /api/concepts/draft
Generate concept draft with LLM.

### POST /api/concepts
Create concept.

### PATCH /api/concepts/{concept_id}
Update concept.

### POST /api/projects/{project_id}/qbs/generate
Generate QBS.

Request:
```json
{
  "n": 30,
  "language": "en",
  "intent_types": ["informational", "comparison", "risk", "product_opportunity"]
}
```

### POST /api/projects/{project_id}/eval-jobs
Start eval job.

Request:
```json
{
  "condition": "baseline",
  "models": ["gpt-5.5-thinking", "gemini"],
  "repetitions_per_query": 5,
  "temperature": 0.2,
  "qbs_ids": ["uuid"]
}
```

Response:
```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

### GET /api/eval-jobs/{job_id}
Return job progress.

### POST /api/eval-runs/{run_id}/extract
Run concept extraction.

### POST /api/eval-runs/{run_id}/judge
Run Cultural Judge.

### POST /api/projects/{project_id}/metrics/aggregate
Aggregate metrics.

### GET /api/projects/{project_id}/metrics
Return metric summaries.

### POST /api/projects/{project_id}/opportunities/generate
Generate opportunities.

### POST /api/projects/{project_id}/answer-cards/generate
Generate Answer Cards.

### POST /api/projects/{project_id}/reports
Generate report.

Request:
```json
{
  "report_type": "cultural_geo_audit",
  "format": "markdown"
}
```

---

## 8.6 Workflow / State Machines

### Project State
```text
draft
→ active
→ running
→ reviewed
→ delivered
→ archived
```

### Eval Job State
```text
queued
→ running
→ extracting
→ judging
→ aggregating
→ completed
→ failed
```

### Concept State
```text
draft
→ expert_review
→ active
→ deprecated
```

### Answer Card State
```text
draft
→ reviewed
→ approved
→ published
```

### Risk Item State
```text
open
→ reviewed
→ resolved
or ignored
```

---

## 8.7 AI Workflow Graph

Recommended LangGraph-style nodes:

```text
Node 1. LoadProjectContext
Node 2. LoadDomainPack
Node 3. GenerateOrLoadQBS
Node 4. BuildPromptPayload
Node 5. RunLLM
Node 6. ExtractConcepts
Node 7. JudgeResponse
Node 8. AggregateMetrics
Node 9. DetectGapsAndRisks
Node 10. GenerateOpportunities
Node 11. GenerateAnswerCards
Node 12. GenerateReport
Node 13. HumanReviewGate
```

Edges:

```text
LoadProjectContext → LoadDomainPack
LoadDomainPack → GenerateOrLoadQBS
GenerateOrLoadQBS → BuildPromptPayload
BuildPromptPayload → RunLLM
RunLLM → ExtractConcepts
ExtractConcepts → JudgeResponse
JudgeResponse → AggregateMetrics
AggregateMetrics → DetectGapsAndRisks
DetectGapsAndRisks → GenerateOpportunities
DetectGapsAndRisks → GenerateAnswerCards
GenerateOpportunities → GenerateReport
GenerateAnswerCards → GenerateReport
GenerateReport → HumanReviewGate
```

---

## 9. UX / IA

### 9.1 Main Navigation

```text
Projects
Domain Packs
Concept Studio
QBS
Eval Harness
Attractor Map
Risk Monitor
Opportunities
Answer Cards
Reports
Review Console
Settings
```

### 9.2 Key Screens

#### Project Dashboard
- Project summary
- Run status
- Average metrics
- Top missing concepts
- Top risk items
- Latest report

#### Concept Studio
- Concept table
- Concept detail editor
- Relation editor
- Vector/risk fields
- Review status

#### QBS Builder
- QBS list
- Generate QBS button
- Intent filters
- Required/forbidden concept editor

#### Eval Harness
- Run config
- Model selection
- Condition selection
- Job progress
- Run logs

#### Metrics Dashboard
- Metric cards
- Baseline vs Intervention charts
- Market comparison
- Intent-type breakdown
- Floor Risk distribution

#### Attractor Map
- Graph visualization
- Node detail drawer
- Edge type filter
- Risk/opportunity overlays

#### Risk Monitor
- Risk table
- Severity filter
- Problem expression
- Safer alternative
- Human review status

#### Report Studio
- Report type selector
- Generated markdown preview
- Export buttons
- Review/Deliver state

---

## 10. Seed Data Requirements

### 10.1 K-Beauty Seed Concepts

Minimum 30 concepts:

```text
kbeauty.aesthetic.natural_glow
kbeauty.aesthetic.glass_skin
kbeauty.ritual.daily_skincare_routine
kbeauty.ritual.layering
kbeauty.trust.ingredient_transparency
kbeauty.trust.derma_inspired
kbeauty.benefit.skin_barrier
kbeauty.benefit.hydration
kbeauty.benefit.sensitive_skin_care
kbeauty.affect.gentle_self_care
kbeauty.identity.clean_beauty_seeker
kbeauty.identity.routine_optimizer
kbeauty.signal.idol_influence
kbeauty.signal.drama_beauty_scene
risk.exaggerated_whitening_claim
risk.medical_effect_claim
risk.idol_skin_generalization
risk.ten_step_stereotype
...
```

### 10.2 K-Food Seed Concepts

```text
kfood.taste.fermented_depth
kfood.taste.spicy_comfort
kfood.ritual.shared_table
kfood.affect.warm_communal_memory
kfood.wellness.fermented_wellness
kfood.product.kimchi_globalization
kfood.product.korean_sauce
risk.exoticization
risk.health_claim_exaggeration
risk.cultural_flattening
...
```

### 10.3 K-Local Tourism Seed Concepts

```text
klocal.place.hidden_gem
klocal.affect.retro_place_mood
klocal.route.drama_location_walk
klocal.food.local_specialty_route
klocal.photo.night_view_spot
klocal.identity.slow_local_travel
risk.over_tourism
risk.cultural_misrepresentation
risk.safety_info_omission
...
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

- Metric formula tests
- JSON schema validation
- Concept extraction parser
- Risk severity calculation
- QBS generation schema validation

### 11.2 Integration Tests

- Project → QBS → Eval → Extract → Judge → Aggregate pipeline
- Baseline vs Intervention comparison
- Report generation from metric summary
- Human review update flow

### 11.3 Golden Set Tests

Create fixed mini benchmark:

```yaml
golden_set:
  domain: kbeauty
  qbs_count: 10
  expected_required_concepts: true
  expected_forbidden_detection: true
  judge_output_schema_valid: true
```

### 11.4 Acceptance Tests

- K-beauty project can be completed end-to-end.
- At least 30 QBS can be generated and executed.
- At least 2 models × 5 repetitions can be run.
- Metrics dashboard renders project-level summary.
- Report markdown is generated.
- High-risk items require human review.

---

## 12. Commercial Packaging

### 12.1 Service Packages

#### Starter Audit
```text
- 1 domain
- 1 target market
- QBS 20
- 1 model
- 3 repetitions
- Markdown report
```

#### Standard Intelligence
```text
- 1 domain
- 2 target markets
- QBS 50
- 2 models
- 5 repetitions
- Dashboard + PDF report
- Answer Card backlog
```

#### Pro MeaningOps
```text
- 3 domains
- 3+ markets
- QBS 100+
- 3 models
- 10 repetitions
- Human expert review
- Monthly tracking
- SSoT/Answer Card intervention report
```

### 12.2 SaaS Pricing Candidates

```text
Starter: monthly low-cost dashboard
Professional: per-project + subscription
Enterprise: custom domain packs + human review + API access
Institutional: government/culture agency contract
```

---

## 13. MVP Backlog

### P0 — Must Have

```text
P0-1. Supabase schema migration
P0-2. Auth and organization role model
P0-3. Project CRUD
P0-4. Domain Pack CRUD
P0-5. Cultural Concept CRUD
P0-6. QBS CRUD + LLM generation
P0-7. Eval Job Runner
P0-8. Concept Extractor
P0-9. Cultural Judge
P0-10. Metric Aggregator
P0-11. Project Dashboard
P0-12. Markdown Report Generator
```

### P1 — Should Have

```text
P1-1. Attractor Map visualization
P1-2. Risk Monitor
P1-3. Opportunity Generator
P1-4. Answer Card Studio
P1-5. Human Review Console
P1-6. Baseline vs Intervention chart
P1-7. PDF export
```

### P2 — Could Have

```text
P2-1. Social/search data import
P2-2. Multilingual expansion
P2-3. Benchmark dataset export
P2-4. API key management for clients
P2-5. PPTX export
P2-6. Advanced prompt registry
```

---

## 14. 90-Day Implementation Plan

### Weeks 1–2: Foundation
```text
- Finalize PRD/SDD
- Implement DB schema
- Build auth/org/role model
- Seed domain packs
- Seed K-beauty concepts
```

### Weeks 3–4: Core Authoring
```text
- Project Workspace
- Domain Pack Manager
- Cultural Concept Studio
- QBS Builder
- Prompt templates
```

### Weeks 5–6: Eval Pipeline
```text
- Eval Runner
- AI provider abstraction
- Concept Extractor
- Cultural Judge
- Run logs
```

### Weeks 7–8: Metrics & Dashboard
```text
- Metric Aggregator
- Project metrics dashboard
- Baseline vs Intervention comparison
- Risk item extraction
```

### Weeks 9–10: Strategy Outputs
```text
- Opportunity Generator
- Answer Card Studio
- Report Generator
- Markdown/PDF export
```

### Weeks 11–12: Pilot & Hardening
```text
- Pilot 1: K-beauty brand
- Pilot 2: K-food brand
- Pilot 3: K-local tourism region
- Human review workflow
- Bug fixes and UX polishing
```

---

## 15. Definition of Done

v1.0 MVP is complete when:

```text
1. User can create a K-beauty project.
2. User can manage at least 30 approved K-beauty concepts.
3. User can generate at least 30 QBS items.
4. System can run 2 AI models × 5 repetitions per QBS.
5. System can extract cultural concepts from AI responses.
6. System can judge Cultural Concept Fidelity, Stereotype Distortion, Floor Risk, Policy Alignment.
7. System can aggregate project-level metrics.
8. System can show baseline vs intervention comparison.
9. System can generate at least one Markdown report.
10. System can generate Answer Card candidates.
11. High-risk items can be routed to Human Review.
12. All run logs are stored and auditable.
```

---

## 16. Core Implementation Notes for AI-Pair Coding

### 16.1 Prioritize Data Contracts
Do not begin UI implementation before stabilizing these interfaces:

```text
CulturalConcept
QBSItem
EvalRun
ConceptExtraction
JudgeResult
MetricSummary
AnswerCard
Report
RiskItem
Opportunity
```

### 16.2 Keep LLM Calls Isolated
Implement provider abstraction:

```ts
interface LLMProvider {
  generate(input: LLMGenerateInput): Promise<LLMGenerateOutput>
}
```

Provider-specific code must not leak into business logic.

### 16.3 Use Strict JSON Schemas
Every LLM prompt that feeds the pipeline must have:

```text
- explicit input block
- explicit output JSON schema
- no markdown in JSON response
- validator and retry on invalid JSON
```

### 16.4 Store Raw and Parsed Outputs
Always store:

```text
raw_prompt_payload
raw_response_text
parsed_json
validation_errors
judge_model
timestamp
```

### 16.5 Human Review Is Not Optional for High-Risk Culture
Any item with:

```text
floor_risk >= 0.7
or stereotype_distortion_rate >= 0.5
or risk_type in political/historical/religious
```

must be routed to Human Review.

---

## 17. Future Extensions

### 17.1 K-Culture Benchmark
```text
K-Culture QBS Bench
Cultural Concept Goldset
Cultural GEO Logs
Human Judge Agreement Dataset
```

### 17.2 Public/Institutional Dashboard
```text
K-Culture Attractor Radar
Country-level resonance map
K-local tourism opportunity map
K-beauty cultural GEO index
```

### 17.3 Agentic Strategy Studio
```text
- Culture strategist agent
- Product concept agent
- Tourism route agent
- Answer Card agent
- Risk reviewer agent
```

### 17.4 Multimodal Expansion
```text
Image concept extraction
Package design cultural fit
Short-form video culture code analysis
Drama scene attractor analysis
```

---

## 18. Final Product Statement

```text
K-Culture Intelligence OS는
K-컬처의 글로벌 확산을 단순 언급량이나 검색량이 아니라
문화 개념 어트랙터, AI 응답공간의 개념 충실도,
문화권별 공명도, 왜곡 위험, 상품화 전이 가능성으로 측정한다.

이를 통해 기관·브랜드·콘텐츠 기업·지자체는
K-컬처를 더 정확히 설명하고,
더 안전하게 번역하고,
더 강하게 상품화하며,
AI 검색 시대에 더 안정적으로 인식되도록 운영할 수 있다.
```
