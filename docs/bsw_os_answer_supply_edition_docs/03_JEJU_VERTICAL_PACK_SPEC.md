# Jeju Local Commerce Answer Supply Vertical Pack Specification

> 문서 ID: JEJU-VPACK-001  
> 버전: 1.0.0  
> 적용 대상: AIHompy Jeju AI Hub 및 입점 소상공인 AI홈피  
> Runtime: BSW-OS Answer Supply Edition  
> Pack Type: Domain + Theme + Tenant Extension

---

# 0. 목적

이 Pack은 제주 여행객·지역 이용자의 상황질문을 발견하고, 제주 AI Hub와 입점 소상공인이 역할을 나눠 정확하고 최신인 장소·상품·코스 답변을 공급하도록 한다.

---

# 1. Vertical Mission

> 제주 여행객이 동행자·날씨·이동수단·시간·지역·취향·접근성·혼잡조건에 맞는 장소와 지역 브랜드를 선택하도록 돕고, 입점 소상공인의 고유한 사실과 경험을 AI 검색이 발견·이해·인용할 수 있게 한다.

---

# 2. Primary Users

- 제주 여행객
- 가족·부모님 동반 여행객
- 아이 동반 여행객
- 커플·친구 여행객
- 혼자 여행객
- 이동·접근성 요구가 있는 여행객
- 해외 여행객
- 제주 소상공인
- 허브 운영자

---

# 3. Core Problem Scenes

## S1 동행자

- 부모님
- 영유아
- 어린이
- 반려동물
- 단체
- 커플
- 혼자
- 휠체어·보행 어려움

## S2 날씨

- 비
- 강풍
- 폭염
- 한파
- 흐림
- 일몰
- 미세먼지

## S3 이동수단

- 렌터카
- 택시
- 버스
- 도보
- 자전거
- 단체차량

## S4 시간

- 아침
- 브런치
- 점심
- 오후
- 일몰
- 저녁
- 늦은 도착
- 출국 전

## S5 지역

- 서귀포
- 산방산
- 중문
- 애월
- 제주시
- 동부
- 서부
- 남부

## S6 취향·목적

- 오션뷰
- 산방산뷰
- 조용함
- 사진
- 로컬 음식
- 디저트
- 체험
- 쇼핑
- 휴식
- 기념일

## S7 편의·접근성

- 주차
- 계단
- 경사
- 화장실
- 실내좌석
- 유아의자
- 반려동물
- 충전
- Wi-Fi
- 짐 보관

## S8 혼잡·예약

- 예약 필요
- 대기
- 혼잡시간
- 단체 가능
- 좌석 제한
- 재료 소진
- 휴무

---

# 4. Question Taxonomy

## Q1 Discovery

어디가 있는가?

## Q2 Fit

내 상황에 적합한가?

## Q3 Comparison

A와 B 중 어디가 적합한가?

## Q4 Logistics

시간·교통·주차·예약은?

## Q5 Trust

실제로 전망·메뉴·편의가 있는가?

## Q6 Course

다른 장소와 어떻게 묶을까?

## Q7 Purchase

무엇을 사거나 예약할 수 있는가?

## Q8 Exception

어떤 상황에는 추천하지 않는가?

---

# 5. Right-to-Answer Rules

## Hub가 답하는 질문

- 지역 전체 비교
- 복수 업체 추천기준
- 코스
- 이동·지역 정보
- 중립적 선택기준
- 공공정보
- 브랜드가 답할 수 없는 비교

## Tenant가 답하는 질문

- 실제 메뉴·가격
- 주차·예약
- 좌석·공간
- 고유 전망
- 반려동물·아이 정책
- 실제 사진
- 상품·체험
- 방문 제한조건

## Joint Answer

- 특정 Scene에 적합한 업체 추천
- Hub 기준 + Tenant Evidence
- Course + Merchant Page

## Official External Source

- 기상특보
- 버스 운영
- 도로 통제
- 관광지 공식 휴무
- 법적·안전 정보

---

# 6. Merchant Fact Pack

## 6.1 Identity

```yaml
business_name:
official_name:
category:
subcategories:
address:
geo:
phone:
reservation_channels:
official_urls:
```

## 6.2 Operations

```yaml
opening_hours:
break_time:
last_order:
regular_closed_days:
seasonal_changes:
reservation_policy:
waiting_policy:
group_policy:
valid_until:
```

## 6.3 Space & Accessibility

```yaml
parking:
parking_capacity:
entrance_steps:
ramp:
elevator:
wheelchair_route:
accessible_toilet:
stroller:
indoor_seating:
outdoor_seating:
weather_suitability:
```

## 6.4 Food·Product·Service

```yaml
signature_items:
menu_range:
price_range:
dietary_options:
allergen_information:
takeout:
delivery:
shipping:
experience_duration:
```

## 6.5 Scene Fit

각 Scene에 대해:

```yaml
scene_id:
fit:
conditions:
evidence_ids:
exclusions:
reviewed_at:
```

## 6.6 Visual Evidence

- Exterior
- Entrance
- Parking
- Route
- View
- Seating
- Restroom
- Menu
- Product
- Weather variant

사진마다 촬영일과 실제사진 여부를 저장한다.

---

# 7. Place & Merchant Claim Types

- VERIFIED_FACT
- OPERATIONAL_FACT
- OBSERVED_FEATURE
- OWNER_STATEMENT
- USER_EXPERIENCE
- HUB_INTERPRETATION
- TEMPORARY_STATUS
- EXTERNAL_OFFICIAL_FACT

## 표현 강도

- DIRECT
- CONDITIONED
- EXPERIENCE_BASED
- UNVERIFIED
- PROHIBITED

예:

```text
금지:
제주 최고의 카페

허용 가능:
산방산과 바다를 함께 볼 수 있는 야외좌석을 운영한다.
단, 시야는 날씨와 좌석 위치에 따라 달라질 수 있다.
```

---

# 8. Freshness Classes

## F0 실시간

- 기상
- 통제
- 당일 휴무
- 재료 소진

TTL: 수 시간~1일

## F1 운영

- 영업시간
- 가격
- 메뉴
- 예약

TTL: 30일 또는 사업자 확인주기

## F2 시설

- 주차
- 계단
- 좌석
- 접근성

TTL: 90일 또는 변경 시

## F3 정체성

- Story
- 설립
- 생산방식

TTL: 1년

만료된 핵심 운영 Fact는 페이지 경고 또는 발행제한을 적용한다.

---

# 9. Answer Asset Types

## A1 Hub Decision Guide

예:

- 비 오는 날 부모님과 갈 곳을 고르는 기준
- 산방산 주변 오션뷰 장소 선택법

## A2 Scene Landing

- 부모님 동반
- 비 오는 날
- 아이 동반
- 일몰

## A3 Merchant Problem-fit Answer

- 부모님과 방문하기 편한가?
- 비 오는 날에도 전망을 즐길 수 있는가?

## A4 Place Evidence Page

사실·사진·운영정보 중심.

## A5 Comparison

Hub가 비교기준을 정의하고 조건별 차이를 설명한다.

## A6 Course

시간·이동·체류시간·예약조건.

## A7 Local Product Answer

선물·배송·원산지·생산자.

## A8 Photo Docent

사진이 실제로 무엇을 증명하는지 설명한다.

---

# 10. Canonical Asset Strategy

## Hub

```text
/ko/ai-hub/jeju/answers/{slug}
/ko/ai-hub/jeju/scenes/{slug}
/ko/ai-hub/jeju/courses/{slug}
/ko/ai-hub/jeju/places/{slug}
```

## Merchant

```text
/ko/brands/{merchant}/answers/{slug}
/ko/brands/{merchant}/menu
/ko/brands/{merchant}/visit
```

질문 변형은 같은 Answer Page의 `relatedQuestions`로 연결한다.

---

# 11. Structured Data Templates

## Merchant

가장 구체적인 LocalBusiness subtype.

필드 후보:

- name
- image
- address
- geo
- telephone
- url
- openingHoursSpecification
- priceRange
- menu
- servesCuisine
- sameAs

## Place Guide

- Article
- BreadcrumbList
- ItemList

## Course

- Article
- ItemList
- TouristDestination/Place references

구조화 데이터는 본문 Fact와 일치해야 한다.

---

# 12. Internal Link Rules

1. Scene Guide → Merchant Answer
2. Merchant Answer → Merchant Fact Page
3. Merchant Page → Related Hub Guide
4. Course → Place/Merchant nodes
5. Comparison → evidence-rich pages
6. Expired Merchant는 추천목록에서 자동 제외

---

# 13. Opportunity Profile

```text
Demand                 15
Travel Fit             15
Tenant Coverage        10
Evidence Readiness     15
Differentiation        15
Action Potential       15
Seasonal Relevance     5
Reuse Potential        10

Freshness Risk        -10
Duplication Risk      -10
Insufficient Facts    -15
```

초기 Heuristic이며 Outcome으로 보정한다.

---

# 14. Quality Gates

## Mandatory

- Address·Geo
- Current operation status
- At least one unique Evidence
- Answer applicability
- Exclusions
- Last verified date
- No unsupported superlative
- No false accessibility assumption
- Real/AI image disclosure

## Hub Recommendation Gate

추천에는:

- Selection criteria
- Evidence
- Eligible tenant set
- Exclusion conditions

이 있어야 한다.

---

# 15. Outcome Events

```text
hub_answer_view
merchant_answer_view
place_evidence_view
directions_click
call_click
reservation_click
course_save
matching_request
merchant_verified_update
helpful_vote
```

Qualified Outcome:

- 적합한 업체 이동
- 예약
- 길찾기
- 실제 문의품질
- 정보오류 감소

---

# 16. Initial Content Program

## 16.1 Canonical Question 60개

8 Scene Cluster별 6~10개.

## 16.2 우선 Asset 24개

- Hub Decision Guide 8
- Scene Landing 8
- Comparison/Course 8

## 16.3 Merchant 10곳

업체당 최대 3개 우선 Problem-fit Answer.

## 16.4 Place Evidence 10개

운영·사진·접근성·주차 중심.

---

# 17. Merchant Onboarding Workflow

```text
Form
→ Fact Draft
→ Evidence Upload
→ Operator Verification
→ Scene Fit
→ Question Matching
→ Answer Draft
→ Merchant Approval
→ Publish
→ Freshness Reminder
```

---

# 18. 제주 Pack의 금지사항

- 단순 지역명·질문 변형별 대량 페이지
- 확인하지 않은 주차·접근성
- 사용후기 한 건을 일반적 사실로 표현
- 날씨와 무관한 절대 전망보장
- AI 이미지의 실제장소 오인
- “최고”, “무조건”, “절대 붐비지 않음”
- Hub 운영사의 이해관계를 숨긴 추천

---

# 19. MVP Acceptance Criteria

1. 8개 Scene을 표현한다.
2. 60개 Canonical Question을 등록한다.
3. 10개 Merchant Fact Pack이 검증된다.
4. Hub·Merchant Right-to-Answer가 동작한다.
5. 24개 Hub Asset과 Merchant Answer가 발행된다.
6. LocalBusiness JSON-LD가 검증된다.
7. 운영 Fact 만료 Queue가 동작한다.
8. 한국어 Canonical과 Locale URL이 일관된다.
9. 길찾기·예약·문의 Event가 기록된다.
10. 잘못된 추천을 수정하고 Receipt로 추적할 수 있다.