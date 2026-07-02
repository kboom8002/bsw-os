---
title: "Pattern Attractor Foundry Repo Guide"
subtitle: "TCO · Vibe OS · Media Soliton 기반 도메인/브랜드 패턴 어트랙터 표준 도출 및 운영 문서"
version: "0.1.0-repo-ready"
language: "ko-KR"
status: "Draft for LLM Repository / Product Architecture / Domain Pack Design"
primary_audience:
  - LLM agents reading this repo
  - product architects
  - domain analysts
  - AIHompy / guide wizard builders
  - brand strategy and AEO/GEO operators
last_updated: "2026-07-02"
---

# Pattern Attractor Foundry Repo Guide

> 이 문서는 다른 LLM이 `Pattern Attractor Foundry`를 이해하고, 도메인별 표준 Pattern Attractor를 도출하며, 브랜드/세부 과제별 Attractor Gap을 분석하고, AI홈피·도메인 가이드·챗봇·상세페이지·카드뉴스·상담 스크립트·AEO/GEO Answer Card로 변환할 수 있도록 작성된 repo-ready Markdown 문서다.

---

## 0. LLM Quick Instruction

이 문서를 읽는 LLM은 다음 원칙을 지켜야 한다.

```text
1. Pattern Attractor를 단순 카피, 후킹 문구, CTA 문장으로 축소하지 말라.
2. Pattern Attractor는 사용자 상태를 목표 상태로 이동시키는 반복 가능한 의미-정동-행동 패턴이다.
3. 모든 Attractor는 TCO Concept State, Evidence Anchor, Vibe Signature, Action Policy, CTA Vector, Media Soliton Rule, Run-Receipt Metric을 가져야 한다.
4. 도메인 표준 Attractor와 브랜드 특화 Attractor를 구분하라.
5. 브랜드 진단은 Attractor Gap 분석으로 수행하라.
6. Vibe 평가는 impression-based scoring이 아니라 evidence-first coding으로 수행하라.
7. 고객 조작, 공포 유도, 허위 희소성, 과장 claim, 취약성 악용을 금지하라.
8. 의료·법률·금융·피부/헬스케어 등 위험 도메인에서는 안전 경계, 전문가 상담, claim strength 제한을 우선하라.
```

---

## 1. One-Sentence Definition

**Pattern Attractor Foundry는 도메인별 고객 질문·불안·비교·신뢰·전환 패턴을 표준화하고, 개별 브랜드/과제의 누락·약점·불일치·전환 기회를 진단한 뒤, TCO 개념 상태, Vibe OS 체감 벡터, Evidence Anchor, Action Policy, Media Soliton, Run-Receipt를 결합해 실행 가능한 콘텐츠·챗봇·가이드·AEO/GEO 자산으로 변환하는 AttractorOps 엔진이다.**

짧게 말하면:

```text
Domain Question Capital
→ Query-State Clusters
→ Standard Pattern Attractors
→ Brand-Specific Attractor Portfolio
→ Attractor Gap Report
→ Media Soliton Pack
→ Run-Receipt
→ Recomposition
```

---

## 2. Why This Exists

기존 마케팅/콘텐츠/챗봇 설계는 다음과 같은 한계를 가진다.

```text
- 키워드 중심 SEO는 질문의 의미 상태를 충분히 다루지 못한다.
- 일반 RAG는 문서 검색은 잘하지만 행동 정책과 CTA 적합성을 보장하지 못한다.
- 일반 LLM 챗봇은 친절하게 답하지만 위험 경계, 근거 수준, 브랜드 정본, 사용자 통제감을 안정적으로 제어하지 못한다.
- 마케팅 카피는 주의를 끌 수 있지만 신뢰, 불안 감소, 비교 명료화, 안전한 전환까지 설계하지 못하는 경우가 많다.
- 브랜드 콘텐츠는 홈페이지, SNS, 광고, 상담, 챗봇, AI 검색 답변에서 메시지가 흩어지는 경우가 많다.
```

Pattern Attractor Foundry는 이 문제를 다음 방식으로 해결한다.

```text
- 도메인별 반복 의사결정 구조를 표준 패턴으로 추출한다.
- 브랜드별 자산, 근거, 위험, Vibe, CTA를 표준 패턴에 맞게 바인딩한다.
- 사용자의 질문 상태에 맞는 Attractor를 선택해 답변/콘텐츠/상담/추천을 제어한다.
- 채널별 변환에서도 핵심 의미, 근거, Vibe, CTA가 보존되도록 Media Soliton을 생성한다.
- 실제 성과를 Run-Receipt로 기록하고 Pattern Strength를 재평가해 Recomposition한다.
```

---

## 3. Core Concepts: Internal Glossary for LLMs

이 섹션은 TCO, Vibe OS 등 내부 개념을 처음 접하는 LLM을 위한 보조 해설이다.

### 3.1 TCO: Tensor Concept Ontology

**TCO는 단어 중심 온톨로지가 아니라 개념 상태 기반 AI 서비스 운영체계다.**

TCO에서 기본 단위는 단어가 아니다. 단어는 표면 라벨이고, 실제 운영 단위는 `Concept Entity`다.

```text
word
→ term candidate
→ context tensor
→ canonical concept entity
→ concept vector / region / operator / evidence / action
→ service control
```

TCO Concept Entity는 다음을 포함한다.

```yaml
concept_entity:
  label: "사용자가 보는 자연어 라벨"
  activation_condition: "언제 이 개념이 활성화되는가"
  boundary: "어디까지 이 개념이고 어디부터 다른 개념인가"
  evidence_requirement: "어떤 근거가 필요한가"
  risk_vector: "위험도/불확실성/전문가 필요도"
  operator: "다른 개념과 결합할 때 어떤 상태 변화가 일어나는가"
  action_policy: "답변, CTA, 디자인, 검색, 안전, 추천 정책"
```

예:

```yaml
concept_entity:
  id: skincare.risk.irritation_after_retinol
  natural_definition: "레티놀 사용 후 따가움·붉은기·건조감이 나타나 자극 또는 장벽 약화 가능성을 확인해야 하는 상태"
  activation_condition:
    - ingredient.retinol
    - symptom.stinging_or_redness_or_dryness
    - intent.continue_or_stop_decision
  boundary:
    mild_transient_stinging: caution
    strong_burning_or_oozing: consult_first
  action_policy:
    answer_mode: cautionary
    product_cta: restricted
    consult_cta: conditional
```

### 3.2 Context Tensor

**Context Tensor는 같은 표현이 어떤 상황에서 해석되어야 하는지 결정하는 다축 문맥 상태공간이다.**

```text
Context Tensor =
Domain × UserState × RiskState × IntentState × EvidenceState × TimeState × ChannelState
```

예:

```yaml
context_tensor:
  domain: jeju_context_travel
  user_state: elderly_parents_trip
  risk_state: low_walking_tolerance
  intent_state: recommend_half_day_course
  evidence_state: official_place_info_preferred
  time_state: rainy_day
  channel_state: webapp_guide
```

### 3.3 Operator

**Operator는 개념 간 관계를 실제 서비스 행동으로 변환하는 연산자다.**

일반 온톨로지 관계:

```text
A related_to B
```

TCO Operator:

```text
Operator(A, B, Context) → New State / Policy / Action
```

예:

```yaml
operator:
  id: op.jeju.rain_elderly_low_walk
  input_concepts:
    - weather.rain
    - traveler.elderly_parents
    - constraint.low_walking_tolerance
  output_policy:
    prefer:
      - indoor_or_semi_indoor
      - short_walk_viewpoint
      - cafe_rest_stop
    avoid:
      - long_oreum_hike
      - exposed_coastal_walk
      - overpacked_schedule
```

### 3.4 Vibe OS

**Vibe OS는 대상이 사용자에게 유발하는 체감 패턴을 evidence-first 방식으로 측정·진단·개입·검증하는 정동-의미 운영체계다.**

Vibe는 단순히 “좋다/나쁘다”가 아니다. 같은 긍정도 `따뜻한 회복형`, `도전적 고각성형`, `차분한 전문형`처럼 다르게 체감된다.

Vibe OS의 레이어:

```text
Layer E. Evidence Layer
Layer 0. Core Affect: Valence, Arousal, Control
Layer 1. Expressive Style: Warmth Style, Precision, Energy, Sophistication, Novelty, Intimacy, Authenticity
Layer 2. Motivational Affordance: Autonomy, Competence, Relatedness, Promotion, Prevention
Layer 3. Social Appraisal: Warmth, Competence, Trust, Fairness, Agency
Layer 4. Identity & Narrative Resonance
Layer 5. Behavioral Response
Layer 6. Dynamic Alignment
```

Evidence-first rule:

```text
Observed Evidence
→ Interpretation
→ Layer Score
→ Confidence
→ Uncertainty
→ Suggested Validation
```

### 3.5 Vibe Signature

**Vibe Signature는 특정 Attractor가 사용자에게 유발해야 하는 목표 체감 벡터다.**

예: Anxiety Reducer의 표준 Vibe Signature

```yaml
vibe_signature:
  L0_core_affect:
    valence: calm_positive
    arousal: low_to_moderate
    control: high
  L1_expressive_style:
    warmth_style: medium_high
    precision: high
    energy: low_to_medium
    authenticity: high
  L2_motivational_affordance:
    autonomy_support: high
    competence_support: high
    prevention_frame: high
  L3_social_appraisal:
    trust: high
    competence: high
    fairness: medium_high
```

### 3.6 Pattern Attractor

**Pattern Attractor는 특정 도메인에서 반복적으로 등장하는 사용자 불확실성, 질문, 불안, 비교, 신뢰 판단, 행동 의향을 정본 개념·근거·Vibe Signature·Action Policy·CTA Vector·채널 표현의 안정적 조합으로 처리하여 사용자를 이해·신뢰·안심·비교 명료화·행동 준비 상태로 수렴시키는 측정 가능한 의미-정동-행동 운영 객체다.**

공식:

```text
Pattern Attractor =
Question-State
+ Concept-State
+ Evidence Anchor
+ Vibe Signature
+ Action Policy
+ CTA Vector
+ Media Soliton Rule
+ Run-Receipt Metric
```

### 3.7 Media Soliton

**Media Soliton은 핵심 의미와 Vibe, 근거, CTA가 채널을 이동해도 보존되는 메시지 패킷이다.**

구성:

```text
Core Proposition
+ Vibe Signature
+ Pattern Attractor
+ Evidence Anchor
+ CTA Vector
+ Channel Adaptation Rule
```

예:

```yaml
media_soliton:
  core_proposition: "비 오는 제주에서는 원래 계획보다 실내·반실내 대체 코스를 먼저 확인하는 것이 좋다."
  evidence_anchor: "weather.rain + indoor_or_semi_indoor_policy + mobility/time constraints"
  vibe_signature: "calm, practical, high-control"
  cta_vector: "map_route | save_course | ask_region"
  channel_rules:
    homepage: "상황별 제주 코스 진입 카드"
    chatbot: "상태 확인 후 플랜 A/B 제안"
    cardnews: "비 오는 날 제주 코스 3단계"
    ad: "오늘 날씨에 맞는 제주 코스"
```

### 3.8 Run-Receipt

**Run-Receipt는 Attractor가 실제로 어떻게 실행되었고 어떤 결과를 만들었는지 기록하는 운영 로그다.**

예:

```yaml
run_receipt:
  activated_attractor: attractor.jeju.rain_low_friction_course
  input_query: "비 오는데 부모님 모시고 어디 가요?"
  concept_state:
    - weather.rain
    - traveler.elderly_parents
    - constraint.low_walking_tolerance
  output_variant: v2_low_walk_course
  user_behavior:
    map_click: true
    re_question: false
    save_course: true
  human_feedback:
    clarity: 4.5
    trust: 4.2
    pressure: 1.1
  detected_gap: []
```

### 3.9 Recomposition

**Recomposition은 Run-Receipt와 평가 결과를 바탕으로 개념 경계, 근거, 정책, Vibe, CTA, 채널 메시지를 재구성하는 루프다.**

```text
Run-Receipt
→ Pattern Strength 재평가
→ Graph Edge Weight 조정
→ Concept Boundary 수정
→ Evidence 보강
→ Action Policy 재바인딩
→ Media Soliton 재작성
→ Goldset 업데이트
```

---

## 4. Product Definition: Pattern Attractor Foundry

### 4.1 Product Mission

Pattern Attractor Foundry의 임무는 다음이다.

```text
도메인별 반복 고객 의사결정 패턴을 표준화하고,
개별 브랜드의 Attractor Portfolio와 Attractor Gap을 진단하며,
TCO·Vibe OS·Media Soliton·Run-Receipt 기반으로
AI홈피, 챗봇, 도메인 가이드, 상세페이지, 카드뉴스, 상담 스크립트, AEO/GEO Answer Card를 생성·평가·개선한다.
```

### 4.2 Core Users

```yaml
users:
  platform_builder:
    needs:
      - domain_pack_generation
      - reusable_attractor_library
      - agent_runtime_specs

  brand_operator:
    needs:
      - brand_attractor_gap_report
      - homepage/copy/chatbot improvements
      - campaign and CTA alignment

  domain_expert:
    needs:
      - concept/evidence/policy review
      - goldset labeling
      - safety and boundary checking

  llm_agent:
    needs:
      - machine-readable attractor specs
      - policy routing rules
      - channel adaptation instructions
```

### 4.3 Core Outputs

```text
1. Domain Pattern Attractor Map
2. Brand Attractor Portfolio
3. Attractor Gap Report
4. Attractor Spec JSON/YAML
5. Media Soliton Pack
6. Answer Card Pack
7. Guide Wizard Flow
8. LLM Prompt Pack
9. Evaluation Rubric
10. Run-Receipt Dashboard Schema
11. Recomposition Task List
```

---

## 5. Domain Standard vs Brand-Specific Attractor

### 5.1 Domain Standard Pattern Attractor

도메인 표준 Pattern Attractor는 특정 업종에서 반복되는 보편적 고객 의사결정 패턴이다.

예: 글로벌 K뷰티 도메인 표준

```text
피부 불편감
→ 원인 불확실성
→ 성분/루틴 질문
→ 안전 경계 확인
→ 근거 있는 사용법
→ 제품/상담/루틴 CTA
```

### 5.2 Brand-Specific Pattern Attractor

브랜드 특화 Pattern Attractor는 도메인 표준 패턴을 특정 브랜드의 개념, 제품, 근거, 스타일, CTA, 안전 정책에 맞게 변형한 것이다.

예: DR.O 브랜드 변형

```text
시술 후 열감·붉은기
→ 지금 제품을 써도 되는가?
→ The Interval™ / Base Reset 개념
→ Consult First 경계
→ 메디글로우/메디텐션 역할 구분
→ 루틴 확인 또는 1:1 상담 CTA
```

### 5.3 Relationship

```text
Domain Standard = 문법
Brand-Specific = 문장
Domain Pack = 업종별 기본 문법 라이브러리
Brand Pack = 개별 브랜드의 실행 문장 라이브러리
```

---

## 6. Standard Pattern Attractor Types

Pattern Attractor Foundry는 최소 9개 표준 유형을 사용한다.

```yaml
standard_attractor_types:
  discovery:
    purpose: "사용자가 문제/욕구를 처음 인식하도록 돕는다."
    target_state: "내 상황이 언어화되고 다음 질문이 생긴다."

  problem_clarification:
    purpose: "막연한 문제를 구조화된 질문 상태로 바꾼다."
    target_state: "내 상태, 조건, 선택 기준이 명확해진다."

  anxiety_reducer:
    purpose: "불안·혼란·행동 마비를 줄이고 통제감을 높인다."
    target_state: "위험 경계와 지금 할 일이 명확해진다."

  trust:
    purpose: "브랜드/서비스/AI 답변을 믿을 수 있게 만든다."
    target_state: "근거, 경계, 절차, 검수 신호를 확인한다."

  evidence:
    purpose: "신뢰를 만드는 핵심 근거를 보이게 한다."
    target_state: "주장과 근거가 연결되어 보인다."

  comparison_anchor:
    purpose: "선택지 비교 기준을 제공한다."
    target_state: "내 상황에 맞는 선택지가 좁혀진다."

  aspiration:
    purpose: "더 나은 자기상/미래상/브랜드 경험을 상상하게 한다."
    target_state: "바람직한 변화가 현실적인 경로로 보인다."

  conversion_trigger:
    purpose: "충분한 이해와 신뢰 이후 다음 행동을 자연스럽게 제안한다."
    target_state: "저장, 문의, 상담, 지도 열기, 제품 정보 확인 등 적절한 행동이 발생한다."

  ecosystem:
    purpose: "단편 콘텐츠를 브랜드/서비스 지식 생태계로 연결한다."
    target_state: "다음 질문, 관련 Answer Card, 상담/지도/구독/재방문 경로가 보인다."
```

---

## 7. Attractor Spec Schema

### 7.1 Minimal YAML Schema

```yaml
pattern_attractor:
  id: "attractor.domain.subdomain.name"
  version: "0.1.0"
  status: "draft | active | deprecated"
  type:
    - discovery
    - problem_clarification
    - anxiety_reducer
    - trust
    - evidence
    - comparison_anchor
    - aspiration
    - conversion_trigger
    - ecosystem

  domain:
    id: "string"
    name: "string"
    subdomain: "string"

  natural_definition: "사람이 읽는 자연어 정의"

  trigger_state:
    user_question_patterns:
      - "string"
    context_requirements:
      - "string"
    risk_state:
      level: "low | medium | high | uncertain"
    intent_state:
      - "string"
    missing_context:
      - "string"

  concept_state:
    required_concepts:
      - "concept.id"
    allowed_concepts:
      - "concept.id"
    forbidden_concepts:
      - "concept.id"

  evidence_anchor:
    required_sources:
      - "source.id"
    evidence_visibility_rule: "string"
    claim_strength_limit: "none | limited | supported | strong"

  vibe_signature:
    L0_core_affect:
      valence: "negative | neutral | mildly_positive | positive"
      arousal: "low | medium | high"
      control: "low | medium | high"
    L1_expressive_style:
      warmth_style: "low | medium | high"
      precision: "low | medium | high"
      energy: "low | medium | high"
      sophistication: "low | medium | high"
      novelty: "low | medium | high"
      intimacy: "low | medium | high"
      authenticity: "low | medium | high"
    L2_motivational_affordance:
      autonomy_support: "low | medium | high"
      competence_support: "low | medium | high"
      relatedness_support: "low | medium | high"
      promotion_frame: "low | medium | high"
      prevention_frame: "low | medium | high"
    L3_social_appraisal:
      warmth: "low | medium | high"
      competence: "low | medium | high"
      trust: "low | medium | high"
      fairness: "low | medium | high"
      agency: "low | medium | high"
    avoid_vibe:
      - "panic"
      - "commercial_pressure"
      - "vague_reassurance"
      - "overconfidence"

  action_policy:
    allowed_actions:
      - "ask_more"
      - "provide_answer"
      - "show_evidence"
      - "suggest_comparison"
      - "offer_consult"
      - "open_map"
      - "show_product_info"
    blocked_actions:
      - "string"
    cta_policy:
      primary: "string"
      secondary:
        - "string"
      blocked:
        - "string"
    safety_policy:
      boundary_notes:
        - "string"
      escalation_conditions:
        - "string"

  media_soliton_rule:
    core_proposition: "string"
    evidence_anchor: "string"
    cta_vector: "string"
    channel_adaptation_rules:
      homepage: "string"
      answer_card: "string"
      chatbot: "string"
      cardnews: "string"
      ad: "string"
      sales_script: "string"
      llm_txt: "string"

  target_state:
    cognitive:
      - "understands_context"
      - "knows_selection_criteria"
    affective:
      - "anxiety_reduced"
      - "control_increased"
    motivational:
      - "ready_to_compare"
      - "ready_to_consult"
    behavioral:
      - "click_map"
      - "save_course"
      - "consult_click"
      - "product_info_view"

  metrics:
    activation_accuracy: "number or formula"
    target_state_transition_lift: "number or formula"
    evidence_trust_lift: "number or formula"
    vibe_alignment: "VPA/VCS/MSA/VEI"
    cta_appropriateness: "number or rubric"
    behavior_outcome_lift: "number or formula"
    mixed_signal_penalty: "number or formula"
    safety_violation_penalty: "number or formula"

  failure_modes:
    - "missing_evidence"
    - "wrong_cta"
    - "overpromising"
    - "vibe_misalignment"
    - "unsafe_guidance"

  recomposition_rule:
    if_failed_then:
      - "update_concept_boundary"
      - "add_evidence_anchor"
      - "rewrite_cta"
      - "change_vibe_signature"
      - "add_followup_question"
```

### 7.2 Minimal JSON Schema Skeleton

```json
{
  "id": "attractor.jeju.rain_low_friction_course",
  "version": "0.1.0",
  "status": "active",
  "type": ["anxiety_reducer", "comparison_anchor", "conversion_trigger"],
  "domain": {
    "id": "jeju_context_travel",
    "subdomain": "rainy_day_alternative_course"
  },
  "trigger_state": {
    "user_question_patterns": ["비 오는데 어디 가요?", "우도 대신 어디 가면 좋아요?"],
    "context_requirements": ["weather.rain"],
    "intent_state": ["alternative_course"],
    "missing_context": ["mobility", "region", "time_budget"]
  },
  "concept_state": {
    "required_concepts": ["weather.rain", "intent.alternative_plan", "policy.indoor_priority"],
    "forbidden_concepts": ["long_oreum_hike", "overpacked_schedule"]
  },
  "evidence_anchor": {
    "required_sources": ["official_place_info", "transport_info_optional"],
    "evidence_visibility_rule": "show why the route fits rainy condition",
    "claim_strength_limit": "limited"
  },
  "vibe_signature": {
    "L0_core_affect": { "valence": "positive", "arousal": "low_to_medium", "control": "high" },
    "L1_expressive_style": { "warmth_style": "medium", "precision": "high", "energy": "medium" },
    "L2_motivational_affordance": { "autonomy_support": "high", "competence_support": "high" },
    "L3_social_appraisal": { "trust": "high" },
    "avoid_vibe": ["overwhelm", "false_certainty"]
  },
  "action_policy": {
    "allowed_actions": ["ask_mobility", "propose_plan_a_b", "open_map"],
    "blocked_actions": ["too_many_places", "unsafe_weather_route"],
    "cta_policy": { "primary": "map_route", "secondary": ["save_course", "change_region"] }
  }
}
```

---

## 8. Domain Attractor Extraction Pipeline

### 8.1 Pipeline Overview

```text
1. Domain Scope Definition
2. Question Capital Collection
3. Query-State Clustering
4. Domain Uncertainty Taxonomy
5. Standard Attractor Mapping
6. TCO Concept/Evidence/Policy Binding
7. Vibe Signature Assignment
8. Media Soliton Generation
9. Goldset & Human Review
10. Run-Receipt Instrumentation
11. Pattern Strength Evaluation
12. Recomposition
```

### 8.2 Step Details

#### Step 1. Domain Scope Definition

도메인을 너무 넓게 잡지 말라.

Bad:

```text
K-Beauty 전체
제주 전체
웨딩 전체
한의원 전체
```

Good:

```text
K-Beauty: Active Ingredient Beginner & Barrier Reset
Jeju: Rain/Wind/Companion/Mobility-based Half-Day Course
Wedding: Studio Portfolio Trust & Consultation CTA
Korean Medicine: First-Visit Symptom Fit & Reservation Guide
```

#### Step 2. Question Capital Collection

수집 대상:

```text
검색어
FAQ
상담 질문
고객 리뷰
DM/댓글
챗봇 로그
콜센터 메모
판매자 답변
경쟁사 상세페이지
AI 검색 답변
```

#### Step 3. Query-State Clustering

표면 문장 대신 상태로 묶어라.

Example:

```text
“비 오는데 어디 가요?”
“우도 못 가면 어디로 바꾸죠?”
“아이랑 실내 갈 데?”
```

Cluster:

```yaml
query_state:
  weather: rain
  intent: alternative_course
  constraint: indoor_or_semi_indoor
  anxiety: plan_disruption
```

#### Step 4. Domain Uncertainty Taxonomy

도메인별 핵심 불확실성을 정의한다.

```yaml
domain_uncertainty:
  kbeauty:
    - "이 성분을 계속 써도 되는가?"
    - "내 피부상태에 맞는가?"
    - "이 claim 표현이 안전한가?"
  jeju:
    - "오늘 조건에서 갈 수 있는가?"
    - "비/바람이면 무엇을 바꿔야 하는가?"
    - "부모님/아이와 무리 없는가?"
    - "렌터카 없이 가능한가?"
  wedding:
    - "이 분위기로 찍을 수 있는가?"
    - "실제 결과물이 믿을 만한가?"
    - "가격과 패키지는 어떻게 다른가?"
```

#### Step 5. Standard Attractor Mapping

```text
불확실성 높음 → Problem Clarification
불안 높음 → Anxiety Reducer
근거 의심 → Trust / Evidence
선택지 과다 → Comparison Anchor
행동 직전 → Conversion Trigger
브랜드 정체성 연결 → Identity / Aspiration
```

#### Step 6. TCO Binding

각 Attractor에 다음을 붙인다.

```yaml
tco_binding:
  required_concepts: []
  forbidden_concepts: []
  context_tensor: {}
  evidence_requirement: []
  risk_vector: {}
  operators: []
  action_policy: {}
```

#### Step 7. Vibe Signature Assignment

각 Attractor가 유발해야 하는 체감을 정의한다.

```yaml
vibe_binding:
  target_L0: {}
  target_L1: {}
  target_L2: {}
  target_L3: {}
  avoid_vibe: []
  confidence_rule: "evidence-first scoring only"
```

#### Step 8. Media Soliton Generation

핵심 메시지를 채널별로 변환한다.

```yaml
channels:
  homepage: "Hero / section / FAQ"
  answer_card: "canonical answer"
  chatbot: "state-aware response"
  cardnews: "slide narrative"
  ad: "short hook with safe claim"
  sales_script: "consultation flow"
  llm_txt: "AI-readable brand statement"
```

#### Step 9. Goldset & Human Review

사람이 검수해야 할 항목:

```text
필수 개념이 맞는가?
금지 개념을 피했는가?
근거가 충분한가?
정책이 안전한가?
Vibe가 목표와 맞는가?
CTA가 압박적이지 않은가?
사용자가 다음 행동을 이해하는가?
```

#### Step 10. Run-Receipt Instrumentation

로그 필수 항목:

```yaml
run_receipt_required_fields:
  session_id: string
  activated_attractor_id: string
  input_query: string
  concept_state: object
  vibe_spec: object
  action_policy: object
  output_variant: string
  cta_shown: string[]
  cta_clicked: string[]
  user_behavior: object
  user_feedback: object
  detected_gap: string[]
```

---

## 9. Brand Attractor Gap Analysis

### 9.1 Gap Types

```yaml
attractor_gap_types:
  missing_attractor:
    definition: "필요한 Attractor가 아예 없음"
    example: "상세페이지에는 제품 설명만 있고 사용자 불안 완화 패턴이 없음"

  weak_attractor:
    definition: "패턴은 있으나 개념, 근거, Vibe, CTA가 약함"
    example: "근거 없는 '믿을 수 있음' 문구"

  misaligned_attractor:
    definition: "브랜드 목표와 사용자 체감이 어긋남"
    example: "따뜻함을 말하지만 결제 UX는 압박적"

  overused_attractor:
    definition: "특정 패턴만 반복되어 피로감 또는 무감각 발생"
    example: "모든 콘텐츠가 '감성'만 반복되고 근거/비교/CTA가 없음"

  unsafe_attractor:
    definition: "공포, 취약성, 허위 희소성, 과장 claim에 의존"
    example: "지금 안 사면 피부가 더 나빠질 수 있습니다"

  broken_media_soliton:
    definition: "채널별 핵심 의미·근거·Vibe·CTA가 흩어짐"
    example: "홈페이지는 안전을 말하지만 광고는 과장 CTA"

  conversion_gap:
    definition: "신뢰는 생겼지만 다음 행동이 약함"
    example: "좋은 FAQ가 있지만 상담/저장/비교 CTA 없음"

  trust_gap:
    definition: "CTA는 강하지만 근거와 경계가 부족함"
    example: "상담 신청 버튼은 많지만 실제 사례와 검수 근거 없음"
```

### 9.2 Brand Attractor Portfolio Score

```text
Brand Attractor Portfolio Score =
Discovery Coverage
+ Problem Clarification Coverage
+ Anxiety Reducer Coverage
+ Trust/Evidence Coverage
+ Comparison Anchor Coverage
+ Conversion Trigger Coverage
+ Ecosystem Coverage
- Overuse Penalty
- Mixed Signal Penalty
- Unsafe Pattern Penalty
```

### 9.3 Attractor Readiness Score

```text
Attractor Readiness =
Concept Coverage
+ Evidence Availability
+ Vibe Fit
+ CTA Clarity
+ Safety Boundary
```

### 9.4 Attractor Strength Score

```text
Attractor Strength =
Activation Accuracy
+ Target State Transition Lift
+ Trust Lift
+ Control Lift
+ CTA Quality
+ Behavior Lift
- Mixed Signal Penalty
- Safety Violation Penalty
```

---

## 10. Domain Packs

### 10.1 DR.O / Post-Clinic Skincare Domain Pack

```yaml
domain_pack:
  id: dro_interval_guide
  domain: skincare_post_clinic
  primary_question_space:
    - post_clinic_heat
    - redness
    - stinging
    - product_use_decision
    - medi_glow_vs_medi_tension
    - consult_first_boundary

  standard_attractors:
    - id: attractor.dro.post_clinic_anxiety_reducer
      type: [anxiety_reducer, trust]
      user_question: "시술 후 얼굴이 뜨거운데 뭘 써야 해요?"
      required_concepts:
        - time.post_clinic_72h
        - symptom.heat_or_redness
        - intent.homecare_guidance
        - policy.consult_first_if_red_flag
      vibe_signature:
        L0: { arousal: low, control: high }
        L1: { precision: high, warmth_style: medium_high }
        L2: { autonomy_support: high, prevention_frame: high }
        L3: { trust: high }
      cta_policy:
        low_risk: "진정·보습 루틴 확인"
        uncertain: "상태 추가 확인"
        high_risk: "전문가 상담 우선"

    - id: attractor.dro.mediglow_meditension_comparison
      type: [comparison_anchor]
      user_question: "메디글로우와 메디텐션 중 뭐가 먼저예요?"
      required_concepts:
        - product_role.medi_glow
        - product_role.medi_tension
        - context.skin_goal
        - context.post_procedure_or_routine
      cta_policy:
        primary: "내 상태 기준 루틴 비교"

  critical_gaps_to_watch:
    - product_cta_before_red_flag_check
    - vague_reassurance
    - panic_tone
    - insufficient_consult_boundary
```

### 10.2 Global K-Beauty Domain Pack

```yaml
domain_pack:
  id: global_kbeauty_skin_state
  subdomain: barrier_active_ingredient_starter
  primary_question_space:
    - retinol_stinging
    - vitamin_c_mix
    - aha_bha_overuse
    - barrier_reset
    - climate_routine_fit
    - country_claim_check

  standard_attractors:
    - id: attractor.kbeauty.active_beginner_anxiety_reducer
      type: [anxiety_reducer, problem_clarification]
      user_question: "Retinol stings. Should I continue?"
      required_concepts:
        - ingredient.retinol
        - symptom.stinging
        - user.active_ingredient_beginner
        - intent.continue_or_stop_decision
      forbidden_concepts:
        - permission.unconditional_continue
      action_policy:
        - ask_frequency_and_severity
        - cautionary_guidance
        - consult_first_if_severe

    - id: attractor.kbeauty.claim_safe_trust
      type: [trust, evidence]
      user_question: "Can I say this repairs the skin barrier?"
      required_concepts:
        - claim.barrier_repair_risk
        - market_policy
        - evidence_requirement
      action_policy:
        - classify_claim_risk
        - suggest_safer_expression
        - require_evidence_if_strong_claim

  critical_gaps_to_watch:
    - drug_like_claim
    - overconfident_routine_advice
    - country_policy_missing
    - product_cta_under_irritation
```

### 10.3 Jeju Context Travel Domain Pack

```yaml
domain_pack:
  id: jeju_context_travel
  subdomain: weather_companion_mobility_course
  primary_question_space:
    - rainy_day_alternative
    - strong_wind_safety
    - elderly_low_walk
    - children_indoor
    - no_car_feasibility
    - airport_buffer
    - quiet_local_preference

  standard_attractors:
    - id: attractor.jeju.rain_low_friction_course
      type: [anxiety_reducer, comparison_anchor, conversion_trigger]
      user_question: "비 오는데 어디 가요?"
      required_concepts:
        - weather.rain
        - intent.alternative_course
        - policy.indoor_or_semi_indoor_priority
      forbidden_concepts:
        - long_oreum_hike
        - overpacked_schedule
      action_policy:
        - ask_region_and_mobility_if_missing
        - propose_plan_a_b
        - include_map_cta

    - id: attractor.jeju.elderly_low_walk_comfort
      type: [problem_clarification, anxiety_reducer]
      user_question: "부모님 모시고 많이 걷지 않는 코스"
      required_concepts:
        - traveler.elderly_parents
        - constraint.low_walking_tolerance
        - policy.low_walk_route
      action_policy:
        - avoid_stairs_if_unknown
        - prefer_short_walk_rest_stop
        - avoid_overpacked_schedule

  critical_gaps_to_watch:
    - mobility_missing
    - unrealistic_route
    - weather_policy_miss
    - accessibility_evidence_gap
```

### 10.4 AIHompy / B-SSoT Domain Pack

```yaml
domain_pack:
  id: aihompy_brand_ssot
  primary_question_space:
    - brand_identity_discovery
    - service_fit
    - portfolio_trust
    - price_package_comparison
    - consultation_comfort
    - aeo_geo_concept_transfer

  standard_attractors:
    - id: attractor.aihompy.ai_readable_brand_discovery
      type: [discovery, ecosystem]
      user_question: "이 브랜드가 무엇을 잘하나요?"
      required_concepts:
        - brand_core_concept
        - service_scope
        - target_customer
      media_soliton:
        core_proposition: "AI가 이해하고 고객이 신뢰하고 상담으로 이어지는 홈페이지"
        channels:
          - homepage_hero
          - answer_card
          - llm_txt
          - chatbot_intro

    - id: attractor.aihompy.consultation_conversion_comfort
      type: [conversion_trigger, anxiety_reducer]
      user_question: "상담하면 부담스럽지 않을까요?"
      required_concepts:
        - consultation_process
        - low_pressure_cta
        - expected_next_step
      vibe_signature:
        L0: { control: high, arousal: low }
        L2: { autonomy_support: high }
        L3: { trust: high }

  critical_gaps_to_watch:
    - brand_concept_missing
    - evidence_gap
    - cta_pressure
    - broken_media_soliton
```

### 10.5 Korean Medicine Clinic Domain Pack

```yaml
domain_pack:
  id: korean_medicine_clinic_aihompy
  primary_question_space:
    - symptom_fit
    - first_visit_anxiety
    - treatment_scope_boundary
    - reservation_process
    - evidence_trust

  standard_attractors:
    - id: attractor.kmedicine.symptom_fit_clarifier
      type: [problem_clarification, trust]
      user_question: "이 증상도 진료 대상인가요?"
      required_concepts:
        - symptom_question
        - clinic_scope
        - no_diagnosis_online
      action_policy:
        - explain_general_scope
        - ask_visit_or_consult
        - avoid_treatment_guarantee

    - id: attractor.kmedicine.first_visit_anxiety_reducer
      type: [anxiety_reducer, conversion_trigger]
      user_question: "처음 가면 뭘 하나요?"
      required_concepts:
        - first_visit_process
        - patient_autonomy
        - consultation_boundary
      vibe_signature:
        L0: { arousal: low, control: high }
        L1: { warmth_style: high, precision: high }
```

### 10.6 Wedding Studio Domain Pack

```yaml
domain_pack:
  id: wedding_studio_aihompy
  primary_question_space:
    - portfolio_mood_fit
    - natural_pose_anxiety
    - package_comparison
    - schedule_availability
    - consultation_comfort

  standard_attractors:
    - id: attractor.wedding.portfolio_discovery
      type: [discovery, trust]
      user_question: "이런 분위기로 찍을 수 있나요?"
      required_concepts:
        - portfolio_style
        - actual_shooting_evidence
        - couple_mood_fit
      cta_policy:
        primary: "비슷한 콘셉트 상담"

    - id: attractor.wedding.package_comparison_anchor
      type: [comparison_anchor]
      user_question: "패키지 차이가 뭐예요?"
      required_concepts:
        - package_components
        - shooting_time
        - retouching
        - album_or_file_delivery
        - additional_cost_boundary
```

---

## 11. LLM Runtime Behavior

### 11.1 Attractor Selection Flow

```text
User Input
→ Extract Expressions
→ Build Query-State
→ Map Required Concepts
→ Detect Risk / Missing Context
→ Retrieve Candidate Attractors
→ Score Attractor Fit
→ Bind Evidence / Policy / Vibe
→ Generate Response or Channel Asset
→ Log Run-Receipt
```

### 11.2 Attractor Fit Scoring

```text
AttractorFit(a | q, x) =
  concept_match(a, q)
+ context_fit(a, x)
+ intent_fit(a, x)
+ risk_policy_fit(a, x)
+ evidence_availability(a)
+ vibe_requirement_fit(a, x)
- forbidden_condition_penalty(a, q, x)
```

### 11.3 Response Generation Rules

LLM은 다음 규칙을 따른다.

```text
1. 질문을 바로 답하지 말고 Query-State로 구조화한다.
2. missing_context가 중요하면 먼저 묻는다.
3. risk_state가 high 또는 uncertain이면 safety policy를 우선한다.
4. Evidence Anchor가 없으면 강한 주장을 피한다.
5. Action Policy가 product_cta_restricted이면 제품 구매/사용 권유를 하지 않는다.
6. Vibe Signature를 지킨다.
7. CTA는 사용자의 Control과 Autonomy를 낮추지 않아야 한다.
8. 출력 후 Run-Receipt에 필요한 trace를 남긴다.
```

### 11.4 Prompt Template: Attractor Mining

```text
[ROLE]
You are a Pattern Attractor Foundry analyst.

[TASK]
Given domain materials, extract recurring user decision patterns and define standard Pattern Attractors.

[INPUTS]
- domain name
- subdomain scope
- customer questions
- FAQ / reviews / consultation notes
- brand assets
- constraints / safety policies

[PROCESS]
1. Cluster questions into Query-State groups.
2. Identify repeated uncertainty, anxiety, comparison, trust, conversion patterns.
3. Map each cluster to standard Attractor types.
4. Define required TCO concepts, evidence anchors, forbidden concepts, action policies.
5. Define Vibe Signature using L0-L3 layers.
6. Create Media Soliton rules for homepage, Answer Card, chatbot, cardnews, ad, sales script.
7. Define Run-Receipt metrics and failure modes.

[OUTPUT]
Return domain_standard_attractors as YAML.
```

### 11.5 Prompt Template: Brand Attractor Gap Audit

```text
[ROLE]
You are a Brand Attractor Gap auditor.

[TASK]
Compare a brand's current assets against the Domain Pattern Attractor Library.

[INPUTS]
- domain_standard_attractors
- brand homepage / FAQ / product pages / social posts / chatbot logs
- conversion goals
- safety and brand constraints

[PROCESS]
1. Identify which standard Attractors are present, weak, missing, unsafe, or misaligned.
2. For each gap, identify affected query states.
3. Diagnose concept gaps, evidence gaps, vibe gaps, CTA gaps, media soliton breaks.
4. Prioritize fixes by risk, frequency, business impact, and fixability.
5. Generate revised Attractor specs and channel assets.

[OUTPUT]
Return:
- brand_attractor_portfolio
- attractor_gap_report
- recomposition_tasks
- media_soliton_pack
```

### 11.6 Prompt Template: Channel Asset Generation

```text
[ROLE]
You are a Media Soliton Generator.

[TASK]
Convert a Pattern Attractor into channel-specific assets while preserving Core Proposition, Evidence Anchor, Vibe Signature, Action Policy, and CTA Vector.

[INPUTS]
- pattern_attractor_spec
- target channels
- brand tone constraints
- safety constraints

[OUTPUT]
For each channel, generate:
- content
- preserved_core_proposition
- evidence_anchor_visible
- cta_vector
- vibe_signature_check
- policy_compliance_check
```

---

## 12. Evaluation Framework

### 12.1 Core Metrics

```yaml
metrics:
  activation_accuracy:
    question: "필요한 상황에서 올바른 Attractor가 활성화되었는가?"

  concept_coverage:
    question: "필수 개념을 포함했는가?"

  boundary_accuracy:
    question: "경계/금지/위험 조건을 정확히 구분했는가?"

  evidence_binding:
    question: "주장과 근거가 연결되었는가?"

  action_policy_correctness:
    question: "답변/CTA/상담/보류 정책이 맞는가?"

  vibe_alignment:
    question: "목표 Vibe Signature와 출력 체감이 맞는가?"

  mixed_signal_alert:
    question: "말과 CTA, 근거와 표현 강도, 브랜드 약속과 UX가 충돌하는가?"

  target_state_transition:
    question: "사용자가 이해·신뢰·안심·비교 명료화·행동 준비 상태로 이동했는가?"

  conversion_quality:
    question: "전환이 적절한 상태에서 발생했는가?"

  recomposition_gain:
    question: "개선 후 성능이 향상되었는가?"
```

### 12.2 Human Rating Rubric

```yaml
human_rating_axes:
  clarity:
    scale: 1-5
    prompt: "사용자가 지금 무엇을 해야 하는지 명확한가?"

  trust:
    scale: 1-5
    prompt: "근거와 경계가 보여 신뢰할 수 있는가?"

  control:
    scale: 1-5
    prompt: "사용자가 선택권과 통제감을 느끼는가?"

  pressure:
    scale: 1-5
    prompt: "CTA가 압박적으로 느껴지는가? 낮을수록 좋다."

  context_fit:
    scale: 1-5
    prompt: "사용자 상황과 잘 맞는가?"

  policy_safety:
    scale: 1-5
    prompt: "위험/경계/금지 조건이 잘 처리되었는가?"
```

### 12.3 Baseline Comparison

검증 시 최소 세 그룹을 비교한다.

```text
A. General LLM
B. RAG-only Answer
C. TCO-Vibe Pattern Attractor Foundry Runtime
```

Primary hypothesis:

```text
C가 A/B보다 Concept Coverage, Boundary Accuracy, Evidence Binding, Action Policy Correctness, Vibe Alignment, User Next-Step Clarity, Conversion Quality에서 높다.
```

---

## 13. Repository Structure

추천 레포 구조:

```text
pattern-attractor-foundry/
  README.md
  docs/
    00_overview.md
    01_core_concepts_tco_vibe_media_soliton.md
    02_attractor_taxonomy.md
    03_domain_extraction_pipeline.md
    04_brand_gap_audit.md
    05_evaluation_framework.md
    06_safety_governance.md

  schemas/
    pattern_attractor.schema.json
    domain_pack.schema.json
    brand_attractor_portfolio.schema.json
    attractor_gap_report.schema.json
    media_soliton.schema.json
    run_receipt.schema.json

  packs/
    dro_interval_guide/
      concepts.yaml
      attractors.yaml
      policies.yaml
      media_solitons.yaml
      goldset.sample.jsonl
    global_kbeauty/
      concepts.yaml
      attractors.yaml
      policies.yaml
      claim_rules.yaml
      goldset.sample.jsonl
    jeju_context_travel/
      concepts.yaml
      attractors.yaml
      policies.yaml
      place_card.schema.yaml
      goldset.sample.jsonl
    aihompy/
      concepts.yaml
      attractors.yaml
      answer_cards.yaml
      llm_txt_rules.yaml
    wedding_studio/
      concepts.yaml
      attractors.yaml
      portfolio_evidence.yaml
    korean_medicine_clinic/
      concepts.yaml
      attractors.yaml
      safety_policies.yaml

  prompts/
    attractor_mining.md
    brand_gap_audit.md
    media_soliton_generation.md
    tco_vibe_response_generation.md
    run_receipt_analysis.md
    recomposition_task_generation.md

  pipelines/
    ingest_questions.md
    cluster_query_states.md
    build_domain_attractors.md
    build_brand_portfolio.md
    generate_channel_assets.md
    evaluate_attractors.md
    recomposition.md

  examples/
    dro_post_clinic_consult_first.yaml
    kbeauty_claim_safe_trust.yaml
    jeju_rain_low_friction_course.yaml
    aihompy_consultation_comfort.yaml

  tests/
    goldset/
      dro_interval_guide.jsonl
      global_kbeauty.jsonl
      jeju_context_travel.jsonl
    eval_runs/
      README.md
```

---

## 14. Minimal Runtime Components

```text
1. Question Ingestor
2. Query-State Clusterer
3. Concept Canonicalizer
4. Context Tensor Builder
5. Attractor Retriever
6. Attractor Fit Scorer
7. Evidence Binder
8. Vibe Spec Coder
9. Policy Binder
10. Media Soliton Generator
11. Response / Asset Generator
12. Run-Receipt Logger
13. Gap Analyzer
14. Recomposition Engine
```

---

## 15. Database Tables

```sql
-- domain and taxonomy
create table domains (
  id text primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table tco_concepts (
  id text primary key,
  domain_id text references domains(id),
  natural_definition text,
  concept_type text,
  activation_condition jsonb,
  boundary jsonb,
  evidence_requirement jsonb,
  risk_vector jsonb,
  action_policy jsonb,
  created_at timestamptz default now()
);

create table pattern_attractors (
  id text primary key,
  domain_id text references domains(id),
  type text[] not null,
  natural_definition text,
  trigger_state jsonb,
  concept_state jsonb,
  evidence_anchor jsonb,
  vibe_signature jsonb,
  action_policy jsonb,
  media_soliton_rule jsonb,
  target_state jsonb,
  metrics jsonb,
  failure_modes jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table brand_attractor_portfolios (
  id uuid primary key default gen_random_uuid(),
  brand_id text not null,
  domain_id text references domains(id),
  attractor_id text references pattern_attractors(id),
  status text,
  readiness_score numeric,
  strength_score numeric,
  gap_types text[],
  notes text,
  created_at timestamptz default now()
);

create table media_solitons (
  id text primary key,
  attractor_id text references pattern_attractors(id),
  core_proposition text,
  evidence_anchor text,
  vibe_signature jsonb,
  cta_vector text,
  channel_assets jsonb,
  preservation_scores jsonb,
  created_at timestamptz default now()
);

create table run_receipts (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  brand_id text,
  domain_id text references domains(id),
  attractor_id text references pattern_attractors(id),
  input_query text,
  concept_state jsonb,
  context_tensor jsonb,
  vibe_spec jsonb,
  action_policy jsonb,
  output_variant text,
  cta_shown jsonb,
  cta_clicked jsonb,
  user_behavior jsonb,
  human_feedback jsonb,
  detected_gaps text[],
  created_at timestamptz default now()
);
```

---

## 16. Safety and Governance

Pattern Attractor는 행동을 유도하는 기술이므로 윤리 원칙이 필수다.

### 16.1 Prohibited Uses

```text
- 고객의 취약성, 불안, 외로움, 공포를 악용하는 전환 설계
- 허위 희소성 또는 압박형 CTA
- 근거 없는 결과 보장
- 의료·피부·금융·법률 영역에서 전문가 판단을 대체하는 단정
- 민감 속성 추론 또는 고정 라벨링
- AI 생성 결과와 실제 결과물 혼동 유도
- 후기, 사례, 근거의 허위 생성
```

### 16.2 Required Safeguards

```yaml
safeguards:
  evidence_first:
    description: "근거 없이 강한 claim을 만들지 않는다."

  autonomy_preserving_cta:
    description: "사용자가 선택권과 통제감을 느끼도록 CTA를 설계한다."

  boundary_notes:
    description: "의료/법률/금융/피부/안전 영역에는 경계 문구를 포함한다."

  mixed_signal_detection:
    description: "브랜드 약속, 카피, UX, CTA가 충돌하지 않는지 점검한다."

  human_review:
    description: "고위험 도메인은 전문가/운영자 검수를 요구한다."

  ai_disclosure:
    description: "AI 생성 이미지/문구/추천과 실제 근거를 구분한다."
```

---

## 17. Example: Full Attractor Spec

```yaml
pattern_attractor:
  id: attractor.dro.post_clinic_consult_first_anxiety_reducer
  version: "0.1.0"
  status: active
  type:
    - anxiety_reducer
    - trust
    - conversion_trigger

  domain:
    id: dro_interval_guide
    subdomain: post_clinic_72h_homecare

  natural_definition: >
    시술 후 72시간 이내 열감·붉은기·따가움이 있는 사용자가 제품 사용 가능 여부를 묻는 상황에서,
    위험 신호를 먼저 확인하고, 불안을 과도하게 자극하지 않으면서도 상담 우선 경계와 진정·보습 루틴을 명확히 안내하는 패턴.

  trigger_state:
    user_question_patterns:
      - "토닝 후 얼굴이 뜨거운데 메디글로우 써도 돼요?"
      - "시술 후 따가운데 계속 발라도 되나요?"
      - "붉은기가 있는데 뭘 발라야 해요?"
    context_requirements:
      - time.post_clinic_72h
    risk_state:
      level: uncertain
    intent_state:
      - product_use_decision
      - safety_check
    missing_context:
      - severity
      - oozing
      - strong_stinging
      - allergy_history

  concept_state:
    required_concepts:
      - time.post_clinic_72h
      - symptom.heat_or_redness_or_stinging
      - intent.product_use_decision
      - policy.red_flag_check_required
    allowed_concepts:
      - product.medi_glow
      - routine.base_reset
      - routine.calming_moisturizing
    forbidden_concepts:
      - permission.unconditional_use
      - diagnosis.medical_condition
      - product_cta.push_purchase_under_uncertainty

  evidence_anchor:
    required_sources:
      - official_answer_card.post_clinic_homecare
      - safety_note.consult_first
      - product_role.medi_glow
    evidence_visibility_rule: "상담 우선 조건과 홈케어 가능 범위를 제품 CTA보다 먼저 노출"
    claim_strength_limit: limited

  vibe_signature:
    L0_core_affect:
      valence: calm_positive
      arousal: low
      control: high
    L1_expressive_style:
      warmth_style: medium_high
      precision: high
      energy: low
      authenticity: high
    L2_motivational_affordance:
      autonomy_support: high
      competence_support: high
      prevention_frame: high
    L3_social_appraisal:
      trust: high
      competence: high
      fairness: high
    avoid_vibe:
      - panic
      - vague_reassurance
      - commercial_pressure
      - overconfidence

  action_policy:
    allowed_actions:
      - ask_red_flag_questions
      - explain_cautious_homecare
      - offer_consult_cta
      - offer_routine_info_if_low_risk
    blocked_actions:
      - unconditional_product_permission
      - push_product_purchase
      - diagnose_condition
    cta_policy:
      primary: "위험 신호 먼저 확인"
      secondary:
        - "진정·보습 루틴 보기"
        - "전문가 상담하기"
      blocked:
        - "바로 구매하기 only"
    safety_policy:
      escalation_conditions:
        - "진물"
        - "강한 따가움"
        - "심한 붉은기"
        - "알레르기 이력"

  media_soliton_rule:
    core_proposition: "시술 후 피부가 불편한 시기에는 제품을 더하기보다 피부 신호와 상담 우선 조건을 먼저 확인한다."
    evidence_anchor: "post_clinic_72h + red_flag_check + base_reset"
    cta_vector: "상태 확인 → 루틴 안내 또는 상담"
    channel_adaptation_rules:
      homepage: "시술 후 72시간, 피부 신호 먼저 확인하세요."
      answer_card: "열감·붉은기·따가움이 있다면 먼저 위험 신호를 확인하세요."
      chatbot: "몇 가지 상태를 먼저 확인한 뒤 안내드릴게요."
      cardnews: "시술 후 바로 제품? 먼저 확인할 4가지 신호"
      ad: "시술 후 홈케어, 먼저 피부 신호부터"
      sales_script: "고객님 상태 확인 후 안전한 범위에서 안내드리겠습니다."
      llm_txt: "DR.O guides post-clinic homecare with Consult First safety boundaries."

  target_state:
    cognitive:
      - understands_red_flags
      - understands_product_use_boundary
    affective:
      - anxiety_reduced
      - control_increased
    motivational:
      - ready_to_answer_followup
      - ready_to_choose_consult_if_needed
    behavioral:
      - red_flag_question_answered
      - consult_click_if_high_risk
      - routine_view_if_low_risk

  metrics:
    activation_accuracy: "correct_attractor_selected / eligible_cases"
    target_state_transition_lift: "next_step_clarity_after - baseline_next_step_clarity"
    evidence_trust_lift: "trust_after_evidence - trust_before_evidence"
    vibe_alignment: "target_vibe_match_score - MSA_penalty"
    cta_appropriateness: "human_rating_cta_fit"
    behavior_outcome_lift: "safe_cta_click_rate - baseline"
    mixed_signal_penalty: "pressure_score + unsupported_claim_score"
    safety_violation_penalty: "count(blocked_action_violations)"

  failure_modes:
    - product_cta_before_red_flag_check
    - panic_tone
    - vague_reassurance
    - missing_consult_boundary
    - insufficient_evidence

  recomposition_rule:
    if_failed_then:
      - "add_red_flag_followup"
      - "lower_claim_strength"
      - "rewrite_cta_to_autonomy_supportive"
      - "increase_evidence_visibility"
      - "update_goldset"
```

---

## 18. Implementation Checklist

### 18.1 MVP Checklist

```text
[ ] Select one narrow domain/subdomain.
[ ] Collect at least 40-80 customer questions.
[ ] Cluster questions into 10-20 Query-State groups.
[ ] Define 50-120 TCO concepts.
[ ] Define 10-20 Pattern Attractors.
[ ] Define Vibe Signature for each Attractor.
[ ] Create 30-60 Goldset items.
[ ] Build Media Soliton Pack for top 5 Attractors.
[ ] Instrument Run-Receipt logging.
[ ] Compare against general LLM and RAG-only baseline.
[ ] Run human review and first Recomposition cycle.
```

### 18.2 Production Checklist

```text
[ ] Domain Pack versioning
[ ] Brand Pack versioning
[ ] Human review workflow
[ ] Attractor Fit Scorer
[ ] Safety policy registry
[ ] Vibe evidence-first coder
[ ] Media Soliton preservation checker
[ ] Attractor Gap Dashboard
[ ] A/B test support
[ ] Regression goldset
[ ] Audit logs
[ ] Privacy and data governance
```

---

## 19. Final Thesis

**Pattern Attractor Foundry는 도메인별 고객 의사결정 패턴을 표준화하고, 브랜드별 실행 패턴의 누락·약점·불일치·전환 기회를 찾아, TCO의 개념/정책 제어와 Vibe OS의 체감/신뢰 측정, Media Soliton의 채널 보존, Run-Receipt의 성과 학습을 결합하는 범용 AttractorOps 시스템이다.**

가장 짧은 실행 공식:

```text
질문을 상태로 바꾼다.
상태에 맞는 Attractor를 선택한다.
개념·근거·Vibe·정책·CTA를 바인딩한다.
채널별로 보존 변환한다.
성과를 기록한다.
패턴을 다시 고친다.
```

---

## 20. Recommended Next Files

이 문서를 기반으로 다음 repo 파일을 추가 생성할 수 있다.

```text
schemas/pattern_attractor.schema.json
schemas/media_soliton.schema.json
schemas/run_receipt.schema.json
packs/jeju_context_travel/attractors.yaml
packs/global_kbeauty/attractors.yaml
packs/dro_interval_guide/attractors.yaml
prompts/attractor_mining.md
prompts/brand_gap_audit.md
pipelines/build_domain_attractors.md
pipelines/evaluate_attractors.md
```
