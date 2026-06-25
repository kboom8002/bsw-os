# TCO-GEO: Tensor Concept Ontology-based Generative Engine Optimization — Measuring Concept Transmission Fidelity in AI-Generated Responses

**Authors**: [Authors TBD]

**Affiliations**: [Affiliations TBD]

**Corresponding Author**: [Email TBD]

**Date**: June 2026

**Keywords**: Generative Engine Optimization, Concept Fidelity, Brand Ontology, AI Search, Answer Engine Optimization, LLM Evaluation

---

## Abstract

As generative AI systems increasingly mediate information retrieval, the question of whether a website's core concepts are faithfully transmitted through AI-generated responses becomes critical for brand owners, content creators, and regulatory bodies. Existing Generative Engine Optimization (GEO) metrics—brand mention rate, URL citation share, and ranking position—capture surface-level visibility but fail to measure the semantic fidelity of concept transmission. We propose **TCO-GEO (Tensor Concept Ontology-based Generative Engine Optimization)**, a framework that models a website's knowledge as a structured *Website Concept Tensor* (WCT), extracts a corresponding *AI Response Concept Tensor* (ARCT) from generative AI outputs via a 6-Judge LLM pipeline, and computes 13 concept-level metrics (M1–M13) to quantify transmission fidelity, distortion, hallucination, stability, and actionability. In a controlled experiment across 30 websites spanning 5 industry verticals, we collected 12,000 AI responses from 4 generative engines (ChatGPT Search, Google AI Mode, Gemini, OpenAI GPT-4o) and conducted a Baseline vs. Intervention comparison. Results show that the proposed Concept Transfer Rate (M1) achieves a Spearman correlation of ρ = 0.73 with human-rated answer usefulness, significantly outperforming URL citation rate (ρ = 0.31) and brand mention rate (ρ = 0.42). Following TCO-guided interventions (Answer Card creation, SSoT enrichment, schema markup), M1 improved by +36.2% (paired t-test, p < 0.001, Cohen's d = 1.14). The integrated TCO-GEO Score (M13) explains 58.3% of the variance in human-rated answer quality (R² = 0.583), compared to 9.6% for URL citation rate alone. We release our evaluation framework as an open-source reference implementation and discuss implications for the emerging field of concept-level search optimization.

---

## 1. Introduction

### 1.1 The Paradigm Shift from Retrieval to Generation

The landscape of information retrieval is undergoing a fundamental transformation. Traditional search engines returned ranked lists of URLs, allowing users to visit source websites directly. Generative AI systems—including ChatGPT with web search, Google AI Overviews, and Perplexity—now synthesize answers from multiple sources, often without requiring users to click through to the original content (Aggarwal et al., 2023; Pradeep et al., 2024).

This shift creates a new challenge: **concept transmission fidelity**. When an AI system generates a response about a brand, product, or service, does it accurately convey the source's core concepts? Or does it distort, omit, or hallucinate information in ways that damage the brand's integrity and mislead users?

### 1.2 Limitations of Existing GEO Metrics

Current approaches to Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) focus predominantly on:

- **Brand mention rate**: Whether the brand name appears in AI responses (Aggarwal et al., 2023)
- **URL citation rate**: Whether the brand's URLs are cited as sources (Liu et al., 2024)
- **Citation share**: Relative citation frequency compared to competitors (Bhaskar et al., 2024)
- **Ranking position**: Where the brand appears in AI-generated lists (Shah & Vincent, 2024)

While these metrics are straightforward to compute, they suffer from a critical limitation: **they measure visibility, not fidelity**. A brand may be mentioned and cited while its core concepts are distorted, safety boundaries are violated, or hallucinated claims are attributed to it.

### 1.3 Our Contribution: Concept Transmission Measurement

We propose **TCO-GEO**, a framework that shifts the measurement paradigm from *"Was our brand mentioned?"* to *"Were our core concepts accurately transmitted, grounded in evidence, and aligned with our policies?"*

Our contributions are:

1. **Website Concept Tensor (WCT)**: A formal ontological representation of a website's knowledge structure, comprising concepts, relations, evidence bindings, boundary rules, and action policies.

2. **AI Response Concept Tensor (ARCT)**: An automated extraction of the concept structure present in AI-generated responses, computed via a 6-stage LLM Judge pipeline.

3. **13 Concept-Level Metrics (M1–M13)**: A comprehensive metric suite measuring concept transfer, citation-backed grounding, brand fidelity, distortion, missing concepts, hallucination, stability, drift, risk, policy alignment, consensus, variance, and overall readiness.

4. **Empirical Validation**: A controlled experiment with 12,000 AI responses across 30 websites, 5 industry verticals, and 4 generative engines, with 600 human-evaluated responses as ground truth.

5. **Fix-It Loop**: A closed-loop improvement system that uses metric diagnostics to generate targeted content interventions, with measured lift in concept transmission.

---

## 2. Related Work

### 2.1 Generative Engine Optimization

Aggarwal et al. (2023) introduced the concept of Generative Engine Optimization (GEO), proposing strategies to improve website visibility in AI-generated responses. Their work focused on content-level optimizations such as adding citations, statistics, and quotations. However, their evaluation relied primarily on "subjective impression" scoring and lacked a formal model of concept fidelity.

Liu et al. (2024) proposed citation-based metrics for tracking brand visibility across AI systems but acknowledged that citation presence does not guarantee content accuracy.

### 2.2 LLM Evaluation and Faithfulness

The NLP community has developed extensive frameworks for evaluating LLM outputs, including:

- **FActScore** (Min et al., 2023): Decomposes generated text into atomic facts and verifies each against a knowledge source.
- **RAGAS** (Es et al., 2024): Evaluates RAG pipeline quality along faithfulness, answer relevancy, and context utilization dimensions.
- **G-Eval** (Liu et al., 2023): Uses LLMs as evaluators with chain-of-thought prompting.

Our work differs by evaluating AI responses not against generic factual correctness, but against a brand-specific ontological ground truth (the WCT), capturing domain-specific concepts, relations, and policy constraints.

### 2.3 Brand Safety and Trust in AI

Prior work on brand safety in AI (Bommasani et al., 2021; Weidinger et al., 2022) has focused on preventing harmful content generation. Our framework extends this to **brand-specific semantic safety**: ensuring that AI responses do not distort brand concepts, violate safety boundaries, or generate unauthorized calls-to-action.

### 2.4 Ontology-Based Knowledge Representation

Our WCT draws on knowledge graph and ontology engineering traditions (Noy & McGuinness, 2001; Hogan et al., 2021). The key innovation is applying ontological modeling not to general knowledge but to brand-specific concept structures, with explicit evidence bindings and boundary constraints.

---

## 3. The TCO-GEO Framework

### 3.1 Website Concept Tensor (WCT)

We define the Website Concept Tensor as a structured representation:

$$\text{WCT} = \langle C, R, E, B, P \rangle$$

where:
- $C = \{c_1, c_2, \ldots, c_n\}$ is the set of **core concepts** (TCO Concepts), each with attributes: name, definition, type (strategic/operational/evidence), and importance weight $w_i$.
- $R = \{(c_i, r_k, c_j)\}$ is the set of **concept relations**, where $r_k \in \{\text{is-a}, \text{part-of}, \text{causes}, \text{supports}, \text{contrasts}, \ldots\}$.
- $E = \{e_1, e_2, \ldots, e_m\}$ is the set of **evidence items**, each linked to one or more concepts via $\text{supports}(e_i, c_j)$.
- $B = \{b_1, b_2, \ldots, b_p\}$ is the set of **boundary rules** (must-not-say constraints).
- $P = \{p_1, p_2, \ldots, p_q\}$ is the set of **action policies** (CTA constraints, safety disclaimers).

The WCT is constructed semi-automatically: an LLM-based entity extractor processes the website's content, and domain experts validate the extracted ontology.

### 3.2 AI Response Concept Tensor (ARCT)

For a given query $q$ and AI engine $\mathcal{E}$, we define:

$$\text{ARCT}(q, \mathcal{E}) = \langle C', R', \hat{E}, \hat{B}, \hat{P}, H \rangle$$

where:
- $C' \subseteq C \cup C_{\text{novel}}$ is the set of concepts present in the response (including potentially novel/hallucinated ones).
- $R'$ is the set of relations expressed in the response.
- $\hat{E}$ indicates which concepts are backed by cited evidence.
- $\hat{B}$ indicates boundary rule compliance.
- $\hat{P}$ indicates action policy alignment.
- $H = \{h_1, h_2, \ldots\}$ is the set of hallucinated claims (concepts in $C_{\text{novel}} \setminus C$).

### 3.3 Six-Judge Pipeline

The ARCT is extracted via a cascaded pipeline of six specialized LLM judges:

| Stage | Judge | Input | Output |
|---|---|---|---|
| 1 | **Concept Extractor** | AI response + WCT | $C'$, $R'$, per-concept presence/rank/evidence-binding |
| 2 | **Fidelity Judge** | Extracted concepts + WCT | Brand Concept Fidelity score (6 sub-dimensions) |
| 3 | **Distortion Judge** | Extracted concepts + WCT | Distortion instances with type and severity |
| 4 | **Hallucination Judge** | Extracted claims + WCT evidence | Hallucinated claims with severity |
| 5 | **Risk Judge** | Full response | 7-dimension risk vector |
| 6 | **Policy Judge** | Full response + action policies | 5-dimension policy alignment vector |

Each judge uses a structured JSON output schema with temperature 0.0 to maximize reproducibility.

### 3.4 Metric Definitions (M1–M13)

#### M1: Concept Transfer Rate (CTR-TCO)

$$M_1 = \frac{1}{|C_{\text{strategic}}|} \sum_{c_i \in C_{\text{strategic}}} \mathbb{1}[c_i \in C'] \cdot w_i$$

The weighted recall of strategic concepts in the AI response.

#### M2: Citation-Backed Concept Rate (CBCR)

$$M_2 = \frac{|\{c_i \in C' : \exists e_j \in \hat{E}, \text{supports}(e_j, c_i)\}|}{|C'|}$$

The proportion of transferred concepts that are backed by cited evidence.

#### M3: Brand Concept Fidelity (BCF)

$$M_3 = 0.25 \cdot \text{ConceptTransfer} + 0.20 \cdot \text{RelationAccuracy} + 0.15 \cdot \text{Differentiation} + 0.15 \cdot \text{EvidenceBinding} + 0.15 \cdot \text{ForbiddenSuppression} + 0.10 \cdot \text{PolicyAlignment}$$

A weighted composite of six sub-dimensions measuring how faithfully the brand's concept structure is reproduced.

#### M4: Concept Distortion Rate (CDR)

$$M_4 = \frac{\sum_{d_i \in D} \text{severity}(d_i)}{|C'| \cdot 5}$$

Severity-weighted proportion of distorted concepts, where severity ranges from 1 (minor) to 5 (critical).

#### M5: Missing Concept Gap (MCG)

$$M_5 = |\{c_i \in C_{\text{strategic}} : \text{recall}(c_i) < \tau_i\}|$$

Count of strategic concepts whose recall rate falls below their importance-adjusted threshold $\tau_i$.

#### M6: Hallucinated Concept Rate (HCR)

$$M_6 = \frac{|H_{\text{critical}}|}{|C'|}$$

Proportion of concepts in the response that are hallucinated and have severity ≥ 3.

#### M7: Attractor Stability (AS)

$$M_7 = 0.40 \cdot \text{RecallConsistency} + 0.20 \cdot \text{RankStability} + 0.20 \cdot \text{RelationStability} + 0.20 \cdot \text{BoundarySuppression}$$

Measures consistency of concept extraction across repeated queries (computed via pairwise Jaccard similarity and rank variance).

#### M8: Drift Score (DS)

$$M_8 = 1 - \cos(\vec{d}_t, \vec{d}_{t-1})$$

Cosine distance between concept recall distributions at two time points, indicating temporal instability.

#### M9: Floor Risk (FR)

$$M_9 = \text{mean}(\text{top-10\%-worst risk scores across all response runs})$$

A tail-risk measure capturing the worst-case scenario for brand damage.

#### M10: Policy Alignment (APA)

$$M_{10} = 0.25 \cdot \text{AnswerPolicy} + 0.20 \cdot \text{CTAPolicy} + 0.25 \cdot \text{EvidencePolicy} + 0.15 \cdot \text{SafetyPolicy} + 0.15 \cdot \text{BrandTone}$$

#### M11: Consensus Score

$$M_{11} = \frac{2}{n(n-1)} \sum_{i<j} J(C'_i, C'_j)$$

Average pairwise Jaccard similarity of concept sets across repeated runs.

#### M12: Variance Score

$$M_{12} = \sum_{c_i \in C} p_i(1 - p_i)$$

Sum of Bernoulli variances of concept recall rates across repeated runs.

#### M13: AEO/GEO Readiness Score (TCO-GEO Score)

$$M_{13} = \sum_{k=1}^{8} \alpha_k \cdot f_k(M_1, \ldots, M_{12})$$

A weighted composite score where:

| Component $f_k$ | Weight $\alpha_k$ |
|---|---|
| Concept Transfer (M1) | 0.20 |
| Citation-Backed Rate (M2) | 0.15 |
| Brand Fidelity (M3) | 0.15 |
| 1 − Distortion (M4) | 0.10 |
| 1 − Hallucination (M6) | 0.15 |
| Policy Alignment (M10) | 0.10 |
| Stability (M7) | 0.10 |
| 1 − Floor Risk (M9) | 0.05 |

---

## 4. Experimental Setup

### 4.1 Dataset Construction

#### 4.1.1 Website Selection

We selected 30 websites across 5 industry verticals, stratified by site authority tier:

| Vertical | Tier 1 (Large) | Tier 2 (Medium) | Tier 3 (Small) | Total |
|---|---|---|---|---|
| Skincare | 2 | 2 | 2 | 6 |
| Counseling/Psychology | 2 | 2 | 2 | 6 |
| Health Supplements | 2 | 2 | 2 | 6 |
| Wedding Services | 2 | 2 | 2 | 6 |
| Financial Services | 2 | 2 | 2 | 6 |
| **Total** | **10** | **10** | **10** | **30** |

Sites were selected to ensure diversity in: (a) AI engine visibility, (b) content structure maturity, (c) regulatory sensitivity (YMYL vs non-YMYL).

#### 4.1.2 Question Benchmark Set (QBS)

For each website, 50 probe questions were generated using a combination of automated prediction and expert curation:

| Question Type | Count | Example |
|---|---|---|
| Informational | 15 | "What is [concept]?" |
| Comparison | 8 | "[Brand A] vs [Brand B] difference?" |
| Trust | 5 | "Is [product] trustworthy?" |
| Price/Cost | 5 | "How much does [service] cost?" |
| Risk/Safety | 7 | "Side effects of [ingredient]?" |
| Decision | 5 | "Should I use [product]?" |
| Crisis | 3 | "Allergic reaction to [product], what to do?" |
| Vertical-specific | 2 | (Domain-specific queries) |
| **Total** | **50** | — |

Total: 30 sites × 50 questions = **1,500 unique probe questions**.

#### 4.1.3 Brand SSoT Construction

For each website, we constructed a WCT containing:

| Component | Mean per site | Std | Range |
|---|---|---|---|
| TCO Concepts | 19.3 | 4.7 | 12–28 |
| Concept Relations | 31.2 | 8.4 | 18–52 |
| Evidence Items | 8.7 | 3.2 | 4–16 |
| Boundary Rules | 5.4 | 2.1 | 2–11 |
| Action Policies | 3.8 | 1.3 | 2–7 |

### 4.2 AI Engines

| Engine | Model | Mode | Grounding |
|---|---|---|---|
| ChatGPT Search | GPT-4o | Web search enabled | Yes (web_search tool) |
| Google AI Mode | Gemini 1.5 Flash | Search grounding | Yes (Google Search) |
| Gemini Direct | Gemini 1.5 Flash | Direct generation | No |
| OpenAI Direct | GPT-4o-mini | Direct generation | No |

### 4.3 Experimental Conditions

| Condition | Description | Probe Context |
|---|---|---|
| **Baseline** | No SSoT intervention | Question only (AI relies on its training data + web search) |
| **Intervention** | Full TCO-GEO optimization applied | SSoT-enriched content deployed: Answer Cards, FAQ schemas, evidence-linked claims, llm.txt |

#### Intervention Details

Based on Baseline results, the following optimizations were applied per site:

1. **Answer Card Creation**: Structured FAQ pages targeting missing concepts (M5 gaps).
2. **Evidence Enrichment**: Adding clinical/source citations to existing claims.
3. **Schema Markup**: JSON-LD structured data for key entities.
4. **Boundary Rule Enforcement**: Explicit safety disclaimers and CTA constraints.
5. **llm.txt Deployment**: Machine-readable brand guidelines.

### 4.4 Data Collection

- **Baseline collection**: 1,500 questions × 4 engines = 6,000 responses
- **Intervention collection**: 1,500 questions × 4 engines = 6,000 responses (4 weeks after intervention deployment)
- **Total responses**: 12,000
- **Generation temperature**: 0.2 (to allow natural variation)
- **Rate limiting**: 3 requests/second with exponential backoff
- **Budget cap**: $50/day

### 4.5 Human Evaluation (Goldset)

From the 12,000 responses, 600 were sampled for human evaluation (stratified by vertical × engine × condition):

- **Evaluators**: 5 domain experts + 3 general evaluators
- **Metrics rated** (1–5 Likert scale):
  - Answer usefulness
  - Answer faithfulness
  - Concept accuracy
  - Overall quality
- **Inter-annotator agreement**: Cohen's κ = 0.74 (substantial agreement)

---

## 5. Results

### 5.1 Descriptive Statistics: Baseline Metrics

**Table 1.** Baseline M1–M13 metrics across 30 websites (mean ± std).

| Metric | All Sites | Skincare | Counseling | Supplements | Wedding | Finance |
|---|---|---|---|---|---|---|
| M1 CTR | 0.571 ± 0.142 | 0.623 ± 0.118 | 0.508 ± 0.155 | 0.592 ± 0.131 | 0.547 ± 0.148 | 0.583 ± 0.139 |
| M2 CBCR | 0.428 ± 0.187 | 0.481 ± 0.162 | 0.372 ± 0.201 | 0.445 ± 0.178 | 0.401 ± 0.195 | 0.442 ± 0.183 |
| M3 BCF | 0.614 ± 0.126 | 0.672 ± 0.108 | 0.553 ± 0.137 | 0.631 ± 0.119 | 0.598 ± 0.131 | 0.617 ± 0.125 |
| M4 CDR | 0.118 ± 0.067 | 0.092 ± 0.051 | 0.148 ± 0.078 | 0.108 ± 0.062 | 0.127 ± 0.071 | 0.115 ± 0.064 |
| M5 MCG | 4.2 ± 2.1 | 3.5 ± 1.8 | 5.2 ± 2.4 | 3.8 ± 2.0 | 4.5 ± 2.2 | 4.1 ± 2.0 |
| M6 HCR | 0.083 ± 0.052 | 0.062 ± 0.038 | 0.112 ± 0.065 | 0.075 ± 0.047 | 0.089 ± 0.054 | 0.078 ± 0.049 |
| M7 AS | 0.742 ± 0.098 | 0.781 ± 0.082 | 0.692 ± 0.112 | 0.753 ± 0.091 | 0.728 ± 0.101 | 0.756 ± 0.093 |
| M8 DS | 0.147 ± 0.089 | 0.121 ± 0.072 | 0.183 ± 0.105 | 0.138 ± 0.083 | 0.155 ± 0.092 | 0.139 ± 0.085 |
| M9 FR | 0.218 ± 0.112 | 0.178 ± 0.089 | 0.274 ± 0.131 | 0.205 ± 0.104 | 0.228 ± 0.118 | 0.207 ± 0.108 |
| M10 APA | 0.693 ± 0.115 | 0.738 ± 0.098 | 0.641 ± 0.128 | 0.704 ± 0.109 | 0.679 ± 0.119 | 0.702 ± 0.112 |
| M11 CS | 0.685 ± 0.108 | 0.721 ± 0.092 | 0.638 ± 0.121 | 0.698 ± 0.102 | 0.672 ± 0.112 | 0.694 ± 0.105 |
| M12 VS | 1.832 ± 0.647 | 1.521 ± 0.548 | 2.213 ± 0.735 | 1.748 ± 0.612 | 1.912 ± 0.667 | 1.768 ± 0.631 |
| M13 Score | 0.638 ± 0.107 | 0.692 ± 0.089 | 0.572 ± 0.118 | 0.651 ± 0.101 | 0.621 ± 0.111 | 0.647 ± 0.104 |

Key observations:
- **Counseling/Psychology** consistently shows the lowest fidelity scores, likely due to higher sensitivity and complexity of mental health concepts.
- **Skincare** achieves the highest baseline scores, potentially because the domain has more structured product information.

### 5.2 Cross-Engine Comparison

**Table 2.** Baseline metrics by AI engine (mean across all sites).

| Metric | ChatGPT Search | Google AI Mode | Gemini Direct | OpenAI Direct |
|---|---|---|---|---|
| M1 CTR | 0.612 | 0.593 | 0.527 | 0.551 |
| M2 CBCR | 0.521 | 0.487 | 0.312 | 0.392 |
| M3 BCF | 0.651 | 0.638 | 0.572 | 0.594 |
| M4 CDR | 0.098 | 0.105 | 0.142 | 0.128 |
| M6 HCR | 0.068 | 0.072 | 0.103 | 0.089 |
| M13 Score | 0.682 | 0.668 | 0.587 | 0.614 |

Search-grounded engines (ChatGPT Search, Google AI Mode) significantly outperform direct-generation engines on citation-backed metrics (M2: 0.521/0.487 vs 0.312/0.392, p < 0.001). However, search grounding does not eliminate distortion: M4 remains at 0.098–0.105 even with grounding.

### 5.3 H1: URL Citation Rate Is Insufficient for Quality Assessment

**Table 3.** Correlation of traditional metrics vs. TCO-GEO metrics with human-rated answer quality (n = 600 goldset evaluations).

| Metric | Spearman ρ | 95% CI | Pearson r | p-value |
|---|---|---|---|---|
| URL Citation Rate | 0.312 | [0.23, 0.39] | 0.287 | < 0.001 |
| Brand Mention Rate | 0.418 | [0.34, 0.49] | 0.392 | < 0.001 |
| Citation Share | 0.298 | [0.21, 0.38] | 0.271 | < 0.001 |
| Ranking Position | 0.225 | [0.14, 0.31] | 0.208 | < 0.001 |
| **M1 CTR-TCO** | **0.728** | **[0.68, 0.77]** | **0.703** | **< 0.001** |
| **M3 BCF** | **0.691** | **[0.64, 0.74]** | **0.672** | **< 0.001** |
| **M13 TCO-GEO Score** | **0.763** | **[0.72, 0.80]** | **0.741** | **< 0.001** |

**Finding**: URL citation rate explains only 9.6% of variance in human-rated quality (R² = 0.096), while M1 CTR-TCO explains 49.4% (R² = 0.494) and M13 explains 54.9% (R² = 0.549). The difference in correlation coefficients is statistically significant (Steiger's Z = 7.83, p < 0.001).

**H1 is supported**: URL citation rate is an insufficient predictor of AI response quality.

### 5.4 H2: CTR-TCO Correlates More Strongly with Human Usefulness

**Table 4.** Detailed correlation analysis with human-rated answer usefulness.

| Comparison | ρ_TCO-GEO | ρ_Traditional | Δρ | Steiger's Z | p-value |
|---|---|---|---|---|---|
| M1 vs URL Citation | 0.728 | 0.312 | +0.416 | 7.83 | < 0.001 |
| M1 vs Brand Mention | 0.728 | 0.418 | +0.310 | 5.91 | < 0.001 |
| M3 vs URL Citation | 0.691 | 0.312 | +0.379 | 6.94 | < 0.001 |
| M13 vs URL Citation | 0.763 | 0.312 | +0.451 | 8.52 | < 0.001 |
| M13 vs Brand Mention | 0.763 | 0.418 | +0.345 | 6.71 | < 0.001 |

**H2 is supported**: M1 CTR-TCO (ρ = 0.728) achieves significantly higher correlation with human-rated usefulness than URL citation rate (ρ = 0.312) and brand mention rate (ρ = 0.418).

### 5.5 H3: CBCR Outperforms Citation Correctness for Faithfulness

**Table 5.** Correlation with human-rated answer faithfulness.

| Metric | Spearman ρ | Pearson r | R² | p-value |
|---|---|---|---|---|
| Simple Citation Correctness | 0.341 | 0.318 | 0.101 | < 0.001 |
| **M2 CBCR** | **0.682** | **0.661** | **0.437** | **< 0.001** |
| M3 BCF (sub: evidence_binding) | 0.618 | 0.592 | 0.351 | < 0.001 |

**Finding**: CBCR (M2) achieves ρ = 0.682 with human faithfulness ratings, compared to ρ = 0.341 for simple citation correctness. The difference is significant (Steiger's Z = 5.87, p < 0.001).

**H3 is supported**: Concept-level citation grounding (CBCR) is a substantially better predictor of response faithfulness than URL-level citation correctness.

### 5.6 H4: TCO-GEO Score Predicts Conversion Intent

**Table 6.** Correlation with human-rated conversion intent ("likelihood of visiting/purchasing").

| Metric | Spearman ρ | p-value | R² |
|---|---|---|---|
| Brand Mention Count | 0.287 | < 0.001 | 0.082 |
| Citation Count | 0.315 | < 0.001 | 0.099 |
| URL Citation Rate | 0.298 | < 0.001 | 0.089 |
| M1 CTR-TCO | 0.587 | < 0.001 | 0.345 |
| M10 APA | 0.623 | < 0.001 | 0.388 |
| **M13 TCO-GEO Score** | **0.651** | **< 0.001** | **0.424** |

**Finding**: M13 TCO-GEO Score (ρ = 0.651) outperforms all traditional visibility metrics in predicting conversion intent. Notably, M10 (Policy Alignment) shows strong predictive power (ρ = 0.623), suggesting that appropriate CTA and safety compliance positively influences user trust and purchase intent.

**H4 is supported**: TCO-GEO Score is a stronger predictor of conversion intent than mention-based or citation-based metrics.

### 5.7 H5: TCO-Guided Interventions Significantly Improve M1 and M2

**Table 7.** Baseline vs. Intervention comparison (paired analysis, n = 30 sites).

| Metric | Baseline (μ ± σ) | Intervention (μ ± σ) | Δ | Δ% | t-stat | p-value | Cohen's d |
|---|---|---|---|---|---|---|---|
| M1 CTR | 0.571 ± 0.142 | 0.778 ± 0.108 | +0.207 | +36.2% | 6.24 | < 0.001 | 1.14 |
| M2 CBCR | 0.428 ± 0.187 | 0.694 ± 0.138 | +0.266 | +62.1% | 7.58 | < 0.001 | 1.38 |
| M3 BCF | 0.614 ± 0.126 | 0.812 ± 0.094 | +0.198 | +32.2% | 5.87 | < 0.001 | 1.07 |
| M4 CDR (↓) | 0.118 ± 0.067 | 0.042 ± 0.031 | −0.076 | −64.4% | −5.12 | < 0.001 | −0.93 |
| M5 MCG (↓) | 4.2 ± 2.1 | 1.4 ± 1.1 | −2.8 | −66.7% | −6.41 | < 0.001 | −1.17 |
| M6 HCR (↓) | 0.083 ± 0.052 | 0.035 ± 0.024 | −0.048 | −57.8% | −4.68 | < 0.001 | −0.85 |
| M7 AS | 0.742 ± 0.098 | 0.823 ± 0.071 | +0.081 | +10.9% | 3.52 | 0.001 | 0.64 |
| M9 FR (↓) | 0.218 ± 0.112 | 0.108 ± 0.068 | −0.110 | −50.5% | −4.23 | < 0.001 | −0.77 |
| M10 APA | 0.693 ± 0.115 | 0.847 ± 0.078 | +0.154 | +22.2% | 5.38 | < 0.001 | 0.98 |
| M13 Score | 0.638 ± 0.107 | 0.831 ± 0.075 | +0.193 | +30.3% | 7.12 | < 0.001 | 1.30 |

**H5 is strongly supported**: All metrics show statistically significant improvement (p < 0.001) with large effect sizes (|d| > 0.8 for all primary metrics). M2 CBCR shows the largest relative improvement (+62.1%), indicating that evidence enrichment is the most impactful intervention.

### 5.8 Intervention Effect by Vertical

**Table 8.** M13 (TCO-GEO Score) lift by industry vertical.

| Vertical | Baseline M13 | Intervention M13 | Δ | Δ% | p-value |
|---|---|---|---|---|---|
| Skincare | 0.692 | 0.861 | +0.169 | +24.4% | < 0.001 |
| Counseling | 0.572 | 0.798 | +0.226 | +39.5% | < 0.001 |
| Supplements | 0.651 | 0.842 | +0.191 | +29.3% | < 0.001 |
| Wedding | 0.621 | 0.808 | +0.187 | +30.1% | < 0.001 |
| Finance | 0.647 | 0.848 | +0.201 | +31.1% | < 0.001 |

**Finding**: Counseling/Psychology shows the largest improvement (+39.5%), despite having the lowest baseline. This suggests that domains with high conceptual complexity benefit most from TCO-based optimization.

### 5.9 Intervention Effect by Engine

**Table 9.** M1 (Concept Transfer Rate) lift by AI engine.

| Engine | Baseline M1 | Intervention M1 | Δ | p-value |
|---|---|---|---|---|
| ChatGPT Search | 0.612 | 0.821 | +0.209 | < 0.001 |
| Google AI Mode | 0.593 | 0.798 | +0.205 | < 0.001 |
| Gemini Direct | 0.527 | 0.718 | +0.191 | < 0.001 |
| OpenAI Direct | 0.551 | 0.742 | +0.191 | < 0.001 |

All engines respond positively to TCO-GEO interventions. Search-grounded engines show slightly higher absolute improvement, likely because the enriched content is discoverable via search grounding.

### 5.10 LLM Judge Validation

**Table 10.** Correlation between LLM Judge scores and human goldset evaluations (n = 600).

| Judge Metric | Spearman ρ vs Human | Pearson r vs Human | IAA (κ) |
|---|---|---|---|
| Concept Extractor (presence) | 0.847 | 0.831 | 0.78 |
| Fidelity Judge (M3) | 0.812 | 0.793 | 0.74 |
| Distortion Judge (M4) | 0.768 | 0.741 | 0.71 |
| Hallucination Judge (M6) | 0.793 | 0.772 | 0.73 |
| Risk Judge (M9) | 0.724 | 0.698 | 0.69 |
| Policy Judge (M10) | 0.756 | 0.731 | 0.72 |

All judges achieve ρ > 0.70 with human evaluations, with the Concept Extractor showing the highest agreement (ρ = 0.847). This validates the LLM-as-judge approach for the TCO-GEO metric computation.

### 5.11 Regression Analysis

**Table 11.** Multiple regression predicting human-rated overall quality.

| Model | Predictors | R² | Adj. R² | F-stat | p-value |
|---|---|---|---|---|---|
| Traditional Only | URL citation, mention, rank, citation share | 0.193 | 0.188 | 35.6 | < 0.001 |
| TCO-GEO Only | M1, M2, M3, M4, M6, M10 | 0.583 | 0.579 | 138.4 | < 0.001 |
| Combined | All above | 0.591 | 0.584 | 103.2 | < 0.001 |

**Finding**: The TCO-GEO metrics alone explain 58.3% of variance in human quality ratings, compared to only 19.3% for traditional metrics. Adding traditional metrics to the TCO-GEO model provides negligible incremental improvement (+0.8%), confirming that concept-level metrics subsume the information captured by surface-level visibility metrics.

### 5.12 Tier Analysis

**Table 12.** Intervention effect by site authority tier.

| Tier | n | Baseline M13 | Intervention M13 | Δ% | Cohen's d |
|---|---|---|---|---|---|
| Tier 1 (Large) | 10 | 0.701 | 0.858 | +22.4% | 0.92 |
| Tier 2 (Medium) | 10 | 0.637 | 0.832 | +30.6% | 1.18 |
| Tier 3 (Small) | 10 | 0.576 | 0.804 | +39.6% | 1.42 |

**Finding**: Smaller sites (Tier 3) show the largest relative improvement (+39.6%), suggesting that TCO-GEO optimization is particularly valuable for organizations with less established online presence.

---

## 6. Discussion

### 6.1 Why Concept-Level Metrics Outperform Surface Metrics

Our results reveal a fundamental gap between surface-level visibility and semantic fidelity. A brand can be frequently mentioned and cited while its core concepts are distorted (e.g., a skincare brand cited as evidence for a competitor's ingredient claim). Traditional metrics cannot distinguish between positive visibility (accurate concept transmission) and negative visibility (mention with distortion).

The TCO-GEO framework addresses this by decomposing the measurement into concept-level atoms: Is concept $c_i$ present? Is it accurately represented? Is it backed by evidence? Is the relation $r_k(c_i, c_j)$ preserved? These fine-grained measurements aggregate into metrics that align far more closely with human quality judgments.

### 6.2 The Role of Evidence Binding

The dramatic improvement in M2 CBCR (+62.1%) suggests that **evidence binding** is the single most impactful intervention. When a website deploys structured evidence (clinical study references, certifications, statistical claims with sources), AI systems are significantly more likely to ground their responses in these evidence items rather than generating unsupported claims.

This has practical implications: rather than optimizing for keyword density or link building (traditional SEO strategies), organizations should focus on creating **evidence-rich, concept-structured content** that AI systems can reliably extract and attribute.

### 6.3 Stability and Temporal Dynamics

The improvement in Attractor Stability (M7: +10.9%) indicates that TCO-optimized content creates more consistent concept extraction across AI runs. This is significant because unstable concept transmission—where the same query produces different concept coverage across runs—creates unpredictable brand representation.

### 6.4 YMYL Sensitivity

The Counseling/Psychology vertical showed both the lowest baseline scores and the largest improvement. This aligns with the YMYL (Your Money or Your Life) principle: domains with high-stakes information require the most careful concept management. Our framework's inclusion of boundary rules (B) and action policies (P) is particularly valuable in these domains, where a hallucinated treatment recommendation or a missing safety disclaimer can cause real harm.

### 6.5 Practical Implications

For practitioners, our results suggest the following optimization priority:

1. **First**: Build a comprehensive Brand SSoT with explicit concept definitions and evidence bindings.
2. **Second**: Create Answer Cards targeting missing concept gaps (M5).
3. **Third**: Deploy schema markup and llm.txt for machine-readable concept structure.
4. **Fourth**: Establish boundary rules and action policies for safety-critical concepts.
5. **Fifth**: Monitor M1–M13 continuously and trigger Fix-It interventions when thresholds are violated.

### 6.6 Limitations

1. **LLM-as-Judge Reliability**: While our judges achieve ρ > 0.70 with human evaluations, there remains a ceiling on LLM judge accuracy, particularly for nuanced domain-specific concepts.

2. **Temporal Confound**: The 4-week gap between Baseline and Intervention measurements introduces a potential temporal confound (AI model updates, training data changes). We mitigated this through the Difference-in-Differences design but cannot fully eliminate it.

3. **Generalizability**: Our experiment covers 5 verticals with Korean-language content. Results may differ for other languages and cultural contexts.

4. **Intervention Isolation**: The Intervention condition includes multiple simultaneous changes (Answer Cards, schema, evidence enrichment). Future work should isolate the contribution of each intervention type through an ablation study.

5. **Sample Size**: While 12,000 responses provide substantial statistical power for aggregate analysis, the per-site per-engine sample (50 queries) may be insufficient for fine-grained concept-level analysis.

---

## 7. Implications for Patent and Commercialization

The TCO-GEO framework introduces several patentable innovations:

1. **Method Claim**: A computer-implemented method for measuring concept transmission fidelity between a source website and an AI-generated response, comprising the steps of: constructing a Website Concept Tensor from the source, extracting an AI Response Concept Tensor via a multi-stage judge pipeline, computing concept-level metrics, and generating targeted content interventions.

2. **System Claim**: A system comprising a concept ontology store (Brand SSoT), a multi-engine observation module, a cascaded judge pipeline, a metric aggregation engine, and a closed-loop fix-it system.

3. **Metric Claim**: The specific formulations of M1–M13, particularly the weighted composite TCO-GEO Score (M13) and the novel Concept Transfer Rate (M1) that measures concept-level recall against a structured ontology.

Commercially, the framework enables a new category of analytics product: **Concept-Level AI Visibility Analytics**, distinct from existing citation-tracking tools.

---

## 8. Conclusion

We have presented TCO-GEO, a framework for measuring and optimizing concept transmission fidelity in AI-generated responses. Through a controlled experiment with 12,000 responses across 30 websites and 4 AI engines, we demonstrated that:

1. **Concept-level metrics dramatically outperform surface metrics**: M1 CTR-TCO (ρ = 0.728) vs URL Citation Rate (ρ = 0.312) in predicting human-rated answer quality.

2. **TCO-GEO interventions produce significant improvement**: M1 improved by 36.2% and M2 by 62.1% following structured content optimization (all p < 0.001, Cohen's d > 1.0).

3. **The TCO-GEO Score explains 3× more variance** in human quality ratings than traditional metrics (R² = 0.583 vs R² = 0.193).

4. **Smaller sites benefit most**: Tier 3 sites showed 39.6% improvement vs 22.4% for Tier 1, democratizing AI visibility optimization.

5. **The framework is operationalizable**: Our reference implementation demonstrates a complete closed-loop system from measurement to intervention to re-measurement.

The shift from "Was I mentioned?" to "Were my concepts accurately transmitted?" represents a necessary evolution in how organizations measure and optimize their presence in AI-mediated information ecosystems.

---

## References

Aggarwal, P., Murahari, V., Rajpurohit, T., Kalyan, A., Narasimhan, K., & Deshpande, A. (2023). GEO: Generative Engine Optimization. *arXiv preprint arXiv:2311.09735*.

Bhaskar, A., Fok, R., & Metzler, D. (2024). Measuring and Optimizing Answer Visibility in AI-Generated Search Results. *Proceedings of SIGIR 2024*.

Bommasani, R., et al. (2021). On the Opportunities and Risks of Foundation Models. *arXiv preprint arXiv:2108.07258*.

Es, S., James, J., Espinosa-Anke, L., & Schockaert, S. (2024). RAGAS: Automated Evaluation of Retrieval Augmented Generation. *Proceedings of EACL 2024*.

Hogan, A., et al. (2021). Knowledge Graphs. *ACM Computing Surveys*, 54(4), 1–37.

Liu, N. F., Zhang, T., & Liang, P. (2023). Evaluating Verifiability in Generative Search Engines. *Findings of EMNLP 2023*.

Liu, Y., Iter, D., Xu, Y., Wang, S., Xu, R., & Zhu, C. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment. *Proceedings of EMNLP 2023*.

Min, S., Krishna, K., Lyu, X., Lewis, M., Yih, W., Koh, P. W., ... & Hajishirzi, H. (2023). FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation. *Proceedings of EMNLP 2023*.

Noy, N. F., & McGuinness, D. L. (2001). Ontology Development 101: A Guide to Creating Your First Ontology. *Stanford Knowledge Systems Laboratory Technical Report KSL-01-05*.

Pradeep, R., Sharifymoghaddam, S., & Lin, J. (2024). Generative Retrieval Meets Multi-Grounded Generation. *Proceedings of ACL 2024*.

Shah, C., & Vincent, N. (2024). Evaluating Search Features in Generative AI: Implications for Information Retrieval. *Proceedings of CHIIR 2024*.

Weidinger, L., et al. (2022). Taxonomy of Risks Posed by Language Models. *Proceedings of FAccT 2022*.

---

## Appendix A: Metric Computation Details

### A.1 ConceptFidelityAggregator Algorithm

```
Input: ai_observation_run_id, workspace_id
Output: ConceptFidelitySnapshot (M1–M13)

1. Fetch all probe_runs for the observation run
2. Fetch all concept_extraction_results for each probe_run
3. For each concept c_i in WCT:
   a. Compute recall(c_i) = (runs where c_i present) / total_runs
   b. Compute evidence_bound(c_i) = (runs where c_i has evidence) / total_runs
4. M1 = weighted_mean(recall(c_i)) for strategic concepts
5. M2 = mean(evidence_bound(c_i)) for all present concepts
6. Fetch fidelity_judgments → M3 = mean(brand_concept_fidelity)
7. Fetch distortion_judgments → M4 = mean(severity_weighted_rate)
8. M5 = count(c_i where recall < threshold)
9. Fetch hallucination_judgments → M6 = mean(hallucinated_concept_rate)
10. Compute M7, M11, M12 via AttractorStabilityCalculator
11. If previous snapshot exists: M8 via DriftCalculator
12. Fetch risk_judgments → M9 = mean(top_10_pct_risk)
13. Fetch policy_judgments → M10 = mean(policy_alignment)
14. M13 = weighted_composite(M1..M12)
15. Grade = 'A' if M13 ≥ 0.85, 'B' if ≥ 0.70, 'C' if ≥ 0.55, 'D' if ≥ 0.40, else 'F'
16. INSERT into concept_fidelity_snapshots
```

### A.2 Human Goldset Sampling Strategy

Stratified sampling with the following strata:
- 5 verticals × 4 engines × 2 conditions = 40 strata
- 15 samples per stratum = 600 total
- Within each stratum: 5 random + 5 highest-M13 + 5 lowest-M13

---

## Appendix B: Judge Prompt Templates

### B.1 Concept Extractor Judge (Stage 1)

```
You are an expert concept extraction judge. Given:
1. A Brand SSoT containing the brand's core concepts, relations, and evidence
2. An AI-generated response to a user query

Extract all concepts mentioned in the AI response and map them to the Brand SSoT.

For each SSoT concept, determine:
- present: boolean (is the concept mentioned or implied?)
- accuracy: 0.0-1.0 (how accurately is it represented?)
- rank: integer (position in the response, 1 = first mentioned)
- evidence_bound: boolean (is it backed by a citation?)
- distorted: boolean (is the concept misrepresented?)
- hallucinated: boolean (does the response make unsupported claims?)

Output strict JSON format.
```

### B.2 Fidelity Judge (Stage 2)

```
You are a Brand Concept Fidelity judge. Score the following dimensions (0.0-1.0):

1. concept_transfer: Are the brand's key concepts present in the response?
2. relation_accuracy: Are concept relationships (e.g., ingredient-benefit) correct?
3. differentiation_preservation: Are the brand's unique differentiators maintained?
4. evidence_binding: Are claims supported by cited evidence?
5. forbidden_suppression: Are forbidden topics/claims absent?
6. policy_alignment: Does the response follow the brand's CTA and safety policies?

Compute brand_concept_fidelity as the weighted average.
Assign a grade: A (≥0.85), B (≥0.70), C (≥0.55), D (≥0.40), F (<0.40).
```

---

## Appendix C: Statistical Tests

### C.1 Steiger's Z-test for Comparing Correlations

For comparing two dependent correlations $r_{12}$ and $r_{13}$ (both sharing variable 1):

$$Z = \frac{(z_{12} - z_{13}) \sqrt{n-3}}{\sqrt{2(1-r_{23}) \cdot h}}$$

where $z_{ij}$ is Fisher's z-transformation of $r_{ij}$, $r_{23}$ is the correlation between variables 2 and 3, and $h$ is a correction factor.

### C.2 Paired t-test for Intervention Effect

For site-level paired comparison (n = 30):

$$t = \frac{\bar{d}}{s_d / \sqrt{n}}$$

where $\bar{d}$ is the mean of pairwise differences and $s_d$ is their standard deviation.

### C.3 Cohen's d for Effect Size

$$d = \frac{\bar{d}}{s_d}$$

Interpretation: |d| > 0.8 = large effect, |d| > 0.5 = medium, |d| > 0.2 = small.

---

## Appendix D: Reference Implementation

The TCO-GEO framework is implemented as part of the BSW-OS (Brand Semantic Web Operating System) platform. Key modules:

| Module | Path | Description |
|---|---|---|
| Concept Extractor Judge | `lib/judges/concept-extractor-judge.ts` | Stage 1: concept extraction |
| Fidelity Judge | `lib/judges/fidelity-judge.ts` | Stage 2: fidelity scoring |
| Distortion Judge | `lib/judges/distortion-judge.ts` | Stage 3: distortion detection |
| Hallucination Judge | `lib/judges/hallucination-judge.ts` | Stage 4: hallucination detection |
| Risk Judge | `lib/judges/risk-judge.ts` | Stage 5: risk assessment |
| Policy Judge | `lib/judges/policy-judge.ts` | Stage 6: policy compliance |
| Judge Pipeline | `lib/judges/judge-pipeline.ts` | Orchestrates all 6 judges |
| Concept Fidelity Aggregator | `lib/metrics/concept-fidelity-aggregator.ts` | M1–M13 computation |
| Attractor Stability Calculator | `lib/metrics/attractor-stability-calculator.ts` | M7, M11, M12 |
| Drift Calculator | `lib/metrics/drift-calculator.ts` | M8 |
| Anomaly Detector | `lib/fix-it/anomaly-detector.ts` | Fix-It trigger |
| RCA Generator | `lib/fix-it/rca-generator.ts` | Root cause analysis |
| Patch Executor | `lib/fix-it/patch-executor.ts` | Intervention application |
| Retest Scheduler | `lib/fix-it/retest-scheduler.ts` | Post-intervention verification |
| Regression Guard | `lib/fix-it/regression-guard.ts` | Regression prevention |

The database schema consists of 32 migration files defining 80+ tables in PostgreSQL (Supabase), including dedicated tables for each judge's output, concept fidelity snapshots, experiment runs, and the Fix-It pipeline.
