# 🥉 AEO 엔터프라이즈 번들 — 고객 사용자 시나리오 & 시스템 기능 가이드

> **상품**: AEO Enterprise (Starter 150만 / Pro 250만 / Elite 400만 / Strategic 별도 협의)
> **대상**: 중견~대기업 뷰티 브랜드, 글로벌 K-beauty, 다수 제품 라인 보유 기업
> **한 줄 요약**: "AI 답변의 모든 전선을 자동으로 장악하는 풀스택 AEO 전환 시스템"

---

## 1. 고객 사용자 시나리오

### 시나리오 A — Starter(150만/월): 1개 브랜드 · 핵심 기능 전부

> **페르소나**: 한수진 (40세, 미드레인지 스킨케어 브랜드 마케팅 이사)
> **현재 상황**: 월 마케팅 예산 3,000만원 중 AI/AEO에 배정 제로. 경쟁사가 AI에서 먼저 인용되기 시작.

#### Week 0: 온보딩 + 풀 진단

```
① BSW 운영팀이 브랜드 전수 설정
   → 제품 라인 5개, CQ 풀 50개+, 경쟁사 3개 등록
   → Domain Pack: skincare + K-beauty vertical 활성화

② 풀 MRI 촬영 (Brand MRI 1회 포함)
   → AI 5개 엔진 × 50개 CQ = 250회 프로빙
   → B-MRI 종합점수: 28/100 (F 등급)
   → 경쟁사 비교: A사 72, B사 55, 우리 28

③ 전체 인프라 자동 구축
   → AEO 웹사이트 (AI홈피) 생성
   → JSON-LD 전체 스키마 삽입
   → llms.txt + robots.txt AI 크롤러 최적화
   → Sitemap 자동 생성
```

#### Month 1: 선제적 질문 장악 시작

```
④ Q-Intelligence 주간 파이프라인 가동
   ┌──────────────────────────────────────────────────────────┐
   │ 주간 예측 보고서                                          │
   │                                                          │
   │ Week 1: 8개 신규 예측 질문 발견                            │
   │   🔴 "세라마이드 크림 vs 히알루론산 크림" (QVS 96, 공백)   │
   │   🔴 "여드름 피부 클렌징 순서" (QVS 93, 공백)              │
   │   🟠 "레티놀 농도별 효과 차이" (QVS 89, 희박)              │
   │   ...5건 더                                               │
   │                                                          │
   │ → 전체 자동 처리:                                         │
   │   CQ 선택 → Mission 컴파일 → Draft 생성                   │
   │   → Safety Gate → Vibe Check → 7채널 변형                 │
   │   → Hub Push → AI홈피 자동 발행                           │
   └──────────────────────────────────────────────────────────┘

⑤ Attractor-Guided 에셋 생산
   → Pattern Attractor "민감 피부 관리 전문가" 가이드라인 적용
   → 7축 ContextTensor 기반 적합도 평가
   → activate(≥70) → 브랜드 전문성 강조 톤 자동 적용
   → 7채널 동시 변형: homepage, answer_card, chatbot, cardnews, ad, sales_script, llm_txt

⑥ DealCard 프로모션 자동 연결
   → "세라마이드 크림 첫 구매 특가" 딜카드 자동 생성
   → JSON-LD Offer 스키마 삽입
   → Matching Engine이 적합 고객 자동 매칭
```

#### Month 2~3: 시즌 부스트 + 경쟁사 대응

```
⑦ 시즌 부스트 자동 감지
   → "여름 자외선 차단" 트렌드 급등 감지
   → 관련 CQ 5개 긴급 추천 + "선점 기회 7일"
   → Answer Factory 자동 처리 → AI홈피 즉시 발행

⑧ Smart Alert: 경쟁사 이상 징후
   ┌──────────────────────────────────────────────────┐
   │ ⚠️ ALERT: 경쟁사 A가 "비건 화장품" 인용 급증       │
   │                                                    │
   │ Z-Score: 2.8 (Critical)                            │
   │ 지난 주 대비: +340% 인용 증가                       │
   │ 영향: 우리 브랜드 인용 15% 감소 위험                 │
   │                                                    │
   │ [긴급 대응 콘텐츠 생산] [상세 분석 보기]              │
   └──────────────────────────────────────────────────┘
   → 클릭 1회 → Answer Factory 자동 전환
   → "비건 화장품" 관련 CQ 3개 즉시 에셋 생산

⑨ 월간 MRI 리포트
   → B-MRI 28 → 39 → 48 (F → D → C 진행 중)
   → QTC 15% → 32% → 45%
   → "3개월 내 B등급 도달 가능" 예측
```

#### Month 6: B등급 → 경쟁사 추월 시작

```
⑩ 누적 콘텐츠 48편+ (주 8편 × 6개월, 일부 자동)
   → AI 5개 엔진 평균 인용률 40%+
   → "스킨케어 루틴" 카테고리 AI 가시성 2위 진입

⑪ 주간 AI Briefing 자동 생성
   → "이번 주 '세라마이드' 관련 인용 12% 증가"
   → "경쟁사 B가 '비건 클렌징' 영역에서 후퇴 중 — 선점 기회"
   → Gemini 기반 정성 분석 + 데이터 기반 추천

⑫ Growth Pulse 대시보드
   → 5탭 통합 뷰: Traffic / Citation / Question / Content / Revenue
   → 주간 성장률 트렌드 + 목표 달성률
```

---

### 시나리오 B — Pro(250만/월): 다수 제품 라인 + 경쟁사 확장

> **페르소나**: 김태호 (47세, 중견 뷰티 그룹 CMO, 제품 라인 15개)

```
Week 1:  제품 라인 15개 × CQ 풀 200개+ 등록
         → 경쟁사 5개 동시 모니터링 설정
         → Domain Pack: skincare + haircare + bodycare

Month 1: 주간 15~20개 CQ 자동 처리
         → 제품 라인별 Answer Factory 파이프라인
         → Clone Transform: 1편 → 7채널 × 네이버/쿠팡/올리브영
         → 제품별 DealCard 자동 매칭

Month 3: 월간 MRI 리포트 (제품 라인별)
         → 라인 A: B-MRI 65 (B등급)
         → 라인 B: B-MRI 42 (D등급) — 집중 교정 필요
         → 라인 C: B-MRI 78 (A등급) — 유지 모드

Month 6: 카테고리 리더십 확보
         → 15개 라인 평균 B-MRI 62 (C+ → B- 전환)
         → 3개 핵심 카테고리 AI 가시성 TOP 3
         → Beauty Pulse: 성분 트렌드 인텔리전스 활용
```

---

### 시나리오 C — Elite(400만/월): 멀티 브랜드 + 글로벌

> **페르소나**: 박선영 (52세, 대형 뷰티 그룹 전략실장, 3개 브랜드 × 5개국)

```
Week 1:  3개 브랜드 × 5개국(KR/US/JP/CN/TW)
         → 15개 AEO 웹사이트 동시 구축
         → Clone Transform: 한국어 원본 → 5개국어 자동 변환
         → 전담 BSW 컨설턴트 배정

Month 1: 국가별 Q-Intelligence 파이프라인
         → KR: 한국어 CQ 100개+
         → US: 영어 CQ 80개+ (K-beauty 수출 키워드)
         → JP: 일본어 CQ 60개+ (현지 트렌드)
         → 각국 AI 엔진 프로빙 (ChatGPT/Gemini/Perplexity + 현지 AI)

Month 3: 글로벌 Dashboard
         → 국가별 B-MRI 비교
         → 크로스마켓 인사이트: "미국에서 '글래스 스킨'이 급등 → 한국 콘텐츠 영어 발행"
         → 위기 대응: "일본 AI에서 경쟁사 인용 급증" → 즉시 일본어 콘텐츠 생산

Month 6: AI 글로벌 가시성 TOP
         → 5개국 평균 B-MRI 65+
         → 핵심 카테고리 AI 가시성 글로벌 TOP 5
         → 월 150편+ 콘텐츠 자동 생산 + 5개국 동시 발행
```

---

### 시나리오 D — Strategic(별도 협의): 완전 맞춤형

```
대상: 글로벌 Top 10 뷰티 그룹 / 제약사 / 의료기기 기업

특징:
  → 전용 BSW-OS 인스턴스 배포
  → 온프레미스 또는 Private Cloud 옵션
  → 커스텀 AI 모델 학습 (브랜드 전용)
  → 내부 시스템 API 연동 (ERP/CRM/PIM)
  → 분기별 전략 워크숍 + C-Level 브리핑
  → SLA 99.9% + 전담 컨설턴트 2인
```

---

## 2. 시스템 기능 가이드

### 2.1 BSW-OS 기능 가이드 (운영자용)

BSW-OS는 **엔터프라이즈 고객을 위한 12개 엔진의 자동화된 플라이휠**입니다.

#### 📍 전체 메뉴 매핑 (엔터프라이즈용)

| 메뉴 그룹 | 메뉴 | 경로 | 엔터프라이즈 기능 |
|----------|------|------|----------------|
| **Semantic Intelligence** | QPA-OS (Semantic Core) | `/semantic-core` | Q-Intelligence 허브 |
| | QIS Signals | `/semantic-core/signals` | 시그널 수집 + 분석 |
| | Canonical Questions | `/semantic-core/canonical-questions` | CQ 관리 |
| | QIS Scenes | `/semantic-core/qis` | Scene 빌더 |
| | **🏭 Answer Factory** | `/semantic-core/answer-factory` | **핵심** — 5단계 에셋 생산 |
| | Pattern Attractors | `/semantic-core/attractors` | Attractor 포트폴리오 |
| | TCO Concepts | `/semantic-core/concepts` | 개념 체계 관리 |
| | Orchestration | `/semantic-core/orchestration` | 파이프라인 오케스트레이션 |
| | Pipeline Artifacts | `/semantic-core/pipeline-artifacts` | 산출물 관리 |
| | Pipeline Config | `/semantic-core/pipeline-config` | 파이프라인 설정 |
| **Monitoring** | Observatory | `/observatory` | AI 5엔진 프로빙 |
| | **🩺 Brand MRI** | `/reports/brand-mri` | B-MRI 진단 리포트 |
| | Deep Dive | `/deep-dive` | 심층 분석 |
| | Golden Reference | `/golden-reference` | 골든 레퍼런스 |
| **Truth** | Truth Studio | `/truth` | 6차원 Truth 관리 |
| **Products** | Sales Automation | `/sales-automation` | 고객 매칭 + Gap 리포트 |
| | aihompy Pack | `/aihompy-pack` | AI홈피 팩 관리 |

#### 🏭 Answer Factory — 엔터프라이즈 파이프라인

```
엔터프라이즈 전용 기능:

[1] 대량 CQ 일괄 처리
    → 200개+ CQ 중 QVS 순으로 자동 선택
    → 제품 라인별 필터링

[2] Attractor-Guided 미션 컴파일
    → 7축 ContextTensor 평가
    → 브랜드 전문성/비교분석/구매결정 Attractor 매핑
    → activate(≥70) / conditional(≥40) / skip(<40) 자동 판정

[3] 7채널 동시 변형
    → homepage: H1→DirectAnswer→Proof→Routines→Cautions
    → answer_card: 간결한 카드형 답변
    → chatbot: 대화형 답변 스크립트
    → cardnews: 슬라이드형 콘텐츠
    → ad: 광고 카피 + USP
    → sales_script: 영업 대본
    → llm_txt: AI 학습용 텍스트

[4] 안전성 + 품질 자동 검증
    → Safety Gate: 의료 단정, 가격 약속, 거짓 주장 차단
    → Vibe Check: VPA 점수 0-100, 목표 미달 시 자동 톤 교정
    → MUST_INCLUDE / MUST_NOT_DO 위반 자동 탐지

[5] Hub Push → 다중 테넌트 발행
    → 1개 에셋 → N개 브랜드 AI홈피 동시 발행
    → 티어별 게이팅 자동 적용
```

#### 📊 Observatory — 대규모 프로빙

```
엔터프라이즈 프로빙 규모:

Starter:  1 브랜드 × 50 CQ × 5 AI = 250회/주
Pro:      3 라인 × 100 CQ × 5 AI = 1,500회/주
Elite:    5 브랜드 × 200 CQ × 5 AI = 5,000회/주

프로빙 결과:
  → 인용 여부 (yes/no/partial)
  → 답변 품질 (accuracy, completeness, brand_alignment)
  → 경쟁사 대비 포지션 (rank 1~10)
  → 시계열 추적 (주간/월간 트렌드)
```

#### 🔧 Orchestration 컨트롤 센터

```
파이프라인 4단계:
  bootstrap → collect → promote → finalize

엔터프라이즈 제어:
  → Pause/Resume 개별 Phase
  → Retry from failed Phase
  → Reset bootstrap / Reset pipeline data
  → Readiness 실시간 체크:
    benchmarkCount, goldenCount, auditCount, deepDiveCount,
    tcoCount, kgCount, signalCount, cqCount, sceneCount, recentRuns
```

#### ⚙️ API 엔드포인트

| API | 메서드 | 용도 | 엔터프라이즈 |
|-----|:-----:|------|:---------:|
| `/api/v1/answer-supply/pipeline` | POST | 원클릭 에셋 생성 | 대량 배치 |
| `/api/v1/answer-supply/publish` | POST | Hub Push + 발행 | 다중 테넌트 |
| `/api/v1/qis/predictions` | GET | 예측 질문 목록 | 200개+ |
| `/api/v1/qis/signals/collect` | POST | 시그널 수집 | 멀티소스 |
| `/api/v1/qis/signals/deduplicate` | POST | 중복 제거 | 자동 |
| `/api/v1/qis/signals/score` | POST | QVS 점수 산출 | 실시간 |
| `/api/pipeline/e2e` | POST | E2E 파이프라인 | 오케스트레이션 |
| `/api/sales-automation/gap-report` | POST | Gap 리포트 | 경쟁사 비교 |

---

### 2.2 aihompy 기능 가이드 (고객 접점)

aihompy는 **엔터프라이즈 고객의 모든 AI홈피와 콘텐츠를 통합 관리하는 플랫폼**입니다.

#### 📍 엔터프라이즈 전용 메뉴

| 메뉴 그룹 | 메뉴 | 기능 |
|----------|------|------|
| **콘텐츠 전략** | ✨ BSW 추천 질문 | BSW 예측 질문 열람 + Writer Hub 전송 |
| | 콘텐츠 갭 대시보드 | AI 공백 분석 + 대응 현황 |
| | QIS 레지스트리 | 질문 자산 총괄 관리 |
| | 허브 추천 질문 | 업종 트렌드 질문 |
| **콘텐츠 생산** | AI 콘텐츠 폴리싱 | 콘텐츠 편집 + AEO 점수 |
| | AEO 구조화 스튜디오 | 구조화 데이터 편집 |
| | Import Studio V3 | 대량 콘텐츠 가져오기 |
| **모니터링** | Observatory | 13-Layer BSA 감사 |
| | QIS Performance | CQ별 성과 추적 |
| | AI Briefing | 주간 AI 정성 분석 |
| | Content Quality | 콘텐츠 품질 감사 |
| **DealCard** | DealCard 대시보드 | 프로모션 관리 |
| | 매칭 현황 | 고객 자동 매칭 |
| | 활동 분석 | 전환 성과 분석 |
| **AI Ambassador** | AI 앰배서더 허브 | AI 답변 품질 관리 |
| | Golden Set | 정답 세트 관리 |
| | 콘텐츠 공백 | AI 답변 공백 감지 |

#### 🔬 Observatory — 13-Layer BSA (Brand Semantic Audit)

```
엔터프라이즈 전용 심층 감사:

Layer 1-3:  기본 구조 (HTML/메타/JSON-LD)
Layer 4-6:  E-E-A-T 신호 (전문성/경험/권위/신뢰)
Layer 7-9:  콘텐츠 품질 (깊이/포괄성/고유성)
Layer 10-12: AI 최적화 (llms.txt/robots.txt/사이트맵)
Layer 13:    종합 진단 + 레이더 차트

→ 각 Layer별 점수 (0-100) + S~F 등급
→ Action Recommender: 우선 교정 액션 자동 제안
→ Truth Dashboard: 6차원 진실성 평가 (observed/strategic/operational/evidence/boundaries/deltas)
```

#### 📊 Growth Pulse — 5탭 통합 대시보드

```
Tab 1: Traffic  — AI 유입 트래픽 추이
Tab 2: Citation — AI 인용 횟수 + 엔진별 분포
Tab 3: Question — CQ 커버리지율 + 신규 질문 발견
Tab 4: Content  — 콘텐츠 생산량 + 품질 점수
Tab 5: Revenue  — DealCard 전환 + 매출 기여

각 탭: 주간/월간/분기 기간 선택 + 목표 대비 달성률
```

#### 🔔 Smart Alert — Z-Score 기반 이상 감지

```
3단계 알림:

🟡 Watch (Z-Score 1.5~2.0)
   → "평소보다 인용 감소 추세 감지"
   → 자동 모니터링 강화

🟠 Warning (Z-Score 2.0~2.5)
   → "경쟁사 인용 증가로 상대적 하락"
   → 대응 콘텐츠 생산 권고

🔴 Critical (Z-Score 2.5+)
   → "긴급: AI 인용 급감 — 즉시 대응 필요"
   → Answer Factory 자동 전환 + 긴급 에셋 생산
```

#### 🧴 Beauty Pulse — 뷰티 전용 인텔리전스 (Elite+)

```
성분 Pulse:
  → INCI 기반 성분 트렌드 추적
  → 7D Vibe 분석 (7일간 성분 관심도 변화)
  → "레티놀" 관심 급등 → 관련 CQ 자동 추천

스킨케어 시그널:
  → 5개 신호원 통합 집계 (SNS/커뮤니티/검색/리뷰/뉴스)
  → 트렌드 선행 지표 → Q-Intelligence에 피드백
```

---

## 3. 티어별 기능 접근 권한

| 기능 | Starter (150만) | Pro (250만) | Elite (400만) | Strategic |
|------|:--------------:|:----------:|:------------:|:---------:|
| **Q-Intelligence** | | | | |
| 주간 예측 질문 | 8개 | 20개 | 무제한 | 무제한 |
| QVS 가치 분석 | ✅ | ✅ + 경쟁사 비교 | ✅ + 멀티마켓 | ✅ 커스텀 |
| 시즌 부스트 | ✅ | ✅ | ✅ | ✅ |
| **Answer Factory** | | | | |
| 월간 에셋 생산 | 30편 | 80편 | 150편 | 무제한 |
| 7채널 변형 | ✅ | ✅ | ✅ | ✅ |
| Attractor 가이드 | ✅ | ✅ | ✅ | ✅ 커스텀 |
| 대량 배치 처리 | ❌ | ✅ | ✅ | ✅ |
| **AI홈피** | | | | |
| 웹사이트 수 | 1개 | 3개 | 5개+ | 무제한 |
| Clone Transform | ❌ | ✅ 네이버/쿠팡 | ✅ 5개국 | ✅ N개국 |
| JSON-LD 스키마 | 전체 | 전체 | 전체 | 전체+커스텀 |
| **모니터링** | | | | |
| AI 엔진 스캔 | 5개 | 5개 | 5개+현지 AI | 커스텀 |
| 경쟁사 모니터링 | 3개 | 5개 | 10개 | 무제한 |
| Brand MRI | 월간 | 월간 | 주간 | 실시간 |
| Smart Alert | ✅ | ✅ | ✅ | ✅ 커스텀 룰 |
| Growth Pulse | 3탭 | 5탭 | 5탭 | 커스텀 탭 |
| AI Briefing | 월간 | 주간 | 주간 | 일간 |
| **DealCard** | | | | |
| 프로모션 카드 | 무제한 | 무제한 | 무제한 | 무제한 |
| A/B 테스트 | ✅ | ✅ | ✅ | ✅ |
| Matching Engine | 기본 | 고급 | 고급+Gamification | 커스텀 |
| **전담 지원** | | | | |
| 컨설턴트 | 공유 | 전담 1인 | 전담 1인 | 전담 2인 |
| 전략 워크숍 | ❌ | 분기 | 월간 | 분기 C-Level |
| SLA | 99% | 99.5% | 99.9% | 99.9%+커스텀 |

---

## 4. 시스템 간 통합 데이터 플로우 (엔터프라이즈 전체)

```
┌─ BSW-OS (Intelligence Engine) ──────────────────────────────────┐
│                                                                  │
│  Q-Intelligence ──→ Answer Factory ──→ Hub Push                  │
│    ↑ QEP/QVS/PAT      ↑ Attractor        ↓                     │
│    │                   ↑ Mission          ↓                     │
│  Observatory ←── Signal Collection      ↓ /api/v1/ai-hub/bsw/ingest
│    ↓ B-MRI              ↑                ↓                     │
│  Brand MRI ──→ 처방 플랜 ─→ Factory 실행  ↓                     │
│                                          ↓                     │
└──────────────────────────────────────────┼──────────────────────┘
                                           ↓
┌─ aihompy (Customer Platform) ────────────┼──────────────────────┐
│                                          ↓                     │
│  BSW 추천 질문 ←── /api/v1/tenant/bsw-assets                   │
│    ↓ Writer Hub로 보내기                                        │
│    ↓                                                            │
│  Writer Hub ──→ AI 초안 편집 ──→ AI홈피 발행                    │
│    ↓                              ↓                            │
│  DealCard ←── 프로모션 매칭       ↓ JSON-LD + llms.txt          │
│                                   ↓                            │
│  Observatory ←── 성과 추적        ↓ AI 크롤러 인덱싱             │
│    ↓ Growth Pulse                 ↓                            │
│    ↓ Smart Alert                  ↓                            │
│    ↓ AI Briefing                  AI 답변에 인용 시작            │
│    ↓ AEO Feedback Loop            ↓                            │
│    └──── Q-Intelligence에 피드백 ──→ BSW-OS                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
