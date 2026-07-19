# BSW-OS Answer Supply Edition — Product Requirements Document

> 문서 ID: BSW-AS-PRD-001  
> 버전: 1.0.0  
> 상태: Implementation Baseline  
> 제품명: BSW-OS Answer Supply Edition  
> 시장명 후보: Problem-to-Answer OS / AI Answer Supply Platform  
> 최초 Vertical: Jeju Local Commerce, Skincare  
> 상위 방법론: Problem-centered AI System  
> 연계 시스템: Open TCO Seed Factory, TCO Forge, TCO-CAP, CasePack, ESDC

---

# 0. 문서 목적

본 문서는 BSW-OS를 기존의 Signal–QIS–PatternAttractor–Media Soliton 중심 콘텐츠 운영체계에서 다음과 같은 **질문 발견·답변 공급·검색 발행·성과학습 시스템**으로 고도화하기 위한 제품 요구사항을 정의한다.

> 고객이 Google·Naver·ChatGPT·Gemini·Perplexity·브랜드 AI Guide에 묻는 문제를 발견하고, 브랜드와 허브가 답할 자격과 근거를 검증하며, 검색·AI가 발견하고 인용할 수 있는 Answer Asset으로 제작·배포하고, 실제 노출·행동 결과를 다음 질문과 답변 개선에 반영한다.

---

# 1. 제품 배경

## 1.1 시장 변화

검색 사용자는 키워드 목록에서 복합적인 상황질문으로 이동하고 있다.

```text
기존:
제주 산방산 카페

변화:
부모님과 산방산을 보러 가는데 주차가 편하고,
바다 전망이 있으며 점심도 먹을 수 있는 곳은?
```

```text
기존:
민감성 피부 마스크팩

변화:
레이저 시술 후 열감과 붉은기가 남아 있는데
어떤 종류의 팩을 언제부터 사용해도 되는가?
```

AI 검색은 원 질문을 관련 하위질문으로 확장하고 여러 출처에서 답을 조합한다. 따라서 단순 키워드 페이지나 범용 FAQ보다 다음이 중요하다.

- 실제 Problem Scene
- 명확한 Concept Boundary
- 최신이고 검증된 사실
- 답변자의 Right-to-Answer
- 적용조건·예외·주의
- 고유한 1차 정보와 경험
- 검색 가능한 정본 URL
- 구조화된 Entity·Product·Place 데이터
- 외부 근거와 내부 근거의 연결
- 노출·인용·행동 결과 학습

---

## 1.2 기존 BSW-OS의 강점

기존 BSW-OS는 다음 핵심자산을 보유한다.

```text
Signal Collector
→ Canonical Question
→ QIS Scene
→ TCO
→ PatternAttractorSpec
→ AttractorFit
→ Media Soliton
→ PreservationChecker
→ RunReceipt
→ GapAnalyzer
→ Recomposition
```

이 구조는 Answer Supply System의 기반으로 유지한다.

---

## 1.3 기존 시스템의 부족한 부분

검색·AI 대응 시스템으로 발전하려면 다음이 부족하다.

1. 질문 수집원이 검색·고객·AI Engine별로 통합되지 않음
2. 질문을 Problem Scene과 Journey로 구조화하지 않음
3. 질문별 수요·사업가치·답변자격·근거준비도를 분리 평가하지 않음
4. 허브와 입점 브랜드 중 누가 답해야 하는지 Routing하지 않음
5. QIS가 Public Answer Page의 SEO·AEO·GEO 계약까지 포함하지 않음
6. Claim–Evidence–Policy가 발행 Gate로 충분히 연결되지 않음
7. Canonical URL·Sitemap·JSON-LD·hreflang 발행 자동화가 약함
8. 검색 노출·AI 인용·행동결과가 RunReceipt에 통합되지 않음
9. 질문 변형마다 Thin Page를 만들 위험을 통제하지 않음
10. 의료·화장품처럼 고위험 Vertical의 Claim Policy가 부족함

---

# 2. 제품 정의

## 2.1 핵심 정의

> BSW-OS Answer Supply Edition은 실제 고객질문을 발견하고 Canonical Question과 Problem Scene으로 정리하며, TCO·Evidence·Policy를 이용해 답변 가능성과 답변 주체를 판단하고, QIS와 PatternAttractorSpec을 검색 가능한 Answer Asset으로 컴파일하여 AI홈피·허브·상품·장소 페이지에 배포하고, 검색·AI 노출과 사용자 행동을 학습하는 운영체계다.

---

## 2.2 전체 폐루프

```text
Question Signal
→ Problem Scene
→ Canonical Question
→ Question Portfolio
→ Right-to-Answer
→ Evidence Readiness
→ AnswerAssetSpec
→ Quality & Policy Gate
→ Public Answer Surface
→ Crawl·Index·Mention·Citation
→ User Action·Outcome
→ RunReceipt·CasePack
→ Recomposition
```

---

# 3. 제품 목표와 비목표

## 3.1 목표

### G1. 실제 질문 발견

검색어·후기·상담·AI Guide·사이트 검색에서 문제질문을 수집한다.

### G2. Canonical Question Portfolio

질문의 단순 표현 변형을 하나의 Canonical Question에 묶는다.

### G3. Right-to-Answer

허브·브랜드·전문가·외부자료 중 가장 적절한 답변 주체를 선택한다.

### G4. Evidence-governed Answer

근거가 없는 Claim이나 최신성이 만료된 사실을 발행하지 않는다.

### G5. Search-ready Asset

검색 가능하고 인용 가능한 HTML·Metadata·Structured Data를 생성한다.

### G6. Multi-surface Reuse

한 개의 정본 Answer를 허브·AI홈피·Article·FAQ·AI Guide·SNS에 변환한다.

### G7. Vertical Governance

제주는 Place·Merchant Freshness, 스킨케어는 Claim·Safety를 별도 통제한다.

### G8. Outcome Learning

검색 노출뿐 아니라 적합한 방문·상담·예약·구매·오류감소를 학습한다.

### G9. Collective Intelligence

여러 소상공인이 공통 Domain Pack을 재사용하면서 Tenant별 고유 Evidence를 유지한다.

### G10. 공통 Core 재사용

제주와 스킨케어 Vertical에서 공통 코드 70% 이상을 목표로 한다.

---

## 3.2 비목표

- AI 검색 노출·순위를 보장하는 서비스
- 질문 변형별 무제한 자동 페이지 생성
- 근거가 없는 자동 의료 조언
- ChatGPT·Gemini 내부 결과 직접 통제
- Search Console을 대체하는 분석제품
- 범용 CMS 전체 대체
- 범용 온톨로지 편집기
- 완전한 TCO Forge·TCO-CAP 선행 구축
- AI Visibility Probe 결과를 절대적 시장점유율로 표현
- 허브가 모든 브랜드 질문을 독점하는 구조

---

# 4. 핵심 사용자

## 4.1 Platform Operator

- Vertical Pack과 Tenant를 운영한다.
- 질문 Portfolio와 발행 Queue를 관리한다.
- 품질·정책·성과를 확인한다.

## 4.2 Domain Editor

- 질문을 검토한다.
- Answer Asset을 수정한다.
- Evidence와 Claim을 확인한다.
- 발행·갱신·통합을 승인한다.

## 4.3 Merchant·Brand Owner

- 브랜드 사실과 사진을 등록한다.
- 질문에 대한 실제 답변을 확인한다.
- 운영시간·가격·정책을 갱신한다.

## 4.4 Expert Reviewer

- 고위험 질문·Claim을 검토한다.
- 답변 가능범위와 Consult First 조건을 승인한다.

## 4.5 Search·Content Operator

- Sitemap·Canonical·Structured Data 상태를 관리한다.
- Search Console·Naver·Analytics 성과를 본다.

## 4.6 End User

- 문제를 검색하고 직접답변을 얻는다.
- 비교·예약·상담·구매 등 다음 행동을 수행한다.

---

# 5. 핵심 제품 모듈

## M1. Problem Query Observatory

### 입력

- Google Search Console
- Naver Search Advisor
- 사이트 내부 검색
- AI Guide 대화
- FAQ·문의
- 후기·댓글
- 경쟁 페이지
- 공공·정책 자료
- 수동 Probe
- 운영자가 등록한 질문

### 출력

- QuestionSignal
- Emerging Term
- Scene Candidate
- Question Gap
- Freshness Change

---

## M2. Question Graph & Portfolio

### 기능

- 질문 정규화
- Paraphrase Clustering
- Canonical Question
- Problem Scene 연결
- Journey Stage
- Intent
- Risk
- Freshness
- Question–Tenant–Asset Graph

---

## M3. Opportunity Engine

질문 우선순위를 다음 축으로 평가한다.

```text
Demand
Business Relevance
Right-to-Answer
Evidence Readiness
Differentiation
Action Potential
Reuse Potential
Policy Risk
Duplication Risk
Freshness Risk
```

단일 Score 외에 Feature Breakdown을 보존한다.

---

## M4. Right-to-Answer Router

답변 주체:

- HUB
- TENANT_BRAND
- DOMAIN_EXPERT
- OFFICIAL_EXTERNAL_SOURCE
- JOINT_ANSWER
- NO_ANSWER

상태:

- ANSWER
- CONDITIONAL
- ASK_FOR_DATA
- EXTERNAL_SOURCE
- EXPERT_REVIEW
- REFUSE

---

## M5. Evidence & Claim Registry

### 객체

- TenantFact
- Claim
- Evidence
- Policy
- Validity
- Reviewer
- Source
- ImageEvidence
- OfficialExternalSource

---

## M6. AnswerAsset Factory

생성 유형:

- Direct Answer
- FAQ
- Answer Card
- Guide
- Comparison
- Checklist
- Article
- Entity Evidence Page
- Place Page
- Product Page
- Course Page
- Ingredient Page
- Safety Page

---

## M7. Public Answer Surface Compiler

### 발행 항목

- HTML
- Metadata
- Canonical
- hreflang
- Sitemap
- Breadcrumb
- Internal Links
- JSON-LD
- Image Metadata
- Author·Reviewer
- Updated Date
- Evidence References
- Expiry Metadata

---

## M8. Quality & Policy Gate

- Duplicate Question
- Thin Content
- Commodity Content
- Missing Evidence
- Claim Strength
- Policy Violation
- Stale Fact
- Structured Data mismatch
- Language mismatch
- Unsafe Advice
- Missing Disclosure
- Broken Internal Links

---

## M9. Visibility & Outcome Observatory

### 검색

- Impression
- Click
- CTR
- Query
- Landing Page
- Index Status

### AI

- Mention
- Citation
- Source URL
- Answer Accuracy
- Competitor Presence
- Engine·Language Variance

### 행동

- Guide Start
- Place View
- Product View
- Call
- Directions
- Reservation
- Consultation
- Purchase
- Return
- Helpful Vote

---

## M10. Recomposition

가능한 Action:

- Refresh
- Expand
- Merge
- Split
- Redirect
- Repurpose
- Add Evidence
- Change Right-to-Answer
- Expert Review
- Retire
- Noindex

---

# 6. 기존 BSW-OS 객체 확장

## 6.1 Canonical Question

기존 객체에 추가:

```yaml
problem_scene_id:
journey_stage:
right_to_answer:
required_evidence:
freshness_class:
canonical_asset_id:
question_variants:
```

## 6.2 QIS Scene → Answer Mission

추가:

```yaml
search_intent:
direct_answer_contract:
surface_contract:
structured_data_contract:
evidence_contract:
claim_strength:
expiry:
internal_link_contract:
```

## 6.3 PatternAttractorSpec

추가:

```yaml
asset_pattern:
citation_pattern:
decision_criteria:
failure_conditions:
content_uniqueness_requirement:
reuse_surfaces:
```

## 6.4 Media Soliton

보존축:

- Proposition
- Evidence
- Concept Boundary
- Policy
- Vibe
- CTA
- Disclosure
- Canonical URL Attribution

## 6.5 RunReceipt

추가:

```yaml
published_url:
canonical_url:
sitemap_status:
structured_data_status:
index_status:
search_metrics:
ai_visibility_observations:
behavior_events:
outcome_events:
```

---

# 7. 기능 요구사항

## FR-001 Question Signal Ingestion

- Source별 Connector를 제공한다.
- Raw Query와 Metadata를 보존한다.
- 개인정보가 포함된 대화는 Redaction 가능해야 한다.

## FR-002 Question Normalization

- 언어·오탈자·동의 표현을 정규화한다.
- 원 표현을 삭제하지 않는다.

## FR-003 Canonical Clustering

- 유사 질문을 Cluster한다.
- 자동 Merge가 아닌 Suggestion을 기본으로 한다.
- High-risk 질문은 사람 승인 후 병합한다.

## FR-004 Problem Scene

- Actor
- Situation
- Goal
- Constraint
- Time
- Place
- Journey Stage
- Risk

를 표현한다.

## FR-005 Question Portfolio

각 질문을 다음 상태로 관리한다.

```text
observed
candidate
canonicalized
evidence_gap
planned
drafted
review
published
refresh_due
merged
retired
```

## FR-006 Opportunity Scoring

- Feature별 원점수를 저장한다.
- Heuristic임을 표시한다.
- Vertical별 Profile을 사용한다.

## FR-007 Right-to-Answer

- 질문별 주체를 결정한다.
- Brand가 답할 수 없는 경우 Hub·Expert로 Routing한다.

## FR-008 Evidence Readiness

- required vs available Evidence를 비교한다.
- Evidence Gap이 있으면 발행을 차단하거나 조건부 처리한다.

## FR-009 Claim Registry

- Claim Type
- Allowed Strength
- Evidence
- Policy
- Validity
- Reviewer

를 저장한다.

## FR-010 AnswerAssetSpec

모든 발행 Asset은 명세에서 컴파일한다.

## FR-011 Direct Answer

페이지 상단에 질문과 직접답변을 명확히 표시한다.

## FR-012 Unique Value Gate

다음 중 최소 하나를 요구한다.

- Tenant 고유 사실
- 직접 경험
- 고유 사진·영상
- 전문가 판단
- 독자적 비교
- 최신 지역·상품 정보
- 구조화된 실제 사례

## FR-013 Thin Page Prevention

- 표현 변형만 다른 질문은 별도 페이지를 만들지 않는다.
- Canonical Asset에 FAQ 또는 Variant로 흡수한다.

## FR-014 Publisher

- SSR/SSG/ISR을 지원한다.
- Indexable HTML을 생성한다.
- Sitemap과 Canonical을 자동 반영한다.

## FR-015 Structured Data

- Vertical Pack별 Schema Template을 사용한다.
- 본문과 불일치하면 발행 차단한다.

## FR-016 Multilingual

- Language별 Canonical URL
- hreflang
- 번역 상태
- 동일 Claim·Evidence 보존

을 관리한다.

## FR-017 Freshness

- Fact·Claim·Asset에 Expiry를 부여한다.
- 만료 전 Review Queue를 생성한다.

## FR-018 Search Metrics

- Google·Naver Query와 Page 데이터를 수집한다.
- Sampling·API 제한을 Metadata로 기록한다.

## FR-019 AI Visibility Probe

- 고정 Probe Set
- Engine
- Locale
- Date
- Result
- Mention·Citation
- Accuracy Review

를 기록한다.

## FR-020 Outcome Events

Vertical별 행동 Event를 연결한다.

## FR-021 Recomposition

성과와 품질에 따라 자동 제안하고, 중요한 변경은 사람 승인 후 실행한다.

## FR-022 Audit

모든 생성·수정·발행·정책판정을 추적한다.

---

# 8. 비기능 요구사항

## NFR-001 검색 접근성

- Public Asset은 로그인 없이 접근
- robots/noindex 상태 명확화
- 주요 본문은 Client JS 없이도 제공

## NFR-002 성능

- Core Web Vitals 목표
- 정적 자산 우선
- 이미지 최적화
- JSON-LD 생성 비용 최소화

## NFR-003 재현성

발행 Asset은 다음 버전을 기록한다.

- Question
- QIS
- TCO
- Evidence
- Policy
- Prompt
- Model
- Template

## NFR-004 보안

- Tenant Row-level Security
- PII Redaction
- Secret Manager
- Audit Log
- Restricted Evidence

## NFR-005 정책 안전성

고위험 Vertical은 LLM 단독 승인 불가.

## NFR-006 장애내성

외부 Metrics API 장애가 페이지 발행 자체를 중단시키지 않는다.

## NFR-007 관측성

생성부터 Outcome까지 Trace 가능해야 한다.

---

# 9. 제품 KPI

## 9.1 Coverage

- Canonical Question Coverage
- Problem Scene Coverage
- Tenant Answer Coverage
- Evidence Coverage

## 9.2 Quality

- Duplicate Asset Rate
- Thin Asset Rate
- Evidence Grounding
- Policy Violation
- Stale Fact Rate
- Expert Correction Rate

## 9.3 Search

- Indexed Asset Rate
- Non-branded Impression
- Qualified Organic Visit
- Query-to-Asset Coverage

## 9.4 AI

- Mention Rate
- Citation Rate
- Answer Accuracy
- Correct Entity Association
- Engine Variance

## 9.5 Business

### 제주

- Place View
- Directions
- Call
- Reservation
- Matching Request

### Skincare

- Answer→Product
- Consultation
- Purchase
- Safety Escalation
- Repeat Visit

---

# 10. MVP 범위

## 공통

- Question Signal 수동·CSV Import
- Canonical Question
- Problem Scene
- Opportunity Score
- Right-to-Answer
- Evidence Registry
- AnswerAssetSpec
- Review Gate
- Answer Page Publisher
- Sitemap·Canonical·JSON-LD
- Basic Analytics
- RunReceipt

## 제주

- 8개 Scene Cluster
- 60개 Canonical Question
- 24개 우선 Answer
- 입점 브랜드 10곳
- Merchant Fact Pack
- Hub Guide 12개
- Merchant Answer 30개 이하
- Place Evidence Page 10개

## 스킨케어

- 기존 Q&A 재분류
- 20~25 Canonical Answer
- Pillar Guide 6개
- Product/Ingredient Evidence Page
- Claim Policy
- Safety Gate
- Expert Review Workflow

---

# 11. Release Plan

## R0.1 Question Portfolio

질문 수집·Cluster·Opportunity.

## R0.2 Evidence & Answer Spec

Fact·Claim·Evidence·Right-to-Answer.

## R0.3 Publisher

Answer Page·Article·Structured Data·Sitemap.

## R0.4 Vertical Governance

제주 Freshness, Skincare Claim·Safety.

## R0.5 Observability

Search·AI Probe·Outcome.

## R1.0 Learning Loop

Recomposition·CasePack·Pattern Update.

---

# 12. 성공 기준

1. 질문 표현 수가 아니라 Canonical Coverage가 증가한다.
2. 브랜드별 고유 Answer Asset이 만들어진다.
3. Thin Page·중복 Page가 통제된다.
4. 모든 중요한 Claim이 Evidence와 연결된다.
5. Google·Naver가 Public Asset을 수집·색인할 수 있다.
6. ChatGPT Search 접근을 위한 Crawler 정책을 관리한다.
7. 허브와 브랜드의 답변역할이 충돌하지 않는다.
8. 스킨케어 고위험 질문은 Safety Gate를 통과한다.
9. 검색·AI 노출과 행동 Event가 RunReceipt에 연결된다.
10. 결과에 따라 Refresh·Merge·Retire가 가능하다.

---

# 13. 최종 제품가치

> 검색량을 보고 글을 많이 만드는 도구가 아니라, 실제 고객문제를 발견하고 가장 적절한 주체가 근거 있는 정본답변을 공급하며, 그 답변이 검색·AI·고객행동에서 어떻게 작동했는지를 학습하는 Problem-to-Answer 운영체계.