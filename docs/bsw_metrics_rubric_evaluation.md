# BSW-OS 지표 체계 — 루브릭 평가 및 GTM 전략

> **평가자 관점:** 글로벌 SEO/AEO/GEO 마케팅 전문가 + LLM 사이언티스트  
> **평가 대상:** BSW-OS 8-Volume 매뉴얼 + 52모듈 구현 코드  
> **평가일:** 2026-06-01  
> **비교 대상:** Semrush AI Visibility, Otterly AI, Profound, SE Ranking, LLMrefs

---

## Part I. 루브릭 평가 (8차원 × 5점)

### 평가 기준

| 점수 | 기준 |
|:---:|:---|
| **5** | 글로벌 최초/유일. 경쟁사 대비 구조적으로 대체 불가. |
| **4** | 차별화 명확. 기존 도구로 재현 어려움. |
| **3** | 업계 수준. 기존 도구와 동등하나 접근법이 다름. |
| **2** | 미흡. 개념은 있으나 실행·검증이 부족. |
| **1** | 부재 또는 치명적 결함. |

---

### 1. 이론적 기반 (Theoretical Foundation)

**점수: ★★★★☆ (4.5/5)**

| 강점 | 약점 |
|:---|:---|
| ✅ SA Dynamics 끌개 이론(Attractor theory) 기반 — 학술적 근거 있음 | ⚠️ 학술 논문으로 출판된 검증(peer review)은 아직 없음 |
| ✅ TCO(Total Concept Ownership)를 "키워드→개념" 패러다임으로 재정의 | ⚠️ "개념" 정의의 엄밀성이 구현 수준에서 LLM 추출 품질에 의존 |
| ✅ "관측 프록시" 인정 — 과학적 겸손함을 시스템에 내장 | |
| ✅ Inside-Out(SSoT) × Outside-In(관측) 이중 측정 구조 | |

> **비교:** Semrush/Otterly는 관측(Outside-In)만 수행. BSW-OS의 D-MRI(내부 준비도) 대비 B-MRI(외부 관측) **이원 구조**는 경쟁 도구에 없는 **구조적 차별점**.

---

### 2. 지표 설계의 정밀도 (Metric Design Precision)

**점수: ★★★★★ (5.0/5) — 글로벌 최초 수준**

| 혁신 포인트 | 기존 도구 비교 |
|:---|:---|
| ✅ **6-Judge LLM Pipeline** — 단일 점수가 아닌 6차원 분석 | Semrush: 단일 Visibility Score |
| ✅ **M1~M13 개념 단위 측정** — 키워드가 아닌 개념의 전달/왜곡/환각/안정성 | Otterly: prompt-level binary (cited/not cited) |
| ✅ **M4(왜곡률) + M6(환각률)** — 부정적 품질 지표 분리 측정 | **경쟁사 전무.** 이것이 가장 큰 차별점. |
| ✅ **M7 끌개 안정성** — 반복 관측 기반 통계적 안정성 | 경쟁사는 단일 스냅샷만 |
| ✅ **M8 드리프트** — 시간 경과에 따른 개념 이동 추적 | 경쟁사는 시계열 비교만(점수 차이) |

> [!IMPORTANT]
> **핵심 판정:** 13개 TCO-GEO 메트릭(M1~M13) 체계는 현재 글로벌 시장에서 **이론적·구현적으로 가장 세분화된 AI 검색 품질 측정 프레임워크**입니다. 특히 M4(왜곡률), M6(환각률), M7(끌개 안정성)의 조합은 경쟁 도구 어디에도 없습니다.

---

### 3. Question 자산 체계 (Question Capital System)

**점수: ★★★★★ (5.0/5) — 유일한 체계**

| 혁신 포인트 | 경쟁 도구 비교 |
|:---|:---|
| ✅ **4계층 질문 모델**: Signal → Capital → CQ → QIS → Probe | Semrush: "Prompt Research" (단일 계층) |
| ✅ **Question Capital을 자산으로 정의** — 질문 영역 점유의 전략적 가치화 | Otterly: "Prompt Library" (질문 관리만) |
| ✅ **QVS(Question Value Score) 5차원 가치 산출** | **경쟁사 전무** |
| ✅ **Expected Layer 3계층** — must/should/must_not_do | Profound: 유사 기능 일부 |
| ✅ **Predicted Question + Emergence Signal** — 미래 질문 선점 엔진 | **경쟁사 전무** |

> **비평:** 이 체계의 가장 강력한 점은 "질문을 비용이 아닌 **자산**으로 정의한 프레이밍"입니다. 경쟁사는 질문을 "추적해야 할 프롬프트"로만 봅니다. BSW-OS는 질문에 경제적 가치(QVS)를 매기고, 예측(Predicted Question)하고, 선점(Preemption) 전략까지 연결합니다. 이것은 **SaaS 가격 모델의 차별화 근거**가 됩니다.

---

### 4. 산업 지수의 확장성 (Industry Index Scalability)

**점수: ★★★★☆ (4.0/5)**

| 강점 | 약점 |
|:---|:---|
| ✅ **BAIR → AIPR → KAIVI** 3단계 확장 | ⚠️ KAIVI는 한국 시장 특화 — 글로벌 확장 시 리네이밍 필요 |
| ✅ **BAIR 공식의 자동 업그레이드** (BSF→M3, OCR→M2) | ⚠️ BAIR 공식 `BSF × AAS × (1+OCR) × SWEL`의 곱셈 구조가 한 요소 0이면 전체 0 |
| ✅ **AIPR 업종별 파워 랭킹** — PR/미디어 발행용 | ⚠️ 업종 분류 체계가 한국 표준(wedding, k-beauty 등)에 의존 |
| ✅ **Cross-tenant 벤치마크** 가능 | ⚠️ 아직 N=3 업종 시드만 존재 |

---

### 5. 실용성 (Practicality & Operability)

**점수: ★★★☆☆ (3.5/5)**

| 강점 | 약점 |
|:---|:---|
| ✅ 3-mode Provider (mock/gemini/openai) | ⚠️ 실제 ChatGPT Search / Perplexity 직접 관측 미구현 |
| ✅ Repeated Runner (반복 관측) | ⚠️ 관측 비용이 높음 (6-Judge × N questions × M repeats) |
| ✅ Fix-It RCA → Retest SWEL 루프 | ⚠️ 패치 적용 → AI 재인덱싱 대기 기간(7~14일)이 측정 불가 |
| ✅ 비용 관리 가이드라인 포함 | ⚠️ Production 규모의 실증 데이터(case study) 부재 |

> [!WARNING]
> **가장 큰 실용성 리스크:** 현재 시스템은 AI Provider(OpenAI/Gemini API)를 통해 **"AI가 AI를 관측"**하는 구조입니다. 실제 ChatGPT Search나 Google AI Mode의 생산 환경 응답을 직접 크롤링하는 것이 아닙니다. 이 "프록시 관측"의 정확도를 실증해야 시장 신뢰를 얻을 수 있습니다.

---

### 6. 데이터 품질 보장 (Data Quality Assurance)

**점수: ★★★★☆ (4.0/5)**

| 강점 | 약점 |
|:---|:---|
| ✅ 원시 응답 전량 보존 (raw_response_text) | ⚠️ Judge 간 일관성(Inter-Judge Agreement) 검증 미측정 |
| ✅ 패널 버전 잠금 → 동일 조건 비교 보장 | ⚠️ LLM Judge의 편향(Bias) 교정 메커니즘 미구현 |
| ✅ Confidence Penalty, Volatility Penalty 내장 | ⚠️ Judge 결과의 Ground Truth 대비 정확도 벤치마크 부재 |
| ✅ 프록시 면책 문구 제도화 | |

---

### 7. 문화적 차별화 (Cultural Moat)

**점수: ★★★★★ (5.0/5) — 유일무이**

| 혁신 포인트 |
|:---|
| ✅ **M14(Cross-Cultural Resonance)** — AI의 문화 콘텐츠 전달 정확도 측정 |
| ✅ **M15(Commercial Transferability)** — 문화 콘텐츠의 상업적 전환 가능성 |
| ✅ **K-Culture 전용 평가 파이프라인** (`runKCultureEvaluation()`) |
| ✅ 한류 콘텐츠(K-Beauty, K-Food, K-Wedding)의 AI 정확 전달이라는 고유 시장 니즈 |

> **비평:** 이것은 경쟁사가 **절대 모방할 수 없는 문화적 해자(Moat)**입니다. Semrush, Otterly 등 영미권 도구는 다문화 충실도를 측정하는 프레임워크가 없습니다. K-Culture의 글로벌 확산 맥락에서, AI가 한국 문화를 왜곡 없이 전달하는지 측정하는 것은 **한국 정부·문화 기관·글로벌 K-브랜드 모두의 니즈**와 정확히 일치합니다.

---

### 8. 확장성 및 개방성 (Extensibility)

**점수: ★★★★☆ (4.0/5)**

| 강점 | 약점 |
|:---|:---|
| ✅ QIS 공유 스키마 (외부 플랫폼 양방향 연동) | ⚠️ 현재 KWeddingHub 1개만 연동 |
| ✅ AI Factory 패턴으로 Provider 교체 용이 | ⚠️ 퍼블릭 API 미공개 (외부 통합 불가) |
| ✅ Multi-tenant + RLS 아키텍처 | ⚠️ SDK/Widget 미제공 |
| ✅ DB 스키마 82테이블 풀 문서화 | |

---

### 종합 점수

| 차원 | 점수 | 비고 |
|:---:|:---:|:---|
| 이론적 기반 | 4.5 | SA Dynamics + TCO, 프록시 인정 |
| 지표 설계 | **5.0** | 🏆 **글로벌 최초.** M1~M13 체계 |
| Question 체계 | **5.0** | 🏆 **유일.** QVS + Prediction |
| 산업 지수 | 4.0 | BAIR→AIPR→KAIVI, 곱셈 구조 리스크 |
| 실용성 | 3.5 | 프록시 관측 한계, 비용, 실증 부재 |
| 데이터 품질 | 4.0 | 원시 보존, Judge 편향 교정 미비 |
| 문화적 차별화 | **5.0** | 🏆 **유일무이.** M14/M15 K-Culture |
| 확장성 | 4.0 | QIS 연동, API 미공개 |
| **종합** | **4.38 / 5.0** | **글로벌 상위 1% 수준의 프레임워크** |

---

## Part II. 가장 경쟁력 있는 포인트 TOP 5

### 🥇 1위: 6-Judge Pipeline + M4/M6 (왜곡·환각 탐지)

```
경쟁사: "AI가 당신을 언급했나요?" (Binary: Yes/No)
BSW-OS: "AI가 당신의 개념을 정확히 전달했나요? 왜곡했나요? 환각을 만들었나요?"
```

**임팩트:** YMYL 도메인(의료, 법률, 금융)에서 **AI 환각으로 인한 법적 리스크**는 2025~2026 최대 이슈. M4+M6는 이 시장 공포를 직접 해결하는 유일한 정량 지표.

**GTM 메시지:** *"AI가 당신의 브랜드를 말할 때, **정확히** 말하고 있나요?"*

---

### 🥈 2위: Question Capital + QVS (질문의 경제적 가치화)

```
경쟁사: "이 프롬프트를 추적하세요" (프롬프트 관리 도구)
BSW-OS: "이 질문의 경제적 가치는 월 ₩910,000입니다. 선점 기한은 14일입니다."
```

**임팩트:** CMO/CFO가 **ROI 근거**로 AEO/GEO 투자를 정당화할 수 있는 유일한 프레임워크.

**GTM 메시지:** *"당신 업종에서 AI가 가장 많이 받는 질문의 가치를 알고 있습니까?"*

---

### 🥉 3위: B-MRI ↔ D-MRI 이원 진단

```
경쟁사: "현재 AI 가시성은 72점입니다" (단일 점수)
BSW-OS: "외부 AI 가시성(B-MRI) 72점, 내부 준비도(D-MRI) 45점 → 갭 27점 → 내부 데이터 보강 우선"
```

**임팩트:** 단순 점수가 아닌 **처방(Prescription)**을 제공. "무엇을 고쳐야 하는지" 자동 진단.

**GTM 메시지:** *"점수만 보여주는 대시보드가 아닙니다. **무엇을 고쳐야 하는지** 알려줍니다."*

---

### 4위: M7 끌개 안정성 (Attractor Stability)

AI 응답의 **재현성**을 측정하는 유일한 지표. 같은 질문에 AI가 매번 다른 답을 한다면, 그 가시성은 무의미.

**GTM 메시지:** *"AI가 어제는 당신을 추천하고 오늘은 경쟁사를 추천하나요? 그 불안정성을 측정합니다."*

---

### 5위: K-Culture M14/M15 (문화적 해자)

한국 문화 콘텐츠의 AI 전달 정확도. 한류 글로벌 확산의 **측정 인프라**가 됨.

**GTM 메시지:** *"AI가 K-Beauty를 설명할 때, 한국 브랜드의 진짜 이야기를 전달하고 있나요?"*

---

## Part III. 실용성·임팩트 매트릭스

### 지표별 실용성 × 임팩트 평가

```
                          높은 임팩트
                              │
                    ┌─────────┼─────────┐
                    │  ❷      │   ❶     │
                    │ QVS     │ M4+M6   │
        낮은        │ M13     │ B-MRI   │  높은
        실용성 ─────┤ M14/M15 │ BAIR    ├─ 실용성
                    │ M7/M8   │ AAS     │
                    │         │ AIPR    │
                    │  ❸      │   ❹     │
                    │ M11/M12 │ D-MRI   │
                    │         │ AITI    │
                    └─────────┼─────────┘
                              │
                          낮은 임팩트
```

### 사분면 해석

| 사분면 | 지표군 | 전략 |
|:---:|:---|:---|
| **❶ Star** (높은 실용성 + 높은 임팩트) | **M4, M6, B-MRI, BAIR, AAS, AIPR** | 🏆 **1차 출시.** 즉시 시장 진입. |
| **❷ Moonshot** (낮은 실용성 + 높은 임팩트) | **QVS, M13, M14/M15, M7/M8** | ⭐ **2차 출시.** 실증 데이터 확보 후. |
| **❸ Niche** (낮은 실용성 + 낮은 임팩트) | **M11, M12** | 📊 내부 품질 모니터링용. 비공개. |
| **❹ Foundation** (높은 실용성 + 낮은 임팩트) | **D-MRI, AITI** | 🔧 고객 온보딩 시 자동 산출. |

---

## Part IV. GTM 전략 — 3-Phase 출시 로드맵

### Phase 0: 시장 프레이밍 (Launch − 4주)

> **목표:** "기존 AI 가시성 도구는 불완전하다"는 **문제 인식** 창출

| 주차 | 활동 | 산출물 |
|:---:|:---|:---|
| W1 | 사고 리더십 콘텐츠 발행 | *"AI가 당신의 브랜드를 왜곡하고 있습니다: 데이터로 증명"* |
| W2 | 업종별 AI 환각 사례 리포트 | K-Beauty/의료/웨딩 업종 AI 왜곡 실례 3건 |
| W3 | 경쟁 도구 한계 분석 기사 | *"Visibility Score만으로는 부족한 이유"* |
| W4 | 티저: "AI Brand Distortion Index" 발표 예고 | 미디어 엠바고 배포 |

---

### Phase 1: 스타 지표 출시 (Month 1~3)

> **목표:** 시장 충격 + 첫 고객 확보

#### 🎯 출시 지표 1: **BAIR (Brand AI Reputation Index)**

**출시 순서 1위인 이유:**
- 단일 점수 → 미디어 인용 최적
- 경쟁사 비교 가능 → PR 가치 극대
- 공식 `BSF × AAS × (1+OCR) × SWEL` → 간결하면서 다차원

**GTM 액션:**
```
[Press Release] "한국 최초 AI 브랜드 평판 지수 BAIR 발표"
[Industry Report] "K-Beauty 업종 AI 브랜드 평판 랭킹 — AIPR 리포트"
[Free Tool] BAIR Score Checker (무료 진단 도구)
```

#### 🎯 출시 지표 2: **AI Distortion & Hallucination Index (M4 + M6)**

**출시 순서 2위인 이유:**
- YMYL 시장의 **공포 마케팅** 가능 — "AI가 당신의 브랜드를 과장하고 있습니다"
- 법적 리스크 → C-Level 의사결정권자의 관심
- 경쟁사 제로 → 독점적 화제성

**GTM 액션:**
```
[Whitepaper] "AI 환각이 브랜드에 미치는 법적·재무적 리스크"
[Case Study] 실제 브랜드의 M4/M6 측정 결과 (익명화)
[Webinar] "당신의 브랜드, AI에서 안전한가?" (YMYL 업종 타겟)
```

#### 🎯 출시 지표 3: **AIPR (AI Power Ranking)**

**출시 순서 3위인 이유:**
- 업종별 랭킹 → **미디어 자석** (매월 발행)
- 경쟁 의식 자극 → 고객 유입 엔진
- "우리 업종에서 AI 검색 1위는 누구?" → 바이럴 질문

**GTM 액션:**
```
[Monthly Report] "2026년 6월 K-Beauty AI Power Ranking"
[Interactive Tool] "내 브랜드의 AI 순위 확인" (리드 수집)
[Partnership] 업종 협회/미디어와 공동 발행
```

---

### Phase 2: 차별화 심화 (Month 4~8)

> **목표:** "점수 뿐 아니라 처방까지" — 기존 도구와의 결정적 차별화

#### 출시 지표 4: **B-MRI ↔ D-MRI 이원 진단**

```
GTM 메시지: "AI 가시성 점수만 아는 것은 체온만 재는 것과 같습니다.
            B-MRI × D-MRI는 MRI 정밀 진단입니다."
```

- 무료 B-MRI 진단 → 유료 D-MRI 심층 진단 → 유료 Fix-It 컨설팅 **퍼널 설계**

#### 출시 지표 5: **QVS (Question Value Score)**

```
GTM 메시지: "당신 업종에서 가장 가치 있는 AI 질문 Top 10을 알려드립니다.
            선점 마감일이 있습니다."
```

- **세일즈 킬러:** "이 질문의 월 가치는 ₩910,000이고, 현재 AI 커버리지는 `none`입니다."
- CFO/CMO 설득에 최적: ROI 직접 제시

#### 출시 지표 6: **M7 끌개 안정성 + M8 드리프트**

```
GTM 메시지: "AI가 어제는 당신을 추천했지만, 오늘은 아닐 수 있습니다.
            Attractor Stability로 AI 응답의 재현성을 보장합니다."
```

---

### Phase 3: 글로벌 확장 + 독점 해자 (Month 9~18)

> **목표:** 경쟁사가 따라올 수 없는 데이터 자산 + 문화적 해자 확립

#### 출시 지표 7: **KAIVI (Korea AI Visibility Index)**

```
GTM: 한국 정부/KOTRA/문체부와 협력하여
     "국가 AI 가시성 지수" 공식 지표로 제안
```

- **PR 핵폭탄:** "한국 브랜드의 글로벌 AI 가시성을 국가 단위로 측정하는 최초의 지수"
- Bloomberg, Nikkei 등 글로벌 미디어 관심 유도

#### 출시 지표 8: **M14/M15 K-Culture Resonance**

```
GTM: K-Culture 글로벌 확산의 "정확도 보증" 인프라
     "AI가 K-Beauty를 설명할 때 틀리지 않도록"
```

- 한류 관련 정부 기관, K-Beauty 글로벌 브랜드 대상
- 경쟁사가 **절대 진입할 수 없는** 문화적 해자

---

## Part V. 핵심 리스크 및 완화 전략

### 시장 진입 전 해결 필수 3가지

| # | 리스크 | 심각도 | 완화 전략 |
|:---:|:---|:---:|:---|
| 1 | **프록시 관측의 신뢰도** — API 기반 관측 ≠ 실제 ChatGPT Search 결과 | 🔴 | ① 실제 ChatGPT/Perplexity 크롤링 파일럿 ② API 관측 vs 실제 결과 상관 계수 발표 ③ 프록시 면책 투명 공개 |
| 2 | **케이스 스터디 부재** — "실제 효과가 있나?" | 🟡 | ① 3개 업종 × 3개 브랜드 파일럿 ② 6주 Baseline→Patch→Retest 사이클 ③ SWEL 실증 데이터 수집 |
| 3 | **관측 비용** — 6-Judge × 20 questions × 3 repeats = 360 API 호출/런 | 🟡 | ① 2-Judge 경량 모드 (M3+M6 only) ② 캐싱/배치 최적화 ③ 가격 계층(Basic/Pro/Enterprise) |

---

## Part VI. 지표 발표 캘린더 (최종)

```
Month 1  ┃ 🎯 BAIR 발표 + 무료 진단 도구
         ┃    → "한국 최초 AI 브랜드 평판 지수"
         ┃
Month 2  ┃ 🎯 M4+M6 (Distortion/Hallucination) 발표
         ┃    → "AI 왜곡 리포트" + YMYL 웨비나
         ┃
Month 3  ┃ 🎯 AIPR 업종별 랭킹 첫 발행
         ┃    → 미디어 파트너십 + 월간 리포트 시작
         ┃
Month 5  ┃ ⭐ B-MRI / D-MRI 이원 진단 공개
         ┃    → "AI 가시성 MRI" 캠페인
         ┃
Month 6  ┃ ⭐ QVS 엔진 공개
         ┃    → "질문의 가치를 계산합니다" + ROI 계산기
         ┃
Month 8  ┃ ⭐ M7/M8 안정성·드리프트 공개
         ┃    → 학술 논문 발표 (SA Dynamics 기반)
         ┃
Month 12 ┃ 🌏 KAIVI 발표
         ┃    → 정부 기관 협력 + 글로벌 미디어
         ┃
Month 15 ┃ 🌏 M14/M15 K-Culture Index 발표
         ┃    → K-Culture 글로벌 정확도 보증 인프라
```

---

## Part VII. 결론 — 하나의 문장으로

> **BSW-OS의 지표 체계는 "AI가 브랜드를 언급하는가"(Visibility)를 넘어, "AI가 브랜드를 **정확하게** 전달하는가"(Fidelity)와 "그 전달이 **안정적으로** 재현되는가"(Stability)를 측정하는 글로벌 유일의 프레임워크입니다. 시장 진입은 공포(M4/M6) → 순위(BAIR/AIPR) → 처방(MRI) → 선점(QVS) → 국가 지수(KAIVI) 순서로 진행해야 합니다.**

---

> **Disclaimer:** 이 평가는 현재 코드베이스와 문서에 기반한 **잠재력(Potential)** 평가입니다. Production 환경에서의 실증 결과가 뒷받침되어야 시장에서의 실제 경쟁력이 확정됩니다.
