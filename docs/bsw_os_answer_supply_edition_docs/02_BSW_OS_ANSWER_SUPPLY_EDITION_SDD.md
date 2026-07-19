# BSW-OS Answer Supply Edition — System Design Document

> 문서 ID: BSW-AS-SDD-001  
> 버전: 1.0.0  
> 상태: Architecture Baseline  
> 연계 문서: BSW-AS-PRD-001, JEJU-VPACK-001, SKIN-VPACK-001

---

# 0. 목적

이 문서는 BSW-OS Answer Supply Edition의 시스템 아키텍처, 서비스 경계, 데이터 모델, Pipeline, API, 저장소, 발행구조, Search·AI 관측, Vertical Pack Interface와 단계별 구현방안을 정의한다.

---

# 1. Architecture Principles

## AP-01 Question-first

Content가 아니라 Canonical Question과 Problem Scene이 작업단위다.

## AP-02 Answer Asset as compiled artifact

발행페이지는 자유형 LLM 출력이 아니라 `AnswerAssetSpec`에서 컴파일한다.

## AP-03 Evidence and Policy before generation

근거·정책 검증이 생성 후 장식이 아니라 생성 전 입력계약이다.

## AP-04 Hub–Tenant separation

공통 중립답변과 브랜드 고유답변의 책임을 분리한다.

## AP-05 One canonical asset, many surfaces

한 질문의 정본 Asset을 다양한 Surface로 변환한다.

## AP-06 Public web first

HTML·Canonical·Internal Link·Structured Data가 API보다 우선한다.

## AP-07 Vertical Packs, shared runtime

도메인별 Concept·Policy·Template만 Pack으로 분리한다.

## AP-08 Outcome, not page count

발행량이 아니라 Coverage·Accuracy·Qualified Action을 최적화한다.

---

# 2. System Context

```text
External Signals
├── Search Console
├── Naver
├── AI Guide
├── Reviews
├── Consultation
└── Manual Research
          ↓
BSW-OS Answer Supply Control Plane
          ↓
Question Graph
→ Evidence/Claim
→ Answer Factory
→ Publisher
          ↓
Public Surfaces
├── Jeju Hub
├── Merchant AI Hompy
├── DR.O AI Hompy
├── Product/Place Pages
└── AI Guide
          ↓
Search·AI Engines·Users
          ↓
Observability & Outcome
          ↓
RunReceipt·CasePack·Recomposition
```

---

# 3. Logical Architecture

```text
1. Signal Plane
   ├── Connectors
   ├── Normalizer
   └── Signal Store

2. Question Intelligence Plane
   ├── Canonicalizer
   ├── Scene Classifier
   ├── Question Graph
   ├── Opportunity Engine
   └── Right-to-Answer Router

3. Semantic Governance Plane
   ├── Tenant Fact Registry
   ├── Claim Registry
   ├── Evidence Registry
   ├── Policy Engine
   └── Freshness Scheduler

4. Answer Production Plane
   ├── QIS Compiler
   ├── AnswerAssetSpec
   ├── PatternAttractor Resolver
   ├── Asset Generator
   ├── Validator Guild
   └── Human Review

5. Publishing Plane
   ├── Route Compiler
   ├── HTML Renderer
   ├── Metadata
   ├── JSON-LD
   ├── Sitemap
   ├── hreflang
   └── Internal Link Graph

6. Observability Plane
   ├── Search Metrics
   ├── AI Visibility Probe
   ├── Product/Place Events
   ├── RunReceipt
   └── Outcome Aggregator

7. Learning Plane
   ├── Gap Analyzer
   ├── Recomposition
   ├── CasePack
   └── TCO/Pattern Candidate Feed
```

---

# 4. Deployment Model

## 4.1 권장 초기 구조

```text
Next.js Application
├── Jeju Hub
├── Tenant AI Hompy
├── DR.O
├── Public Answer Routes
└── Admin Console

Supabase / PostgreSQL
├── Core Tables
├── RLS
├── pgvector
└── Event Store

Python Workers
├── Clustering
├── Opportunity
├── Evidence Binding
├── AI Probe
└── Evaluation

Object Storage
├── Images
├── Evidence Files
├── Generated Artifacts
└── Receipts
```

## 4.2 추후 분리

- TCO-CAP Runtime
- Open TCO Seed Factory
- TCO Forge
- Dedicated Event Warehouse
- Dedicated Search Observatory

---

# 5. Repository Structure

```text
apps/
  web/
  admin/
  worker-api/

packages/
  answer-contracts/
  question-graph/
  opportunity-engine/
  right-to-answer/
  claim-evidence/
  policy-engine/
  answer-factory/
  public-surface/
  structured-data/
  visibility-observatory/
  run-receipts/
  vertical-runtime/

vertical-packs/
  jeju/
    schemas/
    policies/
    prompts/
    templates/
    evaluators/
  skincare/
    schemas/
    policies/
    prompts/
    templates/
    evaluators/

adapters/
  google-search-console/
  naver-search-advisor/
  ga4/
  openai-crawler/
  ai-probes/
  tco-cap/
  bsw-legacy/

docs/
  architecture/
  verticals/
  adr/
  runbooks/
```

---

# 6. Core Data Model

## 6.1 QuestionSignal

```typescript
interface QuestionSignal {
  id: string;
  tenantId?: string;
  verticalId: string;
  sourceType:
    | 'GSC'
    | 'NAVER'
    | 'SITE_SEARCH'
    | 'AI_GUIDE'
    | 'REVIEW'
    | 'CONSULTATION'
    | 'MANUAL'
    | 'AI_PROBE';

  rawText: string;
  language: string;
  observedAt: string;
  sourceUrl?: string;

  impressions?: number;
  clicks?: number;
  engagement?: number;

  privacyClass: string;
  metadata: Record<string, unknown>;
}
```

## 6.2 ProblemScene

```typescript
interface ProblemScene {
  id: string;
  verticalId: string;
  actor: string[];
  situation: string[];
  goals: string[];
  constraints: string[];
  timeContext?: string[];
  placeContext?: string[];
  journeyStage: string;
  riskLevel: string;
}
```

## 6.3 CanonicalQuestion

```typescript
interface CanonicalQuestion {
  id: string;
  verticalId: string;
  tenantId?: string;

  canonicalText: string;
  paraphrases: string[];
  language: string;

  sceneId: string;
  intent: string;
  journeyStage: string;
  riskLevel: string;
  freshnessClass: string;

  requiredConceptIds: string[];
  requiredEvidenceTypes: string[];

  rightToAnswer: RightToAnswerDecision;
  answerability: AnswerabilityState;

  opportunity: ScoreBreakdown;
  status: QuestionStatus;

  canonicalAssetId?: string;
}
```

## 6.4 RightToAnswerDecision

```typescript
interface RightToAnswerDecision {
  primaryActor:
    | 'HUB'
    | 'TENANT'
    | 'EXPERT'
    | 'OFFICIAL_SOURCE'
    | 'JOINT'
    | 'NONE';

  eligibleTenantIds: string[];
  rationale: string[];
  missingRequirements: string[];
  reviewedBy?: string;
}
```

## 6.5 TenantFact

```typescript
interface TenantFact {
  id: string;
  tenantId: string;
  factType: string;
  statement: string;
  structuredValue?: unknown;

  evidenceIds: string[];
  verifiedAt: string;
  validUntil?: string;
  status: 'VERIFIED' | 'PENDING' | 'DISPUTED' | 'EXPIRED';
}
```

## 6.6 Claim

```typescript
interface Claim {
  id: string;
  verticalId: string;
  tenantId?: string;

  statement: string;
  claimType: string;
  allowedStrength: string;

  evidenceIds: string[];
  policyIds: string[];

  validFrom?: string;
  validUntil?: string;

  status:
    | 'DRAFT'
    | 'SUPPORTED'
    | 'CONDITIONAL'
    | 'DISPUTED'
    | 'PROHIBITED'
    | 'EXPIRED';

  reviewerIds: string[];
}
```

## 6.7 Evidence

```typescript
interface Evidence {
  id: string;
  sourceType: string;
  sourceUrl?: string;
  excerpt?: string;
  fileId?: string;

  evidenceType: string;
  authority: number;
  timeliness: number;
  independence: number;
  representativeness: number;

  observedAt?: string;
  validUntil?: string;
  status: string;
}
```

## 6.8 AnswerAssetSpec

```typescript
interface AnswerAssetSpec {
  id: string;
  questionId: string;
  verticalId: string;
  tenantId?: string;

  assetType: string;
  targetSurfaces: string[];
  canonicalRoute: string;

  title: string;
  directAnswer: string;
  contentBlocks: ContentBlock[];

  claimIds: string[];
  evidenceIds: string[];

  applicability: string[];
  exclusions: string[];
  warnings: string[];
  nextActions: NextAction[];

  seo: SeoContract;
  structuredData: StructuredDataContract;
  internalLinks: LinkContract[];

  authorId: string;
  reviewerIds: string[];

  reviewedAt?: string;
  validUntil?: string;

  status: AssetStatus;
  version: string;
}
```

## 6.9 PublishReceipt

```typescript
interface PublishReceipt {
  id: string;
  assetId: string;
  assetVersion: string;

  publishedUrl: string;
  canonicalUrl: string;

  htmlRendered: boolean;
  metadataValidated: boolean;
  structuredDataValidated: boolean;
  sitemapSubmitted: boolean;
  hreflangValidated: boolean;

  indexStatus?: string;
  publishedAt: string;
  lastCheckedAt?: string;
}
```

## 6.10 VisibilityObservation

```typescript
interface VisibilityObservation {
  id: string;
  assetId?: string;
  questionId: string;

  engine:
    | 'GOOGLE_SEARCH'
    | 'GOOGLE_AI'
    | 'NAVER'
    | 'CHATGPT_SEARCH'
    | 'GEMINI'
    | 'PERPLEXITY';

  locale: string;
  observedAt: string;

  mentioned: boolean;
  cited: boolean;
  citedUrls: string[];
  competitors: string[];

  accuracyStatus:
    | 'CORRECT'
    | 'PARTIAL'
    | 'INCORRECT'
    | 'NOT_APPLICABLE'
    | 'NOT_REVIEWED';

  rawResultRef?: string;
}
```

---

# 7. Question Pipeline

```text
INGEST
→ NORMALIZE
→ CLUSTER
→ CANONICALIZE
→ SCENE_BIND
→ SCORE
→ RIGHT_TO_ANSWER
→ EVIDENCE_CHECK
→ PLAN_ASSET
```

## 7.1 Canonicalization

Signals are not deleted. Cluster retains all variants.

## 7.2 Duplicate protection

A new Question can create:

- new Canonical
- paraphrase
- subquestion
- related question
- boundary question

## 7.3 Scene Binding

Vertical Pack supplies classification dimensions.

## 7.4 Opportunity Engine

```typescript
interface ScoreBreakdown {
  demand: number;
  businessRelevance: number;
  rightToAnswer: number;
  evidenceReadiness: number;
  differentiation: number;
  actionPotential: number;
  reusePotential: number;

  policyRisk: number;
  duplicationRisk: number;
  freshnessRisk: number;

  total: number;
  estimateType: 'HEURISTIC' | 'CALIBRATED';
  profileVersion: string;
}
```

---

# 8. Answer Production Pipeline

```text
CanonicalQuestion
→ Answer Mission
→ TCO Context
→ Claim/Evidence Context
→ PatternAttractorSpec
→ AnswerAssetSpec Draft
→ Deterministic Validators
→ LLM Critics
→ Human Review
→ Publish
```

## 8.1 Answer Mission

기존 QIS를 확장한다.

```yaml
question:
scene:
answer_goal:
direct_answer_contract:
decision_criteria:
required_claims:
required_evidence:
allowed_strength:
must_include:
must_not_include:
warnings:
cta_policy:
surface_contract:
expiry:
```

## 8.2 Validator Order

1. Schema
2. Right-to-Answer
3. Evidence Coverage
4. Claim Policy
5. Freshness
6. Duplicate
7. Unique Value
8. Structured Data Match
9. Language
10. Human Review, if required

---

# 9. Publishing Architecture

## 9.1 Route Pattern

```text
/{locale}/answers/{slug}
/{locale}/guides/{slug}
/{locale}/places/{slug}
/{locale}/brands/{tenantSlug}/answers/{slug}
/{locale}/products/{slug}
/{locale}/ingredients/{slug}
```

## 9.2 Rendering

- Server Component
- Static Generation for stable assets
- ISR for changeable Facts
- No essential content behind client-only interaction

## 9.3 Canonical Rules

- One Canonical URL per language
- Query variants do not create indexable duplicates
- Tracking Parameters excluded from Canonical
- Merged Assets use 301

## 9.4 Multilingual

- translated asset inherits claim/evidence IDs
- translation status stored
- hreflang generated only when published
- machine translation requires review for high-risk assets

## 9.5 JSON-LD Factory

Vertical Pack supplies template and validation rules.

---

# 10. Internal Link Graph

## Node

- Question
- Scene
- Guide
- Place
- Merchant
- Product
- Ingredient
- Expert
- Evidence

## Edge

- answers
- applies_to
- related_to
- compare_with
- supported_by
- next_step
- provided_by
- located_near

## Linking Rules

- Every Answer links to one Entity/Evidence/Next Action.
- Every Entity page links to relevant Canonical Answers.
- Hub Guides link to eligible Tenant Answers.
- Tenant Answers link back to neutral Hub criteria where appropriate.

---

# 11. Search & AI Observability

## 11.1 Search Console Connector

Store:

- query
- page
- device
- country
- date
- impressions
- clicks
- position

## 11.2 Naver Connector

Store available crawl/index diagnostics and query metrics according to accessible interfaces.

## 11.3 AI Probe Runner

### Probe definition

```typescript
interface Probe {
  id: string;
  questionId: string;
  promptText: string;
  engine: string;
  locale: string;
  schedule: string;
  expectedEntities: string[];
  expectedFacts: string[];
}
```

### Caution

- AI result is stochastic.
- Personalized session is avoided where possible.
- Observation is sample, not guaranteed ranking.

## 11.4 Qualified Outcome

Search traffic is not sufficient.

Events are mapped to Question→Asset→Entity→Action.

---

# 12. RunReceipt Extension

```typescript
interface AnswerSupplyRunReceipt {
  id: string;

  questionId: string;
  assetId?: string;
  tenantId?: string;
  verticalId: string;

  inputSignalIds: string[];
  sceneId: string;

  tcoVersion: string;
  evidenceVersion: string;
  policyVersion: string;
  promptVersion: string;
  modelVersion: string;
  templateVersion: string;

  validationResults: object[];
  reviewerIds: string[];

  publishReceiptId?: string;
  visibilityObservationIds: string[];
  outcomeEventIds: string[];

  createdAt: string;
}
```

---

# 13. Vertical Pack Interface

```typescript
interface VerticalPack {
  id: string;
  version: string;

  sceneSchema: object;
  questionTypes: object[];
  conceptBindings: object[];

  opportunityProfile: object;
  rightToAnswerRules: object[];

  evidenceTypes: object[];
  claimTypes: object[];
  policyRules: object[];

  assetTemplates: object[];
  structuredDataTemplates: object[];

  freshnessRules: object[];
  humanReviewRules: object[];

  eventTaxonomy: object[];
  evaluationRubrics: object[];
}
```

---

# 14. API Design

## Question

```text
POST /v1/signals
POST /v1/questions/canonicalize
GET  /v1/questions
GET  /v1/questions/{id}
POST /v1/questions/{id}/score
POST /v1/questions/{id}/route
```

## Evidence

```text
POST /v1/facts
POST /v1/claims
POST /v1/evidence
POST /v1/questions/{id}/evidence-check
```

## Answer Asset

```text
POST /v1/assets/plan
POST /v1/assets/generate
POST /v1/assets/{id}/validate
POST /v1/assets/{id}/approve
POST /v1/assets/{id}/publish
```

## Metrics

```text
POST /v1/metrics/search/import
POST /v1/probes/run
POST /v1/outcomes
GET  /v1/assets/{id}/performance
```

## Recomposition

```text
POST /v1/assets/{id}/recommend-recomposition
POST /v1/assets/{id}/merge
POST /v1/assets/{id}/refresh
POST /v1/assets/{id}/retire
```

---

# 15. Database Tables

```text
question_signals
problem_scenes
canonical_questions
question_variants
question_edges
opportunity_scores
right_to_answer_decisions

tenant_facts
claims
evidence
policies
claim_evidence_links

answer_missions
answer_assets
asset_blocks
asset_claim_links
asset_evidence_links
asset_internal_links

publish_receipts
search_metrics
ai_probes
visibility_observations
outcome_events
recomposition_actions

vertical_packs
pack_versions
run_receipts
```

---

# 16. Security & Governance

## 16.1 RLS

Tenant Fact, draft Asset, private Evidence는 Tenant별 격리.

## 16.2 Public vs Private

- Public Evidence
- Internal Evidence
- Restricted Evidence
- Summary-only Evidence

## 16.3 PII

상담·AI Guide 입력에서 PII 제거 후 Question Signal로 사용.

## 16.4 Prompt Injection

후기·웹문서 텍스트는 지시가 아니라 데이터다.

---

# 17. Caching & Performance

- Public Assets CDN cache
- Question Embedding cache
- Evidence retrieval cache
- JSON-LD build cache
- Metrics incremental import
- ISR invalidation by Fact/Claim expiry

---

# 18. Failure Modes

## Missing evidence

Asset remains `evidence_gap`.

## Expired fact

Affected Asset becomes `refresh_due`; critical facts may trigger temporary warning/noindex.

## Structured data mismatch

Publishing blocked.

## AI Probe failure

Observation unknown; no negative score.

## Metrics connector outage

Queue retry; publishing unaffected.

## Unsafe skincare answer

Asset blocked or Consult First template.

---

# 19. Implementation Phases

## Phase 0

Current URL/SEO/Question audit.

## Phase 1

Question Portfolio and Scene Models.

## Phase 2

Fact·Claim·Evidence and Right-to-Answer.

## Phase 3

AnswerAssetSpec and Validator.

## Phase 4

Public Route·Metadata·JSON-LD Publisher.

## Phase 5

Jeju Pack.

## Phase 6

Skincare Pack.

## Phase 7

Search·AI Observability.

## Phase 8

Recomposition·CasePack.

---

# 20. Definition of Done

1. 두 Vertical이 동일 Core Runtime을 사용한다.
2. 질문 Signal이 Canonical Question과 Scene으로 연결된다.
3. Right-to-Answer가 허브·브랜드·전문가를 구분한다.
4. Evidence가 부족한 Asset은 발행되지 않는다.
5. 한 질문의 변형이 중복페이지를 만들지 않는다.
6. Public Asset은 Indexable HTML·Canonical·Sitemap·JSON-LD를 갖는다.
7. Vertical별 Policy Gate가 동작한다.
8. Publish·Visibility·Outcome이 하나의 Receipt로 추적된다.
9. Refresh·Merge·Retire가 가능하다.
10. 기존 BSW-OS QIS·PatternAttractor·Media Soliton과 호환된다.