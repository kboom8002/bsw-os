# AEO 핵심 경쟁력: 고부가치 질문 선점과 슈퍼예측 엔진

> **핵심 통찰**: AEO의 승패는 "AI가 지금 뭐라 답하는가"가 아니라  
> **"다음 달 AI에게 쏟아질 고부가치 질문을 오늘 선점하는 것"**에 달려 있다.

---

## 1. AEO 경쟁의 본질: 시간 축의 전쟁

### 1.1 AEO 가치 곡선

```
                 콘텐츠 가치
                    │
                    │         ┌──── 질문 폭발 시점
                    │         │
                    │    ╭────╯
                    │   ╱
               ★  │  ╱  ← 선점 구간 (여기서 콘텐츠를 제공해야 함)
          선점자 │ ╱     AI가 학습하고 인용할 "유일한 출처"가 됨
          독점  │╱
                ├─────────────────────────────────────── 시간
                │         ▲             ▲
                │    질문 태동기     질문 폭발기
                │    (Emergence)    (Explosion)
                │
                │    ⬆ 여기서        ⬆ 여기서 진입하면
                │    진입해야 함       이미 레드오션
```

### 1.2 AEO 시간 프레임워크

| 단계 | 시기 | 특징 | 전략 | 가치 |
|------|------|------|------|------|
| **① 잠재기** | 질문 발생 전 | 사회·업종 시그널만 존재 | **슈퍼예측** | 💎💎💎💎💎 |
| **② 태동기** | 소수 얼리어답터 질문 | 검색 빈도 미미, AI 학습 부족 | **선제 콘텐츠** | 💎💎💎💎 |
| **③ 성장기** | 질문 빈도 급증 | AI가 출처를 찾기 시작 | **품질 강화** | 💎💎💎 |
| **④ 포화기** | 대중화 | 다수 출처 경쟁, AI 선택지 많음 | **차별화** | 💎💎 |
| **⑤ 안정기** | 질문 표준화 | AI가 고정 출처 확보 | **방어** | 💎 |

> [!IMPORTANT]
> **핵심**: ①②에서 콘텐츠를 제공하면 AI의 "첫 번째 학습 출처"가 되어, ③④⑤에서도 기본 인용 출처(Default Citation)로 고착됩니다. 이것이 **First-Mover Advantage in AI Citation**입니다.

---

## 2. 현재 BSW-OS 역량 진단

### 2.1 현재 기능 매핑

```
BSW-OS 현재 기능            AEO 시간 프레임 커버리지
━━━━━━━━━━━━━━━            ━━━━━━━━━━━━━━━━━━━━━━━

Question Capital             ① ② 에 부분 기여
 └ 질문 자산 수집              (이미 알려진 질문 위주)

QIS Scene                    ③ ④ 에 기여
 └ 질문-의도-시나리오 구조화     (현재 질문 기반)

Probe Panel + Observatory    ④ ⑤ 에 최적화
 └ AI 응답 관측 + 메트릭 산출    (현재 상태 측정)

Expected Layer               ③ ④ 에 기여
 └ 이상적 응답 기준 정의        (기존 질문 기반)

Fix-It OS                    ④ ⑤ 에 기여
 └ 진단 → 패치 → 리테스트       (현재 문제 수정)

3072-dim Vibe Engine         ③ ④ 에 기여
 └ 브랜드 톤 정합성 측정        (기존 콘텐츠 측정)
```

### 2.2 진단 결론

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│  현재 BSW-OS는 Observe → Diagnose → Fix 에 강함       │
│                                                       │
│  ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░  │
│  ◀── 미래 예측 ──▶ ◀──── 현재 관측 ────▶               │
│       ⛔ 약함          ✅ 강함                          │
│                                                       │
│  결정적 갭:                                            │
│  "다음에 어떤 질문이 올 것인가?"를 예측하는 기능 부재    │
│  "예측된 질문에 대한 콘텐츠를 선제 생산"하는 기능 부재   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 3. 필요한 신규 기능 모듈: 4대 엔진

### 아키텍처 전체 구조

```
 ┌─────────────────────────────────────────────────────────────┐
 │                  AEO Prediction & Pre-emption OS            │
 │                                                             │
 │  ┌─────────┐   ┌─────────────┐   ┌─────────┐   ┌────────┐ │
 │  │ Engine 1│   │  Engine 2   │   │Engine 3 │   │Engine 4│ │
 │  │         │   │             │   │         │   │        │ │
 │  │Question │──▶│Vibe-Balanced│──▶│Pre-empt │──▶│Question│ │
 │  │Emergence│   │   Super-    │   │ Content │   │ Value  │ │
 │  │Predictor│   │ Forecasting │   │ Factory │   │ Scorer │ │
 │  │         │   │             │   │         │   │        │ │
 │  └────┬────┘   └──────┬──────┘   └────┬────┘   └───┬────┘ │
 │       │               │               │             │      │
 │  ┌────▼────────────────▼───────────────▼─────────────▼────┐ │
 │  │                BSW-OS (기존)                            │ │
 │  │  Question Capital → QIS → Probe Panel → Observatory    │ │
 │  │  → Metrics → Fix-It → Report                          │ │
 │  └────────────────────────────────────────────────────────┘ │
 └─────────────────────────────────────────────────────────────┘
```

---

### Engine 1: Question Emergence Predictor (QEP)

> **"아직 대중이 묻지 않았지만 곧 물을 질문을 찾는 엔진"**

#### 1.1 신호 수집 소스 (Signal Sources)

```
 외부 신호 (External Signals)
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━

 📰 뉴스/미디어 신호
    ├── SBS 뉴스 키워드 급등 감지 (SBS 파트너십 활용!)
    ├── 네이버/다음 뉴스 트렌드
    └── 업종 전문 미디어 모니터링

 🔬 규제/정책 신호
    ├── 식약처 신규 고시 (스킨케어 성분 규제 변경)
    ├── 의료법 개정안 (클리닉 광고 규제)
    ├── 공정위 가이드라인 (계약/환불 규정)
    └── 국회 발의 법안 (부동산, 교육)

 📊 검색 트렌드 신호
    ├── Google Trends 급상승 검색어
    ├── 네이버 데이터랩 트렌드
    └── YouTube 검색어 트렌드

 💬 커뮤니티 신호
    ├── 네이버 카페/블로그 신규 토픽
    ├── Reddit / X(Twitter) 버즈
    └── 업종 전문 커뮤니티 모니터링

 🧬 계절/이벤트 신호
    ├── 계절 변환 (자외선→보습, 봄웨딩→가을웨딩)
    ├── 사회 이벤트 (수능, 명절, 블프)
    └── 업종 이벤트 (신차 출시, 신메뉴 론칭)

 내부 신호 (Internal Signals)
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━

 📝 AI홈피허브 테넌트 데이터
    ├── raw_intake_questions 신규 질문 패턴
    ├── answer_card 조회수 급증 패턴
    └── 테넌트 온보딩 시 수집 질문

 🔭 BSW-OS 관측 데이터
    ├── Probe 응답 내 신규 토픽 감지
    ├── AI 응답에서 "정보 부족" 패턴 감지
    └── 경쟁사 콘텐츠 신규 등장 감지
```

#### 1.2 예측 알고리즘

```typescript
interface QuestionEmergenceSignal {
  signal_id: string;
  source_type: 'news' | 'regulation' | 'search_trend' | 
               'community' | 'seasonal' | 'internal';
  industry: string;
  raw_text: string;
  detected_at: Date;
  
  // AI 증강 분석 결과
  predicted_questions: PredictedQuestion[];
  confidence: number;           // 0-1
  estimated_emergence: Date;    // 예상 태동 시점
  estimated_explosion: Date;    // 예상 폭발 시점
  estimated_value: number;      // 예상 비즈니스 가치
}

interface PredictedQuestion {
  question_text: string;
  question_variants: string[];
  predicted_intent: string;
  predicted_volume: 'low' | 'medium' | 'high' | 'explosive';
  
  // 선점 분석
  current_ai_coverage: 'none' | 'sparse' | 'moderate' | 'saturated';
  first_mover_window_days: number;   // 선점 가능 기간 (일)
  preemption_urgency: 'low' | 'medium' | 'high' | 'critical';
  
  // 자동 생성된 Expected Layer
  auto_expected_layer: {
    must_include: string[];
    should_include: string[];
    must_not_do: string[];
  };
}
```

#### 1.3 예측 파이프라인

```
신호 수집 (24/7)
     │
     ▼
신호 클러스터링 (Gemini AI)
 "이 규제 변경은 어떤 소비자 질문을 유발할 것인가?"
     │
     ▼
질문 후보 생성 (AI 증강)
 "규제 X → 소비자는 Y, Z, W를 물을 것이다"
     │
     ▼
현재 AI 커버리지 체크 (Probe 관측)
 "이 질문에 대해 ChatGPT/Google AI가 이미 잘 답하는가?"
     │
     ├── 커버리지 높음 → 선점 가치 낮음 → 모니터링
     │
     └── 커버리지 낮음 → ★ 선점 기회! → Engine 2로 전달
```

#### 1.4 실전 시나리오

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 시나리오: 식약처 "레티노이드 화장품 표시 기준 강화" 고시
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔬 신호 감지: 식약처 신규 고시 발표 (D+0)

🤖 AI 예측 (자동):
   Q1: "레티놀 화장품 새 규정 뭐가 바뀌었어?" (informational)
       예상 빈도: explosive | 선점 가능 기간: 14일
       현재 AI 커버리지: none
       
   Q2: "레티놀 함량 표시 의무화 내 제품 해당되나?" (risk_boundary)
       예상 빈도: high | 선점 가능 기간: 21일
       현재 AI 커버리지: none
       
   Q3: "임산부 레티놀 사용 새 가이드라인" (risk_boundary, YMYL)
       예상 빈도: high | 선점 가능 기간: 7일 ⚠️ 긴급
       현재 AI 커버리지: sparse

⚡ 선점 액션 (자동 트리거):
   → Q3 긴급 선점 → Engine 3 (Pre-emptive Content) 즉시 가동
   → Q1, Q2 → 7일 내 콘텐츠 준비 권고
   → 관련 테넌트 알림 발송
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Engine 2: Vibe-Balanced Super-Forecasting (VBSF)

> **"예측된 질문에 대한 답변이 브랜드 바이브를 유지하면서 AI 인용에 최적화되도록 밸런싱하는 엔진"**

#### 2.1 왜 "바이브 밸런스드"인가?

```
일반적 AEO 함정:

  "AI에 잘 나오려면 SEO 키워드를 잔뜩 넣자"
       │
       ▼
  콘텐츠가 기계적·광고적으로 변질
       │
       ▼
  브랜드 바이브 파괴 → 고객 신뢰 하락
       │
       ▼
  장기적으로 AI도 낮은 품질로 판단 → 인용 감소


바이브 밸런스드 접근:

  "AI 인용에 최적화하되, 브랜드의 고유한 톤앤매너를 지킨다"
       │
       ▼
  3072-dim 임베딩으로 콘텐츠 톤 사전 검증
       │
       ▼
  바이브 정합성 유지 + AI 인용 최적화 동시 달성
```

#### 2.2 슈퍼예측 프레임워크

```
Engine 1에서 예측된 질문
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Vibe-Balanced Super-Forecasting                     │
│                                                      │
│  Layer 1: 질문 가치 예측                              │
│  ┌─────────────────────────────────────────────┐     │
│  │ • 검색량 예측 (시계열 모델)                    │     │
│  │ • 전환 가치 예측 (업종 CVR × 객단가)           │     │
│  │ • 경쟁 강도 예측 (현재 출처 수)                │     │
│  │ • 선점 가능성 예측 (AI 커버리지 갭)            │     │
│  └─────────────────────────────────────────────┘     │
│                    │                                  │
│                    ▼                                  │
│  Layer 2: 최적 콘텐츠 설계 예측                       │
│  ┌─────────────────────────────────────────────┐     │
│  │ • AI가 인용하기 좋은 구조 예측                 │     │
│  │   (FAQ, HowTo, 비교표, 순서 목록 등)          │     │
│  │ • 필수 Schema.org 타입 예측                   │     │
│  │ • 최적 콘텐츠 길이 예측                        │     │
│  │ • EEAT 요구 수준 예측 (YMYL 감지)             │     │
│  └─────────────────────────────────────────────┘     │
│                    │                                  │
│                    ▼                                  │
│  Layer 3: 바이브 밸런싱                               │
│  ┌─────────────────────────────────────────────┐     │
│  │ • 브랜드 Vibe Spec(7D) 로드                   │     │
│  │ • 콘텐츠 초안의 3072-dim 임베딩 생성           │     │
│  │ • Vibe Proximity Alignment (VPA) 사전 체크    │     │
│  │ • VPA < 75이면 톤 조정 권고 자동 생성          │     │
│  │ • must_not_do 경계 사전 검증                   │     │
│  └─────────────────────────────────────────────┘     │
│                    │                                  │
│                    ▼                                  │
│  출력: Vibe-Balanced Content Blueprint               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 2.3 슈퍼예측 출력: Content Blueprint

```typescript
interface ContentBlueprint {
  // 예측된 질문
  predicted_question: PredictedQuestion;
  
  // 최적 콘텐츠 설계
  recommended_structure: 'faq' | 'howto' | 'comparison_table' | 
                         'step_guide' | 'expert_review';
  recommended_length: { min: number; max: number; optimal: number };
  recommended_schema: string[];     // ["FAQPage", "HowTo"]
  required_eeat_level: 'basic' | 'enhanced' | 'expert_required';
  
  // 바이브 밸런싱
  vibe_constraints: {
    target_vpa: number;             // 목표 VPA 점수
    tone_guidelines: string[];      // ["따뜻하되 전문적", "과장 금지"]
    forbidden_expressions: string[]; // must_not_do에서 도출
    brand_voice_keywords: string[]; // 브랜드 보이스 핵심 키워드
  };
  
  // Expected Layer (자동 생성)
  auto_expected_layer: ExpectedLayer;
  
  // 가치 예측
  value_forecast: {
    estimated_monthly_searches: number;
    estimated_ai_queries: number;
    estimated_citation_value: number;  // BAVM 기준 광고가치 환산
    first_mover_advantage_multiplier: number; // 선점 프리미엄 배수
    preemption_deadline: Date;
  };
  
  // 실행 권고
  action: {
    urgency: 'immediate' | 'this_week' | 'this_month' | 'monitor';
    assigned_tenants: string[];      // 이 질문에 답해야 할 테넌트
    content_template_id?: string;    // Factory Pattern 재사용 가능 시
  };
}
```

---

### Engine 3: Pre-emptive Content Factory (PCF)

> **"예측된 질문에 대한 콘텐츠를 바이브 밸런스를 유지하면서 자동 초안 생산하는 엔진"**

#### 3.1 팩토리 파이프라인

```
Content Blueprint (Engine 2)
         │
         ▼
┌──────────────────────────────────────┐
│  Pre-emptive Content Factory          │
│                                       │
│  Step 1: 템플릿 선택                  │
│  ├── Factory Pattern Library 검색     │
│  ├── 유사 성공 패턴 매칭               │
│  └── 없으면 신규 템플릿 생성           │
│                                       │
│  Step 2: AI 초안 생성                  │
│  ├── Gemini/GPT-4o로 콘텐츠 초안 생성  │
│  ├── Brand Truth에서 팩트 주입         │
│  ├── Evidence에서 근거 연결            │
│  └── Boundary에서 금지 표현 필터       │
│                                       │
│  Step 3: 바이브 검증                   │
│  ├── 초안의 3072-dim 임베딩 생성       │
│  ├── 브랜드 가이드 임베딩과 코사인 유사도│
│  ├── VPA < 75 → 톤 자동 조정           │
│  └── VPA ≥ 75 → 통과                  │
│                                       │
│  Step 4: YMYL 안전 게이트             │
│  ├── must_not_do 위반 스캔             │
│  ├── YMYL 업종이면 전문가 검토 필수 태그│
│  └── Unsafe Wording Scanner 통과       │
│                                       │
│  Step 5: 테넌트 큐 발행                │
│  ├── answer_card 초안으로 테넌트에 전달 │
│  ├── "선점 기회" 알림 + 기한 표시       │
│  └── 테넌트 승인 → 자동 발행            │
│                                       │
└──────────────────────────────────────┘
         │
         ▼
   발행된 선점 콘텐츠
         │
         ▼
   BSW-OS Observatory 자동 추적 등록
   (해당 질문을 Probe Panel에 추가)
```

#### 3.2 AI홈피허브 연동

```
Pre-emptive Content Factory
         │
         ▼
 ┌─────────────────────────────────┐
 │  AI홈피허브 테넌트 대시보드       │
 │                                  │
 │  🔔 선점 기회 알림               │
 │  ━━━━━━━━━━━━━━━━━━━━━━━━━━     │
 │                                  │
 │  📋 "레티놀 신규정 FAQ"           │
 │  ⏰ 선점 가능 기간: 12일          │
 │  💰 예상 가치: ₩2.3M/월          │
 │  📊 현재 AI 커버리지: 없음        │
 │  🎯 VPA 예상: 88.2 (브랜드 적합)  │
 │                                  │
 │  [초안 확인] [수정 후 발행] [건너뛰기]│
 │                                  │
 └─────────────────────────────────┘
```

---

### Engine 4: Question Value Scorer (QVS)

> **"모든 질문의 비즈니스 가치를 실시간으로 점수화하여 우선순위를 결정하는 엔진"**

#### 4.1 가치 산출 공식

```
QVS = Volume × Conversion × ARPU × FirstMover × (1 - Competition)

각 요소:
━━━━━━

Volume (검색/질문 빈도)
  = 현재 검색량 + 예측 증가분
  범위: 0-100 (정규화)

Conversion (전환 기여도)
  = 해당 질문이 구매/계약으로 이어질 확률
  범위: 0-1
  예: informational=0.05, recommendation=0.15, action_seeking=0.25

ARPU (고객 생애 가치)
  = 업종별 평균 거래 금액
  예: 스킨케어=₩45K, 웨딩=₩5M, 클리닉=₩200K

FirstMover (선점 프리미엄)
  = AI 커버리지가 낮을수록 높음
  범위: 1.0(포화) ~ 5.0(완전 미개척)

Competition (경쟁 강도)
  = 이미 양질의 콘텐츠를 보유한 경쟁사 수
  범위: 0-1
```

#### 4.2 QVS 대시보드 예시

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Question Value Scoring — 스킨케어 업종
 2026년 7월 Week 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 최고 가치 선점 기회 Top 5:

 #  질문                        QVS    선점   상태
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1  레티놀 신규정 FAQ           94.2   12일   ⚡ 긴급
 2  여름 민감성 피부 장벽케어    87.5   21일   🟡 권장
 3  선크림 리콜 제품 목록       85.1    5일   🔴 최긴급
 4  비건 선크림 성분 비교       72.3   30일   🟢 계획
 5  피부 마이크로바이옴 관리법   68.9   45일   🟢 계획

📊 가치 분포:
 QVS 90+  ██            2건 (즉시 대응)
 QVS 70+  ████          3건 (이번 주)
 QVS 50+  ████████      8건 (이번 달)
 QVS 30+  ████████████  12건 (분기 내)
 QVS ~29  ████████████████████  45건 (모니터링)

💰 선점 시 예상 월간 가치 합계: ₩47.2M
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 4. 통합 아키텍처: Predict → Pre-empt → Observe → Optimize

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│   Phase A: PREDICT (신규)              Phase B: OBSERVE (기존) │
│   ━━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━  │
│                                                               │
│   신호 수집                            Probe Panel 관측       │
│       │                                    │                  │
│       ▼                                    ▼                  │
│   질문 출현 예측 (QEP)              AI 응답 수집 + 판정       │
│       │                                    │                  │
│       ▼                                    ▼                  │
│   가치 점수화 (QVS)                 메트릭 산출 (AAS/BSF)     │
│       │                                    │                  │
│       ▼                                    ▼                  │
│   바이브 밸런싱 (VBSF)             B-MRI / BAIR 산출         │
│       │                                    │                  │
│       ▼                                    ▼                  │
│   선제 콘텐츠 생산 (PCF)           Fix-It 진단 + 패치        │
│       │                                    │                  │
│       └────────────┐    ┌─────────────────┘                  │
│                    │    │                                     │
│                    ▼    ▼                                     │
│              ┌───────────────┐                                │
│              │  SBS 공동 발표 │                                │
│              │  지표 산출     │                                │
│              └───────────────┘                                │
│                                                               │
│   🔄 폐쇄 루프:                                               │
│   예측 → 선점 콘텐츠 → 관측 → 효과 측정 → 예측 정확도 보정    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터베이스 확장 설계

```sql
-- ============================================
-- Engine 1: Question Emergence Predictor
-- ============================================

CREATE TABLE emergence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  source_type VARCHAR(50) NOT NULL,
    -- 'news', 'regulation', 'search_trend', 'community', 'seasonal', 'internal'
  industry VARCHAR(100) NOT NULL,
  raw_text TEXT NOT NULL,
  source_url TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,                  -- 신호 유효 기한
  status VARCHAR(30) DEFAULT 'new' NOT NULL
    -- 'new', 'analyzed', 'actionable', 'expired', 'false_positive'
);

CREATE TABLE predicted_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  signal_id UUID REFERENCES emergence_signals(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_variants TEXT[] DEFAULT '{}'::TEXT[],
  predicted_intent VARCHAR(100) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  
  -- 예측 메타
  predicted_volume VARCHAR(20) DEFAULT 'medium' NOT NULL,
  current_ai_coverage VARCHAR(20) DEFAULT 'none' NOT NULL,
  first_mover_window_days INTEGER DEFAULT 30,
  preemption_urgency VARCHAR(20) DEFAULT 'medium' NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.50,
  
  -- 자동 Expected Layer
  auto_must_include TEXT[] DEFAULT '{}'::TEXT[],
  auto_should_include TEXT[] DEFAULT '{}'::TEXT[],
  auto_must_not_do TEXT[] DEFAULT '{}'::TEXT[],
  
  -- 검증 추적
  actually_emerged BOOLEAN,                 -- 실제 출현 여부 (예측 정확도 피드백)
  emerged_at TIMESTAMPTZ,                   -- 실제 출현 시점
  prediction_accuracy_score DECIMAL(3,2),   -- 예측 정확도 자가 평가
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Engine 4: Question Value Scorer
-- ============================================

CREATE TABLE question_value_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  predicted_question_id UUID REFERENCES predicted_questions(id) ON DELETE CASCADE,
  probe_question_id UUID REFERENCES probe_questions(id) ON DELETE CASCADE,
    -- 둘 중 하나 연결 (예측 질문 or 기존 관측 질문)
  
  volume_score DECIMAL(5,2) DEFAULT 0,
  conversion_score DECIMAL(5,2) DEFAULT 0,
  arpu_score DECIMAL(5,2) DEFAULT 0,
  first_mover_score DECIMAL(5,2) DEFAULT 1.0,
  competition_score DECIMAL(5,2) DEFAULT 0,
  
  qvs_composite DECIMAL(10,2) GENERATED ALWAYS AS (
    volume_score * conversion_score * arpu_score * 
    first_mover_score * (1 - competition_score)
  ) STORED,
  
  estimated_monthly_value DECIMAL(12,2),    -- 월간 광고가치 환산 (원)
  preemption_deadline TIMESTAMPTZ,
  
  scored_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Engine 3: Pre-emptive Content Factory
-- ============================================

CREATE TABLE content_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  predicted_question_id UUID REFERENCES predicted_questions(id) ON DELETE CASCADE NOT NULL,
  
  recommended_structure VARCHAR(50) NOT NULL,
  recommended_schema JSONB DEFAULT '[]'::jsonb,
  recommended_length JSONB DEFAULT '{"min":300,"max":800,"optimal":500}'::jsonb,
  required_eeat_level VARCHAR(30) DEFAULT 'basic',
  
  -- 바이브 밸런싱 제약
  target_vpa DECIMAL(5,2) DEFAULT 75.00,
  tone_guidelines TEXT[] DEFAULT '{}'::TEXT[],
  forbidden_expressions TEXT[] DEFAULT '{}'::TEXT[],
  brand_voice_keywords TEXT[] DEFAULT '{}'::TEXT[],
  
  -- 생성된 콘텐츠 초안
  draft_content TEXT,
  draft_vpa_score DECIMAL(5,2),             -- 초안의 VPA 점수
  draft_embedding VECTOR(3072),             -- 초안의 3072-dim 임베딩
  
  -- 상태
  status VARCHAR(30) DEFAULT 'draft' NOT NULL,
    -- 'draft', 'vibe_check_failed', 'ready', 'sent_to_tenant', 
    -- 'tenant_approved', 'published', 'expired'
  
  tenant_id UUID,                           -- 배정된 테넌트
  published_answer_card_id UUID,            -- 발행된 answer_card 연결
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. 예측 정확도 자가 학습 루프

```
예측 → 실제 결과 비교 → 정확도 보정 → 다음 예측 개선

┌─────────────────────────────────────────────────────┐
│  Self-Learning Prediction Loop                       │
│                                                      │
│  예측 시점 (T=0):                                     │
│    "레티놀 신규정 FAQ" 질문이 14일 내 폭발할 것       │
│    confidence: 0.78                                  │
│                                                      │
│  검증 시점 (T=14):                                    │
│    ├── 실제 AI 질문 빈도 변화 측정 (Probe 관측)       │
│    ├── 실제 출현 여부: ✅ emerged                     │
│    ├── 실제 출현 시점: T+11일 (예측 14일 vs 실제 11일)│
│    └── 예측 정확도: 0.85                              │
│                                                      │
│  보정:                                                │
│    ├── 규제 신호의 가중치 +0.05 상향                  │
│    ├── 스킨케어 업종 리드타임 보정 (14→11일)          │
│    └── 유사 신호 패턴의 confidence 기본값 상향         │
│                                                      │
│  다음 예측에 반영                                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 7. SBS 파트너십 시너지

### SBS만이 제공할 수 있는 예측 신호

```
SBS 독점 신호                    예측 활용
━━━━━━━━━━━━                    ━━━━━━━━

📺 SBS 뉴스 편성표              "이 주제가 뉴스에 나가면,
   (방영 전 사전 정보)            소비자 질문이 24시간 내 급증"

📊 SBS 시청률 데이터             "높은 시청률 프로그램에서
   (주제별 시청률)                다룬 주제 → AI 질문 급증 예측"

📰 SBS 취재 파이프라인           "이번 주 탐사보도 주제가
   (보도 예정 주제)               X업종 관련 → 사전 대응"

🎬 SBS 예능/드라마 편성          "예능에서 다이어트 주제 방영
   (콘텐츠 스케줄)                → 다이어트 관련 AI 질문 급증"
```

> [!TIP]
> **이것이 진정한 Unfair Advantage입니다.** SBS의 방송 편성 정보를 예측 신호로 활용하면, 방송 직후 폭증하는 AI 질문에 대한 콘텐츠를 **방송 전에** 미리 준비할 수 있습니다. 어떤 경쟁사도 이 신호에 접근할 수 없습니다.

---

## 8. 기존 BSW-OS vs 확장 후 비교

```
           기존 BSW-OS           확장 후 (Prediction OS 추가)
           ━━━━━━━━━━            ━━━━━━━━━━━━━━━━━━━━━━━━━━

시간 축    현재 → 과거            미래 → 현재 → 과거
           (관측 + 리테스트)       (예측 + 선점 + 관측 + 리테스트)

질문 대응  "이 질문에 잘 답하고   "다음 달 이 질문이 올 것이다.
           있는가?"               지금 콘텐츠를 준비하자."

가치 제안  "측정 + 개선"          "예측 + 선점 + 측정 + 개선"

경쟁 우위  데이터 기반 최적화      시간 기반 선점 + 데이터 최적화

고객 가치  AI 가시성 개선          AI 가시성 선점 + 유지

SBS 시너지 지표 발표              지표 발표 + 방송 연동 예측

수익 모델  관측 구독               관측 구독 + 예측 프리미엄 + 선점 서비스
```

---

## 9. 실행 우선순위

| 순위 | 모듈 | 개발 난이도 | 비즈니스 임팩트 | 선행 조건 |
|------|------|-----------|---------------|-----------|
| **1** | Question Value Scorer (QVS) | **낮음** | ⭐⭐⭐⭐ | 기존 QIS 데이터만으로 즉시 가능 |
| **2** | Question Emergence Predictor (QEP) — 규제/뉴스 신호 | 중간 | ⭐⭐⭐⭐⭐ | RSS/뉴스 API 연동 |
| **3** | Vibe-Balanced Super-Forecasting (VBSF) | 중간 | ⭐⭐⭐⭐ | 3072-dim 엔진(기존) |
| **4** | Pre-emptive Content Factory (PCF) | **높음** | ⭐⭐⭐⭐⭐ | QEP + VBSF 완성 후 |
| **5** | SBS 방송 신호 연동 | 중간 | ⭐⭐⭐⭐⭐ | SBS API/피드 협의 |
| **6** | 자가 학습 루프 | 높음 | ⭐⭐⭐ | 6개월+ 데이터 축적 후 |

> **킥오프 권장**: QVS는 기존 Question Capital + QIS 데이터만으로 **즉시 구현 가능**합니다. 이것만으로도 테넌트에게 "어떤 질문부터 답해야 가장 효과적인가"를 알려줄 수 있습니다.
