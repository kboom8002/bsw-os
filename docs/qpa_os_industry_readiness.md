# QPA-OS 업종별 준비도 분석 보고서

> 분석 기준일: 2026-07-03

## 핵심 요약

BSW-OS의 QPA-OS 파이프라인은 **업종 무관(Industry-agnostic) 아키텍처**로 설계되어 있어, 이론적으로 어떤 업종이든 QPA-OS를 구동할 수 있습니다. 그러나 **업종별 질문 자산(Panel Questions)의 품질과 양**에 따라 실질적인 준비도 차이가 존재합니다.

---

## 업종별 준비도 매트릭스

| 업종 | 패널 질문 수 | 벤치마크 브랜드 | 데모 데이터 | 시드 스크립트 | 온보딩 시딩 | **준비도** |
|------|:-----------:|:--------------:|:----------:|:------------:|:----------:|:----------:|
| 🧴 **스킨케어** | ✅ 155개 (Goldilocks) | ✅ 20개 브랜드 | ✅ | ✅ | ⚠️ 범용 | 🟢 **Ready** |
| 📸 **웨딩 포토 스튜디오** | ✅ 80개 (Goldilocks) | ✅ 15개 브랜드 | ✅ | ✅ | ⚠️ 범용 | 🟢 **Ready** |
| 🏛️ **서울 자치구 (국문)** | ✅ ~80개 (Goldilocks) | ✅ 25개 자치구 | ❌ | ❌ | ⚠️ 범용 | 🟡 **Partial** |
| 🏛️ **서울 자치구 (영문)** | ✅ ~80개 (Goldilocks) | ✅ 25개 자치구 | ❌ | ❌ | ⚠️ 범용 | 🟡 **Partial** |
| 🎤 **K-pop 아이돌 (국문)** | ⚠️ 18개 (+패딩 20) | ✅ 22개 그룹 | ❌ | ❌ | ⚠️ 범용 | 🟡 **Partial** |
| 🎤 **K-pop 아이돌 (영문)** | ⚠️ 18개 (+패딩 20) | ✅ 22개 그룹 | ❌ | ❌ | ⚠️ 범용 | 🟡 **Partial** |
| 🏪 **편의점/리테일** | ⚠️ ≤20개 (자동패딩) | ❌ 미설정 | ✅ | ✅ | ⚠️ 범용 | 🟡 **Partial** |
| 그 외 21개 업종 | ⚠️ ≤20개 (자동패딩) | ❌ 미설정 | ❌ | ❌ | ⚠️ 범용 | 🔴 **Not Ready** |

---

## 준비도 등급 기준

### 🟢 Ready (운영 가능)
- **Goldilocks급 패널 질문** (80~155개): 업종 특화된 고품질 질문이 충분히 확보됨
- **벤치마크 브랜드 구성** 완료: 경쟁사 비교 분석 가능
- **데모 & 시드 스크립트** 존재: 신규 워크스페이스 초기 세팅 자동화 가능

### 🟡 Partial (부분 준비)
- 파이프라인은 작동하나 아래 중 하나 이상 미비:
  - 패널 질문 수가 불충분 (20개 미만)
  - 데모 데이터 미구축
  - 시드 스크립트 미작성

### 🔴 Not Ready (미준비)
- `BENCHMARK_DOMAINS`에 도메인 미등록 (벤치마크 측정 불가)
- 자동 패딩된 20개 질문만 존재
- 데모/시드 인프라 전무

---

## QPA-OS 파이프라인 구성 요소 현황

8개 핵심 엔진은 모두 **업종 무관**으로 작동합니다:

| 엔진 | 파일 | 상태 | 비고 |
|------|------|:----:|------|
| Tri-Axis Router | [tri-axis-router.ts](file:///c:/Users/User/bsw/lib/qis/tri-axis-router.ts) | ✅ | 한국어 장소/테마 매핑 내장 |
| CQ Canonicalizer | [cq-canonicalizer.ts](file:///c:/Users/User/bsw/lib/qis/cq-canonicalizer.ts) | ✅ | LLM 기반 질문 정규화 |
| Scene Builder | [scene-builder.ts](file:///c:/Users/User/bsw/lib/qis/scene-builder.ts) | ✅ | QIS Scene 명세 생성 |
| TCO Distiller | [tco-distiller.ts](file:///c:/Users/User/bsw/lib/qis/tco-distiller.ts) | ✅ | 운영 개념 추출 |
| Attractor Promoter | [attractor-promoter.ts](file:///c:/Users/User/bsw/lib/qis/attractor-promoter.ts) | ✅ | 승급 평가 (≥68.0점) |
| Content Generator | [content-generator.ts](file:///c:/Users/User/bsw/lib/qis/content-generator.ts) | ✅ | AEO/GEO 콘텐츠 생성 |
| Hub Client | [hub-client.ts](file:///c:/Users/User/bsw/lib/qis/hub-client.ts) | ⚠️ **Stub** | AIHompyHub 미연동 |
| QIS Auth | [qis-auth.ts](file:///c:/Users/User/bsw/lib/qis/qis-auth.ts) | ✅ | SHA-256 인증 |

---

## 등록된 전체 업종 목록 (28개)

[questions-data.ts](file:///c:/Users/User/bsw/db/seed/industry-panels/questions-data.ts)에 `IndustryType` enum으로 정의된 28개 업종:

| # | 업종 (IndustryType) | 패널 질문 규모 | 벤치마크 도메인 등록 |
|---|---------------------|:--------------:|:-------------------:|
| 1 | `skincare` (스킨케어) | 155개 ✅ | ✅ |
| 2 | `wedding_studio` (웨딩스튜디오) | 80개 ✅ | ✅ |
| 3 | `place_brand_ko` (장소브랜드 국문) | ~80개 ✅ | ✅ |
| 4 | `place_brand_en` (장소브랜드 영문) | ~80개 ✅ | ✅ |
| 5 | `kpop_idol_ko` (K-pop 국문) | 18개 ⚠️ | ✅ |
| 6 | `kpop_idol_en` (K-pop 영문) | 18개 ⚠️ | ✅ |
| 7 | `beauty` (뷰티) | ≤20개 | ❌ |
| 8 | `wedding` (웨딩) | ≤20개 | ❌ |
| 9 | `clinic` (병원/클리닉) | ≤20개 | ❌ |
| 10 | `restaurant` (요식업) | ≤20개 | ❌ |
| 11 | `real_estate` (부동산) | ≤20개 | ❌ |
| 12 | `legal` (법률) | ≤20개 | ❌ |
| 13 | `education` (교육) | ≤20개 | ❌ |
| 14 | `travel` (여행) | ≤20개 | ❌ |
| 15 | `pet` (반려동물) | ≤20개 | ❌ |
| 16 | `auto` (자동차) | ≤20개 | ❌ |
| 17 | `finance` (금융) | ≤20개 | ❌ |
| 18 | `insurance` (보험) | ≤20개 | ❌ |
| 19 | `healthcare` (헬스케어) | ≤20개 | ❌ |
| 20 | `it_software` (IT/소프트웨어) | ≤20개 | ❌ |
| 21 | `food_beverage` (식음료) | ≤20개 | ❌ |
| 22 | `fashion_ecommerce` (패션/이커머스) | ≤20개 | ❌ |
| 23 | `logistics` (물류) | ≤20개 | ❌ |
| 24 | `energy` (에너지) | ≤20개 | ❌ |
| 25 | `hr_recruitment` (인사/채용) | ≤20개 | ❌ |
| 26 | `consulting_b2b` (컨설팅/B2B) | ≤20개 | ❌ |
| 27 | `convenience_retail` (편의점/리테일) | ≤20개 | ❌ |
| 28 | `manufacturing` (제조) | ≤20개 | ❌ |

---

## 주요 GAP 분석

> [!WARNING]
> ### 1. 온보딩 시 업종별 패널 질문 미주입
> `seedInitialQuestions()`가 `industryKey`를 오케스트레이터에 전달하지 않아, 온보딩 중 LLM 범용 질문만 생성되고 **업종 특화 큐레이션 패널 질문이 자동 주입되지 않습니다**.
> 이는 스킨케어·웨딩 등 Goldilocks급 패널을 보유한 업종에서도 동일한 문제입니다.

> [!WARNING]
> ### 2. Hub Client 미구현
> `hub-client.ts`는 Stub 상태로, 외부 AIHompyHub로부터의 실시간 시그널 수집이 작동하지 않습니다.

> [!IMPORTANT]
> ### 3. `attractor_metrics` 테이블 미존재
> Attractor Promoter 엔진은 구현되어 있으나, 결과를 저장할 `attractor_metrics` DB 테이블이 마이그레이션에 존재하지 않습니다.

> [!NOTE]
> ### 4. 🔴 미준비 업종(21개)의 확장 경로
> 파이프라인이 업종 무관으로 설계되어 있으므로, 새 업종 활성화에 필요한 작업은:
> 1. `INDUSTRY_PANELS_DATA`에 Goldilocks급 패널 질문 추가 (60~100개 이상)
> 2. `BENCHMARK_DOMAINS`에 도메인 등록 (브랜드, 도메인, 키워드)
> 3. (선택) 데모 데이터 & 시드 스크립트 작성
