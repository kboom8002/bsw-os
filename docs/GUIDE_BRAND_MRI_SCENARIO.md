# 🥈 Brand MRI + 처방전 — 고객 사용자 시나리오 & 시스템 기능 가이드

> **상품**: Brand MRI (50만원 1회 → 80만원/월 관리)
> **대상**: 중견 뷰티 브랜드, 스킨케어 브랜드, 수출 브랜드
> **한 줄 요약**: "AI가 귀사를 어떻게 보는지 정밀 촬영하고, 처방하고, 치료 인프라까지 구축합니다"

---

## 1. 고객 사용자 시나리오

### 시나리오 A — 풀패키지(50만, 1회): MRI 촬영 → 처방 → 첫 치료

> **페르소나**: 최지원 (38세, 클린 뷰티 브랜드 마케팅 팀장)
> **현재 상황**: 자사몰 + 올리브영 입점. AI에서 경쟁사만 추천됨.

#### Phase 1: MRI 촬영 (진단) — Day 1~3

```
① 계약 체결 후 BSW 운영팀이 브랜드 설정

② BSW-OS Observatory 가동
   ┌─────────────────────────────────────────────────┐
   │ AI 5개 엔진 동시 프로빙                            │
   │                                                   │
   │ 질문: "순한 클렌징 오일 추천"                        │
   │                                                   │
   │  ChatGPT  │ 경쟁사A 추천 ✅ │ 우리 브랜드 ❌        │
   │  Gemini   │ 경쟁사A 추천 ✅ │ 우리 브랜드 ❌        │
   │  Perplexity│ 경쟁사B 추천 ✅ │ 우리 브랜드 ❌       │
   │  Claude   │ 언급 없음        │ 우리 브랜드 ❌        │
   │  Copilot  │ 경쟁사A 추천 ✅  │ 우리 브랜드 ❌        │
   └─────────────────────────────────────────────────┘

③ Brand MRI 리포트 자동 생성
   → B-MRI 종합점수: 34/100 (F 등급)
   → 구성 요소:
     • AAS (AI Answer Share): 12%
     • OCR (Organic Coverage Rate): 8%
     • BSF (Brand Sentiment Factor): 65%
     • QTC (Question Territory Coverage): 15%
     • GCTR (Growth Capture Territory Rate): 5%
     • ARS (AI Recommendation Strength): 22%

④ 경쟁사 비교
   ┌──────────────────────────────────────────┐
   │ 브랜드      │ B-MRI │ AAS  │ QTC  │ 등급 │
   │ 경쟁사 A    │  71   │ 42%  │ 55%  │  B   │
   │ 경쟁사 B    │  58   │ 28%  │ 40%  │  C   │
   │ 우리 브랜드  │  34   │ 12%  │ 15%  │  F   │
   └──────────────────────────────────────────┘
```

**고객 체감**: "수치로 정확히 보이니까 충격적이에요. 경쟁사 대비 이렇게 뒤처져 있었다니."

#### Phase 2: 처방전 (전략 도출) — Day 3~5

```
⑤ Q-Intelligence 파이프라인 가동
   → 업종(클린 뷰티) 예측 질문 20개 도출
   → QVS 가치 점수로 우선순위 정렬

⑥ AI 공백 매핑 (Answer Gap)
   ┌─────────────────────────────────────────────────┐
   │ 질문                    │ AI 커버 │ QVS │ 선점   │
   │ "클렌징 오일 이중세안"    │  🔴 없음 │ 95  │ 7일   │
   │ "순한 클렌징 성분 추천"   │  🔴 없음 │ 91  │ 14일  │
   │ "민감 피부 클렌징 순서"   │  🟠 희박 │ 88  │ 21일  │
   │ "비건 클렌징 오일 차이"   │  🟡 보통 │ 82  │ 30일  │
   └─────────────────────────────────────────────────┘

⑦ QVS × AEPI 전략 매트릭스 도출
   → 4사분면 매핑:
     • 🔴 "반드시 선점" (고가치 + AI 공백)
     • 🟡 "경쟁적 진입" (고가치 + AI 포화)
     • 🟢 "유지/강화" (이미 커버 중)
     • ⚪ "관찰" (저가치)

⑧ Attractor 포트폴리오 갭 분석
   → "정보형 Attractor 80% → 비교형/구매형 부족"
   → 처방: "비교형 Attractor 3개 추가 생성 필요"

⑨ 처방 액션 플랜 (9종)
   → generate_llm_instruction: AI가 브랜드를 올바르게 소개하는 지시문
   → generate_evidence: E-E-A-T 강화 증거 자료
   → sync_social_links: SNS 링크 구조화
   → create_situation_configs: 상황형 콘텐츠 설정
   → generate_about_brand_fields: 브랜드 소개 구조화
   → ...4종 추가
```

**고객 체감**: "어떤 질문을 먼저 잡아야 하는지, 어떤 콘텐츠를 써야 하는지 다 알려주네요."

#### Phase 3: 치료 인프라 + 첫 치료 — Day 5~14

```
⑩ AEO 웹사이트 자동 구축
   → Turnkey Engine으로 브랜드 AI홈피 생성
   → Archetype System이 클린 뷰티 맞춤 디자인 적용
   → JSON-LD (16개 스키마) 전체 삽입
   → llms.txt 영문 파일 자동 생성

⑪ 첫 콘텐츠 3편 자동 생산 + 발행
   → BSW Answer Factory에서 "반드시 선점" 3건 처리
     • Step 1: CQ "클렌징 오일 이중세안" 선택
     • Step 2: AnswerMissionCompiler가 미션 자동 생성
     • Step 3: AI 초안 + Safety Gate + Vibe Check
     • Step 4: 7채널 변형 (homepage, answer_card, chatbot...)
     • Step 5: aihompy Hub Push → 고객 AI홈피 발행

⑫ DealCard 프로모션 연결
   → "클렌징 오일 첫 구매 20% 할인" 카드 자동 생성
   → JSON-LD Offer 스키마 삽입
```

**고객 체감**: "진단부터 홈페이지, 첫 콘텐츠, 프로모션까지 2주만에 다 됐어요."

---

### 시나리오 B — 월간 관리(80만/월): 정기 건강검진

```
매월 진행:
┌──────────────────────────────────────────────────────────┐
│ Week 1: 월간 MRI 재촬영                                   │
│   → B-MRI 점수 변화 추적 (34 → 42 → 51 → 58)             │
│   → 경쟁사 비교 리포트 업데이트                              │
│                                                          │
│ Week 2: 주간 Q-Intelligence                               │
│   → 새로운 예측 질문 5~7개 추천                             │
│   → 시즌 부스트 감지 (겨울: "건조 피부" 급등)                │
│                                                          │
│ Week 3: 콘텐츠 5편 생산 + 발행                              │
│   → BSW Answer Factory → Writer Hub → AI홈피              │
│   → 예약 발행 + 검토 승인 워크플로우                         │
│                                                          │
│ Week 4: 성과 리뷰 + 다음 달 전략                            │
│   → Observatory 성과 분석                                  │
│   → Smart Alert: 이상 징후 감지                             │
│   → AI Briefing: 주간 정성 분석                             │
│   → AEO Feedback Loop: 인용 변동 분석                      │
└──────────────────────────────────────────────────────────┘

6개월 후:
  B-MRI 34 → 72 (F → B+ 등급)
  QTC 15% → 55%
  AI 3개 엔진에서 브랜드 키워드 TOP 5 진입
```

---

## 2. 시스템 기능 가이드

### 2.1 BSW-OS 기능 가이드 (운영자용)

BSW-OS는 **Brand MRI 진단 + 처방 + Answer Asset 생산의 핵심 엔진**입니다.

#### 📍 주요 메뉴 매핑

| 메뉴 | 경로 | Brand MRI 역할 |
|------|------|---------------|
| **🩺 Brand MRI** | `Reports > Brand MRI` | B-MRI 종합 리포트 (5섹션 대시보드) |
| **🏭 Answer Factory** | `Semantic Core > Answer Factory` | 처방 실행 — 5단계 에셋 생산 |
| **📊 Observatory** | `Monitoring > Observatory` | Phase 1 MRI 촬영 데이터 수집 |
| **🎯 Attractor** | `Truth > Attractor` | Attractor 포트폴리오 관리 |

#### 🩺 Brand MRI 리포트 페이지 (5섹션)

```
Section 1: B-MRI 종합점수
  ┌──────────────────────────────────────────┐
  │ ★ 54.3 / 100                            │
  │                                          │
  │ AAS  12% ████░░░░░░░░░░                  │
  │ OCR   8% ███░░░░░░░░░░░                  │
  │ BSF  65% ████████████░░                  │
  │ QTC  15% ████░░░░░░░░░░                  │
  │ GCTR  5% ██░░░░░░░░░░░░                  │
  │ ARS  22% █████░░░░░░░░░                  │
  └──────────────────────────────────────────┘

Section 2: AI 5엔진 답변 스냅샷
  → ChatGPT, Gemini, Perplexity, Claude, Copilot
  → 각 엔진별 인용 여부 + 답변 품질 평가

Section 3: QVS × AEPI 전략 매트릭스
  → 4사분면 버블차트
  → X축: QVS (질문 가치), Y축: AEPI (AI 인용 가능성)
  → 각 CQ가 어디에 위치하는지 시각화

Section 4: Attractor 포트폴리오 갭
  → 현재 Attractor 유형 분포 (정보형/비교형/구매형/문제해결형)
  → 갭: "구매형 Attractor 부족 → 전환율 저하 위험"

Section 5: 처방 액션 플랜
  → 우선순위별 교정 액션 목록
  → "Answer Factory에서 바로 실행" 버튼
```

#### ⚙️ B-MRI 계산 공식

```
B-MRI = (AAS × 0.20) + (OCR × 0.15) + (BSF × 0.10)
      + (QTC × 0.20) + (GCTR × 0.15) + (ARS × 0.20)
      - confidencePenalty - volatilityPenalty

Competitive_Position = max(0, AAS - competitor_AAS + 50)
```

#### 📡 처방 실행 — Answer Factory 연동

```
Brand MRI 리포트 → "처방 실행" 클릭
  ↓
Answer Factory 자동 전환
  ↓ "반드시 선점" CQ 목록 사전 선택
  ↓ Step 2: Mission 자동 컴파일 (Attractor 가이드 포함)
  ↓ Step 3: Draft + Safety + Vibe Check
  ↓ Step 4: 7채널 Preview
  ↓ Step 5: Hub Push → 고객 AI홈피 발행
```

---

### 2.2 aihompy 기능 가이드 (고객 접점)

aihompy는 **Brand MRI 고객이 진단 결과를 열람하고, 치료(콘텐츠 발행)를 실행하는 플랫폼**입니다.

#### 📍 고객 접근 메뉴

| 메뉴 | 경로 | Brand MRI 역할 |
|------|------|---------------|
| **✨ BSW 추천 질문** | `Studio > Foundation > BSW 추천 질문` | 처방전 기반 우선 대응 질문 열람 |
| **📊 콘텐츠 갭 대시보드** | `Studio > Foundation > QIS Gap` | AI 공백 시각화 + 대응 현황 |
| **📡 Observatory** | `Studio > Observatory` | AI 가시성 추적 + 성과 분석 |
| **📰 QIS Performance** | `Studio > Observatory > QIS Performance` | CQ별 성과 추적 |
| **📋 AI Briefing** | `Studio > Observatory > AI Briefing` | 주간 AI 정성 분석 |

#### 🔄 Brand MRI 고객의 월간 루틴

```
┌─ 월초 ─────────────────────────────────────────────┐
│                                                     │
│  1. Observatory에서 월간 MRI 결과 확인               │
│     → B-MRI 점수 트렌드 (상승/하락/정체)              │
│     → AI 엔진별 인용 변화 추적                        │
│                                                     │
│  2. BSW 추천 질문에서 새로운 처방 확인                 │
│     → "이번 달 우선 대응 질문 5개"                    │
│     → AI 공백(🔴) 질문 우선 처리                     │
│                                                     │
│  3. Writer Hub에서 콘텐츠 생산                       │
│     → AI 초안 생성 → 편집 → 검토 → 발행              │
│     → SEO/AEO 점수 실시간 확인                       │
│                                                     │
│  4. AI Briefing에서 주간 인사이트 확인                 │
│     → "이번 주 '비건 화장품' 검색 트렌드 12% 상승"     │
│     → 대응 콘텐츠 긴급 생산 권고                      │
│                                                     │
│  5. QIS Performance에서 성과 측정                    │
│     → CQ별 커버리지율                                │
│     → 인용 횟수 변화                                 │
│     → 선제 대응 성공률                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 📊 Observatory 상세 기능

| 탭 | 기능 | 업데이트 주기 |
|---|------|:----------:|
| **Hub Health** | 전체 사이트 건강 점수 | 실시간 |
| **QIS Performance** | CQ별 커버리지/인용/우선순위 | 매일 |
| **AI Briefing** | Gemini 기반 정성 분석 | 주간 |
| **Content Quality** | 콘텐츠 품질 점수 + 개선 권고 | 매일 |

---

## 3. 풀패키지(50만) vs 월간 관리(80만) 기능 비교

| 기능 | 풀패키지 (50만, 1회) | 월간 관리 (80만/월) |
|------|:------------------:|:------------------:|
| MRI 촬영 (AI 5엔진 스캔) | 1회 | 매월 |
| B-MRI 리포트 | 1회 | 매월 + 트렌드 |
| Q-Intelligence 예측 | 20개 | 주간 5~7개 |
| 처방 액션 플랜 | 1회 | 매주 업데이트 |
| AI홈피 구축 | ✅ | ✅ + 운영 |
| 첫 콘텐츠 | 3편 | 월 5편 |
| DealCard | 1장 | 무제한 |
| 성과 추적 | ❌ | ✅ |
| Smart Alert | ❌ | ✅ |
| AI Briefing | ❌ | 주간 |
| AEO Feedback Loop | ❌ | ✅ |
| 경쟁사 모니터링 | 1회 스냅샷 | 실시간 |
