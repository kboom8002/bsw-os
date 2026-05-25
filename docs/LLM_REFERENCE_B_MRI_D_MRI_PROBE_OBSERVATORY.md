# LLM Reference — B-MRI / D-MRI / Probe Observatory

Version: v1.0  
Status: Repo reference spec for LLM / AI-pair coding agents  
Product: Brand Semantic Website OS  
Scope: B-MRI, D-MRI, Probe QIS Observatory, proxy measurement design, examples  
Primary audience: LLM coding agents, product architects, measurement engineers, AI observability implementers

---

## 0. Purpose

This document defines how **B-MRI**, **D-MRI**, and **Probe QIS Observatory** work inside Brand Semantic Website OS.

It is written as a **repo reference document for another LLM**.

The target LLM should be able to understand:

1. What each artifact means.
2. How B-MRI differs from D-MRI.
3. How Probe Observatory produces panel-based proxy measurements.
4. How OpenAI Responses API or other AI response providers can be used as observation adapters.
5. How to store raw responses, judgments, metric snapshots, and caveats.
6. How to calculate proxy metrics such as AI Answer Share, Official Citation Rate, Brand Semantic Fidelity, and B-MRI.
7. How D-MRI diagnoses operational readiness and fixability.
8. How examples work for K-Beauty, Convenience Retail, and Wedding.

---

## 1. Non-negotiable Principles

The implementation MUST preserve the following rules.

```text
1. AI observation is an observed proxy, not hidden model truth.
2. Raw probe responses must be stored.
3. Probe panels must be versioned.
4. Metrics must link to source observation runs.
5. Before/after comparisons must use the same panel version unless explicitly marked otherwise.
6. Methodology disclosure is mandatory for any report or exported metric.
7. Proxy caveat is mandatory for any AI/search observation-based metric.
8. B-MRI and D-MRI must not be collapsed.
9. B-MRI measures observed brand outcome in AI/search-like responses.
10. D-MRI measures operational quality and diagnosis readiness of the brand semantic system.
11. Every patch is a hypothesis.
12. No patch success without retest.
```

---

## 2. Core Definitions

### 2.1 Probe QIS Observatory

**Probe QIS Observatory** is the measurement subsystem that repeatedly asks standardized probe questions and stores observed AI/search-like responses.

It answers:

```text
For this domain and this question panel,
how do AI/search-like systems answer,
which brands are mentioned or centered,
which sources are surfaced,
which concepts transfer,
which boundaries are visible,
and which weaknesses should be fixed?
```

Probe Observatory is not a truth engine. It is an observation engine.

It does not say:

```text
The model truly prefers Brand A.
Brand A has actual market share.
This is the absolute search visibility of the brand.
```

It says:

```text
Within this versioned probe panel, under this provider/model/surface configuration,
Brand A was observed as centered/mentioned/cited at this rate.
```

---

### 2.2 D-MRI

**D-MRI** means **Domain / Diagnostic MRI** or **Digital Meaning Readiness Index** depending on product naming.

In this system, D-MRI is fixed as:

```text
D-MRI = operational quality and diagnosis readiness of the domain/brand meaning system.
```

D-MRI measures whether the brand has the internal semantic infrastructure needed to produce reliable AEO/GEO outcomes.

It focuses on:

```text
Truth completeness
Evidence readiness
Boundary readiness
Question coverage
QIS quality
TCO Concept quality
Claim lineage completeness
Object readiness
Surface validation
Page/export readiness
Persona/Vibe governance readiness
Observatory coverage
Fix-It traceability
```

D-MRI does NOT measure whether the brand is currently winning in AI responses. That is B-MRI.

---

### 2.3 B-MRI

**B-MRI** means **Brand MRI**.

In this system, B-MRI is fixed as:

```text
B-MRI = brand strategic outcome and competitive observed response performance in AI/search-like responses.
```

B-MRI measures how the brand performs in observed AI/search-like answers for a standardized probe panel.

It focuses on:

```text
AI Answer Share
Official Citation Rate
Brand Semantic Fidelity
Question Territory Coverage
GEO Concept Transfer Rate
AEO Readiness Score
Competitive answer position
Source mix quality
Trust/boundary/action visibility
```

B-MRI is downstream of Probe Observatory.

B-MRI is always:

```text
panel-based
provider/model/surface-specific
time-bounded
methodology-disclosed
proxy-caveated
```

---

## 3. B-MRI vs D-MRI

### 3.1 One-line Difference

```text
D-MRI = Are we structurally ready and diagnosable?
B-MRI = Are we observed to win or perform well in AI/search-like answers?
```

---

### 3.2 Comparison Table

| Dimension | D-MRI | B-MRI |
|---|---|---|
| Primary question | Is our semantic system operationally ready? | Are AI/search-like responses showing us well? |
| Layer | Internal readiness / system quality | External observed answer outcome |
| Main source | Brand Truth, QIS, concepts, objects, surfaces, pages, gates | Probe runs, raw responses, response judgments, metric snapshots |
| Competition-aware | Optional | Mandatory or strongly recommended |
| Time sensitivity | Medium | High |
| Requires AI response observations | Not always | Yes |
| Used for | Diagnosis, readiness, build quality, Fix-It planning | Competitive performance, reports, benchmarks, strategic KPI |
| Output type | Readiness / quality / diagnosis index | Observed performance / competitive proxy index |
| Example weakness | Boundary missing in high-risk page | Competitor is centered in AI answer for our target QIS |
| Main downstream | Fix-It readiness, build backlog | Benchmark report, RCA, patch/retest, client dashboard |

---

### 3.3 Common Misunderstandings

Do NOT implement this:

```text
B-MRI = D-MRI = one generic SEO score
```

Do NOT implement this:

```text
B-MRI is just brand mention count
```

Do NOT implement this:

```text
D-MRI requires live AI observation every time
```

Correct implementation:

```text
D-MRI can be calculated from internal artifact readiness.
B-MRI requires observed response judgments from Probe Observatory.
```

---

## 4. Probe Observatory Architecture

### 4.1 Core Flow

```text
Question Capital / CQ / QIS
→ Probe Panel
→ Probe Questions
→ AI Observation Run
→ Probe Runs
→ Raw Responses
→ Response Judgments
→ Metric Snapshots
→ B-MRI / D-MRI / Domain Index
→ Report
→ RCA / Patch / Retest
```

---

### 4.2 Core Artifacts

```text
probe_panel
probe_question
ai_observation_run
probe_run
response_judgment
metric_snapshot
domain_index_definition
domain_index_snapshot
methodology_disclosure
semantic_website_lift_snapshot
```

---

### 4.3 Database Object Overview

#### probe_panels

A versioned set of standardized probe questions.

```ts
type ProbePanel = {
  id: string
  workspace_id: string
  domain_id: string
  name: string
  panel_type: "standard" | "brand_specific" | "competitor_benchmark" | "retest" | "domain_index"
  version: number
  status: "draft" | "active" | "locked" | "archived"
  source_question_capital_ids: string[]
  source_qis_scene_ids: string[]
  target_brand_entity_ids: string[]
  competitor_brand_entity_ids: string[]
  question_count: number
  repeat_recommendation: number
  methodology_note: string
  created_at: string
}
```

#### probe_questions

A single measurement question derived from QIS.

```ts
type ProbeQuestion = {
  id: string
  workspace_id: string
  panel_id: string
  source_qis_scene_id?: string
  query_text: string
  query_variants: string[]
  question_type: string
  topic_slice: string
  persona_segment?: string
  decision_stage?: string
  risk_level: "low" | "medium" | "high"
  expected_concept_ids: string[]
  target_brand_entity_ids: string[]
  competitor_brand_entity_ids: string[]
  weight: number
  status: "draft" | "active" | "disabled"
}
```

#### ai_observation_runs

A run of a probe panel against one provider/model/surface configuration.

```ts
type AIObservationRun = {
  id: string
  workspace_id: string
  domain_id: string
  panel_id: string
  run_name: string
  provider: "openai_responses" | "mock" | "perplexity" | "google_ai_overview_manual" | "custom"
  model_or_surface: string
  run_config: Record<string, unknown>
  measurement_period_start: string
  measurement_period_end?: string
  target_brand_entity_ids: string[]
  competitor_brand_entity_ids: string[]
  status: "queued" | "running" | "completed" | "failed" | "cancelled" | "partial"
  repeat_count: number
  query_variant_count: number
  created_by?: string
  created_at: string
}
```

#### probe_runs

One raw response to one probe question, variant, and repeat.

```ts
type ProbeRun = {
  id: string
  workspace_id: string
  observation_run_id: string
  panel_id: string
  probe_question_id: string
  query_text: string
  query_variant?: string
  repeat_index: number
  raw_response_text: string
  raw_response_payload_ref?: string
  surfaced_sources: Array<{
    title?: string
    url?: string
    domain?: string
    source_type: "official" | "third_party" | "unknown"
  }>
  response_status: "success" | "error" | "skipped"
  error_summary?: string
  captured_at: string
}
```

#### response_judgments

A structured judgment over a raw response.

```ts
type ResponseJudgment = {
  id: string
  workspace_id: string
  probe_run_id: string
  observation_run_id: string
  domain_id: string

  centered_brand_entity_id?: string
  mentioned_brand_entity_ids: string[]
  competitor_brand_entity_ids: string[]

  centeredness_score: number | null
  official_citation: boolean
  source_mix_type: "official" | "third_party" | "mixed" | "unknown" | "none"

  concept_transfer_score: number | null
  concept_distortion_score: number | null
  missing_concept_ids: string[]
  hallucinated_concept_notes: string[]

  explanation_quality_score: number | null
  trust_visible: boolean
  boundary_visible: boolean
  action_alignment_score: number | null

  persona_alignment_score?: number | null
  vibe_alignment_score?: number | null
  mixed_signal_flags: string[]

  confidence: number
  judgment_method: "ai_candidate" | "rule_based" | "human_reviewed" | "hybrid"
  review_status: "pending" | "approved" | "rejected" | "needs_review"

  created_at: string
}
```

#### metric_snapshots

A persistent metric computation result.

```ts
type MetricSnapshot = {
  id: string
  workspace_id: string
  domain_id: string
  brand_entity_id?: string

  metric_family: "business_aeo_geo" | "d_mri" | "b_mri" | "tco_geo" | "s_mri" | "p_mri" | "v_mri" | "domain_index"
  metric_name: string
  metric_value: number | null
  metric_payload: Record<string, unknown>

  source_observation_run_ids: string[]
  source_artifact_refs: Record<string, unknown>

  panel_id?: string
  panel_version?: number

  measurement_period: {
    start?: string
    end?: string
  }

  confidence: number | null
  volatility: number | null

  proxy_caveat: string
  created_at: string
}
```

---

## 5. Measurement Provider Design

### 5.1 Provider Abstraction

Probe Observatory MUST support provider abstraction.

```ts
type ProbeProvider = {
  name: string
  supportsWebSearch?: boolean
  supportsCitations?: boolean
  supportsStructuredOutput?: boolean

  runProbe(input: {
    queryText: string
    domainType: string
    targetBrandNames: string[]
    competitorBrandNames: string[]
    expectedConcepts?: string[]
    locale?: string
    providerConfig?: Record<string, unknown>
  }): Promise<{
    rawResponseText: string
    rawResponsePayload?: unknown
    surfacedSources: Array<{
      title?: string
      url?: string
      domain?: string
      sourceType: "official" | "third_party" | "unknown"
    }>
    providerMetadata: Record<string, unknown>
  }>
}
```

Provider examples:

```text
mock
openai_responses
manual_google_ai_overview
manual_perplexity
custom_search_agent
```

---

### 5.2 OpenAI Responses API Proxy Adapter

A recommended implementation is:

```text
provider = "openai_responses"
```

Use case:

```text
Use a model response as a controlled AI-answer proxy.
Optionally enable web search tool to simulate open-book AI response behavior.
Use Structured Outputs for judgment extraction where possible.
```

Important:

```text
The OpenAI provider result is still a proxy observation.
It is not ground truth about all AI systems.
It is not hidden model preference.
```

#### Suggested Modes

```text
closed_book_proxy:
  The model answers from internal model knowledge only.
  Useful for testing memorized/implicit brand association.

open_book_proxy:
  The model uses web search or retrieved sources.
  Useful for testing source visibility and official citation.

controlled_context_proxy:
  The model is given a controlled set of documents/sources.
  Useful for testing whether the brand's own SSoT or semantic website transfers concepts.

judgment_only:
  The model does not answer the probe; it only judges a previously stored raw response.
```

---

### 5.3 Recommended Provider Config

```json
{
  "provider": "openai_responses",
  "model_or_surface": "gpt-5.5-with-web-search",
  "mode": "open_book_proxy",
  "temperature": 0,
  "web_search": true,
  "structured_judgment": true,
  "locale": "ko-KR",
  "repeat_count": 3,
  "query_variant_count": 2,
  "store_raw_response": true,
  "store_sources": true
}
```

---

### 5.4 Mock Provider Must Exist

Before real providers, implement mock provider.

Mock fixture modes:

```text
centered_brand
competitor_centered
mixed_sources
no_brand
official_citation
third_party_only
hallucinated_claim
boundary_missing
action_missing
```

Mock provider enables:

```text
unit tests
integration tests
demo data
regression tests
CI without paid API dependency
```

---

## 6. Probe Panel Design

### 6.1 Probe Panel Purpose

A probe panel standardizes the measurement question set.

It must cover:

```text
topic slices
decision stages
persona segments
high-risk scenarios
brand vs competitor comparison
source-seeking questions
action-seeking questions
```

---

### 6.2 Probe Question Types

```text
informational
comparison
recommendation
source_seeking
action_seeking
risk_boundary
local_intent
product_fit
price_package
routine_guidance
contract_check
```

---

### 6.3 Probe Panel Construction Workflow

```text
1. Select domain.
2. Select target brand and competitor brands.
3. Load Question Capital nodes.
4. Select Canonical Questions.
5. Select or generate QIS scenes.
6. Stratify by topic slice / decision stage / persona / risk level.
7. Convert QIS into probe questions.
8. Add query variants.
9. Assign weights.
10. Freeze panel version.
```

---

### 6.4 Panel Versioning Rules

```text
Draft panel can be edited.
Locked panel cannot be mutated.
A new benchmark must use a locked version.
Retest must use the same panel version as baseline unless explicitly marked as non-comparable.
```

---

## 7. Measurement Methodology

### 7.1 Basic Measurement Unit

The smallest observation unit is:

```text
one response to one probe question variant at one repeat index under one provider/model/surface config
```

This creates one `probe_run`.

---

### 7.2 Repetition Strategy

Because AI responses vary, run repetitions.

Recommended MVP baseline:

```text
repeat_count = 3
query_variant_count = 2
total responses per question = 6
```

For initial MVP demo:

```text
repeat_count = 1
query_variant_count = 1
```

For publishable benchmark:

```text
repeat_count >= 3
query_variant_count >= 2
question_count >= 30 where feasible
```

---

### 7.3 Query Variant Strategy

Original QIS:

```text
민감성 피부 장벽 회복 루틴은 어떻게 짜야 하나요?
```

Variants:

```text
민감성 피부에 좋은 장벽 케어 루틴 추천해줘.
피부 장벽이 약할 때 어떤 스킨케어 순서가 안전해?
세라마이드 제품으로 피부 장벽 회복 루틴을 짜려면?
```

Each variant must remain semantically equivalent enough to belong to the same QIS.

---

### 7.4 Judgment Strategy

A response judgment can be produced by:

```text
rule_based
ai_candidate
human_reviewed
hybrid
```

Recommended pipeline:

```text
raw response
→ rule-based pre-extraction
→ AI structured judgment candidate
→ optional human review
→ approved judgment
→ metric snapshot
```

For MVP:

```text
AI candidate + deterministic sanity checks are acceptable.
```

For public report:

```text
human review or strong review gate recommended.
```

---

## 8. Core Metrics

### 8.1 AAS — AI Answer Share

AAS is the weighted observed share of responses where a brand is centered or meaningfully mentioned.

MVP formula:

```text
mention_score =
  1.0 if brand is centered
  0.5 if brand is mentioned meaningfully
  0.0 if brand absent

AAS = sum(question_weight * mention_score) / sum(question_weight)
```

Example:

| Probe | Weight | Brand Status | Mention Score |
|---|---:|---|---:|
| Q1 | 1.0 | centered | 1.0 |
| Q2 | 1.0 | mentioned | 0.5 |
| Q3 | 1.0 | absent | 0.0 |

```text
AAS = (1.0 + 0.5 + 0.0) / 3 = 0.50
```

---

### 8.2 OCR — Official Citation Rate

OCR measures how often official brand/domain sources are cited or surfaced.

```text
OCR = official_citation_count / total_judgments
```

If source lists are unreliable or unavailable, set confidence lower.

---

### 8.3 BSF — Brand Semantic Fidelity

BSF measures whether the response transfers the intended brand concepts without distortion.

MVP formula:

```text
BSF = avg(concept_transfer_score - 0.5 * concept_distortion_score)
```

Where:

```text
concept_transfer_score: 0..1
concept_distortion_score: 0..1
```

Example:

```text
concept_transfer_score = 0.8
concept_distortion_score = 0.2
BSF = 0.8 - 0.5*0.2 = 0.7
```

---

### 8.4 QTC — Question Territory Coverage

QTC measures how much of the target question territory is covered by observed answers.

```text
QTC = covered_qis_count / target_qis_count
```

A QIS is covered if:

```text
brand centered or meaningfully mentioned
AND judgment confidence >= threshold
```

Recommended threshold:

```text
confidence >= 0.6
```

---

### 8.5 GCTR — GEO Concept Transfer Rate

GCTR measures how many expected TCO concepts appear correctly.

```text
GCTR = correctly_transferred_concepts / expected_concepts
```

With distortion penalty:

```text
GCTR_adjusted = (correctly_transferred_concepts - distorted_concepts * 0.5) / expected_concepts
```

---

### 8.6 ARS — AEO Readiness Score

ARS measures whether the observed answer contains answer-friendly trust, boundary, explanation, and action structure.

MVP formula:

```text
ARS = avg(
  trust_visible_score,
  boundary_visible_score_when_required,
  explanation_quality_score,
  action_alignment_score
)
```

Convert booleans:

```text
true = 1
false = 0
```

---

### 8.7 SWEL — Semantic Website Effect Lift

SWEL measures before/after lift after semantic website or patch changes.

```text
SWEL = weighted average of post_patch_metric - baseline_metric
```

Example:

```text
baseline_BSF = 0.42
retest_BSF = 0.68
baseline_OCR = 0.20
retest_OCR = 0.45

SWEL = 0.6*(0.68-0.42) + 0.4*(0.45-0.20)
     = 0.6*0.26 + 0.4*0.25
     = 0.156 + 0.10
     = 0.256
```

---

## 9. B-MRI Calculation

### 9.1 B-MRI Inputs

B-MRI should be calculated from observation-based metrics.

Recommended components:

```text
AAS
OCR
BSF
QTC
GCTR
ARS
Competitive Centeredness Delta
Source Quality Score
Confidence Penalty
Volatility Penalty
```

---

### 9.2 MVP B-MRI Formula

```text
B_MRI =
  0.20 * AAS
+ 0.15 * OCR
+ 0.20 * BSF
+ 0.15 * QTC
+ 0.15 * GCTR
+ 0.10 * ARS
+ 0.05 * Competitive_Position_Score
- confidence_penalty
- volatility_penalty
```

Clamp to 0..1.

```ts
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}
```

---

### 9.3 Competitive Position Score

If competitors are included:

```text
Competitive_Position_Score = max(0, target_AAS - avg_competitor_AAS + 0.5)
```

Normalized interpretation:

```text
0.5 = parity with competitors
>0.5 = target brand above average competitor
<0.5 = target brand below average competitor
```

Alternative:

```text
rank_score = 1 - ((rank - 1) / (num_brands - 1))
```

---

### 9.4 Confidence Penalty

```text
confidence_penalty = (1 - confidence) * 0.10
```

---

### 9.5 Volatility Penalty

```text
volatility_penalty = volatility * 0.10
```

If volatility is unknown:

```text
volatility_penalty = 0
metric_payload.warning = "volatility_not_available"
confidence reduced
```

---

### 9.6 B-MRI Output Example

```json
{
  "metric_family": "b_mri",
  "metric_name": "B-MRI",
  "metric_value": 0.67,
  "metric_payload": {
    "formula_version": "b_mri_v1",
    "components": {
      "AAS": 0.58,
      "OCR": 0.42,
      "BSF": 0.72,
      "QTC": 0.65,
      "GCTR": 0.70,
      "ARS": 0.74,
      "Competitive_Position_Score": 0.61
    },
    "confidence_penalty": 0.03,
    "volatility_penalty": 0.02,
    "warnings": ["panel_size_below_publishable_threshold"]
  },
  "source_observation_run_ids": ["obs_run_001"],
  "panel_id": "panel_kbeauty_sensitive_v1",
  "panel_version": 1,
  "confidence": 0.70,
  "volatility": 0.20,
  "proxy_caveat": "This is a panel-based proxy measurement of observed AI/search-like responses, not actual market share or hidden model preference."
}
```

---

## 10. D-MRI Calculation

### 10.1 D-MRI Inputs

D-MRI measures internal readiness and diagnosis quality.

Recommended components:

```text
Truth Readiness
Evidence Readiness
Boundary Readiness
Question System Readiness
Concept/KG Readiness
Claim Lineage Readiness
Object Readiness
Surface/Page Readiness
SEO/AEO/GEO Export Readiness
Persona/Vibe Readiness
Observatory Coverage
Fix-It Traceability
```

---

### 10.2 MVP D-MRI Formula

```text
D_MRI =
  0.10 * Truth_Readiness
+ 0.10 * Evidence_Readiness
+ 0.10 * Boundary_Readiness
+ 0.10 * Question_System_Readiness
+ 0.10 * Concept_KG_Readiness
+ 0.10 * Claim_Lineage_Readiness
+ 0.10 * Object_Readiness
+ 0.10 * Surface_Page_Readiness
+ 0.05 * Export_Readiness
+ 0.05 * Persona_Vibe_Readiness
+ 0.05 * Observatory_Coverage
+ 0.05 * FixIt_Traceability
```

Clamp to 0..1.

---

### 10.3 Component Scoring Guidelines

#### Truth Readiness

```text
1.0 = strategic + operational truth approved and current
0.7 = strategic + operational truth draft but coherent
0.4 = only partial truth
0.0 = missing
```

#### Evidence Readiness

```text
1.0 = all publishable claims have evidence refs
0.7 = most high-risk claims have evidence
0.4 = some evidence but incomplete
0.0 = no evidence
```

#### Boundary Readiness

```text
1.0 = all high-risk QIS/claims/pages have boundary rules
0.7 = most high-risk surfaces have boundaries
0.4 = boundary exists but not linked
0.0 = missing
```

#### Question System Readiness

```text
1.0 = Question Capital, CQ, QIS complete and linked
0.7 = CQ/QIS mostly linked
0.4 = questions exist but weak structure
0.0 = missing
```

#### Claim Lineage Readiness

```text
1.0 = all publishable claims have lineage
0.7 = most important claims have lineage
0.4 = lineage partial
0.0 = no lineage
```

#### Object Readiness

```text
1.0 = objects complete with refs, evidence, boundary, status approved
0.7 = objects generated but some warnings
0.4 = objects partial
0.0 = missing
```

#### Surface/Page Readiness

```text
1.0 = surface/page validation passes
0.7 = minor warnings
0.4 = major warnings
0.0 = missing
```

#### Observatory Coverage

```text
1.0 = probe panel covers key QIS territory and is locked
0.7 = basic probe panel exists
0.4 = ad hoc probes only
0.0 = no observatory setup
```

#### Fix-It Traceability

```text
1.0 = RCA/patch/retest/lift loop exists
0.7 = RCA/patch exists but retest limited
0.4 = recommendations only
0.0 = no fix-it loop
```

---

### 10.4 D-MRI Output Example

```json
{
  "metric_family": "d_mri",
  "metric_name": "D-MRI",
  "metric_value": 0.76,
  "metric_payload": {
    "formula_version": "d_mri_v1",
    "components": {
      "Truth_Readiness": 0.90,
      "Evidence_Readiness": 0.80,
      "Boundary_Readiness": 0.70,
      "Question_System_Readiness": 0.85,
      "Concept_KG_Readiness": 0.65,
      "Claim_Lineage_Readiness": 0.70,
      "Object_Readiness": 0.75,
      "Surface_Page_Readiness": 0.80,
      "Export_Readiness": 0.70,
      "Persona_Vibe_Readiness": 0.75,
      "Observatory_Coverage": 0.60,
      "FixIt_Traceability": 0.55
    },
    "weak_dimensions": [
      "Observatory_Coverage",
      "FixIt_Traceability",
      "Concept_KG_Readiness"
    ],
    "recommended_next_steps": [
      "Lock probe panel v1.",
      "Complete retest loop for top 3 weak QIS.",
      "Add missing concept relations."
    ]
  },
  "source_artifact_refs": {
    "truth_ids": ["truth_001"],
    "qis_scene_ids": ["qis_001", "qis_002"],
    "surface_contract_ids": ["surface_001"],
    "page_ids": ["page_001"]
  },
  "confidence": 0.78,
  "proxy_caveat": "D-MRI is an internal readiness and diagnostic quality index. It is not a direct measure of external AI answer performance."
}
```

---

## 11. Methodology Disclosure

Every B-MRI, domain index, or report based on AI/search observations must include a methodology disclosure.

Required fields:

```ts
type MethodologyDisclosure = {
  methodology_name: string
  methodology_version: string
  domain_id: string
  panel_id: string
  panel_version: number
  question_count: number
  repeat_count: number
  query_variant_count: number
  provider: string
  model_or_surface: string
  measurement_period: {
    start: string
    end: string
  }
  judgment_method: "ai_candidate" | "rule_based" | "human_reviewed" | "hybrid"
  metric_formula_versions: string[]
  limitations: string[]
  proxy_caveat: string
}
```

Required proxy caveat:

```text
This is a panel-based proxy measurement of observed AI/search-like responses, not actual market share, hidden model preference, or guaranteed search visibility.
```

Korean:

```text
이 지표는 표준 탐침 질문 패널에서 관측된 AI/검색형 응답의 패널 기반 대리 측정값이며, 실제 시장점유율, 모델 내부 선호, 확정적 검색 노출을 의미하지 않습니다.
```

---

## 12. Example 1 — K-Beauty Skincare

### 12.1 Domain Setup

```text
Domain: K-Beauty Skincare
Target brand: PureBarrier
Competitors: DermaGlow, CeraLuxe, CalmSkin
Hero topic: sensitive skin barrier routine
```

---

### 12.2 Probe Panel

```json
{
  "name": "K-Beauty Sensitive Skin Trust Panel",
  "panel_type": "competitor_benchmark",
  "version": 1,
  "question_count": 5,
  "repeat_recommendation": 3,
  "target_brand_entity_ids": ["purebarrier"],
  "competitor_brand_entity_ids": ["dermaglow", "ceraluxe", "calmskin"]
}
```

---

### 12.3 Probe Questions

```json
[
  {
    "query_text": "민감성 피부 장벽 회복 루틴은 어떻게 짜야 하나요?",
    "question_type": "routine_guidance",
    "topic_slice": "skin_barrier",
    "risk_level": "high",
    "expected_concepts": ["skin_barrier", "ceramide", "panthenol", "patch_test", "irritation_boundary"],
    "weight": 1.2
  },
  {
    "query_text": "세라마이드 크림을 고를 때 어떤 기준을 봐야 하나요?",
    "question_type": "product_fit",
    "topic_slice": "ingredient",
    "risk_level": "medium",
    "expected_concepts": ["ceramide", "barrier_support", "ingredient_evidence"],
    "weight": 1.0
  },
  {
    "query_text": "피부가 예민할 때 레티놀과 장벽 크림을 같이 써도 되나요?",
    "question_type": "risk_boundary",
    "topic_slice": "compatibility",
    "risk_level": "high",
    "expected_concepts": ["retinol_caution", "patch_test", "usage_frequency_boundary"],
    "weight": 1.2
  }
]
```

---

### 12.4 Example Raw Response

```text
민감성 피부 장벽 회복에는 저자극 클렌저, 보습 세럼, 세라마이드 크림 순서가 도움이 됩니다. PureBarrier의 Barrier Repair Cream은 세라마이드와 판테놀 중심의 장벽 케어 제품으로 언급될 수 있습니다. 다만 피부가 민감한 경우 새 제품은 패치 테스트를 먼저 하고, 자극이 있으면 사용을 중단하는 것이 좋습니다.
```

---

### 12.5 Response Judgment

```json
{
  "centered_brand": "PureBarrier",
  "mentioned_brands": ["PureBarrier"],
  "centeredness_score": 0.85,
  "official_citation": false,
  "source_mix_type": "unknown",
  "concept_transfer_score": 0.82,
  "concept_distortion_score": 0.05,
  "missing_concepts": [],
  "hallucinated_claims": [],
  "explanation_quality_score": 0.78,
  "trust_visible": true,
  "boundary_visible": true,
  "action_alignment_score": 0.65,
  "confidence": 0.74,
  "judgment_method": "ai_candidate",
  "review_status": "pending"
}
```

---

### 12.6 Example Metric Snapshot

```json
{
  "AAS": 0.66,
  "OCR": 0.20,
  "BSF": 0.76,
  "QTC": 0.70,
  "GCTR": 0.72,
  "ARS": 0.78,
  "B_MRI": 0.64,
  "D_MRI": 0.81
}
```

Interpretation:

```text
D-MRI is strong: internal structure is ready.
B-MRI is moderate: observed AI answer performance is decent, but official citation is weak.
Likely RCA: official source visibility / schema / citation readiness issue.
```

---

## 13. Example 2 — Convenience Retail

### 13.1 Domain Setup

```text
Domain: Convenience Retail
Target brand: Quick25
Competitors: CUrator Mart, SevenBox
Hero topic: late-night meal and local action
```

---

### 13.2 Probe Question

```json
{
  "query_text": "오늘 밤 편의점 야식으로 가성비 좋은 조합은?",
  "question_type": "recommendation",
  "topic_slice": "meal_occasion",
  "risk_level": "medium",
  "expected_concepts": ["late_night_meal", "value_combo", "promotion_caveat", "store_app_action"],
  "weight": 1.0
}
```

---

### 13.3 Example Judgment

```json
{
  "centered_brand": null,
  "mentioned_brands": ["CUrator Mart", "SevenBox"],
  "centeredness_score": 0.0,
  "official_citation": false,
  "source_mix_type": "third_party",
  "concept_transfer_score": 0.45,
  "concept_distortion_score": 0.10,
  "missing_concepts": ["store_app_action", "promotion_caveat"],
  "explanation_quality_score": 0.62,
  "trust_visible": false,
  "boundary_visible": false,
  "action_alignment_score": 0.20,
  "confidence": 0.68
}
```

---

### 13.4 Metric Interpretation

```json
{
  "AAS": 0.15,
  "OCR": 0.05,
  "BSF": 0.40,
  "QTC": 0.25,
  "GCTR": 0.35,
  "ARS": 0.28,
  "B_MRI": 0.29,
  "D_MRI": 0.72
}
```

Interpretation:

```text
D-MRI is acceptable: internal structure exists.
B-MRI is weak: observed AI responses do not mention or center Quick25.
Main weakness: local action CTA and promotion caveat are not transferring.
RCA candidates:
- RCA-S: page/surface not AI-readable enough
- RCA-A: action policy weak
- RCA-L: official source not surfaced
Patch:
- add app/store action object
- add promotion caveat object
- revise semantic page export
Retest:
- same panel version
- compare ARS, GCTR, AAS
```

---

## 14. Example 3 — Wedding

### 14.1 Domain Setup

```text
Domain: Wedding
Target brand: Lumiere Hall
Competitors: Gardenia Hall, Modern Veil, Maison Hall
Hero topic: wedding hall package and contract boundary
```

---

### 14.2 Probe Question

```json
{
  "query_text": "웨딩홀 패키지 계약 전에 꼭 확인할 조건은?",
  "question_type": "contract_check",
  "topic_slice": "contract_boundary",
  "risk_level": "high",
  "expected_concepts": ["package_inclusion", "cancellation_policy", "seasonal_price_variation", "additional_cost_boundary", "consultation_required"],
  "weight": 1.3
}
```

---

### 14.3 Example Raw Response

```text
웨딩홀 패키지를 비교할 때는 대관료, 식대, 플라워 장식, 연출, 스냅/영상 포함 여부를 확인해야 합니다. Lumiere Hall은 고급스러운 분위기와 상담형 패키지로 비교 대상이 될 수 있습니다. 다만 날짜, 시즌, 보증 인원, 취소 조건에 따라 비용이 달라질 수 있으므로 계약 전 세부 조건을 확인해야 합니다.
```

---

### 14.4 Judgment

```json
{
  "centered_brand": "Lumiere Hall",
  "mentioned_brands": ["Lumiere Hall"],
  "centeredness_score": 0.75,
  "official_citation": false,
  "source_mix_type": "unknown",
  "concept_transfer_score": 0.78,
  "concept_distortion_score": 0.05,
  "missing_concepts": ["additional_cost_boundary"],
  "explanation_quality_score": 0.80,
  "trust_visible": true,
  "boundary_visible": true,
  "action_alignment_score": 0.70,
  "vibe_alignment_score": 0.82,
  "mixed_signal_flags": [],
  "confidence": 0.72
}
```

---

### 14.5 Interpretation

```text
B-MRI is moderate-high because the brand is centered and contract boundary is visible.
OCR is still weak because official source citation is missing.
Patch should improve official citation and additional cost boundary.
```

---

## 15. RCA Mapping

### 15.1 B-MRI Weakness to RCA

| Weak Metric | Likely RCA Family | Example Cause |
|---|---|---|
| Low AAS | RCA-Q / RCA-S / RCA-X | brand not visible for target questions, competitor stronger |
| Low OCR | RCA-L / RCA-S / RCA-T | official source not cited, schema weak, evidence missing |
| Low BSF | RCA-C / RCA-O / RCA-S | concepts not transferred, object weak, surface incomplete |
| Low QTC | RCA-Q / RCA-O | missing question territory or object type |
| Low GCTR | RCA-C / RCA-L | concepts missing or unsupported |
| Low ARS | RCA-S / RCA-A / RCA-T | trust/boundary/action block weak |
| High volatility | RCA-R / RCA-Q | panel unstable, query variants too broad, AI response unstable |
| Low competitive score | RCA-X / RCA-S / RCA-C | competitor has stronger source ecosystem or clearer answer assets |

---

### 15.2 D-MRI Weakness to RCA

| Weak Component | Likely RCA Family | Example Patch |
|---|---|---|
| Truth Readiness | RCA-T | complete Operational Truth |
| Evidence Readiness | RCA-T / RCA-L | add evidence items |
| Boundary Readiness | RCA-T / RCA-S | add boundary rules and surface block |
| Question Readiness | RCA-Q | create CQ/QIS coverage |
| Concept/KG Readiness | RCA-C | add concepts and relations |
| Claim Lineage | RCA-L | link claims to evidence/boundary |
| Object Readiness | RCA-O | create/refine representation objects |
| Surface/Page Readiness | RCA-S | add trust/proof/boundary/action blocks |
| Export Readiness | RCA-S | fix schema and AI-readable payload |
| Persona/Vibe Readiness | RCA-P / RCA-V | fix authority/vibe/dark pattern rules |
| Observatory Coverage | RCA-R | create/lock probe panel |
| Fix-It Traceability | RCA-G | create RCA/patch/retest workflow |

---

## 16. Retest Workflow

### 16.1 Retest Rule

```text
No patch success without retest.
```

### 16.2 Retest Flow

```text
1. Identify weak metric.
2. Create RCA case.
3. Create patch ticket.
4. Apply or preview patch.
5. Create retest plan.
6. Run same panel version.
7. Generate retest response judgments.
8. Compute metric snapshots.
9. Compare baseline vs retest.
10. Compute SWEL and post-patch lift.
11. Check guardrail regression.
12. Decide pass/fail/inconclusive.
```

---

### 16.3 Retest Comparison Example

Baseline:

```json
{
  "AAS": 0.15,
  "OCR": 0.05,
  "ARS": 0.28,
  "B_MRI": 0.29
}
```

After patch:

```json
{
  "AAS": 0.35,
  "OCR": 0.22,
  "ARS": 0.55,
  "B_MRI": 0.48
}
```

Lift:

```json
{
  "absolute_lift": {
    "AAS": 0.20,
    "OCR": 0.17,
    "ARS": 0.27,
    "B_MRI": 0.19
  },
  "weighted_lift": 0.21,
  "guardrail_regressions": [],
  "result_status": "positive"
}
```

If guardrail regression exists:

```json
{
  "weighted_lift": 0.21,
  "guardrail_regressions": ["boundary_visibility_decreased_high_risk"],
  "result_status": "failed_guardrail"
}
```

---

## 17. Implementation Pseudocode

### 17.1 Run Observation

```ts
async function runObservationRun(input: {
  panelId: string
  providerName: string
  repeatCount: number
  queryVariantCount: number
}) {
  const panel = await getLockedProbePanel(input.panelId)
  const provider = getProbeProvider(input.providerName)

  const observationRun = await createAIObservationRun({
    panel_id: panel.id,
    provider: input.providerName,
    repeat_count: input.repeatCount,
    query_variant_count: input.queryVariantCount,
    status: "running"
  })

  for (const question of panel.questions) {
    const variants = selectVariants(question, input.queryVariantCount)

    for (const variant of variants) {
      for (let repeat = 1; repeat <= input.repeatCount; repeat++) {
        try {
          const response = await provider.runProbe({
            queryText: variant,
            domainType: panel.domain_type,
            targetBrandNames: panel.target_brand_names,
            competitorBrandNames: panel.competitor_brand_names,
            expectedConcepts: question.expected_concepts
          })

          await createProbeRun({
            observation_run_id: observationRun.id,
            panel_id: panel.id,
            probe_question_id: question.id,
            query_text: question.query_text,
            query_variant: variant,
            repeat_index: repeat,
            raw_response_text: response.rawResponseText,
            raw_response_payload_ref: storeRawPayload(response.rawResponsePayload),
            surfaced_sources: response.surfacedSources,
            response_status: "success"
          })
        } catch (error) {
          await createProbeRun({
            observation_run_id: observationRun.id,
            panel_id: panel.id,
            probe_question_id: question.id,
            query_text: question.query_text,
            query_variant: variant,
            repeat_index: repeat,
            raw_response_text: "",
            surfaced_sources: [],
            response_status: "error",
            error_summary: String(error)
          })
        }
      }
    }
  }

  await completeObservationRun(observationRun.id)
}
```

---

### 17.2 Judge Response

```ts
async function judgeProbeRun(probeRunId: string) {
  const probeRun = await getProbeRun(probeRunId)
  const question = await getProbeQuestion(probeRun.probe_question_id)
  const brandSet = await getBrandSet(question)

  const ruleExtract = extractBrandMentionsAndSources(
    probeRun.raw_response_text,
    brandSet
  )

  const aiCandidate = await runResponseJudgmentAgent({
    raw_response_text: probeRun.raw_response_text,
    surfaced_sources: probeRun.surfaced_sources,
    target_brands: brandSet.target,
    competitors: brandSet.competitors,
    expected_concepts: question.expected_concepts
  })

  const judgment = validateAndMergeJudgment(ruleExtract, aiCandidate)

  return await createResponseJudgment({
    ...judgment,
    probe_run_id: probeRun.id,
    observation_run_id: probeRun.observation_run_id,
    judgment_method: "hybrid",
    review_status: "pending"
  })
}
```

---

### 17.3 Compute B-MRI

```ts
function computeBMRI(input: {
  aas: number
  ocr: number
  bsf: number
  qtc: number
  gctr: number
  ars: number
  competitivePositionScore: number
  confidence: number
  volatility?: number | null
}) {
  const base =
    0.20 * input.aas +
    0.15 * input.ocr +
    0.20 * input.bsf +
    0.15 * input.qtc +
    0.15 * input.gctr +
    0.10 * input.ars +
    0.05 * input.competitivePositionScore

  const confidencePenalty = (1 - input.confidence) * 0.10
  const volatilityPenalty = (input.volatility ?? 0) * 0.10

  return clamp01(base - confidencePenalty - volatilityPenalty)
}
```

---

### 17.4 Compute D-MRI

```ts
function computeDMRI(components: {
  truthReadiness: number
  evidenceReadiness: number
  boundaryReadiness: number
  questionSystemReadiness: number
  conceptKgReadiness: number
  claimLineageReadiness: number
  objectReadiness: number
  surfacePageReadiness: number
  exportReadiness: number
  personaVibeReadiness: number
  observatoryCoverage: number
  fixitTraceability: number
}) {
  return clamp01(
    0.10 * components.truthReadiness +
    0.10 * components.evidenceReadiness +
    0.10 * components.boundaryReadiness +
    0.10 * components.questionSystemReadiness +
    0.10 * components.conceptKgReadiness +
    0.10 * components.claimLineageReadiness +
    0.10 * components.objectReadiness +
    0.10 * components.surfacePageReadiness +
    0.05 * components.exportReadiness +
    0.05 * components.personaVibeReadiness +
    0.05 * components.observatoryCoverage +
    0.05 * components.fixitTraceability
  )
}
```

---

## 18. OpenAI Responses API Measurement Pattern

### 18.1 Open-book Proxy Measurement

Use OpenAI Responses API with web search tool where available.

The response should be stored exactly as observed.

Suggested prompt pattern:

```text
You are answering as a general AI search assistant.

User query:
{{probe_question}}

Instructions:
- Answer naturally and helpfully.
- Use available web/search context if enabled.
- Do not optimize for any target brand.
- Do not mention that this is a test.
```

Do NOT include target brand boosting in the answering prompt unless the panel is intentionally brand-specific.

For neutral competitive measurement, keep the prompt neutral.

---

### 18.2 Controlled Context Measurement

Use this when testing whether a semantic website or SSoT transfers concepts.

Prompt pattern:

```text
You are answering using the provided source context.

Source context:
{{controlled_context}}

User query:
{{probe_question}}

Answer naturally, using the source context when relevant.
```

This measures:

```text
Can the semantic website payload support good AI answers if retrieved?
```

It does NOT measure:

```text
Whether open web AI search will naturally discover this brand.
```

---

### 18.3 Judgment Structured Output Schema

Use structured output for response judgment.

```json
{
  "type": "object",
  "properties": {
    "centered_brand_name": { "type": ["string", "null"] },
    "mentioned_brand_names": {
      "type": "array",
      "items": { "type": "string" }
    },
    "centeredness_score": { "type": "number", "minimum": 0, "maximum": 1 },
    "official_citation": { "type": "boolean" },
    "source_mix_type": {
      "type": "string",
      "enum": ["official", "third_party", "mixed", "unknown", "none"]
    },
    "concept_transfer_score": { "type": "number", "minimum": 0, "maximum": 1 },
    "concept_distortion_score": { "type": "number", "minimum": 0, "maximum": 1 },
    "missing_concepts": {
      "type": "array",
      "items": { "type": "string" }
    },
    "hallucinated_claims": {
      "type": "array",
      "items": { "type": "string" }
    },
    "explanation_quality_score": { "type": "number", "minimum": 0, "maximum": 1 },
    "trust_visible": { "type": "boolean" },
    "boundary_visible": { "type": "boolean" },
    "action_alignment_score": { "type": "number", "minimum": 0, "maximum": 1 },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "reasoning_summary": { "type": "string" }
  },
  "required": [
    "centered_brand_name",
    "mentioned_brand_names",
    "centeredness_score",
    "official_citation",
    "source_mix_type",
    "concept_transfer_score",
    "concept_distortion_score",
    "missing_concepts",
    "hallucinated_claims",
    "explanation_quality_score",
    "trust_visible",
    "boundary_visible",
    "action_alignment_score",
    "confidence",
    "reasoning_summary"
  ],
  "additionalProperties": false
}
```

Do not store hidden chain-of-thought.  
Store only judgment explanation or reasoning summary suitable for audit.

---

## 19. Report Language Rules

Allowed:

```text
panel-based proxy
observed AI/search-like response
observed answer share
within this probe panel
under this methodology
measurement period
confidence and volatility
methodology limitations
```

Forbidden or unsafe without caveat:

```text
true AI market share
actual model preference
hidden LLM preference
definitive AI ranking
guaranteed AEO/GEO visibility
proves consumer preference
```

---

## 20. Required Tests

### 20.1 Probe Observatory Tests

```text
Probe Panel can be created.
Panel version locks correctly.
Locked panel cannot mutate.
Observation Run stores raw responses.
Mock provider works without API key.
OpenAI provider can be feature-flagged.
Response Judgment is separate from raw response.
AI judgment defaults to candidate.
Metric Snapshot links source observation runs.
Proxy caveat required.
```

---

### 20.2 B-MRI Tests

```text
B-MRI uses observation-based metrics.
B-MRI does not equal D-MRI.
B-MRI formula clamps to 0..1.
B-MRI includes confidence and volatility penalties.
B-MRI stores panel ID and version.
B-MRI requires proxy caveat.
B-MRI can include competitor comparison.
```

---

### 20.3 D-MRI Tests

```text
D-MRI can compute without live AI observation.
D-MRI uses internal readiness components.
D-MRI identifies weak dimensions.
D-MRI does not claim external AI answer performance.
D-MRI links source artifacts.
D-MRI produces recommended next steps.
```

---

### 20.4 Retest Tests

```text
Retest uses same panel version as baseline.
Patch cannot be marked successful without retest.
Positive lift with critical guardrail regression fails.
Baseline/retest metric refs are stored.
SWEL computes from baseline vs retest metrics.
```

---

## 21. Implementation Checklist

```text
[ ] provider abstraction exists
[ ] mock provider exists
[ ] OpenAI Responses adapter scaffold exists
[ ] probe panels are versioned
[ ] probe questions link to QIS
[ ] raw probe responses are stored
[ ] response judgments are separate
[ ] judgment structured output schema exists
[ ] metric snapshots store source refs
[ ] B-MRI formula implemented
[ ] D-MRI formula implemented
[ ] methodology disclosure exists
[ ] proxy caveat mandatory
[ ] report export gate checks caveat
[ ] RCA mapping from weak metrics exists
[ ] retest comparison exists
[ ] tests cover B-MRI vs D-MRI distinction
```

---

## 22. Minimal Repo File Recommendations

Recommended document paths:

```text
docs/observatory/01_probe_observatory_spec.md
docs/observatory/02_provider_adapters.md
docs/observatory/03_response_judgment_schema.md
docs/metrics/01_b_mri_spec.md
docs/metrics/02_d_mri_spec.md
docs/metrics/03_business_aeo_geo_metrics.md
docs/metrics/04_methodology_and_proxy_caveat.md
docs/fixit/01_metric_to_rca_mapping.md
docs/fixit/02_retest_and_lift_workflow.md
```

Recommended code paths:

```text
lib/observatory/providers/types.ts
lib/observatory/providers/mock-provider.ts
lib/observatory/providers/openai-responses-provider.ts
lib/observatory/judgment/schema.ts
lib/observatory/judgment/judge-response.ts
lib/metrics/business-metrics.ts
lib/metrics/b-mri.ts
lib/metrics/d-mri.ts
lib/metrics/confidence-volatility.ts
lib/fixit/metric-to-rca.ts
lib/fixit/retest-comparison.ts
```

Recommended tests:

```text
tests/unit/b-mri.test.ts
tests/unit/d-mri.test.ts
tests/unit/business-metrics.test.ts
tests/unit/response-judgment-schema.test.ts
tests/integration/probe-observatory.test.ts
tests/integration/openai-provider-adapter.test.ts
tests/regression/golden-observatory-bmri-dmri.test.ts
```

---

## 23. Final Summary for LLM

If another LLM must remember only one thing, remember this:

```text
Probe Observatory observes AI/search-like answers through versioned QIS-derived panels.
B-MRI summarizes observed brand performance in those responses.
D-MRI summarizes internal semantic system readiness and diagnostic quality.
Both are traceable, caveated, and methodologically bounded.
B-MRI requires response observations.
D-MRI can be computed from internal artifacts.
Neither metric is true market share or hidden model preference.
```
