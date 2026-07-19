# 🥇 AEO 올인원 — 고객 사용자 시나리오 & 시스템 기능 가이드

> **상품**: AEO 올인원 (Basic 29만 / Pro 59만 / Premium 129만원)
> **대상**: 소상공인, 소형 뷰티 브랜드, 1인 사업자
> **한 줄 요약**: "가입하면 AI가 추천하는 우리 가게가 완성됩니다"

---

## 1. 고객 사용자 시나리오

### 시나리오 A — Basic(29만): 존재감을 만드는 첫 걸음

> **페르소나**: 김미영 (42세, 강남 피부관리실 원장)
> **현재 상황**: 네이버 블로그 + 인스타그램만 운영. AI에게 물으면 가게가 안 나옴.

#### Day 1: 가입 및 AI홈피 자동 생성

```
① aihompy 접속 → "무료 시작" 클릭

② 온보딩 위저드 (3분)
   • 업종: 피부관리 선택
   • 상호명, 주소, 전화, 영업시간 입력
   • 대표 사진 3장 업로드 (또는 네이버 플레이스 자동 연동)
   • 강점 2줄 입력 (예: "15년 경력 피부관리 전문")

③ AI 자동 실행 (고객은 기다리기만!)
   → 업종 맞춤 디자인 프리셋 선택
   → AEO 웹사이트 자동 생성 (5분 이내)
   → 상황형 섹션 2개 자동 배치
   → JSON-LD (FAQPage) + llms.txt 자동 삽입
```

**고객 체감**: "제가 뭔가 한 게 없는데 웹사이트가 생겼어요!"

#### Week 1: 첫 번째 AI 추천 질문 수신

```
④ BSW Q-Intelligence 가동
   → "강남 민감성 피부 관리 잘하는 곳" 질문 발견
   → QVS 점수 87 / AI 공백 상태: 🔴 없음

⑤ aihompy BSW 추천 질문 대시보드에 알림 표시
   "이 질문은 AI에서 아직 아무도 답하지 않았습니다"

⑥ 고객이 "Writer Hub로 보내기" 클릭
   → AI가 FAQ 형식 초안 자동 생성
   → 고객이 간단히 검토 후 "발행" 클릭

⑦ AI홈피에 FAQ 페이지 발행 완료
   → JSON-LD FAQPage 스키마 자동 삽입
   → llms.txt 업데이트
```

**고객 체감**: "AI가 알아서 질문을 찾아주고 답변까지 써줬어요. 발행 버튼만 눌렀어요."

#### Month 1~3: 반복 사이클

```
매월 3개 질문 추천 → 3편 콘텐츠 발행 → 3개월 = 9편 누적

⑧ 3개월 후: AI 가시성 리포트 (분기 간이)
   → ChatGPT 검색: "강남 피부관리" → 김미영 피부관리실 첫 언급!
   → Gemini 검색: 아직 미출현 → "추가 콘텐츠 3편 추천"
```

---

### 시나리오 B — Pro(59만): AI 추천의 단골이 되는 법

> **페르소나**: 박소연 (35세, 스킨케어 브랜드 마케팅 매니저)
> **현재 상황**: 자사 웹사이트 있으나 JSON-LD/llms.txt 없음

#### Week 1: BSW 추천 질문 7개 수신

```
① BSW Q-Intelligence 파이프라인 가동
   → 업종(스킨케어) 트렌드 분석
   → 7개 예측 질문 도출 + QVS 우선순위 정렬

② aihompy BSW 추천 질문 대시보드
   ┌──────────────────────────────────────────────────────┐
   │ 🔴 AI 공백 | "레티놀 처음 쓰는 법" | QVS 92 | ⏱ 14일  │ [Writer Hub로 보내기]
   │ 🟠 희박   | "비타민C 세럼 순서"    | QVS 85 | ⏱ 21일  │ [Writer Hub로 보내기]
   │ 🟡 보통   | "나이아신아마이드 효과"  | QVS 78 | ⏱ 30일  │ [Writer Hub로 보내기]
   │ ...5건 더                                             │
   └──────────────────────────────────────────────────────┘

③ 7편 모두 "Writer Hub로 보내기" → 초안 생성 → 편집 → 발행
   → 각 페이지에 JSON-LD (FAQPage + Product) 자동 삽입
   → SEO/AEO 점수 실시간 확인 가능 (Pro 전용)
```

#### Month 2: 시즌 부스트

```
④ BSW Q-Intelligence가 "여름 자외선 차단" 시즌 부스트 감지
   → 관련 질문 3개 긴급 추천 + "선점 기회 7일"
   → 고객 즉시 초안 생성 → 발행

⑤ 월간 AI 가시성 리포트 (Pro: 매월)
   → ChatGPT + Gemini + Perplexity 3개 엔진 스캔
   → "레티놀 처음 쓰는 법" → ChatGPT 인용 시작!
   → Gap 분석: "아직 2개 질문 미커버" → 우선 생산 안내
```

#### Month 6: 업계 TOP 3 진입

```
⑥ 누적 콘텐츠 42편 + 예약 발행 워크플로우 활용
   → 주 2편 자동 예약 발행
   → AI 3개 엔진에서 "스킨케어 루틴" 관련 질문 70% 커버
   → 업계 AI 가시성 TOP 3 달성
```

---

### 시나리오 C — Premium(129만): AI 시대의 카테고리 킹

> **페르소나**: 이준호 (45세, 중소 뷰티 브랜드 대표, 해외 수출 준비)

```
Week 1:  월 15개 질문 발견 (한국어+영어 동시)
         → 15편 콘텐츠 생산 + 다국어 동시 발행
         → 5개 AI 엔진 모니터링 시작

Month 1: 검토 승인 워크플로우 (대표→팀장→발행)
         → Clone Transform: 1편 → 7채널 자동 변환
         → DealCard: 브랜드 커스텀 프로모션 카드 연결

Month 3: 월간 리포트 + 경쟁사 비교 + Alert
         → "경쟁사 B가 '비건 화장품' 키워드 인용 시작"
         → 즉시 교정 콘텐츠 생산 → 선제 대응

Month 6: 국내+글로벌 AI 가시성 동시 확보
         → K-Verified 연계 수출 브랜딩
```

---

## 2. 시스템 기능 가이드

### 2.1 BSW-OS 기능 가이드 (운영자용)

BSW-OS는 **AEO 올인원 고객을 위한 Q-Intelligence 예측 + Answer Asset 생산 엔진**입니다.

#### 📍 접근 경로

| 메뉴 | 경로 | 기능 |
|------|------|------|
| **🏭 Answer Factory** | `Semantic Core > Answer Factory` | 5단계 워크플로우: CQ 선택 → Mission → Draft → Preview → Publish |
| **📊 Observatory** | `Monitoring > Observatory` | AI 5개 엔진 프로빙 + 성과 추적 |
| **📡 Signals** | `Semantic Core > Signals` | 시그널 수집 + 분석 |
| **🔗 Sales Automation** | `Sales > Gap Report` | 고객 매칭용 Gap 분석 리포트 |

#### 🏭 Answer Factory 사용법 (5단계)

```
Step 1: Select — 대응할 CQ + Scene 선택
  ┌────────────────────────────────────────┐
  │ CQ 목록 (QVS 점수순 정렬)               │
  │ ☑ "레티놀 처음 쓰는 법" (QVS: 92)       │
  │   └ Scene: 초보자_야간_루틴             │
  │ ☑ "비타민C 세럼 순서" (QVS: 85)         │
  │   └ Scene: 데일리_모닝_루틴             │
  └────────────────────────────────────────┘

Step 2: Mission — AI가 자동 컴파일
  → mustInclude[], requiredEvidence[], decisionCriteria[]
  → Attractor 적합도 평가 (7축 ContextTensor)

Step 3: Draft — AI 초안 + 안전성 검증
  → PreemptiveContentFactory가 LLM 초안 생성
  → Safety Gate: 의료 단정, 가격 약속 등 위반 자동 차단
  → Vibe Check: VPA 점수 < 목표 시 자동 톤 교정

Step 4: Preview — HTML + JSON-LD 미리보기
  → 7채널 변형 (homepage, answer_card, chatbot...)
  → JSON-LD (FAQPage/Article/Product) 확인

Step 5: Publish — Hub Push
  → aihompy 고객 대시보드로 전송
  → Tenant Queue에 등록 → 고객 열람 가능
```

#### ⚙️ API 엔드포인트

| API | 메서드 | 용도 |
|-----|:-----:|------|
| `/api/v1/answer-supply/pipeline` | POST | 원클릭 에셋 생성 |
| `/api/v1/answer-supply/publish` | POST | Hub Push + 발행 |
| `/api/v1/qis/predictions` | GET | 예측 질문 목록 |
| `/api/v1/qis/signals/collect` | POST | 시그널 수집 |

---

### 2.2 aihompy 기능 가이드 (고객 접점)

aihompy는 **AEO 올인원 고객이 직접 사용하는 AI홈피 + 콘텐츠 관리 플랫폼**입니다.

#### 📍 고객 접근 메뉴 (Foundation 섹션)

| 메뉴 | 경로 | 기능 |
|------|------|------|
| **✨ BSW 추천 질문** | `Studio > Foundation > BSW 추천 질문` | BSW에서 도출된 예측 질문 열람 + Writer Hub 전송 |
| **🧠 질문 자산 분류기 (QIS)** | `Studio > Foundation > QIS` | Raw 질문 → AI 클러스터링 → 표준 규격 승인 |
| **📋 QIS 레지스트리** | `Studio > Foundation > QIS Registry` | 승인된 질문 자산 목록 관리 |
| **📊 콘텐츠 갭 대시보드** | `Studio > Foundation > QIS Gap` | AI 공백 분석 + 대응 우선순위 |
| **💡 내 질문 자산** | `Studio > Questions > Clusters` | 클러스터별 질문 자산 관리 |

#### ✨ BSW 추천 질문 대시보드 사용법

```
① 대시보드 접속
   → 4개 스탯 카드:
     • 총 추천 질문 수
     • 🔴 AI 공백 질문 (선제 대응 필요)
     • ⭐ 고확신 예측 (신뢰도 80%+)
     • ✅ 발행 완료

② 필터 탭으로 우선순위 파악
   → [전체] [🔴 AI 공백] [⭐ 고확신] [✅ 발행됨]

③ 질문 카드 확인
   → AI 커버리지 상태 (🔴 없음 / 🟠 희박 / 🟡 보통 / 🟢 포화)
   → 확신도 (%)
   → 선점 기회 (일 수)
   → 추천 포맷 (answer_card, homepage 등)
   → QVS 가치 점수

④ "Writer Hub로 보내기" 클릭
   → AI가 자동으로 초안 생성
   → Writer Hub 편집 화면으로 이동
   → 검토 후 AI홈피에 발행
```

#### 🔄 전체 고객 워크플로우

```
[BSW-OS]                              [aihompy]
                                       
Q-Intelligence 파이프라인              
  ↓ 예측 질문 도출                      
  ↓ QVS 가치 산출                       
  ↓ Hub Push ──────────────────────→  BSW 추천 질문 대시보드
                                        ↓ 고객 열람
                                        ↓ "Writer Hub로 보내기"
                                        ↓ AI 초안 자동 생성
                                        ↓ 편집 + 검토
                                        ↓ AI홈피 발행
                                        ↓ JSON-LD + llms.txt 자동
                                       
                                       Observatory
                                        ↓ AI 가시성 추적
                                        ↓ 성과 리포트
```

#### 📊 Observatory (성과 측정)

| 메뉴 | 기능 |
|------|------|
| **QIS Performance** | QIS 클러스터별 커버리지율, 인용 횟수, 우선순위 |
| **AI Briefing** | Gemini 기반 주간 AI 정성 분석 브리핑 |
| **Content Quality** | 콘텐츠 품질 점수 및 개선 권고 |

---

## 3. 티어별 기능 접근 권한 요약

| 기능 | Basic | Pro | Premium |
|------|:-----:|:---:|:-------:|
| BSW 추천 질문 열람 | 월 3개 | 월 7개 | 월 15개 |
| Writer Hub AI 초안 | 월 3편 | 월 7편 | 월 15편 |
| JSON-LD 스키마 | FAQPage | FAQPage + Product | 전체 |
| AI 가시성 리포트 | 분기 간이 | 월 1회 | 월 1회 + Alert |
| AI 엔진 스캔 수 | 2개 | 3개 | 5개 |
| DealCard 프로모션 | 월 3장 | 무제한 | 무제한 |
| Clone Transform | ❌ | ❌ | ✅ |
| 다국어 발행 | ❌ | ❌ | 영어 동시 |
| 검토 승인 워크플로우 | ❌ | 예약 발행 | 검토 승인 |
