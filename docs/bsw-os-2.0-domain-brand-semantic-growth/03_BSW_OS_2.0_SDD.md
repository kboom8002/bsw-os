# BSW-OS 2.0 Software Design Description

> Target Platform: TF-Studio  
> Architecture: Modular Monolith + Domain Adapter + Durable Workflow  
> 상태: `RC1 / SDD HANDOFF`

# 1. Target Architecture

```text
TF-Studio
├─ Identity·Tenant
├─ Learning Bridge
├─ BSW-OS
│  ├─ Domain Registry
│  ├─ Brand Knowledge
│  ├─ Question Intelligence
│  ├─ TCO·Evidence
│  ├─ Opportunity
│  ├─ Asset Registry
│  ├─ Article Bridge
│  ├─ Outcome
│  └─ Agent Runtime
├─ Article Work OS
├─ Work OS Core
├─ AI Runtime
├─ Evaluation
├─ Projection
└─ Admin·Observability
```

# 2. Bounded Contexts

1. Domain Registry
2. Brand Knowledge
3. Question Intelligence
4. Semantic Knowledge
5. Strategy & Opportunity
6. Asset Orchestration
7. Article Work Bridge
8. Publication Projection
9. Outcome Intelligence
10. Agent & Governance

# 3. Core Tables

## Registry

- `bsw_domains`
- `bsw_domain_versions`
- `bsw_domain_pack_installations`
- `bsw_domain_members`
- `bsw_markets`
- `bsw_locales`

## Brand

- `bsw_brands`
- `bsw_brand_memberships`
- `bsw_brand_entities`
- `bsw_brand_ssot_revisions`
- `bsw_brand_claims`
- `bsw_brand_evidence_links`
- `bsw_brand_policies`

## Question

- `bsw_question_signals`
- `bsw_question_clusters`
- `bsw_canonical_questions`
- `bsw_question_relations`
- `bsw_question_situations`
- `bsw_question_entity_links`
- `bsw_question_tco_links`
- `bsw_question_journeys`

## Semantic Knowledge

- `bsw_tco_concepts`
- `bsw_tco_boundaries`
- `bsw_tco_relations`
- `bsw_sources`
- `bsw_evidence`
- `bsw_evidence_policies`
- `bsw_risk_rules`

## Strategy

- `bsw_question_coverage`
- `bsw_brand_fit_assessments`
- `bsw_answerability_assessments`
- `bsw_content_gaps`
- `bsw_opportunities`
- `bsw_strategy_recommendations`
- `bsw_work_orders`

## Assets·Bridge·Outcome

- `bsw_assets`
- `bsw_asset_versions`
- `bsw_asset_question_links`
- `bsw_asset_claim_links`
- `bsw_asset_projections`
- `bsw_internal_link_edges`
- `bsw_structured_data_assets`
- `bsw_article_work_orders`
- `bsw_article_bridge_runs`
- `bsw_article_results`
- `bsw_search_observations`
- `bsw_ai_answer_observations`
- `bsw_citation_observations`
- `bsw_interaction_events`
- `bsw_conversion_events`
- `bsw_outcome_snapshots`
- `bsw_refresh_tickets`
- `bsw_case_packs`
- `bsw_pattern_records`

## Agent

- `bsw_agent_assets`
- `bsw_agent_mission_contracts`
- `bsw_agent_runs`
- `bsw_agent_run_receipts`
- `bsw_agent_incidents`

# 4. Tenant Model

```text
Organization
→ Workspace
→ Domain
→ Brand Membership
```

규칙:

- Domain은 Workspace에 설치한다.
- Brand가 여러 Domain에 참여하면 Membership을 분리한다.
- Brand A SSoT를 Brand B에 자동공유하지 않는다.
- Domain Pattern은 원자료가 아닌 추상화된 자산으로 공유한다.

# 5. Key Contracts

## Canonical Question

```ts
interface CanonicalQuestion {
  id: string;
  domainId: string;
  locale: string;
  text: string;
  normalizedText: string;
  intent: string;
  lifecycle: "OBSERVED" | "VALIDATED" | "ACTIVE" | "DECLINING" | "ARCHIVED";
  freshnessPolicy: Record<string, unknown>;
  riskLevel: "R1" | "R2" | "R3" | "R4";
}
```

## Brand Fit

```ts
interface BrandFitAssessment {
  questionId: string;
  brandId: string;
  relevance: number;
  authority: number;
  evidenceReadiness: number;
  operationalFit: number;
  differentiation: number;
  riskAdjustment: number;
  status: "LOW" | "CONDITIONAL" | "HIGH";
  rationale: string[];
}
```

## Opportunity

```ts
interface OpportunityCandidate {
  questionId: string;
  brandId?: string;
  ownerType: "DOMAIN_HUB" | "BRAND" | "SHARED";
  recommendedWorkType:
    | "ARTICLE"
    | "ANSWER_CARD"
    | "FAQ"
    | "PLACE_PAGE"
    | "PRODUCT_PAGE"
    | "COMPARISON"
    | "STRUCTURED_DATA"
    | "EVIDENCE_ACQUISITION"
    | "SSOT_UPDATE"
    | "REFRESH"
    | "DO_NOT_PUBLISH";
  score: number;
  scoreComponents: Record<string, number>;
  requiredHumanGate: string[];
}
```

# 6. Question Pipeline

```text
Signal Ingest
→ Sanitize
→ Privacy Classify
→ Language Normalize
→ Entity Extract
→ Intent·Situation
→ Duplicate Search
→ Cluster
→ Canonical Candidate
→ Human·Rule Validation
→ TCO Link
→ Coverage Refresh
```

Idempotency:

```text
question-signal:{domain}:{source}:{source_id}:{content_hash}
canonicalize:{cluster_id}:{model_version}:{prompt_version}
```

# 7. Opportunity Pipeline

```text
Canonical Question
→ Existing Asset Coverage
→ Candidate Brand
→ Brand Fit
→ Answerability
→ Evidence Readiness
→ Risk
→ Cannibalization
→ Work Type
→ Priority
→ Human Approval
```

Hard Blocker:

- rights 없음
- brand membership 없음
- unsupported claim
- stale critical source
- R4 specialist 없음
- conflicting SSoT
- PII
- real-time guarantee 불가능

# 8. Article Work OS Bridge

Outbound 핵심 필드:

```text
Domain
Brand
Canonical Question
Semantic Mission
Article Profile
Required TCO
Required Claims
Prohibited Claims
Sources
Evidence Requirements
Freshness
Risk
Channels
Internal Links
Structured Data
Outcome Metrics
```

Inbound 핵심 필드:

```text
Approved Version
Claims
Evidence Links
Publication Projections
Structured Assets
Validation Results
Human Corrections
Delivery Manifest
Outcome Tracking Plan
```

Bridge State:

```text
DRAFT
→ APPROVED_FOR_EXECUTION
→ SENT
→ ACCEPTED
→ IN_PRODUCTION
→ HUMAN_REVIEW
→ APPROVED
→ RETURNED
→ PUBLISHED
→ LEARNING
```

# 9. Agent Runtime

```ts
interface AgentMissionContract {
  agentId: string;
  mission: string;
  allowedDomains: string[];
  allowedTools: string[];
  readableObjects: string[];
  writableObjects: string[];
  prohibitedActions: string[];
  requiredGates: string[];
  riskCeiling: "R1" | "R2" | "R3";
  lifecycle: "SEED" | "SHADOW" | "CANARY" | "ACTIVE" | "SUSPENDED";
}
```

P0 원칙:

- 모든 Agent SHADOW
- 외부발행 Side Effect 금지
- Work Order는 Human Queue
- High-risk Claim은 Specialist Gate
- RunReceipt·Kill Switch 필수

# 10. Route Structure

```text
src/app/(app)/bsw/
├─ page.tsx
├─ domains/[domainId]/
│  ├─ page.tsx
│  ├─ questions/page.tsx
│  ├─ tco/page.tsx
│  ├─ opportunities/page.tsx
│  ├─ brands/page.tsx
│  ├─ assets/page.tsx
│  ├─ outcomes/page.tsx
│  └─ agents/page.tsx
├─ brands/[brandId]/
│  ├─ page.tsx
│  ├─ ssot/page.tsx
│  ├─ claims/page.tsx
│  ├─ coverage/page.tsx
│  └─ assets/page.tsx
├─ work-orders/page.tsx
└─ admin/
```

# 11. Library Structure

```text
src/lib/bsw/
├─ domain/
├─ brand/
├─ question/
├─ tco/
├─ evidence/
├─ opportunity/
├─ assets/
├─ article-bridge/
├─ outcome/
├─ agents/
├─ policies/
├─ schemas/
├─ repositories/
└─ observability/
```

# 12. RLS

기본조건:

```text
auth.uid exists
AND active workspace membership
AND object.workspace_id = membership.workspace_id
```

추가조건:

- Brand Membership 확인
- Domain Admin·Brand Admin 분리
- Platform Domain Pack Read-only
- Brand SSoT 외부 Projection은 승인본만
- Agent는 Gateway로만 접근

Negative Test:

1. Cross-organization Question 차단
2. Brand A SSoT를 Brand B Editor가 읽지 못함
3. Domain Hub Draft Public Access 차단
4. Article Result Cross-link 차단
5. Revoked Projection 차단
6. R4 자동승인 차단
7. Agent Tool Allowlist 위반 차단
8. Tenant Context 없는 Service Role 차단

# 13. Queue·Outbox

Job:

- signal_ingest
- normalize
- cluster
- canonicalize
- brand_match
- answerability
- opportunity_score
- article_bridge
- observation
- refresh

State:

```text
QUEUED
→ CLAIMED
→ RUNNING
→ SUCCEEDED
→ FAILED
→ RETRY
→ DEAD
```

Domain State와 Outbox Event는 동일 Transaction으로 Commit한다.

# 14. AI Runtime

기존 TF-Studio Unified AI Client를 활용하고 다음 Gateway를 추가한다.

- `QuestionAiGateway`
- `TcoAiGateway`
- `OpportunityAiGateway`
- `ObservationAiGateway`

Rule Engine:

- Tenant
- Lifecycle
- Rights
- Risk Ceiling
- State Transition
- Numeric Scoring
- Structured Data Validation

AI Assist:

- Intent·Scene
- Cluster Candidate
- Concept Candidate
- Strategy Rationale
- Gap Explanation

# 15. Observability

Trace Fields:

- organization_id
- workspace_id
- domain_id
- brand_id
- question_id
- opportunity_id
- work_order_id
- article_project_id
- asset_id
- agent_run_id

Metrics:

- signals_ingested
- canonical_questions
- coverage_rate
- opportunity_throughput
- article_bridge_success
- human_override
- unsupported_claim
- refresh_debt
- cost_per_verified_loop

# 16. Security

- Prompt Injection Isolation
- Review·Customer Text는 untrusted
- External Source Provenance
- Medical·Health Claim Gate
- Local Business Freshness Warning
- No hidden PII
- No competitor defamation
- Public Projection Allowlist
- Agent no autonomous publish at P0

# 17. Test

## Unit

- normalization
- graph relation
- brand fit
- answerability
- opportunity score
- cannibalization
- work order compiler
- article result mapper

## E2E 제주

```text
QuestionSignal
→ Canonical Question
→ Brand Match
→ Opportunity
→ Article Work Order
→ Approved Article
→ Brand Projection
→ CTA
→ Refresh
```

## E2E Skincare

```text
Ingredient Question
→ TCO Boundary
→ Evidence Gap
→ High-risk Gate
→ Specialist Review
→ Approved Answer
```

# 18. Feature Flags

- `bsw_os_enabled`
- `bsw_jeju_pack_enabled`
- `bsw_skincare_pack_enabled`
- `bsw_article_bridge_enabled`
- `bsw_agent_shadow_enabled`
- `bsw_ai_observation_enabled`
- `bsw_auto_refresh_enabled`
- `bsw_bounded_active_enabled`

# 19. Required ADR

- ADR-BSW-001 Domain–Brand dual model
- ADR-BSW-002 Question Graph storage
- ADR-BSW-003 Domain Pack versioning
- ADR-BSW-004 Opportunity scoring
- ADR-BSW-005 Article bridge
- ADR-BSW-006 Agent runtime
- ADR-BSW-007 AI Answer observation
- ADR-BSW-008 Hub–Brand projection
- ADR-BSW-009 Healthcare governance
- ADR-BSW-010 Refresh workflow
