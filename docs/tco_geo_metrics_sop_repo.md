# TCO-GEO Concept Fidelity Metrics SOP
## Repo Reference Document for AI-Pair Coding

> **Version:** v1.0  
> **Purpose:** LLM/AI-pair coding reference document for implementing an AEO/GEO concept-fidelity measurement engine  
> **Target System:** AIHompy / Brand SSoT / Answer Card / TCO-GEO Analytics / AI Brand MRI  
> **Core Thesis:** AEO/GEO evaluation should not stop at whether a brand appears in an AI answer. It should measure whether the brand's core concepts are accurately, stably, and safely reconstructed across probabilistic LLM response distributions.

---

## 0. Executive Summary

This repository document defines a product-ready and implementation-ready metric framework for **TCO-GEO**: a concept-fidelity-based AEO/GEO analytics system.

The framework operationalizes the following integrated theory:

```text
LLM-based brand, customer, trend, and deal intelligence should not analyze a single response.
It should measure concept-attractor distributions repeatedly produced under controlled interaction conditions,
canonicalize concepts, evidence, and policies through TCO,
and reduce variance, drift, and floor risk through SSoT and Answer Card interventions.
```

The system evaluates how well a website, AIHompy, Brand SSoT, or Answer Card set transfers its core concepts into generated AI responses.

It uses three theoretical layers:

```text
1. Semantic Attractor Dynamics
   Interprets brand/customer/trend/deal meaning as attractors, resonance, cancellation, boundary, drift, and state transition.

2. Tensor Concept Ontology, TCO
   Canonicalizes words and claims into concept entities, context tensors, concept regions, relation operators, evidence, and action policies.

3. Probabilistic Eval Harness
   Treats LLM output as a distribution, not a point, and measures repeated-run variance, drift, consensus, and floor risk.
```

---

## 1. System Goal

The system should answer the following questions:

```text
1. Does AI correctly reconstruct the brand's core concepts?
2. Does AI cite or ground those concepts in official evidence?
3. Does AI distort, omit, or hallucinate important brand concepts?
4. Does AI consistently preserve the brand concept attractor across repeated runs?
5. Does AI drift across prompts, time, models, or contexts?
6. What is the worst-case output risk?
7. Does the AI response follow the expected answer, CTA, safety, evidence, and tone policies?
8. Does SSoT / Answer Card intervention improve concept transfer, fidelity, stability, and safety?
```

The product output should support:

```text
- AI Brand MRI reports
- TCO-GEO concept-fidelity dashboards
- Baseline vs Intervention AEO/GEO experiments
- AIHompy SSoT improvement roadmaps
- Answer Card backlog generation
- Monthly MeaningOps monitoring
```

---

## 2. Core Concepts

### 2.1 Brand SSoT

The official source of brand truth. It defines the brand's canonical concepts, concept boundaries, evidence, allowed expressions, forbidden expressions, and action policies.

### 2.2 Answer Card

A question-level answer unit containing:

```text
- Question
- Short Answer
- Detailed Answer
- Evidence
- Boundary / Conditions
- CTA
- Related Concepts
- Policy Rules
```

### 2.3 QBS: Question Benchmark Set

A standardized set of representative questions used to evaluate AEO/GEO behavior.

Question types:

```text
- informational
- comparison
- trust
- price
- risk
- decision
- crisis
- local / vertical-specific
```

### 2.4 AI Response Concept Tensor

A structured representation of concepts extracted from an AI response.

### 2.5 Concept Attractor Distribution

The repeated-run distribution of concept appearances, ranks, relations, distortions, and risks across LLM outputs.

---

## 3. Data Model Overview

### 3.1 Brand SSoT Object

```yaml
brand_ssot:
  brand_id: string
  brand_name: string
  version: string
  core_concepts:
    - concept_id: string
      label: string
      definition: string
      importance_weight: number
      evidence_required: boolean
      evidence_sources: string[]
      allowed_expressions: string[]
      forbidden_expressions: string[]
      related_answer_cards: string[]
      action_policy_id: string
  forbidden_concepts:
    - concept_id: string
      label: string
      reason: string
      severity: number
  relation_graph:
    - source_concept_id: string
      relation_type: string
      target_concept_id: string
      required: boolean
      importance_weight: number
  policies:
    answer_policy: object
    cta_policy: object
    evidence_policy: object
    safety_policy: object
    tone_policy: object
```

### 3.2 QBS Object

```yaml
qbs_item:
  query_id: string
  query_text: string
  intent_type: informational | comparison | trust | price | risk | decision | crisis
  user_microgroup: string
  target_concepts:
    required: string[]
    optional: string[]
    forbidden: string[]
  expected_relations:
    - source_concept_id: string
      relation_type: string
      target_concept_id: string
  expected_policy:
    answer_mode: string
    cta_policy: string
    safety_policy: string
    evidence_required: boolean
    tone: string
  importance_weight: number
```

### 3.3 AI Response Log Object

```yaml
ai_response:
  run_id: string
  brand_id: string
  condition: baseline | intervention
  query_id: string
  model: string
  prompt_version: string
  sampling:
    temperature: number
    top_p: number
  response_text: string
  cited_sources: string[]
  timestamp: datetime
```

### 3.4 Judge Result Object

```yaml
judge_result:
  run_id: string
  query_id: string
  extracted_concepts:
    - concept_id: string
      label: string
      present: boolean
      accuracy: number
      matched_expression: string
      rank: number
      evidence_bound: boolean
      distortion: boolean
      distortion_type: string | null
      hallucinated: boolean
      confidence: number
  extracted_relations:
    - source_concept_id: string
      relation_type: string
      target_concept_id: string
      accuracy: number
  policy_alignment:
    answer_policy: number
    cta_policy: number
    evidence_policy: number
    safety_policy: number
    brand_tone: number
  risk:
    risk_score: number
    hallucination: number
    brand_distortion: number
    critical_missing: number
    unsafe_cta: number
    evidence_omission: number
  notes: string
```

### 3.5 Aggregated Metric Object

```yaml
metric_summary:
  brand_id: string
  condition: baseline | intervention
  qbs_size: number
  runs_total: number
  metrics:
    concept_transfer_rate: number
    citation_backed_concept_rate: number
    brand_concept_fidelity: number
    concept_distortion_rate: number
    missing_concept_gap_count: number
    hallucinated_concept_rate: number
    attractor_stability: number
    drift_score: number
    floor_risk: number
    policy_alignment: number
    consensus_score: number
    variance_score: number
    aeo_geo_readiness_score: number
```

---

## 4. Standard Pipeline

```text
Step 1. Build Brand SSoT
Step 2. Build QBS
Step 3. Run Baseline LLM responses
Step 4. Run Intervention LLM responses
Step 5. Extract concepts and relations from responses
Step 6. Judge fidelity, distortion, hallucination, policy, and risk
Step 7. Aggregate metrics
Step 8. Compare Baseline vs Intervention
Step 9. Generate Answer Card backlog and SSoT improvement tasks
Step 10. Produce report and dashboard
```

---

## 5. Standard Run Configuration

```yaml
run_config:
  models:
    - gpt
    - gemini
    - perplexity_or_search_ai
  repetitions_per_query:
    lite: 5
    standard: 10
    pro: 30
  generation_temperature: 0.2
  judge_temperature: 0.0
  qbs_size:
    lite: 20
    standard: 50
    pro: 100
  conditions:
    baseline:
      context: existing_website_or_public_web
    intervention:
      context: brand_ssot_plus_answer_cards
  judge_mode:
    - llm_judge
    - human_spot_check
```

---

## 6. Metric Definitions and SOPs

---

# M1. Concept Transfer Rate

## Definition

Concept Transfer Rate measures the weighted proportion of required Brand SSoT concepts correctly present in the AI response.

```text
Concept Transfer Rate =
weighted_sum(required_concept_accuracy)
/
weighted_sum(required_concept_importance)
```

## What It Measures

```text
- Whether AI includes the brand's required concepts.
- Whether SSoT and Answer Card concepts are absorbed into AI responses.
- Whether a website is conceptually legible to AI.
```

## Exact SOP

```text
1. For each QBS item, define required_concepts.
2. Assign importance_weight to each required concept.
3. Run LLM response generation.
4. Extract concepts from AI response using Concept Extractor Judge.
5. Match extracted concepts to required_concepts using concept_id, allowed expressions, and semantic equivalence.
6. Score each concept:
   - 1.0 = accurately present
   - 0.5 = partially present or vague
   - 0.0 = missing
7. Compute weighted average per response.
8. Aggregate by query, intent_type, user_microgroup, and brand.
```

## LLM API Proxy SOP

### Judge Prompt

```text
You are a concept-fidelity judge.
Evaluate whether the AI response accurately includes the required Brand SSoT concepts.

[Question]
{query_text}

[Required Concepts]
{required_concepts_json}

[AI Response]
{response_text}

Return JSON:
{
  "concept_scores": [
    {
      "concept_id": "string",
      "present": true/false,
      "accuracy": 0|0.5|1,
      "matched_expression": "string",
      "reason": "string"
    }
  ]
}
```

## Implementation Notes

```text
- Use deterministic judge setting: temperature 0.
- Store raw judge output for auditability.
- Support human override for critical concepts.
- Use concept aliases and multilingual labels from TCO.
```

---

# M2. Citation-Backed Concept Rate

## Definition

Citation-Backed Concept Rate measures the proportion of AI response concepts that are backed by official evidence or citation.

```text
Citation-Backed Concept Rate =
number_of_core_concepts_with_valid_evidence
/
number_of_core_concepts_in_response
```

## What It Measures

```text
- Whether AI uses the brand's official source or SSoT as evidence.
- Whether concepts are grounded, not just generated.
- Whether Answer Cards function as citable concept units.
```

## Exact SOP

```text
1. Link each core concept to official evidence_source IDs.
2. Extract concepts from the AI response.
3. Extract citations, URLs, source names, or evidence phrases.
4. Determine whether each concept is linked to valid evidence.
5. Mark citation_type:
   - official_ssot
   - official_page
   - answer_card
   - third_party
   - unsupported
6. Compute concept-level and response-level citation-backed rate.
```

## LLM API Proxy SOP

### Judge Prompt

```text
For each concept in the AI response, determine whether it is supported by an official or valid evidence source.

[Known Evidence Sources]
{evidence_sources_json}

[AI Response]
{response_text}

Return JSON:
{
  "concept_evidence": [
    {
      "concept_id": "string",
      "cited": true/false,
      "citation_type": "official_ssot|official_page|answer_card|third_party|unsupported",
      "citation_url": "string|null",
      "evidence_quality": 0.0-1.0
    }
  ]
}
```

---

# M3. Brand Concept Fidelity

## Definition

Brand Concept Fidelity is a composite score measuring whether the AI response faithfully reconstructs the brand's canonical concept structure, including concepts, relations, differentiation, evidence, forbidden concept suppression, and action policy.

```text
Brand Concept Fidelity =
0.30 × Concept Transfer
+ 0.20 × Relation Accuracy
+ 0.15 × Differentiation Preservation
+ 0.15 × Evidence Binding
+ 0.10 × Forbidden Concept Suppression
+ 0.10 × Policy Alignment
```

## What It Measures

```text
- Whether AI understands the brand, not just mentions it.
- Whether the brand's intended category, differentiator, and official answer structure are preserved.
- Whether the AI response is strategically usable.
```

## Exact SOP

```text
1. Define the brand's canonical concept graph in Brand SSoT.
2. Define required relations for each QBS item.
3. Run response generation.
4. Extract concepts, relations, differentiators, evidence, forbidden expressions, and CTA.
5. Score each fidelity subcomponent.
6. Calculate weighted Brand Concept Fidelity.
7. Aggregate by QBS intent type and condition.
```

## LLM API Proxy SOP

### Judge Prompt

```text
Evaluate how faithfully the AI response reconstructs the Brand SSoT.

Evaluation dimensions:
1. Core concept transfer
2. Relation accuracy
3. Differentiation preservation
4. Evidence binding
5. Forbidden concept suppression
6. Policy alignment

[Brand SSoT]
{brand_ssot_json}

[Question]
{query_text}

[AI Response]
{response_text}

Return JSON with scores between 0 and 1:
{
  "brand_concept_fidelity": number,
  "subscores": {
    "concept_transfer": number,
    "relation_accuracy": number,
    "differentiation_preservation": number,
    "evidence_binding": number,
    "forbidden_suppression": number,
    "policy_alignment": number
  },
  "main_issue": "string"
}
```

---

# M4. Concept Distortion Rate

## Definition

Concept Distortion Rate measures how often AI includes a brand concept but misrepresents, exaggerates, narrows, expands, or wrongly categorizes it.

```text
Concept Distortion Rate =
number_of_distorted_core_concepts
/
number_of_core_concepts_in_response
```

## Distortion Types

```text
category_distortion:
  e.g., AIHompy is misread as generic website production.

function_distortion:
  e.g., Answer Card is reduced to simple FAQ.

claim_distortion:
  e.g., unsupported exaggerated performance claim.

policy_distortion:
  e.g., purchase CTA when diagnostic CTA is required.

boundary_distortion:
  e.g., forbidden or unsafe claim appears without condition.
```

## Exact SOP

```text
1. Define correct_definition, boundary_conditions, and forbidden_conditions for each concept.
2. Extract each concept expression from the AI response.
3. Compare expression against canonical definition.
4. Tag distortion_type and severity 1-5.
5. Calculate distortion rate and severity-weighted distortion.
```

## LLM API Proxy SOP

### Judge Prompt

```text
Detect concept distortions in the AI response.

[Canonical Concept Definitions]
{concept_definitions_json}

[Boundary and Forbidden Conditions]
{boundary_json}

[AI Response]
{response_text}

Return JSON:
{
  "distortions": [
    {
      "concept_id": "string",
      "distortion_type": "category_distortion|function_distortion|claim_distortion|policy_distortion|boundary_distortion",
      "severity": 1-5,
      "response_expression": "string",
      "correct_definition": "string",
      "reason": "string"
    }
  ],
  "concept_distortion_rate": number
}
```

---

# M5. Missing Concept Gap

## Definition

Missing Concept Gap identifies required concepts repeatedly absent from AI responses.

```text
Missing Concept Gap =
required concepts whose recall_rate is below threshold
```

## Thresholds

```yaml
thresholds:
  critical_concept: 0.80
  important_concept: 0.60
  optional_concept: 0.40
```

## What It Measures

```text
- Which Answer Cards are missing or weak.
- Which Brand SSoT concepts are not absorbed by AI.
- Which customer questions expose concept gaps.
```

## Exact SOP

```text
1. For each QBS item, define required_concepts.
2. Run each query R times.
3. Extract concept presence per run.
4. Calculate recall_rate by concept_id.
5. Mark concepts below threshold as Missing Concept Gap.
6. Group gaps by page, intent_type, customer_microgroup, and severity.
7. Generate Answer Card backlog items.
```

## LLM API Proxy SOP

Use LLM Judge only for concept extraction. Use code or spreadsheet for gap calculation.

### Gap Interpretation Prompt

```text
Given the Missing Concept Gap table, propose SSoT and Answer Card improvements.

[Gap Table]
{gap_table_json}

Return:
1. likely reason for gap
2. required SSoT improvement
3. recommended Answer Card
4. priority
```

---

# M6. Hallucinated Concept Rate

## Definition

Hallucinated Concept Rate measures the proportion of concepts or claims in the AI response that are not supported by Brand SSoT, official evidence, or allowed inference.

```text
Hallucinated Concept Rate =
unsupported_concepts_or_claims
/
total_extracted_concepts_or_claims
```

## Hallucination Types

```text
unsupported_claim
unsupported_service
unsupported_comparison
unsupported_policy
unsupported_safety_claim
```

## Exact SOP

```text
1. Define allowed_concepts and allowed_claims from Brand SSoT.
2. Extract all claims and concepts from the AI response.
3. Classify each claim as supported, inferred, or unsupported.
4. Mark unsupported claims as hallucination.
5. Assign severity based on domain risk and business impact.
6. Calculate hallucinated concept rate.
```

## LLM API Proxy SOP

### Judge Prompt

```text
Break the AI response into claims and concepts.
Classify each as supported, inferred, or unsupported based on the allowed claims and evidence.

[Allowed Concepts]
{allowed_concepts_json}

[Allowed Claims]
{allowed_claims_json}

[Evidence Sources]
{evidence_sources_json}

[AI Response]
{response_text}

Return JSON:
{
  "claims": [
    {
      "claim": "string",
      "support_status": "supported|inferred|unsupported",
      "hallucination": true/false,
      "severity": 1-5,
      "reason": "string"
    }
  ],
  "hallucinated_concept_rate": number
}
```

---

# M7. Attractor Stability

## Definition

Attractor Stability measures whether core brand concepts and relations remain stable across repeated runs, prompt variants, model variants, or time.

```text
Attractor Stability =
0.40 × Core Concept Recall Rate
+ 0.20 × Rank Stability
+ 0.20 × Relation Stability
+ 0.20 × Boundary Suppression
```

Where:

```text
Boundary Suppression = 1 - Confusion Concept Rate
```

## Exact SOP

```text
1. Define attractor_concepts and confusion_concepts.
2. Run QBS repeatedly.
3. Extract ordered concept list and concept rank from each response.
4. Calculate concept recall rate.
5. Calculate rank variance and convert to rank stability.
6. Calculate relation recall rate.
7. Calculate confusion concept rate.
8. Compute final Attractor Stability.
```

## LLM API Proxy SOP

### Judge Prompt

```text
Extract ordered core concepts and confusion concepts from the AI response.

[Core Attractor Concepts]
{core_concepts_json}

[Confusion Concepts]
{confusion_concepts_json}

[AI Response]
{response_text}

Return JSON:
{
  "ordered_core_concepts": [
    {"concept_id": "string", "rank": number}
  ],
  "confusion_concepts": [
    {"concept_id": "string", "rank": number, "expression": "string"}
  ]
}
```

---

# M8. Drift Score

## Definition

Drift Score measures how much the AI response concept distribution changes across time, models, prompt variants, contexts, or interventions.

```text
Drift Score = Distance(Concept Distribution A, Concept Distribution B)
```

Recommended distance methods:

```text
- Cosine distance
- Jensen-Shannon divergence
- L1 distance
```

## Drift Types

```text
temporal_drift:
  same QBS over time

model_drift:
  same QBS across models

prompt_sensitivity_drift:
  same intent with wording variants

context_drift:
  context changes alter concept distribution

intervention_drift:
  SSoT intervention moves distribution toward target concept structure
```

## Exact SOP

```text
1. Define comparison conditions A and B.
2. Run the same QBS under both conditions.
3. Extract concept distribution vectors.
4. Normalize concept vector by recall_rate or weighted frequency.
5. Calculate distance between distributions.
6. Classify drift as positive, negative, or neutral.
```

## LLM API Proxy SOP

LLM Judge extracts concept vectors. Drift calculation should be done by code.

### Concept Vector Example

```json
{
  "condition": "baseline",
  "concept_distribution": {
    "brand.ssot": 0.32,
    "brand.answer_card": 0.28,
    "confusion.website_design": 0.41,
    "brand.aeo_geo": 0.22
  }
}
```

---

# M9. Floor Risk

## Definition

Floor Risk measures the risk severity of the worst outputs in repeated-run distributions.

```text
Floor Risk =
average risk_score of the top p% riskiest responses
```

Recommended p:

```text
lite: 10%
standard: 10%
pro: 5%
```

## Risk Components

```text
- hallucination_severity
- brand_distortion_severity
- critical_missing_concept
- unsafe_cta
- evidence_omission
- legal_medical_financial_claim_risk
- trust_damage_tone
```

## Exact SOP

```text
1. Assign risk_score 0-1 to each response.
2. Sort runs by risk_score descending.
3. Select top p% highest risk responses.
4. Compute average risk_score for tail set.
5. Store worst examples for report.
6. Generate mitigation tasks.
```

## LLM API Proxy SOP

### Risk Judge Prompt

```text
Evaluate the operational risk of the AI response.

Risk dimensions:
1. unsupported claims
2. brand distortion
3. critical concept omission
4. inappropriate CTA
5. legal/medical/financial/safety risk
6. evidence omission
7. trust-damaging tone

[Brand SSoT]
{brand_ssot_json}

[Expected Policy]
{expected_policy_json}

[AI Response]
{response_text}

Return JSON:
{
  "risk_score": number,
  "risk_items": {
    "hallucination": number,
    "brand_distortion": number,
    "critical_missing": number,
    "unsafe_cta": number,
    "evidence_omission": number,
    "regulated_claim_risk": number,
    "trust_damage_tone": number
  },
  "floor_reason": "string"
}
```

---

# M10. Policy Alignment / Action Policy Alignment

## Definition

Policy Alignment measures whether an AI response follows the expected answer, CTA, evidence, safety, and tone policies defined in TCO.

```text
Policy Alignment =
weighted average of answer_policy, cta_policy, evidence_policy, safety_policy, brand_tone
```

## Exact SOP

```text
1. Define expected_policy per QBS item.
2. Extract answer mode, CTA, evidence note, safety note, tone, and forbidden expressions from the AI response.
3. Score each subpolicy 0-1.
4. Detect policy violations and severity.
5. Aggregate by query and brand.
```

## LLM API Proxy SOP

### Policy Judge Prompt

```text
Evaluate whether the AI response follows the expected policy.

[Expected Policy]
{expected_policy_json}

[AI Response]
{response_text}

Return JSON:
{
  "policy_alignment": number,
  "subscores": {
    "answer_policy": number,
    "cta_policy": number,
    "evidence_policy": number,
    "safety_policy": number,
    "brand_tone": number
  },
  "violations": [
    {"policy": "string", "severity": 1-5, "reason": "string"}
  ]
}
```

---

# M11. Consensus Score

## Definition

Consensus Score measures whether repeated responses converge on the same core concepts, relations, and policies.

```text
Consensus Score =
average pairwise similarity between run-level concept/relation/policy sets
```

## Exact SOP

```text
1. Extract concept_set, relation_set, and policy_set from each run.
2. Compute pairwise Jaccard similarity for concept_set.
3. Compute relation similarity.
4. Compute policy similarity.
5. Weighted average becomes Consensus Score.
```

## Recommended Formula

```text
Consensus Score =
0.50 × Concept Set Consensus
+ 0.30 × Relation Set Consensus
+ 0.20 × Policy Consensus
```

---

# M12. Variance Score

## Definition

Variance Score measures the instability of concept occurrence, rank, and policy across repeated runs.

```text
Variance Score =
concept_presence_variance
+ rank_variance
+ policy_variance
```

## Exact SOP

```text
1. Convert each run into a concept vector.
2. Calculate variance for each concept dimension.
3. Calculate rank variance for core concepts.
4. Calculate policy score variance.
5. Normalize to 0-1 scale.
```

## Product Interpretation

```text
Low Variance:
  AI consistently reconstructs the brand.

High Variance:
  AI is unstable; SSoT or Answer Cards need reinforcement.
```

---

# M13. AEO/GEO Readiness Score

## Definition

AEO/GEO Readiness Score is a composite readiness score measuring whether a website or AIHompy is prepared for accurate AI answer reconstruction.

## Recommended Formula

```text
AEO/GEO Readiness =
0.15 × SSoT Completeness
+ 0.15 × Answer Coverage
+ 0.10 × Evidence Binding
+ 0.10 × Technical Structure
+ 0.15 × Concept Transfer Rate
+ 0.15 × Brand Concept Fidelity
+ 0.10 × Policy Alignment
+ 0.10 × (1 - Floor Risk)
```

## Inputs

```text
SSoT Completeness:
  manual or automated audit of Brand SSoT fields

Answer Coverage:
  number of answered QBS items / total QBS items

Evidence Binding:
  evidence-linked concept coverage

Technical Structure:
  schema, metadata, internal links, llm feed, answer sitemap

Runtime Metrics:
  M1, M3, M9, M10
```

---

## 7. Baseline vs Intervention Experiment

### Purpose

To prove whether SSoT and Answer Cards improve AEO/GEO concept fidelity.

### Conditions

```yaml
conditions:
  baseline:
    description: Existing website/public web only
  intervention_1:
    description: Brand SSoT provided
  intervention_2:
    description: Brand SSoT + Answer Cards provided
  intervention_3:
    description: Brand SSoT + Answer Cards + TCO Policies provided
```

### Experiment SOP

```text
1. Build QBS.
2. Run baseline condition R times per question.
3. Run intervention condition R times per question.
4. Apply the same judge pipeline to all outputs.
5. Compare metrics:
   - Concept Transfer Rate
   - Brand Concept Fidelity
   - Distortion Rate
   - Attractor Stability
   - Drift Score
   - Floor Risk
   - Policy Alignment
6. Generate improvement report.
```

### Improvement Metrics

```text
absolute_improvement = intervention_score - baseline_score
relative_improvement = (intervention_score - baseline_score) / baseline_score
risk_reduction = baseline_risk - intervention_risk
```

---

## 8. LLM API Implementation Architecture

```text
+----------------------+
| Brand/QBS Input      |
+----------+-----------+
           |
           v
+----------------------+
| Query Runner         |
| - baseline           |
| - intervention       |
+----------+-----------+
           |
           v
+----------------------+
| Response Store       |
+----------+-----------+
           |
           v
+----------------------+
| Judge Pipeline       |
| - Concept Extractor  |
| - Fidelity Judge     |
| - Distortion Judge   |
| - Risk Judge         |
| - Policy Judge       |
+----------+-----------+
           |
           v
+----------------------+
| Metrics Aggregator   |
+----------+-----------+
           |
           v
+----------------------+
| Report Generator     |
| Dashboard / PDF / MD |
+----------------------+
```

---

## 9. Suggested Repository Structure

```text
tco-geo-metrics/
  README.md
  docs/
    00-theory.md
    01-metrics-sop.md
    02-qbs-design.md
    03-judge-prompts.md
    04-report-spec.md
    05-productization.md
  schemas/
    brand_ssot.schema.json
    qbs_item.schema.json
    ai_response.schema.json
    judge_result.schema.json
    metric_summary.schema.json
  prompts/
    generator_prompt.md
    concept_extractor_judge.md
    fidelity_judge.md
    distortion_judge.md
    hallucination_judge.md
    risk_judge.md
    policy_judge.md
    gap_interpreter.md
  pipelines/
    run_baseline.md
    run_intervention.md
    judge_pipeline.md
    aggregate_metrics.md
    generate_report.md
  examples/
    sample_brand_ssot.yaml
    sample_qbs.yaml
    sample_response_log.jsonl
    sample_metric_summary.json
    sample_report.md
  src/
    runners/
    judges/
    metrics/
    reports/
    storage/
```

---

## 10. AI-Pair Coding Implementation Tasks

### Phase 1. Schema and Local Prototype

```text
1. Implement JSON schemas.
2. Create sample Brand SSoT.
3. Create sample QBS.
4. Build response log data model.
5. Build judge result parser.
6. Implement basic metrics calculator.
```

### Phase 2. LLM API Runner

```text
1. Implement query runner.
2. Support baseline/intervention contexts.
3. Support repeated runs.
4. Store responses as JSONL.
5. Add model/provider abstraction.
```

### Phase 3. Judge Pipeline

```text
1. Implement concept extractor judge.
2. Implement fidelity judge.
3. Implement distortion judge.
4. Implement hallucination judge.
5. Implement risk judge.
6. Implement policy judge.
7. Add retry and JSON repair logic.
```

### Phase 4. Metrics Aggregator

```text
1. Calculate Concept Transfer Rate.
2. Calculate Brand Concept Fidelity.
3. Calculate Distortion Rate.
4. Calculate Missing Concept Gap.
5. Calculate Hallucinated Concept Rate.
6. Calculate Attractor Stability.
7. Calculate Drift Score.
8. Calculate Floor Risk.
9. Calculate Policy Alignment.
10. Calculate AEO/GEO Readiness.
```

### Phase 5. Report Generator

```text
1. Generate Markdown report.
2. Generate executive summary.
3. Generate baseline vs intervention comparison.
4. Generate Answer Card backlog.
5. Generate SSoT improvement tasks.
6. Export to PDF later if needed.
```

### Phase 6. Dashboard MVP

```text
1. Build brand metric overview.
2. Add QBS-level table.
3. Add concept gap table.
4. Add floor risk examples.
5. Add intervention improvement chart.
```

---

## 11. Report Template

```markdown
# AI Brand MRI / TCO-GEO Concept Fidelity Report

## 1. Executive Summary

## 2. AEO/GEO Concept Fidelity Score

## 3. Baseline vs Intervention Overview

## 4. Concept Transfer Rate

## 5. Brand Concept Fidelity

## 6. Missing Concept Gap

## 7. Concept Distortion and Hallucination

## 8. Attractor Stability

## 9. Drift and Variance

## 10. Floor Risk

## 11. Policy Alignment

## 12. Priority Answer Card Backlog

## 13. Brand SSoT Improvement Tasks

## 14. 30-Day AEO/GEO Improvement Roadmap
```

---

## 12. Product Naming

Recommended product-level names:

```text
TCO-GEO Concept Fidelity Audit
AI Brand MRI
AEO/GEO Concept Fidelity Report
AIHompy Brand Fidelity Test
SSoT Intervention Effectiveness Report
```

Recommended dashboard name:

```text
TCO-GEO Analytics Dashboard
```

---

## 13. Core Product Claims

Use these carefully and only after pilot validation.

```text
This system measures not only whether a brand appears in AI answers,
but whether AI accurately and consistently reconstructs the brand's core concepts.
```

```text
This framework evaluates AEO/GEO readiness through concept transfer, brand fidelity, response stability, drift, floor risk, and policy alignment.
```

```text
SSoT and Answer Card interventions can be tested by comparing baseline and intervention response distributions.
```

---

## 14. Quality Control Rules

```text
1. Never rely on a single LLM response.
2. Always use repeated runs for distributional evaluation.
3. Separate generator model and judge model when possible.
4. Use temperature 0 for judge tasks.
5. Keep raw response and raw judge logs.
6. Use human spot-checks for critical concepts and high-risk domains.
7. Report confidence and limitations.
8. Distinguish official evidence from LLM inference.
9. Do not overclaim causality before intervention validation.
10. Always turn metric failures into SSoT / Answer Card improvement tasks.
```

---

## 15. Minimal MVP Acceptance Criteria

The MVP is acceptable if it can:

```text
1. Load Brand SSoT JSON/YAML.
2. Load QBS JSON/YAML.
3. Run at least 10 repeated LLM calls per query.
4. Store response logs as JSONL.
5. Run at least concept extractor, fidelity judge, risk judge, policy judge.
6. Calculate the 7 core metrics:
   - Concept Transfer Rate
   - Brand Concept Fidelity
   - Concept Distortion Rate
   - Missing Concept Gap
   - Attractor Stability
   - Drift Score
   - Floor Risk
7. Generate a Markdown report.
8. Generate an Answer Card backlog.
```

---

## 16. Final Integration Statement

```text
TCO-GEO Concept Fidelity Metrics transform AEO/GEO evaluation
from surface visibility measurement into concept-level, distribution-aware, policy-aligned brand intelligence.

The core question is no longer:
"Does the brand appear in AI answers?"

The new question is:
"Does AI accurately, consistently, and safely reconstruct the brand's canonical concept structure across probabilistic response distributions?"
```

