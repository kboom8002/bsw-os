# Implementation Roadmap & Gate

# W0. Existing Audit

- 기존 BSW 코드·DB·Prompt·Agent
- TF-Studio 공통기능
- Article Work OS Runtime
- AI홈피·Domain Hub
- Tenant·RLS
- Source Connector

Gate: Architecture Decision.

# W1. Domain–Brand Core

- Domain·Pack
- Brand·Membership
- SSoT
- Hub–Brand Boundary
- RLS

Gate: Cross-tenant Critical Defect 0.

# W2. Question Intelligence

- Signal
- Normalize
- Cluster
- Canonical
- Intent·Scene
- Journey·Graph

Gate: Golden 질문셋 적합성.

# W3. Semantic Fabric

- TCO
- Entity
- Source
- Evidence
- Claim
- Risk

Gate: Concept Boundary Test.

# W4. Opportunity

- Coverage
- Brand Fit
- Answerability
- Score
- Work Type
- Cannibalization

Gate: Human Strategy Agreement.

# W5. Asset System

- Answer Card
- FAQ
- Article
- Place·Product
- Schema
- Internal Link
- Projection

Gate: Asset Validator.

# W6. Article Bridge

- Work Order
- Status
- Result
- Correction
- Publication

Gate: E2E.

# W7. Agent Family

- 13 Agent
- Mission Contract
- Shadow
- RunReceipt
- Kill Switch

Gate: Autonomous Side Effect 0.

# W8. Outcome

- Search
- AI Answer
- Citation
- Interaction
- Conversion
- Refresh

Gate: Privacy·Attribution.

# W9. Autonomous Runtime

- Scheduler
- Queue
- Outbox
- Retry
- Human Wait
- Incident

Gate: Recovery Test.

# W10. Domain Pilots

- 제주
- Skincare
- Fixture
- Field Outcome
- Calibration

# Vertical Slices

## VS1 제주 질문→Article

```text
Signal
→ Question
→ Brand Fit
→ Opportunity
→ Article Work Order
→ Approved Article
→ Projection
→ Outcome
```

## VS2 제주 Place Asset

```text
Brand SSoT
→ Place Question
→ Place Page
→ JSON-LD
→ Map CTA
```

## VS3 Skincare Governance

```text
Question
→ TCO
→ Evidence
→ High-risk Gate
→ Specialist Review
→ Approved Asset
```

## VS4 Refresh

```text
Source Change
→ Impacted Question
→ Asset
→ Refresh Ticket
→ New Version
```

# Release Gate

## Alpha

- Domain Core
- 2 Packs
- Question Radar
- Opportunity
- Manual Article Bridge

## Beta

- Agent Shadow
- Search Data
- AI Observation
- Refresh

## Bounded Autonomous

- 저위험 Profile
- 승인 Source
- Approved Pack
- Exception Queue
- Sample Audit
- Kill Switch

# Definition of Ready

- TF-Studio Repo Audit
- 기존 BSW Audit
- Article Bridge Contract
- Domain Pack Seed
- RLS Test Harness
- Prompt Registry
- Feature Flag
- Specialist Reviewer

# Definition of Done

1. Domain 2개.
2. Brand 6개 이상.
3. Canonical Question 100개 이상.
4. Question Graph.
5. Brand SSoT.
6. TCO·Evidence.
7. Opportunity Queue.
8. Article Work Order.
9. Approved Asset Return.
10. Projection.
11. Outcome.
12. Refresh.
13. Agent Shadow.
14. RLS Negative Test.
15. 제주 E2E.
16. Skincare Governance E2E.
17. Feature Flag·Rollback.
18. Audit·RunReceipt.
