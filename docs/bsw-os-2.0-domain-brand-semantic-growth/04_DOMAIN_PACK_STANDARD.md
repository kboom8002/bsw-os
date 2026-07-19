# BSW-OS 2.0 Domain Pack Standard

> Pack = Versioned Manifest + Knowledge Bundle + Strategy Bundle + Runtime Adapter + Validation Bundle

# 1. Manifest

```yaml
pack_id: dmn.jeju.local-business
version: 2.0.0-seed
maturity: SEED
deployment_status: SHADOW
supported_locales: [ko-KR, en-US, ja-JP, zh-CN]
risk_ceiling: R3
```

# 2. Bundle

- Domain Identity
- TCO·Entity
- Question Taxonomy·Journey
- Evidence Policy
- Strategy·Opportunity Rule
- Asset Profiles·Renderer
- Risk·Human Gate
- Outcome·Refresh
- Agent Mission·Fixture

# 3. Lifecycle

```text
DRAFT
→ SHADOW
→ CANDIDATE
→ ACTIVE
→ DEPRECATED
→ WITHDRAWN
```

Maturity:

```text
SEED
→ OPERATIONAL
→ VALIDATED
→ OUTCOME_CALIBRATED
→ AGENT_READY
```

# 4. Validation

- V0 Manifest
- V1 Schema
- V2 TCO
- V3 Question
- V4 Evidence
- V5 Strategy
- V6 Security
- V7 Fixture
- V8 Human Pilot
- V9 Outcome
- V10 Agent

# 5. Fixtures

Profile당 최소:

- Golden 5
- Failure 3
- Boundary 3
- Adversarial 2
- Freshness 2
- Cannibalization 2

# 6. Upgrade

- Project는 Pack Version을 Pin한다.
- Upgrade 자동적용 금지.
- Released Asset 불변.
- Migration·Rollback·Revalidation 필수.

# 7. 제주 Pack 특화

핵심 Entity:

- Place·Merchant·Category
- Location·Attraction·Route
- Experience·Menu·Product
- View·Access·Parking
- Reservation·Hours
- Companion·Weather·Season
- Accessibility·Language

Freshness Critical:

- 영업시간
- 가격
- 예약
- 휴무
- 도로
- 날씨
- 행사

Critical Risk:

- 접근성 과장
- 실시간성 단정
- 현지생산 허위
- 경관 보장
- 안전·기상

# 8. Skincare Pack 특화

핵심 Entity:

- Skin Concern
- Skin Type
- Condition
- Ingredient
- Function
- Product Category
- Product
- Routine
- Evidence
- Safety
- Regulatory Claim

Critical Risk:

- 치료·완치
- 진단
- Ingredient→Product 효능 비약
- 임신·알레르기 안전 단정
- Review 일반화
- 경쟁비방

Specialist Gate:

- Dermatology
- Regulatory
- Toxicology
- Clinical Evidence
