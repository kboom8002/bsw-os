# BSW-OS 브랜드 종합 활용 가이드 — Part 3: QIS/QVS & 콘텐츠 전략

> **문서 버전:** v3.0 | **최종 갱신:** 2026-06-26
> **대상 독자:** BSW-OS를 활용하는 브랜드 운영자, 컨설턴트, 개발자
> **관련 문서:** [Part 1: 시스템 아키텍처](BSW_OS_BRAND_GUIDE_PART1_SYSTEM_OVERVIEW.md) · [Part 2: 벤치마크 & 역설계](BSW_OS_BRAND_GUIDE_PART2_BENCHMARK_REVERSE_ENGINEERING.md)

---

## 1. QIS (Query Intelligence System) 개요

### 1.1 QIS란 무엇인가

> **"AI가 답변할 질문을 예측하고, 그 질문의 비즈니스 가치를 정량화하여, 가장 가치 있는 질문을 먼저 선점한다"**

QIS는 Hub 플랫폼(AIHOMPYHUB, KWeddingHub 등)에서 수집된 **실시간 시그널**을 분석하여 **떠오를 질문을 예측**하고, 해당 질문의 **비즈니스 가치(QVS)**를 산출하는 시스템입니다.

### 1.2 QIS 핵심 흐름

```
[Hub 플랫폼]
  ├─ 커뮤니티 Q&A
  ├─ 검증 후기
  ├─ 가격 제보
  ├─ 스트레스 패턴
  └─ 계약/시세 데이터
       ↓
[1] Signal Ingest (22종 시그널 수신)
       ↓
[2] Tri-Axis Router (3축 분류)
  ├─ Industry축 (업종별)
  ├─ Place축 (지역별)
  └─ Vortex축 (테마별)
       ↓
[3] Question Predictor (질문 예측)
       ↓
[4] QVS Calculator (가치 산출)
       ↓
[5] QIS Cross Mapper (벤치마크 교차 매핑)
       ↓
[6] Content Strategy → Brand Action
```

---

## 2. QIS 시그널 시스템

### 2.1 22종 시그널 유형

QIS는 Hub 플랫폼에서 22종의 시그널을 수신합니다:

| 카테고리 | 시그널 | 설명 |
|---------|--------|------|
| **커뮤니티** | `community_question` | 카페 아고라 Q&A |
| **후기** | `verified_review` | 검증된 안심 후기 |
| **가격** | `price_report` | 실거래가 제보 |
| | `deal_room_contract` | Deal Room 계약 조건 |
| | `deal_room_price` | Deal Room 시세 데이터 |
| **감정** | `stress_pattern` | 스트레스 데이터 패턴 |
| | `sentiment_pattern` | 감정 패턴 |
| **트렌드** | `style_dna_trend` | Style DNA 트렌드 |
| | `trend_signal` | 일반 트렌드 시그널 |
| | `cross_axis_trend` | 3축 교차 트렌드 |
| **의도** | `event_intent` | 파티 플래너 의도 |
| | `intent_signal` | 일반 의도 시그널 |
| **라이프사이클** | `newlywed_lifecycle` | 신혼 라이프 데이터 |
| | `lifecycle_event` | 라이프사이클 이벤트 |
| **엔티티** | `entity_created` | 엔티티 생성 |
| | `entity_reviewed` | 엔티티 리뷰 |
| | `comparison_requested` | 비교 요청 |
| **지역** | `place_review` | 지역 스팟 후기 |
| | `place_inquiry` | 지역 문의 |
| **테마** | `vortex_mission_signal` | Vortex 미션 시그널 |
| **갈등** | `family_conflict` | Family Bridge 갈등 패턴 |

### 2.2 시그널 페이로드

```typescript
QisSignalPayload {
  source_platform: 'kweddinghub' | 'aihompyhub' | 'jehuhub' | 'other';
  signal_type: (22종 중 하나);
  industry: string;            // 세부업종 키
  macro_industry?: string;     // BM 매크로 카테고리
  hub_axis: 'industry' | 'place' | 'vortex';  // 3축 분류
  place_slug?: string;         // 지역 슬러그 (예: 'jeju', 'gangnam')
  vortex_slug?: string;        // 테마 슬러그
  geo_context?: { region, city?, district? };
  raw_text: string;            // 원본 텍스트
  predicted_impact: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  metadata: Record<string, unknown>;
}
```

### 2.3 Tri-Axis Router (3축 라우팅)

모든 시그널은 3축 중 하나(또는 교차)로 분류됩니다:

| 축 | 분류 기준 | 예시 |
|----|----------|------|
| **Industry** (업종) | 업종 키워드 매칭 | "스킨케어 성분 비교" → skincare |
| **Place** (지역) | 지역 키워드 매칭 | "제주 웨딩 스튜디오" → place_slug: 'jeju' |
| **Vortex** (테마) | 테마 키워드 매칭 | "신혼여행 예산" → vortex_slug: 'honeymoon' |
| **Cross-Axis** | 2축 이상 교차 | "제주 스킨케어 매장" → industry + place |

**지역 키워드 자동 인식:** 서울, 부산, 제주, 강남, 성수 등 주요 한국 도시/지역명 → 자동 place_slug 변환

---

## 3. QVS (Query Value Score) — 질문 가치 점수

### 3.1 QVS 공식

```
QVS = 볼륨 × 전환율 × 객단가 추정치
```

| 구성요소 | 필드 | 범위 | 설명 |
|---------|------|------|------|
| **Volume Score** | `volume_score` | 0-100 | 검색 볼륨 추정 |
| **Conversion Score** | `conversion_score` | 0-100 | 전환율 추정 |
| **ARPU Score** | `arpu_score` | 0-100 | 평균 수익 추정 |
| **First Mover Score** | `first_mover_score` | 0.5-2.0 | 선점 우위 승수 (기본 1.0) |
| **Competition Score** | `competition_score` | 0-1 | 경쟁 강도 |
| **QVS Composite** | `qvs_composite` | 0-100 | **종합 QVS 점수** |

### 3.2 QVS 활용

- **높은 QVS (70+)**: 높은 비즈니스 가치 → 즉시 콘텐츠 생산 우선순위
- **낮은 QVS (< 30)**: 낮은 비즈니스 가치 → 모니터링만
- **높은 QVS + 높은 Competition**: Takeover 리스크 → 방어 전략 필요
- **높은 QVS + 낮은 Competition**: 선점 기회 → First Mover 전략

### 3.3 QVS Portfolio Manager

포트폴리오 건강도를 모니터링합니다:

| 지표 | 의미 |
|------|------|
| `overallScore` (0-100) | 포트폴리오 평균 QVS |
| `takeoverRiskCount` | QVS > 50 AND competition > 0.7인 질문 수 |
| `driftDetectedCount` | AI 의도가 변화한 질문 수 |
| `dominantIntent` | 가장 많은 의도 유형 |

---

## 4. QIS 예측 질문 시스템

### 4.1 예측 질문 스키마

```typescript
QisPredictedQuestion {
  bsw_question_id: string;
  question_text: string;
  predicted_intent: string;           // 예측된 검색 의도
  predicted_volume: 'low' | 'medium' | 'high';
  confidence: number;                 // 예측 신뢰도 (0-1)
  first_mover_window_days: number;    // 선점 기회 잔여일
  current_ai_coverage: 'none' | 'sparse' | 'moderate' | 'saturated';
  
  // 콘텐츠 가이드
  auto_must_include: string[];        // 반드시 포함해야 할 내용
  auto_must_not_do: string[];         // 반드시 하지 말아야 할 내용
  
  // QVS
  qvs_composite?: number;
  
  // 3축 타겟
  target_axis: 'industry' | 'place' | 'vortex' | 'cross_axis';
  place_slug?: string;
  vortex_slug?: string;
  geo_keywords: string[];
  recommended_formats: string[];      // expert_column, case_study, answer_card 등
}
```

### 4.2 AI 커버리지 4단계

| 단계 | 의미 | 전략 |
|------|------|------|
| **None** | AI 답변에 관련 콘텐츠 없음 | 🔴 즉시 선점 — First Mover 기회 |
| **Sparse** | 소수의 불완전한 답변 존재 | 🟡 품질 우위로 선점 가능 |
| **Moderate** | 보통 수준의 답변 존재 | 🟢 차별화된 콘텐츠로 경쟁 |
| **Saturated** | 충분한 답변이 이미 포화 | ⚪ 선점 불가 — 차별화에 집중 |

### 4.3 피드백 루프

```
BSW 예측 → Hub에 전송 → 실제 질문 출현 여부 확인
                              ↓
                        QIS Feedback
                              ↓
                    예측 정확도 추적 + 시그널 가중치 자동 재보정
```

피드백 3건 이상 누적 시 자동 가중치 재보정이 실행됩니다.

---

## 5. QIS Cross Mapper — 벤치마크 교차 매핑

### 5.1 교차 매핑 로직

업종 필수 질문(Set A)과 브랜드 사이트 프로브(Set B)를 교차 매칭합니다:

```
업종 QIS 질문 (Set A)          브랜드 사이트 프로브 (Set B)
  ┌──────────────┐               ┌──────────────┐
  │ "○○ 성분은?" │──── match ───→│ "성분 안내"   │ → BOTH
  │ "○○ 가격은?" │               │              │ → INDUSTRY_ONLY (🔴 RED)
  │              │               │ "수상 이력"   │ → SITE_ONLY (🟢 GREEN)
  └──────────────┘               └──────────────┘
```

**유사도 계산:**
```
finalScore = Jaccard유사도 × 0.4 + 코사인유사도(임베딩) × 0.6 + 키워드보너스(+0.25)
매칭 임계값: ≥ 0.35
```

**결과 3분류:**

| 분류 | 의미 | 벤치마크 연동 |
|------|------|-------------|
| **`both`** | 업종도 기대하고 사이트도 커버 | 🟢 GREEN — 유지 |
| **`industry_only`** | 업종은 기대하지만 사이트 미커버 | 🔴 RED — 콘텐츠 갭 |
| **`site_only`** | 사이트는 있지만 업종은 미기대 | 고유 강점 또는 ⚪ 블루오션 |

### 5.2 QIS 7-Layer 분류

각 질문은 7개 레이어로 분류됩니다:

| 레이어 | 이름 | 설명 | 예시 |
|--------|------|------|------|
| **L1** | 보편적 질문 | 업종 내 누구나 묻는 기본 질문 | "스킨케어 루틴 순서" |
| **L2** | 경쟁 비교 | 브랜드 간 비교 질문 | "Brand-A vs Brand-B" |
| **L3** | 성분/재료 | 구성 요소 관련 질문 | "레티놀 농도 효과" |
| **L4** | 규제/인증 | 규제 준수, 인증 관련 | "FDA 승인 여부" |
| **L5** | YMYL 안전 | 건강/금융 등 민감 정보 | "부작용 주의사항" |
| **L6** | 트렌드/신규 | 최신 트렌드, 신기술 | "2026 스킨케어 트렌드" |
| **L7** | 시즌/이벤트 | 계절성, 이벤트 연관 | "여름철 자외선 차단" |

**Gap Analyzer 우선순위 연동:**
- L1 (보편적 질문) 갭: 우선순위 +40
- L3~L7 갭: 우선순위 +25
- L6 (트렌드) 사이트 전용: ⚪ WHITE 블루오션 기회

---

## 6. QIS × 벤치마크 통합 대시보드

### 6.1 탭 2: 🔮 AEO 콘텐츠 트렌드

**QIS 시그널 데이터를 업종 벤치마크 맥락에서 시각화합니다.**

#### KPI 카드 4종

| KPI | 소스 | 의미 |
|-----|------|------|
| **활성 시그널** | `bsw_received_signals` 최근 30일 | 업종 내 유입 시그널 수 |
| **예측 질문** | `bsw_predicted_questions` 미출현 | 아직 출현하지 않은 예측 질문 수 |
| **평균 QVS** | 예측 질문의 평균 qvs_composite | 업종 질문 가치 수준 |
| **미커버 비율** | AI 커버리지 = none 비율 | 선점 기회의 크기 |

#### 시그널 추이 차트 (30일)
- X축: 날짜, Y축: 시그널/예측 수
- 보라색 영역: 총 시그널 수
- 황색 영역: 신규 예측 수
- **인사이트:** 시그널 급증 → 업종 내 트렌드 변화 신호

#### AI 커버리지 분포 (도넛 차트)
- 🔴 미커버(None): 선점 기회
- 🟡 희소(Sparse): 품질 우위 선점 가능
- 🔵 보통(Moderate): 차별화 필요
- 🟢 포화(Saturated): 방어 모드

#### 떠오르는 질문 TOP 5
- QVS 상위, 미출현, 고신뢰 예측 질문
- 각 질문: 의도, 볼륨, QVS 점수, 선점 잔여일, AI 커버리지
- 🔴 3일 이내 / 🟡 7일 이내 / 🔵 일반 긴급도 뱃지

### 6.2 탭 3: 🎯 QVS×AEPI 전략

**질문의 비즈니스 가치(QVS)와 브랜드의 해당 영역 성능(AEPI)을 2D 매트릭스로 시각화합니다.**

#### QVS × AEPI 4-Quadrant 전략 매트릭스

```
    QVS (질문 가치)
 100 ┌────────────────┬────────────────┐
     │                │                │
     │  🔴 위협       │  💎 핵심       │
     │  (집중투자)    │  (방어+확장)   │
     │                │                │
     │ 고가치인데     │ 고가치이고     │
     │ 브랜드가 약함  │ 브랜드가 강함  │
  50 ├────────────────┼────────────────┤
     │                │                │
     │  ⚪ 무시       │  🟢 유지       │
     │  (모니터링)    │  (효율화)      │
     │                │                │
     │ 저가치이고     │ 저가치이고     │
     │ 브랜드도 약함  │ 브랜드가 강함  │
   0 └────────────────┴────────────────┘
     0                50              100
              AEPI (브랜드 성능)
```

| 사분면 | 전략 | 액션 |
|--------|------|------|
| **🔴 위협** (고QVS + 저AEPI) | 즉시 집중 투자 | 해당 질문에 고품질 콘텐츠 생산, 스키마 추가, E-E-A-T 보강 |
| **💎 핵심** (고QVS + 고AEPI) | 방어 + 확장 | 기존 콘텐츠 정기 업데이트, 경쟁사 모니터링, 관련 질문 확장 |
| **🟢 유지** (저QVS + 고AEPI) | 효율 최적화 | 비용 최소화, 자동화, 필요시만 업데이트 |
| **⚪ 무시** (저QVS + 저AEPI) | 장기 모니터링 | 리소스 투입 보류, QVS 상승 시 재평가 |

**산점도 시각화:**
- 각 점(dot) = 예측 질문 또는 콘텐츠 영역
- 점 크기: 긴급도 (critical > medium > low)
- 점 색상: 🔴 ≤3일 / 🟡 ≤7일 / ⚪ 일반
- 클릭 시: 질문 상세 (텍스트, AI 커버리지, 경쟁 강도, 선점 잔여일)

#### First Mover 타임라인

선점 기회를 **마감일 기준 긴급도**로 그룹화합니다:

```
🔴 3일 이내 (Critical)
├─ "○○ 성분 부작용" QVS:89 | AI커버리지: none | 경쟁:82%
└─ "○○ vs △△ 비교" QVS:76 | AI커버리지: sparse | 경쟁:65%

🟡 7일 이내 (Medium)
├─ "○○ 가격 변동"  QVS:67 | AI커버리지: sparse | 경쟁:45%
└─ "○○ 사용법"     QVS:58 | AI커버리지: moderate | 경쟁:30%

🟢 14일 이내 (Low)
└─ "○○ 리뷰 정리"  QVS:45 | AI커버리지: none | 경쟁:20%

📊 경쟁 압박: 높음 3건 | 중간 5건 | 낮음 8건
```

---

## 7. QIS × 벤치마크 데이터 브릿지

### 7.1 통합 데이터 구조

```typescript
QisBenchmarkIntegration {
  subIndustryKey: string;
  
  // QIS 통계
  activeSignals: number;           // 최근 30일 시그널 수
  totalPredictions: number;        // 미출현 예측 수
  highConfidencePredictions: number; // 신뢰도 ≥ 0.7
  avgQvsComposite: number;         // 평균 QVS
  
  // AI 커버리지 분포
  coverageDistribution: {
    none: number;
    sparse: number;
    moderate: number;
    saturated: number;
  };
  
  // 통합 매트릭스
  qvsAepiMatrix: QvsAepiMatrixItem[];     // 4-Quadrant 좌표
  layerBenchmarks: QisLayerRow[];          // L1~L7별 IRI/BDR/CWR/OPP
  firstMoverItems: FirstMoverItem[];       // 선점 기회 목록
  contentTrends: ContentTrendPoint[];      // 일별 트렌드
  topPredictions: TopPredictedQuestion[];  // QVS TOP 5
}
```

### 7.2 Graceful Fallback 전략

QIS DB에 실제 데이터가 없는 초기 상태에서도 시스템은 정상 작동합니다:

| 상황 | Fallback |
|------|----------|
| Hub 미연동 (시그널 0건) | "QIS 시그널 데이터 수집 중" 메시지 표시 |
| 예측 질문 없음 | 벤치마크 스냅샷 기반 **시뮬레이션 매트릭스** 자동 생성 |
| QVS 미산출 | 업종 평균 + 랜덤 보정으로 시뮬레이션 |

**시뮬레이션 매트릭스 (10개 영역):**

| 영역 | 메트릭 키 | 기본 QVS |
|------|----------|---------|
| AI 크롤러 접근성 | aiCrawlerAccessScore | 75 |
| FAQ 스키마 구현 | schemaQualityScore | 85 |
| E-E-A-T 신호 | eeatOverall | 90 |
| Answer-First 콘텐츠 | answerFirstAvgScore | 80 |
| 콘텐츠 신선도 | freshnessScore | 65 |
| OG 메타데이터 | ogCompleteness | 55 |
| 인용 품질 | citationQualityScore | 70 |
| 멀티미디어 활용 | multimediaScore | 45 |
| 내부 링크 구조 | internalLinkTopologyScore | 60 |
| 독창성 지수 | originalityScore | 72 |

---

## 8. 콘텐츠 전략 실전 워크플로

### 8.1 전략 도출 프로세스

```
Step 1: 업종 벤치마크 실행
  → 업종 AEPI 평균·분포 파악
  → 내 브랜드의 상대적 위치 확인
     ↓
Step 2: AEO 콘텐츠 트렌드 확인 (탭 2)
  → 업종 내 어떤 시그널이 증가하고 있는지
  → AI 커버리지가 없는(None) 영역이 얼마나 큰지
  → 떠오르는 질문 TOP 5 확인
     ↓
Step 3: QVS×AEPI 전략 매트릭스 확인 (탭 3)
  → 🔴 위협 사분면: 즉시 대응 필요 질문 식별
  → First Mover 3일 이내 항목 확인
     ↓
Step 4: 콘텐츠 생산 우선순위 결정
  → 🔴 위협 + Critical 긴급도 → 1순위
  → 🔴 위협 + Medium 긴급도 → 2순위
  → 💎 핵심 + 경쟁 상승 → 3순위 (방어)
     ↓
Step 5: 콘텐츠 제작 가이드 참조
  → auto_must_include: 반드시 포함할 내용
  → auto_must_not_do: 반드시 피할 내용
  → recommended_formats: 최적 콘텐츠 형식
     ↓
Step 6: 제작 → 배포 → 재측정
  → GENESIS/TAAW 자동 생산 또는 수동 제작
  → 2주 후 재감사로 AEPI 변화 측정
  → QIS 피드백으로 예측 정확도 개선
```

### 8.2 콘텐츠 형식 가이드

QIS가 추천하는 콘텐츠 형식:

| 형식 | 적합한 질문 유형 | 스키마 |
|------|----------------|--------|
| `expert_column` | 전문가 분석, YMYL 질문 | Article + author |
| `case_study` | 사례 기반, 경험 질문 | Article + Review |
| `answer_card` | 단답형, 팩토이드 질문 | FAQPage |
| `comparison_table` | 비교 질문 | Product + AggregateRating |
| `how_to_guide` | 절차/방법 질문 | HowTo |
| `local_guide` | 지역 기반 질문 | LocalBusiness |
| `trend_report` | 트렌드 분석 | Article |

### 8.3 E-E-A-T 차원별 콘텐츠 전략

| E-E-A-T 차원 | 약할 때 징후 | 교정 콘텐츠 전략 |
|-------------|-------------|----------------|
| **Experience** | 리뷰/체험 콘텐츠 부재 | 실사용 후기, 사진/영상, AggregateRating 스키마 |
| **Expertise** | 저자 정보 없음 | 전문가 프로필 추가, 자격 증명, Article 스키마 |
| **Authoritativeness** | 외부 인용 없음 | 수상 이력, 인증 마크, 공공기관 인용 |
| **Trustworthiness** | 신뢰 정보 부재 | HTTPS, 개인정보처리방침, 환불 정책, 연락처 |

---

## 9. QIS API 레퍼런스

### 9.1 시그널 수신

```
POST /api/v1/qis/signals/ingest
Authorization: Bearer {QIS_API_KEY}

Body: {
  "signals": [
    {
      "source_platform": "aihompyhub",
      "signal_type": "community_question",
      "industry": "skincare",
      "hub_axis": "industry",
      "raw_text": "레티놀 사용 시 주의사항이 궁금합니다",
      "predicted_impact": "high",
      "detected_at": "2026-06-26T06:00:00Z"
    }
  ]
}

Response: { received: 1, predicted: 1, errors: [] }
```

### 9.2 예측 질문 조회

```
GET /api/v1/qis/predictions?min_confidence=0.7

Response: {
  predictions: [
    {
      bsw_question_id: "uuid",
      question_text: "레티놀 부작용 종류",
      predicted_intent: "informational",
      predicted_volume: "high",
      confidence: 0.89,
      first_mover_window_days: 3,
      current_ai_coverage: "none",
      qvs_composite: 82,
      auto_must_include: ["피부 자극 주의", "농도별 차이"],
      recommended_formats: ["expert_column", "answer_card"]
    }
  ]
}
```

### 9.3 피드백 전송

```
POST /api/v1/qis/feedback
Authorization: Bearer {QIS_API_KEY}

Body: {
  "feedbacks": [
    {
      "bsw_question_id": "uuid",
      "emerged": true,
      "emerged_at": "2026-06-26T10:00:00Z",
      "emergence_source": "cafe_agora",
      "actual_frequency": 45
    }
  ]
}
```

### 9.4 QIS 동기화 Cron

```
GET /api/cron/qis-sync
Authorization: Bearer {CRON_SECRET}

실행 시간: 매일 03:00 KST
작업:
  1. Pull Phase: Hub에서 시그널 + 메트릭 + 예상 레이어 수집
  2. Push Phase: 고신뢰 예측 → 3축 라우팅 → Hub에 전송
```

---

## 10. 운영 체크리스트

### 10.1 일일 운영

| 항목 | 방법 | 주기 |
|------|------|------|
| QIS 시그널 모니터링 | AEO 콘텐츠 트렌드 탭 확인 | 일 1회 |
| First Mover 긴급 항목 확인 | QVS×AEPI 전략 탭 → 🔴 Critical 확인 | 일 1회 |
| 자동 동기화 로그 확인 | `/api/cron/qis-sync` 로그 | 자동 |

### 10.2 주간 운영

| 항목 | 방법 | 주기 |
|------|------|------|
| 업종 벤치마크 Diff 확인 | Cron 자동 재감사 결과 확인 | 주 1회 |
| QVS 포트폴리오 건강도 | Takeover 리스크/드리프트 모니터링 | 주 1회 |
| 경쟁사 AEPI 변동 추적 | 리더보드 순위 변화 확인 | 주 1회 |

### 10.3 월간 운영

| 항목 | 방법 | 주기 |
|------|------|------|
| 내 브랜드 Full Audit | Deep Dive 5차원 진단 | 월 1회 |
| 콘텐츠 전략 갱신 | QVS×AEPI 매트릭스 재평가 | 월 1회 |
| 예측 정확도 리뷰 | QIS 피드백 누적 분석 | 월 1회 |
| 레퍼런스 사이트 점검 | 폐업/리뉴얼 사이트 교체 | 분기 1회 |

---

## 11. Supabase 테이블 요구사항 (QIS 관련)

```sql
-- QIS 수신 시그널
CREATE TABLE bsw_received_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,
  industry TEXT NOT NULL,
  hub_axis TEXT DEFAULT 'industry',
  place_slug TEXT,
  vortex_slug TEXT,
  raw_text TEXT NOT NULL,
  predicted_impact TEXT DEFAULT 'medium',
  detected_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QIS 예측 질문
CREATE TABLE bsw_predicted_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  predicted_intent TEXT,
  predicted_volume TEXT DEFAULT 'medium',
  confidence NUMERIC(3,2),
  first_mover_window_days INTEGER,
  current_ai_coverage TEXT DEFAULT 'none',
  qvs_composite NUMERIC(5,2),
  competition_score NUMERIC(3,2),
  industry TEXT NOT NULL,
  actually_emerged BOOLEAN DEFAULT false,
  emerged_at TIMESTAMPTZ,
  prediction_accuracy NUMERIC(3,2),
  auto_must_include TEXT[] DEFAULT '{}',
  auto_must_not_do TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QIS 수신 메트릭
CREATE TABLE bsw_received_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  industry TEXT NOT NULL,
  value NUMERIC,
  sample_size INTEGER,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_signals_industry ON bsw_received_signals(industry, detected_at DESC);
CREATE INDEX idx_predictions_industry ON bsw_predicted_questions(industry, actually_emerged, confidence DESC);
CREATE INDEX idx_predictions_qvs ON bsw_predicted_questions(qvs_composite DESC) WHERE actually_emerged = false;
```

---

## 부록: 전체 데이터 흐름 요약

```
┌─── Hub 플랫폼 ──────────────────────────────────────────────┐
│  커뮤니티 Q&A, 검증 후기, 가격 데이터, 감정 패턴, ...        │
└──────────────────────────┬──────────────────────────────────┘
                           ↓ Signal Ingest (22종)
┌─── BSW-OS QIS ───────────┴──────────────────────────────────┐
│  Tri-Axis Router → Question Predictor → QVS Calculator      │
│        ↓                     ↓                ↓              │
│  axis분류        예측질문(confidence)   가치점수(0-100)       │
└──────────────────┬───────────┬────────────┬──────────────────┘
                   ↓           ↓            ↓
┌─── BSW-OS Benchmark ────────┴────────────┴──────────────────┐
│  Batch Audit Runner → 22 Metrics → AEPI Score                │
│  Temporal Tracker → Diff → Cron 자동 재감사                  │
│  Gap Analyzer → 4-Quadrant → Prescriptions                   │
│  QIS Cross Mapper → RED/GREEN/WHITE 갭                       │
│        ↓                                                     │
│  QIS-Benchmark Bridge                                        │
│  ├─ AEO Content Trends (시그널 추이 + 커버리지)              │
│  ├─ QVS × AEPI Matrix (4-Quadrant 전략)                     │
│  └─ First Mover Timeline (긴급도 분류)                       │
└──────────────────────────────────────────────────────────────┘
                   ↓
┌─── 통합 인포그래픽 대시보드 ─────────────────────────────────┐
│  [📊 업종 현황] [🔮 AEO 트렌드] [🎯 QVS×AEPI 전략]          │
│                                                               │
│  리더보드 + 분포         시그널 차트        4-Quadrant 산점도 │
│  드릴다운 모달           TOP 질문           선점 타임라인     │
└──────────────────────────────────────────────────────────────┘
                   ↓
┌─── 콘텐츠 실행 ──────────────────────────────────────────────┐
│  Content Blueprint → GENESIS 자동 생성                       │
│  TAAW 콘텐츠 파이프라인 → 품질 게이트 → 배포                │
│  피드백 → QIS 정확도 재보정 → 성장 플라이휠                  │
└──────────────────────────────────────────────────────────────┘
```

---

> **이전 문서:** [Part 1: 시스템 아키텍처 총론](BSW_OS_BRAND_GUIDE_PART1_SYSTEM_OVERVIEW.md) · [Part 2: 업종 벤치마크 & 브랜드 역설계](BSW_OS_BRAND_GUIDE_PART2_BENCHMARK_REVERSE_ENGINEERING.md)
