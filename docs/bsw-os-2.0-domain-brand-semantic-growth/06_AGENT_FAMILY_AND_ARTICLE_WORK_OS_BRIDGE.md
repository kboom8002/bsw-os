# Agent Family & Article Work OS Bridge

# 1. Agent Family

1. Signal Radar Agent
2. Question Curator Agent
3. Intent & Scene Agent
4. Domain TCO Agent
5. Brand Match Agent
6. Evidence Steward Agent
7. Opportunity Strategist Agent
8. Semantic Mission Agent
9. Asset Architect Agent
10. SEO/AEO/GEO Validator Agent
11. Performance Observer Agent
12. Refresh Agent
13. Domain Governance Agent

# 2. Lifecycle

```text
SEED
→ SHADOW
→ CANARY
→ BOUNDED_ACTIVE
→ SUSPENDED
→ RETIRED
```

P0는 모두 SHADOW다.

# 3. Mission Contract

모든 Agent는 다음을 가진다.

- Mission
- Readable Objects
- Writable Objects
- Allowed Tools
- Prohibited Actions
- Risk Ceiling
- Required Gates
- RunReceipt
- Kill Switch

# 4. ArticleWorkOrder

필수 필드:

- Domain
- Brand
- Canonical Question
- Semantic Mission
- Article Profile
- Required TCO
- Required Claims
- Prohibited Claims
- Source Candidates
- Evidence Requirements
- Freshness
- Risk
- Channel Targets
- Internal Link Targets
- Structured Data Targets
- Outcome Metrics

# 5. ArticleResult

반환 필드:

- Approved Version
- Claims
- Evidence Links
- Human Corrections
- Validation Results
- Publication Projections
- Structured Assets
- Delivery Manifest
- Outcome Plan

# 6. State Sync

```text
BSW Opportunity
→ Work Order Approved
→ Article Work OS Accepted
→ Production
→ Review
→ Approved
→ Projection
→ Outcome
→ Learning
```

Article Document State와 BSW Opportunity State는 분리한다.

# 7. Failure

- rejected mission
- missing evidence
- unsupported claim
- specialist required
- source conflict
- freshness expired
- projection leakage
- publication failed

실패가 발견된 단계가 아니라 원인 Stage로 회귀한다.

# 8. Agent 금지행위

- R3/R4 Claim 승인
- 외부발행 최종승인
- 경쟁브랜드 비방
- 의료·법률 판단
- Brand SSoT Authority 승격
- Public Projection 승인
