# BSW-OS 2.0 Product Requirements Document

> 제품상태: `RC1 / Pilot Product Definition`  
> 기본 Control Plane: TF-Studio  
> 연결 제품: Article Work OS, AI홈피, Domain Hub, Brand Site

# 1. 제품비전

> **한 도메인의 모든 핵심 질문을 발견하고, 각 질문을 가장 적합한 브랜드·근거·자산유형에 배분하며, 승인된 SEO·AEO·GEO 자산을 지속 생산·배포·갱신하는 Domain–Brand Semantic Growth Platform**

# 2. 사용자

- Domain Operator
- Brand Operator
- Editor·Reviewer
- SEO/AEO/GEO Analyst
- Domain Expert
- Platform Admin

# 3. 핵심 사용자 여정

```text
Domain 생성
→ Domain Pack 설치
→ Brand Onboarding
→ Question Signal 수집
→ Canonical Question
→ Coverage·Brand Fit·Answerability
→ Opportunity
→ Article·Asset Work Order
→ Human Gate
→ Projection
→ Outcome·Refresh
```

# 4. Product Planes

1. Domain Intelligence
2. Brand Knowledge
3. Question Intelligence
4. Strategy & Opportunity
5. Asset Orchestration
6. SEO/AEO/GEO Compiler
7. Publication & Projection
8. Outcome Intelligence
9. Agent & Automation
10. Governance & Administration

# 5. P0 Scope

## Domains

- 제주 소상공인
- Skincare

## Brands

- Domain당 3~5개 Pilot Brand
- Brand SSoT
- Approved Claim
- Product·Place·Service
- Evidence
- Brand FAQ

## Questions

- Manual·CSV·Connector Signal Import
- Normalize·Cluster·Canonicalize
- Intent·Customer Situation
- Question Journey
- Coverage

## Opportunities

- Brand Fit
- Answerability
- Evidence Readiness
- Risk
- Work Type
- Priority Queue

## Assets

- Article
- Answer Card
- FAQ
- Place·Product Page
- Structured Data
- Internal Link
- Refresh

## Article Bridge

- Work Order
- Status Sync
- Approved Result
- Claim·Evidence Trace
- Human Correction
- Publication Projection

## Outcome

- Search Console
- First-party Analytics
- Site Search
- CTA
- Sampled AI Answer Observation
- Refresh Trigger

# 6. P0 제외

- 자동 고위험 발행
- 모든 LLM의 실시간 자동모니터링
- 경쟁사 비공개 데이터 수집
- 완전 자동 Medical Claim
- 실시간 재고·예약 보장
- Predictive Pattern 자동승격
- 다중 CMS 양방향 Sync

# 7. Functional Requirements

## Domain

- `FR-DOM-001` Domain 생성·수정·Archive
- `FR-DOM-002` Domain Pack 설치·Version Pin
- `FR-DOM-003` Locale·Market 설정
- `FR-DOM-004` Evidence Policy
- `FR-DOM-005` Risk Rule
- `FR-DOM-006` Domain Hub 설정
- `FR-DOM-007` Domain Role

## Brand

- `FR-BRD-001` Brand 등록
- `FR-BRD-002` Brand SSoT Revision
- `FR-BRD-003` Product·Service·Place
- `FR-BRD-004` Claim·Evidence
- `FR-BRD-005` Policy·Availability
- `FR-BRD-006` Media Right
- `FR-BRD-007` Brand Projection
- `FR-BRD-008` Freshness 관리

## Question Intelligence

- `FR-QIS-001` QuestionSignal 수집
- `FR-QIS-002` Source·Locale·Timestamp
- `FR-QIS-003` Privacy Class
- `FR-QIS-004` Normalize
- `FR-QIS-005` Duplicate Detection
- `FR-QIS-006` Cluster
- `FR-QIS-007` Canonical Question
- `FR-QIS-008` Intent
- `FR-QIS-009` Customer Situation
- `FR-QIS-010` Entity Link
- `FR-QIS-011` TCO Link
- `FR-QIS-012` Journey
- `FR-QIS-013` Freshness
- `FR-QIS-014` Lifecycle

## Opportunity

- `FR-OPP-001` Existing Asset Coverage
- `FR-OPP-002` Domain Coverage
- `FR-OPP-003` Brand Coverage
- `FR-OPP-004` Brand Fit
- `FR-OPP-005` Answerability
- `FR-OPP-006` Evidence Readiness
- `FR-OPP-007` Risk
- `FR-OPP-008` Opportunity Score
- `FR-OPP-009` Work Type Selection
- `FR-OPP-010` Strategy Queue
- `FR-OPP-011` Human Override
- `FR-OPP-012` Cannibalization Warning

## Asset

- `FR-AST-001` Answer Card
- `FR-AST-002` FAQ
- `FR-AST-003` Article
- `FR-AST-004` Place·Product Page
- `FR-AST-005` Comparison
- `FR-AST-006` Structured Data
- `FR-AST-007` Internal Link
- `FR-AST-008` Multilingual Projection
- `FR-AST-009` Asset Version
- `FR-AST-010` Refresh

## Article Work OS Bridge

- `FR-ART-001` ArticleWorkOrder 생성
- `FR-ART-002` Semantic Mission
- `FR-ART-003` Required TCO
- `FR-ART-004` Required Claim
- `FR-ART-005` Prohibited Claim
- `FR-ART-006` Source Candidate
- `FR-ART-007` Risk·Freshness
- `FR-ART-008` Status Sync
- `FR-ART-009` Approved Result
- `FR-ART-010` Correction·CasePack

## Outcome

- `FR-OUT-001` Search Performance
- `FR-OUT-002` AI Answer Observation
- `FR-OUT-003` Citation Observation
- `FR-OUT-004` Interaction
- `FR-OUT-005` CTA·Conversion
- `FR-OUT-006` Outcome Snapshot
- `FR-OUT-007` Attribution State
- `FR-OUT-008` Refresh Ticket
- `FR-OUT-009` Pattern Candidate
- `FR-OUT-010` Domain·Brand Dashboard

## Agent

- `FR-AGT-001` Agent Registry
- `FR-AGT-002` Mission Contract
- `FR-AGT-003` Tool Allowlist
- `FR-AGT-004` Shadow Run
- `FR-AGT-005` Human Comparison
- `FR-AGT-006` Canary
- `FR-AGT-007` Kill Switch
- `FR-AGT-008` RunReceipt
- `FR-AGT-009` Cost·Latency
- `FR-AGT-010` Incident

# 8. 주요 화면

## Domain Command Center

- Question Landscape
- Coverage
- Opportunity
- Domain TCO
- Brand Portfolio
- Freshness Debt
- Article Queue
- Outcome

## Question Radar

- Signal Inbox
- Cluster
- Canonical Question
- Scene·Intent
- Trend
- Source Mix
- Privacy

## Brand Semantic Console

- Brand SSoT
- Entity
- Claim·Evidence
- Question Fit
- Coverage
- Assets
- Freshness
- Risk

## Opportunity Board

```text
Knowledge Needed
→ Ready for Strategy
→ Work Queue
→ Review
→ Published
→ Refresh
```

## Outcome Observatory

- Search
- AI Answer
- Citation
- Engagement
- CTA
- Conversion
- Refresh
- Pattern

# 9. North Star

> **Verified Question-to-Outcome Loops per Active Domain**

Verified Loop:

```text
Canonical Question
+ Domain·Brand Fit
+ Approved Knowledge
+ Executed Asset
+ Human Gate
+ Publication
+ Outcome Observation
+ Refresh·Learning Trace
```

# 10. 핵심 지표

## Domain

- Active Canonical Questions
- Question Coverage
- Evidence Coverage
- Freshness Debt
- Domain Authority Assets
- Verified Loops

## Brand

- Brand Answerability
- Brand Coverage
- Approved Claim Coverage
- Entity Consistency
- Search·AI Mention
- CTA·Conversion
- Unsupported Claim

## Operation

- Signal→Question Lead Time
- Question→Work Order Lead Time
- Work Order→Approval
- Human Correction Time
- Cost per Approved Asset
- Automation Coverage
- Exception Rate

# 11. Risk

- R1: 일반 정보·내부 자산
- R2: 외부 브랜드 콘텐츠
- R3: 건강·투자·평판·규제
- R4: 전문판단·법률·의료·중대한 안전

# 12. Release

## Alpha

- 제주 Domain
- 3 Brand
- Manual Signal
- Question Radar
- Opportunity
- Article Work Order
- Human Approval

## Beta

- Search Console
- Site Search
- AI Answer Observation
- Skincare Pack
- Agent Shadow
- Refresh

## Pilot Production

- 2 Domain
- 8~10 Brand
- Exception Queue
- Projection Automation
- CasePack·Pattern
