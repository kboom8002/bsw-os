# 고수익 잠재 6대 수익 모델 심층 분석 및 GTM 전략

> R09 DealCard / R11 Writer Hub / R13 Q-Intelligence / R14 Answer Gap / R15 Beauty Pulse / R18 K-Verified
> 각 모델의 **구현 실태 -> 가치 제안 세분화 -> 상품 설계 -> GTM 경로** 도출

---

## R09. DealCard Engine — AI 프로모션 자동화

### 구현 실태 분석

| 모듈 | 파일 | 상태 |
|------|------|:----:|
| Pipeline FSM | `pipeline-fsm.ts` (테스트 포함) | 구현됨 |
| Matching Engine | `matching-engine.ts` + `cosine-similarity.ts` + `hard-filter.ts` | 구현됨 |
| Cross-Tenant Filter | `cross-tenant-filter.ts` | 구현됨 |
| Gamification (Card Grade) | `card-grade.ts` + `promotion-ranker.ts` | 구현됨 |
| RulePack Engine | `rulepack-engine.ts` + `user-level.ts` | 구현됨 |
| Vibe DealCard Bridge | `apps/web/lib/vibe-dealcard/` | 구현됨 |

> **핵심 강점**: 코사인 유사도 기반 매칭 + 게이미피케이션(카드 등급) + 크로스 테넌트 필터링이 이미 구현되어, 단순 쿠폰이 아닌 "AI 기반 맞춤 프로모션 매칭" 상품 설계가 가능함.

### 상품 티어 설계

#### Tier 0. Free (트래픽 획득 미끼)
- **가격**: 무료
- **제공**: 월 3장 DealCard 생성 + 기본 디자인 3종
- **제한**: 워터마크 + 분석 없음 + 자사 허브 내 노출만
- **목적**: 소상공인 첫 경험 -> 유료 전환

#### Tier 1. DealCard Starter (5만원/월)
- **가격**: 5만원/월 (연 결제 시 4만원)
- **제공**: 무제한 카드 생성 + 12종 템플릿 + 기본 성과 분석(노출/클릭/전환) + JSON-LD Offer 스키마 자동 삽입 + 카카오톡/인스타 공유 링크
- **타겟**: 소상공인 (카페, 미용실, 음식점)

#### Tier 2. DealCard Pro (15만원/월)
- **가격**: 15만원/월
- **제공**: Starter 전체 + **Matching Engine 활성화**(고객 바이브 기반 맞춤 카드 자동 추천) + A/B 테스트(2변형) + 시즌/날씨 자동 트리거 + Promotion Ranker 기반 최적 배치
- **타겟**: 2~5개 지점 운영 사업자

#### Tier 3. DealCard Brand (50만원/월)
- **가격**: 50만원/월
- **제공**: Pro 전체 + **Cross-Tenant 매칭**(타 허브 소비자 노출, 네트워크 효과) + 게이미피케이션(Bronze/Silver/Gold 카드 등급) + 경쟁사 프로모션 벤치마킹 + 브랜드 전용 디자인
- **타겟**: 뷰티/F&B 프랜차이즈

#### Tier 4. DealCard API (별도 협의)
- **제공**: RESTful API + Webhook + SDK
- **타겟**: 커머스 플랫폼, 대형 유통사
- **과금**: API 호출 건당 + 월 기본료

### GTM 전략

| Phase | 시기 | 전술 | 기대 효과 |
|-------|------|------|----------|
| 1 | 8월 | Free Tier 오픈 + 뷰티경제 "이달의 Deal" 연동 | 100% 초기 노출 |
| 2 | 10월 | Starter/Pro 유료 전환 + aihompy 사용자 업셀 | 전환율 3% |
| 3 | Q1'27 | Brand Tier + BNT 광고주 크로스셀 | 대형 계약 |

### 수익 시뮬레이션 (12개월 후)

| Tier | 가입사 | 월 매출 |
|------|:------:|:------:|
| Free | 500 | 0 |
| Starter | 150 | 750만 |
| Pro | 40 | 600만 |
| Brand | 5 | 250만 |
| **합계** | | **1,600만/월** |

---

## R11. Writer Hub + AI Copilot — AEO 콘텐츠 운영 도구

### 구현 실태 분석

| 모듈 | 파일 | 기능 |
|------|------|------|
| WriterHubClient | `WriterHubClient.tsx` (278줄) | 멤버십/제출/작성 3탭 UI |
| PlatformWritePanel | `PlatformWritePanel.tsx` (419줄) | 4단계 위저드 (주제->AI생성->편집->제출) |
| Platform Writer Engine | `platform-writer-engine.ts` | AI 콘텐츠 생성 엔진 |
| Writer Prompts | `platform-writer-prompts.ts` | 프롬프트 레지스트리 |
| Clone Transform | `clone-transform-engine.ts` (20KB) | 1원본->N파생 (다국어, 채널별, 톤 변형) |
| AI Copilot | `apps/web/lib/copilot/` | AI 보조 에디터 |
| Content Authority | `contentAuthority.ts` | 콘텐츠 권한/품질 관리 |

> **핵심 강점**: "주제 입력 -> AI 초안 생성 -> 편집 -> 발행"까지 4단계 파이프라인 구현 완료. Clone Transform으로 1원본 -> N파생(다국어, 채널별, 톤 변형) 가능.

### 사용자별 가치 제안

| 사용자 | 핵심 페인포인트 | Writer Hub 가치 |
|--------|--------------|----------------|
| 언론사 기자 | AI용 기사 포맷(JSON-LD, 구조화) 수동 작업 | 자동 구조화 + llms.txt |
| 브랜드 마케터 | 답변형 콘텐츠 작성 역량 부족 | AI 초안 + 가이드 |
| 에이전시 | 다수 클라이언트 콘텐츠 대량 관리 | 멀티 테넌트 + 벌크 |
| 소상공인 | 콘텐츠 작성 시간/역량 없음 | 원클릭 생성 |

### 상품 티어 설계

#### Tier 1. Writer Lite (무료, aihompy 내장)
- **가격**: aihompy SaaS 포함
- **제공**: 월 5편 AI 초안 생성 + 기본 에디터 + JSON-LD FAQPage 자동
- **목적**: aihompy 사용자의 자연스러운 콘텐츠 생산 유도

#### Tier 2. Writer Pro (15만원/월)
- **가격**: 15만원/월
- **제공**: 무제한 AI 초안 + **Clone Transform** 활성화(1원본->3채널 자동 변형) + SEO/AEO 점수 실시간 표시 + 예약 발행 + CQ 자동 변환 제안
- **타겟**: 브랜드 마케터 (1인 또는 소규모 팀)

#### Tier 3. Writer Team (40만원/월)
- **가격**: 40만원/월 (5시트 포함, 추가 시트 5만원)
- **제공**: Pro 전체 + **다국어 Transform**(한->영/중/일 + hreflang 자동) + 팀 워크플로우(작성->검토->승인->발행) + 역할 분리(Writer/Editor/Publisher) + 브랜드 보이스 가이드 + BSW Governance 연동(Evidence Level + Safety 경고)
- **타겟**: 에이전시, 중견 브랜드 마케팅팀

#### Tier 4. Newsroom (100만원/월)
- **가격**: 100만원/월 (10시트 포함)
- **제공**: Team 전체 + **Mission Compiler 연동**(BSW-OS 추천 CQ 자동 유입) + **Observatory 연동**(발행 기사 AI 인용 추적) + API 접근(CMS 연동) + SLA 24시간 + 월간 성과 컨설팅 1회
- **타겟**: 미디어/언론사 편집국

### GTM 전략

| Phase | 시기 | 전술 | 기대 효과 |
|-------|------|------|----------|
| 1 | 8월 | Writer Lite -> aihompy 전 사용자 기본 제공 | 자연 노출 |
| 2 | 9월 | 뷰티경제 편집국 Newsroom 내부 도입 (레퍼런스) | 신뢰 확보 |
| 3 | 10월 | Pro/Team 베타 모집 (10사 무료 1개월) | 전환율 30% 목표 |
| 4 | Q1'27 | 에이전시 채널 오픈 -> 리셀러 마진 30% | 확장 |

**킬러 데모**: "1편 쓰면 4채널 배포" Clone Transform 라이브 시연

### 수익 시뮬레이션 (12개월 후)

| Tier | 가입사 | 월 매출 |
|------|:------:|:------:|
| Lite (내장) | 200 | 0 (SaaS 수익 기여) |
| Pro | 30 | 450만 |
| Team | 10 | 400만 |
| Newsroom | 3 | 300만 |
| **합계** | | **1,150만/월** |

---

## R13. Q-Intelligence — 질문 트렌드 인텔리전스

### 구현 실태 분석

| 모듈 | 파일 | 기능 |
|------|------|------|
| **QEP** | `qis-local-qep.ts` (529줄) | 시그널 수집 -> Gemini 분석 -> 질문 예측 + 1:3 Fan-out |
| **QVS** | `qis-local-qvs.ts` (179줄) | QVS = Vol x Conv x ARPU x FM x (1-Comp) 가치 평가 |
| **PAT** | `qis-local-pat.ts` (305줄) | 슈퍼포캐스팅 기반 자가학습 + 편향 감지 |
| Benchmark Receiver | `qis-benchmark-receiver.ts` | 외부 벤치마크 수신 |
| Metrics Collector | `qis-metrics-collector.ts` | QIS 성능 지표 수집 |
| Industry Templates | `industry-templates.ts` (22KB) | 업종별 시그널 가중치 템플릿 |
| Mission Creator | `missionCreator.ts` | 예측 질문 -> 콘텐츠 미션 변환 |

> **핵심 강점**: **"14일 내 소비자가 AI에게 물을 질문을 예측하고, 각 질문의 원화 환산 가치(QVS)를 산출하며, 예측 정확도를 자가 학습(PAT)하는"** 3단 파이프라인. 시장에 이런 제품은 없음.

### vs 기존 SEO 도구 차별화

| 기존 SEO 키워드 도구 | Q-Intelligence |
|:------------------:|:--------------:|
| 과거 검색량 기반 | **미래** 질문 예측 (14일 후) |
| Google 검색만 분석 | AI 5개 엔진 답변 분석 |
| 키워드 나열 | 원화 환산 가치(QVS) 제공 |
| 정확도 보증 없음 | 슈퍼포캐스팅 자가학습(PAT) |
| 업종 무관 일반 분석 | 업종별 시그널 가중치 템플릿 |

### 상품 티어 설계

#### Tier 1. Q-Pulse (30만원/월)
- **가격**: 30만원/월
- **제공**: 업종별 주간 트렌드 리포트(떠오르는 질문 TOP 20) + QVS 점수 + AI 커버리지 표시(none/sparse/moderate/saturated) + 시즌 부스트 알림 + 이메일+대시보드
- **타겟**: 소형 브랜드, 마케팅 실무자

#### Tier 2. Q-Intelligence Pro (80만원/월)
- **가격**: 80만원/월
- **제공**: Q-Pulse 전체 + **자사 브랜드 질문 전수 분석** + **1:3 Fan-out 분석**(기본+YMYL Safety 파생+경쟁 비교 파생) + 경쟁사 3사 비교 + 미션 자동 생성(Writer Hub 연결) + 월간 컨설팅 1회(30분)
- **타겟**: 중견 뷰티 브랜드 마케팅팀

#### Tier 3. Q-Intelligence Enterprise (200만원/월)
- **가격**: 200만원/월
- **제공**: Pro 전체 + **PAT 정확도 리포트**(지난달 예측 vs 실제 출현율) + 커스텀 업종 템플릿 + 경쟁사 무제한 비교 + API 접근(내부 BI 연동) + 전략 컨설팅 월 2회(1시간) + **보장: 예측 정확도 60% 미만 시 다음 달 무료**
- **타겟**: 대기업 브랜드, CMO 직보

#### Tier 4. Q-Intelligence for Media (150만원/월)
- **가격**: 150만원/월 (미디어 특별 가격)
- **제공**: 업종별 떠오르는 질문 -> 기사 주제 자동 변환 + "AI가 아직 답 못함" = 기사 가치 높음 표시 + 편집회의용 주간 브리핑 자동 생성 + Writer Hub Newsroom 연동
- **타겟**: 미디어 편집국

### GTM 전략

| Phase | 시기 | 전술 |
|-------|------|------|
| 1 | 8월 | 뷰티경제 내부 기사 주제 선정 도구로 사용 (내부 레퍼런스) |
| 2 | 9월 | "AI 답변을 선점하라" 시리즈에서 Q-Intelligence 결과를 기사 소재로 활용 |
| 3 | 10월 | Q-Pulse 외부 판매 개시 + 무료 "위클리 브리핑" 뉴스레터 |
| 4 | Q1'27 | Enterprise + API 출시 |

**킬러 전략**: PAT 정확도를 공개하여 신뢰 확보 (목표: 70%+)

### 수익 시뮬레이션 (12개월 후)

| Tier | 가입사 | 월 매출 |
|------|:------:|:------:|
| Q-Pulse | 20 | 600만 |
| Pro | 8 | 640만 |
| Enterprise | 3 | 600만 |
| Media | 2 | 300만 |
| **합계** | | **2,140만/월** |

---

## R14. Answer Gap Intelligence — AI 공백 지도

### 구현 실태 분석

| BSW-OS 모듈 | 파일 | 기능 |
|-------------|------|------|
| Observatory Probe | `lib/signal-collection/observatory-probe.ts` | 5개 AI 엔진 동시 질의 + 답변 비교 |
| Performance Tracker | `lib/signal-collection/signal-performance-tracker.ts` | 인용 성과 추적 |
| Deduplicate Pipeline | `apps/web/lib/qis/dedupPipeline.ts` | 중복 질문 제거 |
| Golden Set Manager | `apps/web/lib/qis/goldenSetManager.ts` | 기준 질문 세트 관리 |
| QVS | `qis-local-qvs.ts` | 공백의 경제적 가치 산출 |

> **핵심 강점**: ChatGPT, Gemini, Perplexity, Claude, Copilot **5개 AI 동시 비교 진단**. "어떤 질문에 어떤 AI가 제대로 답하지 못하는가"를 시각화하는 유일한 도구.

### R13과의 시너지

```
R13 Q-Intelligence               R14 Answer Gap
"소비자가 곧 물을 질문" (미래)     "AI가 아직 못 답하는 질문" (현재)
         ↓ 결합하면 ↓
  "높은 가치(QVS) + 아직 공백(Gap)"
  = 최고 우선순위 콘텐츠 기회
```

### 상품 티어 설계

#### Tier 1. Gap Snapshot (건당 30만원)
- **가격**: 30만원 / 1회
- **제공**: 특정 카테고리 질문 20개 x AI 5개 엔진 동시 진단 + Gap Map 히트맵 + 공백 질문 TOP 5 + QVS 가치 산출 + PDF 리포트
- **타겟**: 브랜드 마케터 (1회성 진단)

#### Tier 2. Gap Monitor (50만원/월)
- **가격**: 50만원/월
- **제공**: 자사 핵심 CQ 50개 주간 자동 모니터링 + 신규 공백 실시간 알림 + 경쟁사 답변 변동 감지 + 월간 Gap Trend 리포트 + 대시보드
- **타겟**: 브랜드 마케팅팀

#### Tier 3. Gap + Action (100만원/월)
- **가격**: 100만원/월
- **제공**: Monitor 전체 + **Action Pipeline**(공백 발견 -> Writer Hub 미션 자동 생성) + BSW-OS Answer Asset 자동 생산(월 10 CQ) + 발행 후 Citation 추적(End-to-End) + "공백 선점 -> 인용 획득" 전체 사이클 관리
- **타겟**: 중견~대기업 브랜드

#### Tier 4. Gap Intelligence for Media (80만원/월)
- **가격**: 80만원/월
- **제공**: "AI가 모르는 것 = 기사 가치 높은 것" 로직 + 주간 편집회의용 Gap Report("이번 주 AI가 틀리게 답한 질문 TOP 10")
- **번들**: R13 Media와 합산 시 150만원 (개별 대비 30% 할인)

### GTM 전략

**킬러 콘텐츠**: 매월 "AI 오답 리포트"를 뷰티경제 기사로 발행
- "ChatGPT는 이 성분을 모른다" -> 브랜드 즉각 반응 -> Gap + Action 계약

| Phase | 시기 | 전술 |
|-------|------|------|
| 1 | 8월 | "AI 답변을 선점하라" 1막에 Gap Snapshot 결과를 기사 소재 활용 |
| 2 | 9월 | 뷰티경제 독자 대상 "무료 Gap Snapshot 체험" (10사) |
| 3 | 10월 | Monitor + Action 유료 전환 |
| 4 | Q1'27 | 에이전시 채널 -> 리셀러 구조 |

### 수익 시뮬레이션 (12개월 후)

| Tier | 건수/가입사 | 월 매출 |
|------|:---------:|:------:|
| Snapshot | 월 5건 | 150만 |
| Monitor | 15사 | 750만 |
| Gap+Action | 5사 | 500만 |
| Media | 2사 | 160만 |
| **합계** | | **1,560만/월** |

---

## R15. Beauty Pulse — 뷰티 시장 인텔리전스

### 구현 실태 분석

| 모듈 | 파일 | 기능 |
|------|------|------|
| **Ingredient Pulse Engine** | `ingredientPulseEngine.ts` (297줄) | 성분별 트렌드: 7D Vibe Vector + INCI + 임상 근거 등급 |
| **Skincare Signal Aggregator** | `skincareSignalAggregator.ts` (229줄) | 5개 신호원 앙상블(Ambassador QA 30%, 성분검색 25%, 리뷰감성 20%, 시즌 15%, 제품 10%) |
| Beauty Oiticle Types | `beautyOiticleTypes.ts` (7.8KB) | 뷰티 특화 콘텐츠 타입 |
| Trend Signal Aggregator | `trendSignalAggregator.ts` (6KB) | 일반 트렌드 신호 수집 |
| Artist Resonance Radar | `artistResonanceRadar.ts` (7.7KB) | 크리에이터 공명도 추적 |
| Pulse Engine (Core) | `pulseEngine.ts` (8.9KB) | 통합 Pulse 엔진 |

> **핵심 강점**: **성분 INCI 매핑 + 7차원 바이브 벡터 + 임상 근거 등급(A/B/C) + 5개 신호원 앙상블** 결합. 이 깊이의 뷰티 데이터 제품은 시장에 없음.

### 상품 티어 설계

#### Tier 1. Pulse Weekly (20만원/월)
- **가격**: 20만원/월
- **제공**: 주간 성분 트렌드 TOP 10(트렌드 스코어+전주 대비 변동) + 소비자 고민 트렌드 TOP 5(시즌 관련도 포함) + 급상승 성분 Alert(50%+ 급등) + 이메일 뉴스레터+웹 대시보드
- **타겟**: 소형/인디 뷰티 브랜드

#### Tier 2. Pulse Pro (60만원/월)
- **가격**: 60만원/월
- **제공**: Weekly 전체 + **성분 심층 프로필**(INCI명+7D Vibe Vector+임상 근거 등급+시너지/주의 성분) + 카테고리별 분석(클렌저/세럼/크림/선케어) + **소비자 고민->성분->제품** 연결 지도 + 분기 전망 리포트 + CSV 다운로드
- **타겟**: 중견 뷰티 브랜드 R&D/마케팅

#### Tier 3. Pulse Enterprise (150만원/월)
- **가격**: 150만원/월
- **제공**: Pro 전체 + **경쟁 브랜드 성분 포트폴리오 비교** + 소비자 VOC(Ambassador QA) 원문 접근 + 신제품 출시 타이밍 추천(시즌/트렌드 기반) + API 연동(내부 R&D) + 월간 전략 컨설팅(1시간)
- **타겟**: 대기업 뷰티 브랜드 (아모레, LG생건 등)

#### Tier 4. Pulse Media (80만원/월)
- **가격**: 80만원/월
- **제공**: 주간 "성분 이슈 브리핑" 자동 생성 + "이번 주의 성분" 기사 초안 자동 + 소비자 고민 -> 기획 기사 주제 추천 + Writer Hub 연동
- **타겟**: 뷰티경제/BNT 편집국

### GTM 전략

| Phase | 시기 | 전술 | 기대 효과 |
|-------|------|------|----------|
| 1 | 8월 | 뷰티경제 "이번 주의 성분" 연재 시작 (Pulse 데이터 기사화) | Pulse = 기사 소재 |
| 2 | 9월 | 기사 하단 "Beauty Pulse 제공" CTA 삽입 | 제품 인지 |
| 3 | 10월 | Weekly 유료 오픈 + 무료 "월간 성분 다이제스트" PDF | 리드 수집 |
| 4 | Q4 | Pro/Enterprise -> 브랜드 영업 | 매출 확대 |

**킬러 전략**: Pulse 데이터 자체가 기사 소재 = 무한 콘텐츠 마케팅 루프

### 수익 시뮬레이션 (12개월 후)

| Tier | 가입사 | 월 매출 |
|------|:------:|:------:|
| Weekly | 30 | 600만 |
| Pro | 10 | 600만 |
| Enterprise | 3 | 450만 |
| Media | 2 | 160만 |
| **합계** | | **1,810만/월** |

---

## R18. K-Verified — 한류 원산지 인증

### 구현 실태 분석

| 자산 | 상태 | 활용 |
|------|:----:|------|
| BSW-OS Evidence Registry | 구현됨 | 6단계 근거 등급 -> 인증 기준 |
| Safety Gate | 구현됨 | YMYL 안전성 검증 |
| Validator Guild | 구현됨 | 다중 검증인 합의 |
| hreflang Manager | 구현됨 | 다국어 원본-번역 연결 |
| BNT 뉴스 파트너십 | 확보 | 한국 현지 미디어 발행 권위 |
| Clone Transform (다국어) | 구현됨 | 한->영/중/일 콘텐츠 변환 |

> **핵심 강점**: 글로벌 K-beauty 시장에서 "한국산 정본(Authentic Korean Source)"임을 AI 엔진에 증명하는 **신뢰 마크**.

### 시장 페인포인트

1. 한국 성분/제품 정보가 영어 번역 시 오역/왜곡
2. AI가 비공인 소스(Reddit, 개인 블로그)에서 틀린 K-beauty 정보 학습
3. 글로벌 소비자가 "이 정보가 진짜 한국에서 온 것인지" 확인 불가
4. 한국 브랜드의 수출 시 "정본 한국 정보" 영어 유통 체계 부재

### 상품 티어 설계

#### Tier 1. K-Verified Basic (150만원/년)
- **가격**: 150만원/년 (월 12.5만)
- **제공**: BSW-OS Governance 검증 마크(Bronze+) + K-Verified 배지(웹+콘텐츠) + JSON-LD isTrustedSource 메타데이터 + 연 1회 검증 심사 + K-Verified 디렉토리 등재(answerhub.kr)
- **타겟**: 신진/인디 K-beauty 브랜드

#### Tier 2. K-Verified Pro (300만원/년)
- **가격**: 300만원/년
- **제공**: Basic 전체 + **BNT뉴스 영문 브랜드 프로필 기사 1편/분기**(4편/년) + hreflang 연결(한국어 원본<->영문) + 분기별 검증 심사(연 4회) + AI 5개 엔진 인용 모니터링 + 디렉토리 상위 노출
- **타겟**: 수출 중인 중견 K-beauty 브랜드

#### Tier 3. K-Verified Enterprise (600만원/년)
- **가격**: 600만원/년
- **제공**: Pro 전체 + **BNT뉴스 전용 브랜드 페이지 + 월 1편 영문 기사** + 3개국어 콘텐츠 자동 변환(한/영/중 or 한/영/일) + 글로벌 AI 답변 모니터링(ChatGPT EN, Gemini EN, Perplexity EN) + Brand MRI 글로벌 리포트(분기) + 전담 매니저
- **타겟**: 글로벌 진출 대형 K-beauty 브랜드

#### Tier 4. K-Verified Consortium (별도 가격)
- **가격**: 참여 브랜드당 200만원/년 (최소 10사)
- **제공**: 특정 제품 카테고리 컨소시엄(예: "한국 선크림") + 카테고리 정본 영문 콘텐츠 허브 + 공동 BNT 기사(월 2편) + AI 답변 내 컨소시엄 브랜드 우선 인용
- **타겟**: K-beauty 산업 협회, 수출 조합

### GTM 전략

| Phase | 시기 | 전술 | 기대 효과 |
|-------|------|------|----------|
| 1 | 8월 | BNT "K-beauty 팩트체크" 시리즈 시작 | 문제 인식 |
| 2 | 9월 | 선도 K-beauty 3사 파일럿 (무료 6개월 Pro) | 사례 확보 |
| 3 | Q4 | K-Verified Basic 정식 오픈 | 매출 시작 |
| 4 | 2027 | Consortium -> 대한화장품산업연구원 등 협회 제휴 | 규모화 |

**킬러 콘텐츠**: "AI가 한국 화장품에 대해 틀리게 답하는 것들" BNT 시리즈

### 수익 시뮬레이션 (12개월 후)

| Tier | 가입사 | 연 매출 |
|------|:------:|:------:|
| Basic | 30 | 4,500만 |
| Pro | 15 | 4,500만 |
| Enterprise | 5 | 3,000만 |
| Consortium | 1건 (10사) | 2,000만 |
| **합계** | | **14,000만/년 (월 1,170만)** |

---

## 6대 모델 통합 시뮬레이션

### 월 매출 요약

| # | 모델 | 월 매출 | 비중 |
|---|------|:------:|:----:|
| R09 | DealCard Engine | 1,600만 | 17% |
| R11 | Writer Hub + Copilot | 1,150만 | 12% |
| R13 | Q-Intelligence | 2,140만 | 23% |
| R14 | Answer Gap Intelligence | 1,560만 | 17% |
| R15 | Beauty Pulse | 1,810만 | 19% |
| R18 | K-Verified | 1,170만 | 12% |
| **합계** | | **9,430만/월** | 100% |
| **연간** | | **~11.3억/년** | |

### 번들 시너지 전략

6개 모델은 서로를 강화하는 플라이휠을 형성합니다:

```
R13 Q-Intelligence  --발견-->  R14 Gap Intelligence  --생산-->  R11 Writer Hub
     (질문 예측)                   (공백 진단)                    (콘텐츠 생산)
         |                            |                              |
         +--------- R15 Beauty Pulse -+------------------------------+
                   (시장 트렌드 분석)
                         |
                   R18 K-Verified
                   (인증/신뢰 부여)
                         |
                   R09 DealCard
                   (프로모션 유통)
```

### 번들 상품 제안

| 번들 | 포함 모델 | 개별 합산 | 번들 가격 | 할인율 |
|------|----------|:--------:|:--------:|:-----:|
| **Discovery Bundle** | R13 Q-Pulse + R14 Gap Snapshot(월1) | 60만 | 50만/월 | 17% |
| **Content Bundle** | R13 Pro + R14 Monitor + R11 Pro | 145만 | 120만/월 | 17% |
| **Brand Shield** | R14 Gap+Action + R15 Pro + R18 Pro(월환산) | 185만 | 150만/월 | 19% |
| **Full Stack AEO** | 6개 전체 최고 Tier | 545만(월환산) | 400만/월 | 27% |

### 종합 GTM 타임라인

| 월 | R09 DealCard | R11 Writer | R13 Q-Intel | R14 Gap | R15 Pulse | R18 K-Verified |
|:--:|:-----------:|:----------:|:----------:|:-------:|:---------:|:--------------:|
| 8월 | Free Tier 오픈 | Lite 내장 | 내부 레퍼런스 | 기사 소재 | 기사 시리즈 | BNT 기사 |
| 9월 | - | Newsroom(내부) | 뉴스레터 | 무료 체험 | - | 파일럿 3사 |
| 10월 | Starter/Pro | Pro/Team 베타 | Q-Pulse 유료 | Monitor 유료 | Weekly 유료 | - |
| 11월 | - | - | - | Action 유료 | - | - |
| 12월 | - | - | - | - | Pro/Enterprise | Basic 정식 |
| Q1'27 | Brand Tier | 에이전시 채널 | Enterprise+API | 에이전시 채널 | - | Consortium |
