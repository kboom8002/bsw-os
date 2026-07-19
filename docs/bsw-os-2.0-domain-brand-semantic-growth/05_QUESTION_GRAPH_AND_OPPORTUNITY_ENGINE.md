# Question Graph & Opportunity Engine

# 1. Signal Sources

- Search Console
- Site Search
- Customer Inquiry
- Review
- Community
- Social
- 상담·예약
- 기존 콘텐츠
- AI Answer Observation
- Manual Research

Signal은 관찰치이며 전체 수요를 대표한다고 간주하지 않는다.

# 2. Normalization

```text
Raw
→ Language
→ Spelling
→ Entity
→ Intent
→ Scene
→ Constraint
→ Duplicate
```

원문과 Provenance를 보존한다.

# 3. Cluster

기준:

- semantic similarity
- entity overlap
- intent
- customer situation
- desired outcome
- decision stage

Embedding 유사도만으로 자동병합하지 않는다.

# 4. Canonical Question

Template:

```text
[어떤 사람]이
[어떤 상황]에서
[어떤 제약]을 고려해
[어떤 판단·행동]을 하기 위해
무엇을 알아야 하는가?
```

# 5. Question Journey

Skincare:

```text
문제인지
→ 원인
→ 성분
→ 제품유형
→ 제품
→ 사용법
→ 이상반응 대응
```

제주:

```text
지역선택
→ 일정
→ 장소
→ 이동
→ 이용조건
→ 대안
```

# 6. Coverage

- NONE
- WEAK
- PARTIAL
- ADEQUATE
- STRONG
- STALE
- CONFLICTED

Coverage는 자산존재가 아니라 질문에 실제로 답하는 정도다.

# 7. Brand Fit

평가축:

- Relevance
- Authority
- Evidence
- Operational Fit
- Differentiation
- Commercial Fit
- Risk

결과:

- LOW
- CONDITIONAL
- HIGH

# 8. Answerability

평가축:

- SSoT completeness
- Evidence
- Concept boundary
- Freshness
- Rights
- Reviewer
- Channel

Hard Blocker는 점수로 상쇄하지 않는다.

# 9. Opportunity Score

초기 Weight는 실험값이며 정본이 아니다.

```yaml
demand: 0.18
strategic_fit: 0.14
coverage_gap: 0.14
brand_fit: 0.12
answerability: 0.12
evidence_readiness: 0.10
utility: 0.08
freshness: 0.05
channel_fit: 0.04
risk_adjustment: 0.03
```

# 10. Work Type Rules

```text
Coverage NONE + Answerability HIGH
→ New Asset

Coverage STRONG + Freshness Low
→ Refresh

Demand High + Evidence Low
→ Evidence Acquisition

Hub General Question
→ Domain Article

Brand-specific Fact
→ Brand Asset

Comparison + Neutral Evidence
→ Hub Comparison

High Risk
→ Specialist Review or Do Not Publish
```

# 11. Cannibalization

검사:

- 동일 Canonical Question
- 동일 Intent
- 동일 Audience
- 동일 Answer
- Hub·Brand Owner 충돌

해결:

- Hub Parent / Brand Child
- Merge
- Canonical
- Internal Link
- Different Scene
- Noindex
- Archive

# 12. Learning

Outcome으로 Weight를 즉시 자동변경하지 않는다.

```text
Observation
→ Association
→ Experiment
→ Calibration
→ Approved Policy Revision
```
