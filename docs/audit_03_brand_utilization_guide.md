# BSW-OS 업종별 브랜드 활용 가이드

> **대상 독자**: 업종별 브랜드 마케터, SEO/AEO/GEO 전략 담당자, 디지털 마케팅 책임자  
> **작성 기준**: BSW-OS 프로덕션 코드베이스 정밀 감사 기반  
> **작성일**: 2026-07-07

---

## 목차

1. [시작하기: BSW-OS 브랜드 운영 프레임워크](#1-시작하기-bsw-os-브랜드-운영-프레임워크)
2. [업종별 활용 시나리오](#2-업종별-활용-시나리오)
3. [월별 실행 로드맵](#3-월별-실행-로드맵)
4. [KPI 대시보드 활용법](#4-kpi-대시보드-활용법)
5. [위험 시나리오별 대응 프로토콜](#5-위험-시나리오별-대응-프로토콜)
6. [고급 활용: 경쟁 전략 수립](#6-고급-활용-경쟁-전략-수립)
7. [FAQ — 자주 묻는 질문](#7-faq--자주-묻는-질문)

---

## 1. 시작하기: BSW-OS 브랜드 운영 프레임워크

### 1.1 브랜드가 BSW-OS로 할 수 있는 것

BSW-OS는 **"AI가 우리 브랜드를 어떻게 말하고 있는가?"**라는 질문에 대한 체계적 답을 제공합니다.

| 단계 | 활동 | BSW-OS 모듈 | 산출물 |
|------|------|-------------|--------|
| **① 정의** | 브랜드가 AI에 전달하고 싶은 메시지 정의 | Truth Studio | SSoT (Strategic/Operational Truth) |
| **② 관측** | AI가 실제로 뭐라고 하는지 측정 | Observatory + Benchmark | AAS, OCR, BSF, M1-M15 실측값 |
| **③ 비교** | 업종 경쟁사 대비 포지셔닝 확인 | Benchmark + Industry Report | AIPR 순위, BDR×CWR Matrix |
| **④ 진단** | 정의 vs 관측 간 갭 식별 | FixIt + Gap Analyzer | Truth Delta, 4-Quadrant 갭 |
| **⑤ 최적화** | 갭 해소를 위한 콘텐츠/구조 개선 | Semantic Core + FixIt Patch | Answer Card, Schema, 어트랙터 |
| **⑥ 검증** | 개선 효과 재측정 | Retest + Temporal Tracker | 리프트 분석 (예: +12.4% ARS) |

### 1.2 첫 번째 주에 해야 할 5가지

```
Day 1   → Truth Studio에서 Strategic Truth (미션/비전/필라) 정의
Day 2   → Operational Claims 10개 이상 입력 + 증거 첨부
Day 3   → Boundary Rules (금지 클레임) 5개 이상 설정
Day 4   → Benchmark 첫 실행 (daily_light 모드)
Day 5   → D-MRI + B-MRI 점수 확인 → 갭 우선순위 결정
```

> [!TIP]
> **Truth Studio가 가장 먼저입니다.** AI가 올바르게 전달해야 할 브랜드 진실을 정의하지 않으면, 측정 결과의 해석이 불가능합니다. "기준 없는 측정은 의미 없는 숫자"입니다.

---

## 2. 업종별 활용 시나리오

### 2.1 🧴 스킨케어/뷰티 브랜드

**업종 특성**: YMYL(건강/의료), 성분 중심 질문 다수, 비교 리뷰 질문 높음, 인플루언서 영향 큼

**AEPI 가중치 프로필** (BSW-OS 프리셋: `skincare_cosmetics`):

| 차원 | 가중치 | 이유 |
|------|--------|------|
| factoid | 0.20 | 성분 효능/안전성 사실 정보 |
| procedural | 0.15 | 사용법, 루틴 질문 |
| comparative | 0.25 | "A 대 B 뭐가 좋아?" 비교 질문 매우 높음 |
| authority | 0.15 | 피부과 전문의 추천, 임상 시험 |
| schema_org | 0.10 | Product, Review 스키마 |
| topical_cluster | 0.10 | 피부 타입별 토픽 클러스터 |
| local_geo | 0.05 | 낮음 (온라인 D2C 중심) |

**활용 시나리오:**

#### 시나리오 A: "ChatGPT에서 '레티놀 크림 추천'하면 우리 제품이 안 나와요"

```
BSW-OS 대응 흐름:
1. Benchmark → L3_ingredient 레이어에서 AAS 확인
   → AAS = 12% (경쟁사 A: 45%, B: 38%)
2. Gap Analyzer → RED 사분면: 업종 콘텐츠 갭 발견
   → 처방: "create_content" (예상 AEPI +15.0)
3. Opportunity Analyzer → "gap" 유형, E-E-A-T 매핑: "Expertise"
   → 권고: "임상 시험 결과 기반 전문가 콘텐츠 작성 필요"
4. FixIt → 자동 패치:
   - answer_card_create: "레티놀 크림 선택 가이드" 시맨틱 페이지 생성
   - ssot_update: "레티놀 0.05% 함유, 피부과 테스트 완료" 클레임 추가
5. Retest → 7일 후 재측정: AAS 12% → 31% (+158% 상승)
```

#### 시나리오 B: "AI가 우리 제품에 대해 틀린 정보를 말해요"

```
BSW-OS 대응 흐름:
1. Truth Studio → Observed Claims에서 왜곡 발견
   - AI가 말하는 것: "XX크림은 스테로이드 함유" (거짓)
   - Operational Truth: "XX크림은 비스테로이드 성분만 사용"
2. Truth Delta → 자동 탐지: "스테로이드 함유" 왜곡
3. M4 (Concept Distortion) = 0.22 → Critical 이상
4. FixIt → 자동 RCA:
   - 가설 1: 경쟁사 비교 기사에서 스테로이드 키워드 연관 발생
   - 가설 2: 과거 제품 라인에 스테로이드 성분이 있었음
5. 자동 패치:
   - boundary_rule_add: "스테로이드 미함유" 명시적 경계 규칙
   - answer_card_update: 성분 정보 페이지에 "비스테로이드" 강조
6. Unsafe Wording Scanner → 보고서에서 "스테로이드" 관련 위험 문구 자동 제거
```

### 2.2 💒 웨딩 스튜디오/플래너

**업종 특성**: 지역 기반, 시즌성 높음, 비용/가격 질문 많음, 비교 질문 높음, 감성적 의사결정

**AEPI 가중치 프로필** (BSW-OS 프리셋: `wedding_studio`):

| 차원 | 가중치 | 이유 |
|------|--------|------|
| factoid | 0.10 | 비용, 패키지 정보 |
| procedural | 0.15 | 웨딩 준비 절차 |
| comparative | 0.20 | 스튜디오 비교 |
| authority | 0.10 | 리뷰, 수상 경력 |
| schema_org | 0.10 | LocalBusiness, Event 스키마 |
| topical_cluster | 0.15 | 시즌별/스타일별 클러스터 |
| local_geo | 0.20 | **높음** — 지역 검색 핵심 |

**활용 시나리오:**

#### 시나리오: "강남 웨딩 스튜디오 추천"에서 AI 노출 확보

```
BSW-OS 대응 흐름:
1. Benchmark → L1_universal: "강남 웨딩 스튜디오 추천"
   → AAS = 8%, IRI = 22% (업종 전체 브랜드 인지도 낮음)
2. 7-Layer 분석:
   - L4_practical: "웨딩 촬영 비용" → AAS 0% (완전 부재)
   - L6_trend: "2026 웨딩 트렌드" → OPP 85% (블루오션!)
3. Gap Analyzer:
   - WHITE 사분면 (블루오션): "2026 웨딩 트렌드" → opportunity_content
   - YELLOW 사분면: "강남 웨딩" 사이트에 있지만 AI 미반영 → add_schema
4. Pattern Attractor:
   - 도메인 표준 어트랙터: "지역+서비스 FAQ 패턴" 적용
   - Media Soliton: 지역별 FAQ 콘텐츠 멀티채널 생성
5. Golden Reference:
   - 업종 상위 스튜디오 25곳 역공학 → 섹션 순서 골든 스탠다드 도출
   - Hero 카피, 가격표 구조, 갤러리 배치 패턴 벤치마크
```

### 2.3 🏥 의료/클리닉

**업종 특성**: YMYL 최고 등급, 규제 엄격, 허위 광고 위험 높음, 전문가 권위 필수

**AEPI 가중치 프로필** (BSW-OS 프리셋: `ymyl_professional`):

| 차원 | 가중치 | 이유 |
|------|--------|------|
| factoid | 0.15 | 시술 정보, 비용 |
| procedural | 0.10 | 시술 절차 |
| comparative | 0.10 | 시술 비교 (YMYL 주의) |
| authority | **0.30** | **최고 가중치** — 의사 자격, 논문, 학회 활동 |
| schema_org | 0.15 | MedicalOrganization, Physician |
| topical_cluster | 0.10 | 진료 분야별 클러스터 |
| local_geo | 0.10 | 지역 클리닉 검색 |

**핵심 활용 포인트:**

> [!CAUTION]
> **의료 업종은 Boundary Rules가 생명입니다.** 의료법/약사법 위반 클레임이 AI 답변에 포함되면 법적 리스크가 발생합니다. Truth Studio에서 금지 클레임을 반드시 사전 정의하세요.

```
필수 Boundary Rules 예시:
- "100% 효과 보장" → 금지 (의료법 위반)
- "부작용 없음" → 금지 (허위 광고)
- "최저가 보장" → 금지 (비교 광고 제한)
- 특정 환자 후기 → 조건부 (동의서 필요)
```

**M6 (할루시네이션) 모니터링 특히 중요:**
- 임계값: M6 > 0.05 → 즉시 대응 (일반 업종은 0.10)
- AI가 없는 시술이나 검증되지 않은 효과를 말하는 경우 → FixIt 자동 RCA → boundary_rule_add

### 2.4 🏪 로컬 SMB (카페, 레스토랑, 미용실 등)

**업종 특성**: 지역 검색 절대적, 네이버 플레이스 의존, 가격 민감, 리뷰 중심

**AEPI 가중치 프로필** (BSW-OS 프리셋: `local_services`):

| 차원 | 가중치 | 이유 |
|------|--------|------|
| factoid | 0.10 | 메뉴, 가격, 영업시간 |
| procedural | 0.05 | 예약 방법 |
| comparative | 0.15 | "XX역 맛집 추천" 비교 |
| authority | 0.10 | 리뷰 수, 평점 |
| schema_org | 0.15 | LocalBusiness, Restaurant |
| topical_cluster | 0.10 | 메뉴별/상황별 클러스터 |
| local_geo | **0.35** | **최고 가중치** — 동네/역/구 기반 검색 |

**Sales Automation 연동 활용:**

BSW-OS의 Sales Automation 모듈은 로컬 SMB에 특히 강력합니다:

```
1. Portal Gap Aggregator:
   "XX동 브런치 카페" — 수요 있으나 커버리지 0%
   → UnderservedSegment 자동 식별

2. Gap-Product Mapper:
   → "비오는날 AI홈피 팩" 추천 (날씨 기반 콘텐츠)
   → "외국인 친화 페이지 팩" 추천 (다국어 지원)
   → "접근성 인증 팩" 추천 (장애인 접근성)

3. Outreach Message Generator:
   → 구체적 수요 데이터를 인용한 개인화 제안서 자동 생성
   → "XX동에서 '브런치 카페 추천' 검색이 월 850회인데,
      AI 답변에 귀사가 포함되지 않고 있습니다"
```

---

## 3. 월별 실행 로드맵

### Month 1: 기반 구축

| 주차 | 활동 | 모듈 | 목표 KPI |
|------|------|------|----------|
| W1 | Strategic Truth 정의 + Operational Claims 15개 | Truth Studio | D-MRI TruthReadiness > 0.6 |
| W2 | Boundary Rules 설정 + Evidence 첨부 | Truth Studio | D-MRI BoundaryReadiness > 0.5 |
| W3 | 첫 Benchmark 실행 (daily_light) | Benchmark | AAS/OCR/BSF 기준선 확보 |
| W4 | Gap Analyzer 실행 + 우선순위 결정 | Deep Dive | RED/WHITE 사분면 식별 |

### Month 2: 시맨틱 자산 구축

| 주차 | 활동 | 모듈 | 목표 KPI |
|------|------|------|----------|
| W5 | Canonical Questions 20개 프로모션 | Semantic Core | D-MRI QuestionSystem > 0.4 |
| W6 | QIS Scene 10개 생성 | Semantic Core | Scene 커버리지 > 50% |
| W7 | Pattern Attractor 5개 설정 | Semantic Core | D-MRI ConceptKg > 0.5 |
| W8 | TCO Concepts 10개 정의 | Semantic Core | 토픽 클러스터 기반 확보 |

### Month 3: 최적화 & 경쟁

| 주차 | 활동 | 모듈 | 목표 KPI |
|------|------|------|----------|
| W9 | FixIt RCA 실행 + 자동 패치 배포 | FixIt | M4 < 0.15, M6 < 0.10 |
| W10 | 경쟁사 비교 분석 (BDR×CWR Matrix) | Industry Report | 전략 사분면 확인 |
| W11 | Golden Reference 역공학 (상위 5곳) | Golden Reference | 콘텐츠 품질 벤치마크 |
| W12 | 월간 보고서 발행 (Safety Gate 통과) | Reports | AITI > 70 |

### Month 4+: 성장 & 자동화

| 활동 | 모듈 | 목표 KPI |
|------|------|----------|
| 주간 Benchmark 자동화 (Cron 2AM) | Benchmark | 시계열 추세 확보 |
| Playbook Rules 설정 → 자동 RCA 트리거 | FixIt | 대응 시간 < 24시간 |
| QIS 3-Axis Hub 동기화 | Semantic Core | 실시간 트렌드 반영 |
| 분기 Industry Report 발행 | Reports | KAIVI 추세 상승 |

---

## 4. KPI 대시보드 활용법

### 4.1 경영진용 — "30초 대시보드"

| 지표 | 의미 | 목표 | 위험 기준 |
|------|------|------|-----------|
| **KAIVI** | 한국 AI 가시성 종합 점수 | > 65 | < 40 |
| **AIPR 순위** | 업종 내 AI 파워 랭킹 | Top 5 | > 10위 |
| **B-MRI** | 브랜드 시장 준비도 | > 60 | < 35 |

### 4.2 마케팅 팀용 — "주간 점검"

| 지표 | 의미 | 주간 점검 포인트 |
|------|------|-----------------|
| **AAS** | AI 답변 점유율 | 지난주 대비 변화율 확인 |
| **OCR** | 인용률 | 새 콘텐츠 발행 후 OCR 증가 여부 |
| **BSF** | 메시지 정확도 | 핵심 키워드 must_include 매칭률 |
| **CWR** | 경쟁 승률 | L2 질문에서 경쟁사 대비 순위 |
| **Freshness** | 콘텐츠 최신성 | stale 비율 증가 시 콘텐츠 업데이트 |

### 4.3 SEO 실무자용 — "일일 모니터링"

| 지표 | 임계값 | 자동 알림 |
|------|--------|-----------|
| **M4** (Concept Distortion) | > 0.15 | 🔴 Critical: 즉시 FixIt RCA |
| **M6** (Hallucination) | > 0.10 | 🔴 Critical: 즉시 Boundary Rule |
| **M9** (Floor Risk) | > 0.30 | 🟡 Warning: SSoT 보강 |
| **AAS 급락** (>15% 감소) | — | 🔴 Major: 원인 조사 |
| **BDR 급락** (>10% 감소) | — | 🟡 Minor: 브랜드 방어 검토 |

---

## 5. 위험 시나리오별 대응 프로토콜

### 5.1 🔴 할루시네이션 위기

**증상**: AI가 브랜드에 대해 사실이 아닌 정보를 생성
**탐지**: M6 > 0.10

```
대응 프로토콜:
Step 1: Truth Studio → Observed Claims 확인 → 허위 클레임 식별
Step 2: Boundary Rules → 해당 허위 정보 명시적 금지 추가
Step 3: FixIt → answer_card_create: 올바른 정보 포함 시맨틱 페이지 생성
Step 4: FixIt → ssot_update: Operational Truth에 정확한 정보 강화
Step 5: 24시간 후 Retest → M6 변화 확인
Step 6: 개선 미확인 시 → 직접 AI 피드백 제출 (Google/OpenAI)
```

### 5.2 🟡 경쟁사 추월 위기

**증상**: CWR이 지속적으로 하락, 경쟁사 AAS 급등
**탐지**: CWR < 40% OR AAS 주간 하락 > 10%

```
대응 프로토콜:
Step 1: Industry Report → BDR×CWR Matrix 확인 → 현재 사분면 진단
Step 2: Opportunity Analyzer → "gap" 유형 기회 식별
Step 3: Semantic Core → 경쟁 비교 질문(L2) 대상 QIS Scene 우선 생성
Step 4: Pattern Attractor → 비교 우위 패턴 설정
Step 5: Golden Reference → 선두 경쟁사 역공학 → 콘텐츠 구조 벤치마크
Step 6: 14일 후 Retest → CWR 변화 확인
```

### 5.3 🟠 콘텐츠 노후화

**증상**: Freshness Score 지속 하락
**탐지**: Freshness < 50

```
대응 프로토콜:
Step 1: Freshness Analyzer → stale/dated 응답 식별
Step 2: Temporal Tracker → 어떤 질문에서 최신성이 떨어지는지 확인
Step 3: Semantic Core → 해당 질문의 Answer Card 업데이트
Step 4: Truth Studio → Operational Claims에 최신 데이터/날짜 포함
Step 5: 7일 후 Retest → Freshness 변화 확인
```

### 5.4 🔵 블루오션 발견

**증상**: OPP Score 높은 영역 발견 (어떤 브랜드도 AI 답변에 없음)
**탐지**: OPP > 70% in specific L6_trend questions

```
활용 프로토콜:
Step 1: Gap Analyzer → WHITE 사분면 기회 확인
Step 2: QIS Scene → 해당 트렌드 질문에 대한 답변 정책 사전 정의
Step 3: Pattern Attractor → "첫 진입자" 패턴 생성
Step 4: Content Generator → Media Soliton으로 멀티채널 콘텐츠
Step 5: 7일 후 Benchmark → AAS 확보 → 선점 효과 측정
```

> [!TIP]
> **블루오션 질문(WHITE 사분면)은 가장 높은 ROI**를 제공합니다. 경쟁 없이 AI 답변을 선점할 수 있으며, QVS × AEPI Matrix에서 "Threat → Core" 전환이 가장 빠릅니다.

---

## 6. 고급 활용: 경쟁 전략 수립

### 6.1 4-Quadrant Competitive Position에 따른 전략

```
                  높은 CWR (경쟁 승률)
                       │
   ┌──────────────────┼──────────────────┐
   │ Competitive      │ AI Leader        │
   │ Warrior          │                  │
   │                  │ ⭐ OPP 선점 +    │
   │ 🔴 긴급:        │ 지배력 유지      │
   │ BDR 강화 필요    │                  │
   │                  │                  │
───┼──────────────────┼──────────────────┼── 높은 BDR
   │ Vulnerable       │ Steady           │   (브랜드 방어)
   │                  │ Defender         │
   │ ⚫ 치명적:       │                  │
   │ AI 가시성        │ 🟡 중요:         │
   │ 기반 구축        │ L2 비교 공략     │
   │                  │                  │
   └──────────────────┼──────────────────┘
                       │
                  낮은 CWR
```

### 6.2 포지션별 실행 전략

| 포지션 | 1순위 액션 | 2순위 액션 | 3순위 액션 | 타임라인 |
|--------|-----------|-----------|-----------|----------|
| **AI Leader** | OPP 블루오션 선점 | Factory Reuse (성공 패턴 재활용) | 월간 KAIVI 추세 모니터 | 월 1회 |
| **Competitive Warrior** | Truth Studio SSoT 전면 보강 | BDR 강화 (L7 브랜드 방어) | FixIt 자동 패치 활성화 | 주 1회 |
| **Steady Defender** | L2 비교 질문 QIS Scene 집중 | Pattern Attractor 비교 우위 패턴 | Golden Reference 역공학 | 격주 |
| **Vulnerable** | 기본 Truth 정의 + Benchmark 시작 | Schema markup 전면 적용 | 업종 도메인 팩 로드 | 매일 |

### 6.3 E-E-A-T 차원별 최적화 체크리스트

BSW-OS의 Opportunity Analyzer가 각 갭을 E-E-A-T 차원에 매핑합니다:

| E-E-A-T 차원 | 최적화 액션 | BSW-OS 모듈 |
|--------------|------------|-------------|
| **Experience** | 실제 사용기/체험기 기반 Answer Card | Semantic Core → answer_card_create |
| **Expertise** | 전문가 자격/논문/특허 기반 클레임 | Truth Studio → Evidence + Operational Claims |
| **Authority** | 수상경력, 미디어 인용, 공식 인증 | Truth Studio + Schema (Organization) |
| **Trust** | 리뷰 관리, 투명한 가격, 환불 정책 | Boundary Rules + Schema (Review) |

---

## 7. FAQ — 자주 묻는 질문

### Q1: "Benchmark를 얼마나 자주 실행해야 하나요?"

**권장 주기:**
- `daily_light` — 매일 새벽 2시 자동 실행 (Cron), 핵심 메트릭 추적
- `weekly_full` — 주 1회 종합 측정, 7-Layer 전체 스캔
- 중요 콘텐츠 변경 후 → 48시간 후 수동 Retest

**비용:** daily_light ≈ $0.15-0.30/일, weekly_full ≈ $1-3/회

### Q2: "AAS가 0%인데 어디서 시작하나요?"

```
1. Truth Studio에서 브랜드 SSoT 완성 (D-MRI TruthReadiness > 0.7)
2. Schema markup 적용 (Organization, Product, FAQ)
3. Answer-First 콘텐츠 3개 이상 작성 (QIS Scene 기반)
4. 2주 후 첫 Benchmark → AAS 기준선 확보
5. FixIt → Gap Analyzer → RED 사분면 우선 처리
```

### Q3: "경쟁사 분석은 어떻게 하나요?"

BSW-OS는 **동일 파이프라인으로 경쟁사를 측정**합니다:
- Benchmark에서 대상 브랜드 + 경쟁사 모두 AAS/OCR/BSF 산출
- AIPR이 경쟁사 포함 순위 매김
- BDR×CWR Matrix가 4사분면 포지셔닝 제시
- 별도의 경쟁사 도구 불필요

### Q4: "보고서를 외부에 공유해도 되나요?"

BSW-OS는 **Safety Release Gate**를 내장하고 있습니다:
1. Unsafe Wording Scanner 통과 ✅
2. Methodology Appendix 첨부 ✅
3. Proxy Caveat 면책 조항 포함 ✅
4. Manual Review 승인 ✅

> 4개 게이트를 모두 통과해야 외부 공유/내보내기가 활성화됩니다.

### Q5: "AI 답변이 바뀌어서 지표가 들쑥날쑥해요"

이것은 **정상입니다.** AI 답변은 본질적으로 비결정적(non-deterministic)입니다.

BSW-OS의 대응:
- **M7 (Attractor Stability)**: 답변 안정성 추적 (0.40×recallConsistency + ...)
- **M11 (Consensus Score)**: 실행 간 Jaccard 유사도로 일관성 측정
- **Confidence/Volatility Penalties**: B-MRI에서 변동성 자동 감산
- **멀티엔진 수렴 검증**: 4개 엔진 교차 검증으로 단일 엔진 편향 제거

> [!NOTE]
> **변동성이 높은 질문**은 Opportunity Analyzer에서 "volatile" 유형으로 자동 분류되며, 해당 질문의 콘텐츠 강화가 변동성 감소의 가장 효과적인 방법입니다.

### Q6: "D-MRI와 B-MRI 차이가 뭔가요?"

| | D-MRI | B-MRI |
|---|-------|-------|
| **측정 대상** | 내부 디지털 자산 준비도 | 외부 AI 검색 가시성 |
| **데이터 소스** | 12개 내부 DB 테이블 | AI 프로브 실측 결과 |
| **관점** | "우리가 준비됐나?" | "AI가 우리를 보고 있나?" |
| **이상적 상태** | D-MRI ≈ B-MRI (내외부 일치) | — |
| **갭 의미** | D-MRI >> B-MRI: 준비는 됐는데 AI가 모름 | D-MRI << B-MRI: AI가 보는데 우리가 준비 안 됨 |

### Q7: "네이버도 추적하나요?"

현재 BSW-OS는 **생성형 AI 검색 엔진** (ChatGPT, Gemini, Perplexity, Claude)에 집중합니다. 네이버의 경우:
- **네이버 News API**: 뉴스 트렌드 시그널 수집 (S-OGDE 파이프라인)
- **네이버 DataLab API**: 검색량 트렌드 14일 실시간 반영
- 네이버 AI (CUE:) 직접 프로빙은 향후 로드맵

---

> [!IMPORTANT]
> **이 가이드의 모든 수치, 수식, 임계값은 BSW-OS 프로덕션 코드에서 직접 추출**되었습니다. 코드 변경 시 본 가이드의 해당 항목도 업데이트가 필요합니다.
