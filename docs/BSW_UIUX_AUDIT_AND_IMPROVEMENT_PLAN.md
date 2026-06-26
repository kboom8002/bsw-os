# BSW-OS UI/UX 정밀 감사 및 무마찰 고도화 개선 방안

> 감사 일시: 2026-06-26 | 감사 범위: 서피스/벤치마크 + QIS 3축 연동

---

## 1. 현재 UI/UX 구현 상태 감사 결과

### 1.1 구현 완료 현황표

| 영역 | 컴포넌트 | 파일 | 크기 | 상태 |
|------|---------|------|------|------|
| **공개 랜딩** | SiteAuditLanding | `SiteAuditLanding.tsx` | 15.7KB | ✅ 완성 |
| **대시보드 메인** | SiteAuditDashboard | `SiteAuditDashboard.tsx` | 27.3KB | ✅ 완성 |
| **진단 개요** | OverviewPanel | `OverviewPanel.tsx` | 3.8KB | ✅ 완성 |
| **AEPI 스코어** | AEPIScoreCard | `AEPIScoreCard.tsx` | 5.5KB | ✅ 완성 |
| **레이어 스코어** | LayerScoreCards | `LayerScoreCards.tsx` | 4.6KB | ✅ 완성 |
| **ERR 레이더** | ERRRadarChart | `ERRRadarChart.tsx` | 6.0KB | ✅ 완성 |
| **E-E-A-T 차트** | EEATQuadChart | `EEATQuadChart.tsx` | 5.7KB | ✅ 완성 |
| **기술 인프라** | TechInfraPanel | `TechInfraPanel.tsx` | 10.6KB | ✅ 완성 |
| **스키마 품질** | SchemaQualityPanel | `SchemaQualityPanel.tsx` | 13.7KB | ✅ 완성 |
| **콘텐츠 시맨틱** | ContentSemanticPanel | `ContentSemanticPanel.tsx` | 18.7KB | ✅ 완성 |
| **갭 4분면** | GapQuadrantMatrix | `GapQuadrantMatrix.tsx` | 7.8KB | ✅ 완성 |
| **처방전** | PrescriptionList | `PrescriptionList.tsx` | 5.6KB | ✅ 완성 |
| **엔티티 맵** | SurfaceMapPanel | `SurfaceMapPanel.tsx` | 5.8KB | ✅ 완성 |
| **답변 카드** | AnswerCardList | `AnswerCardList.tsx` | 5.1KB | ✅ 완성 |
| **페르소나 델타** | PersonaDeltaPanel | `PersonaDeltaPanel.tsx` | 7.2KB | ✅ 완성 |
| **파라메트릭** | ParametricPersonaPanel | `ParametricPersonaPanel.tsx` | 8.2KB | ✅ 완성 |
| **피델리티** | PersonaFidelityPanel | `PersonaFidelityPanel.tsx` | 11.8KB | ✅ 완성 |
| **Robots 매트릭스** | RobotsBotMatrix | `RobotsBotMatrix.tsx` | 4.6KB | ✅ 완성 |
| **진행 추적** | ProgressTracker | `ProgressTracker.tsx` | 4.7KB | ✅ 완성 |
| **잠금 패널** | LockedPanel | `LockedPanel.tsx` | 2.8KB | ✅ 완성 |
| **이메일 수집** | EmailCaptureForm | `EmailCaptureForm.tsx` | 2.5KB | ✅ 완성 |
| **과금 카드** | PricingCards | `PricingCards.tsx` | 8.6KB | ✅ 완성 |
| **시계열 트렌드** | TemporalTrendChart | `TemporalTrendChart.tsx` | 3.3KB | ✅ 완성 |
| **긴급 이슈** | CriticalIssuesList | `CriticalIssuesList.tsx` | 6.4KB | ✅ 완성 |
| **업종 포지셔닝** | RelativePositioningPanel | `RelativePositioningPanel.tsx` | 11.9KB | ✅ 완성 |
| **전략 패널** | StrategyPanel | `StrategyPanel.tsx` | 11.6KB | ✅ 완성 |
| **업종 비교 차트** | IndustryComparisonChart | `IndustryComparisonChart.tsx` | 3.3KB | ✅ 완성 |
| **퍼센타일 바** | PercentileBar | `PercentileBar.tsx` | 3.2KB | ✅ 완성 |
| **합계** | **28개 컴포넌트** | | **220KB** | |

### 1.2 페이지 라우트 감사

| 경로 | 용도 | 상태 | 이슈 |
|------|------|------|------|
| `/site-audit` | 공개 랜딩/입력 | ✅ | - |
| `/site-audit/progress/[sessionId]` | 진행 추적 | ✅ | 11-step 표시만, 개별 step 상세 없음 |
| `/site-audit/results/[sessionId]` | 결과 대시보드 | ✅ | - |
| `/(workspace)/site-audit/history` | 감사 이력 | ⚠️ | **Mock 데이터 사용 중** (DB 연동 미완) |
| `/(workspace)/site-audit/industry-benchmark` | 업종 벤치마크 관리 | ✅ | 스킨케어만 시드 |
| `/(workspace)/site-audit/settings` | 감사 설정 | ⚠️ | 확인 필요 |
| `/(workspace)/site-audit/llms-generator` | LLMs.txt 생성 | ✅ | - |
| `/(workspace)/semantic-core/qis` | QIS 장면 관리 | ⚠️ | **Mock CQ 3개만** |
| `/benchmark` | 공개 벤치마크 | ⚠️ | 확인 필요 |

### 1.3 발견된 핵심 이슈 분류

> [!CAUTION]
> **Critical (사용 불가) 4건**
> - C1. QIS 관리 페이지 Mock 데이터만 사용 (실 DB 미연결)
> - C2. 감사 이력 페이지 Mock 데이터 (실 세션 조회 미구현)
> - C3. Free 사용자가 어떤 탭이 잠겨있는지 직관적으로 모름
> - C4. 업종 벤치마크 진행 중 실시간 피드백 없음

> [!WARNING]
> **Major (사용 마찰) 10건**
> - M1. 랜딩에서 업종/목적 미수집
> - M2. 결과 대시보드에 "다음에 할 일" CTA 없음
> - M3~M4. 포지셔닝/전략 탭 빈 화면
> - M5. LockedPanel → checkout 실결제 미구현
> - M6. 모바일 탭 스크롤 힌트 없음
> - M7. PDF가 window.print()만 사용
> - M8. 진행 추적 Step 의미 미설명
> - M9. QIS 3축 현황 대시보드 UI 없음
> - M10. 업종 시드 skincare만

> [!NOTE]
> **Minor (개선 여지) 6건**
> - 지연 로딩 미적용, 진단 완료 알림 미지원, A vs B 비교 없음, 소셜 공유 없음, a11y 불완전, 다크모드 전용

---

## 2. 페르소나별 고도화 개선 방안

### 2.1 공개 사용자 (Free Tier) — "3분 안에 WOW"

#### F1. 랜딩 업종 자동 감지 + 원클릭 시작 `[★★★ High]`

**현재:** URL + 브랜드명 + 수동 tier 선택  
**개선:** URL 입력 즉시 업종 자동 추론 → 원클릭 "무료 진단 시작"

```diff
- <input placeholder="https://example.com" />
+ <input placeholder="https://example.com" onBlur={autoDetectIndustry} />
+ <div>🏷️ 자동 감지: 뷰티 > 스킨케어 [수정]</div>
+ <button>⚡ 무료 AI 건강검진 (8초)</button>
```

#### F2. 잠긴 인사이트 미리보기 `[★★★ Very High]`

**현재:** LockedPanel에 설명+업그레이드 버튼만  
**개선:** 실제 데이터 1~2건 미리보기 + "나머지 N건 잠금" CTA

```
✅ 발견: Schema 누락 3건
✅ 처방전: FAQ 스키마 추가
────────────────────────
🔒 나머지 17건 잠금
Lite 이상 필요 ₩89,000
[전체 결과 보기 →]
```

#### F3. 결과 페이지 "Next Action" CTA `[★★★ High]`

**현재:** 결과 끝에 EmailCaptureForm만  
**개선:** 3가지 다음 행동 제안 + 맞춤 코멘트

#### F4. 진행 트래커 Step 설명 강화 `[★★ Medium]`

**현재:** `Step 3/11: 진행 중...`  
**개선:** 각 Step 아이콘 + 한줄 설명 + 예상 시간 + 완료 체크

---

### 2.2 유료 사용자 (Lite/Pro/Enterprise) — "전문가급 인사이트"

#### P1. 포지셔닝/전략 빈 화면 → 인라인 CTA `[★★★ Very High]`

**현재:** "벤치마크 데이터가 없습니다" 회색 메시지  
**개선:** 인라인 업종 선택 + 즉시 벤치마크 실행 버튼

#### P2. 모바일 탭 스크롤 힌트 `[★★ Medium]`

그래디언트 페이드 + 화살표 인디케이터

#### P3. PDF 다운로드 고도화 `[★★ Medium]`

`@media print` CSS 최적화 또는 react-pdf 서버 생성

#### P4. 진단 완료 알림 `[★★ Medium]`

이메일/카카오 알림 옵션

#### P5. A vs B 사이트 비교 모드 `[★★ High]`

Pro 이상에서 2개 사이트 비교 대시보드

---

### 2.3 관리자 (Workspace Admin) — "운영 효율 극대화"

#### A1. QIS 장면 페이지 DB 연동 `[★★★ Critical]`

Mock CQ 3개 → Supabase `canonical_questions` CRUD 연결

#### A2. 감사 이력 DB 연동 `[★★★ Critical]`

Mock 세션 4개 → `audit_sessions` 테이블 워크스페이스별 조회

#### A3. QIS 3축 현황 대시보드 UI 신규 `[★★★ High]`

```
📊 QIS 3축 실시간 현황
┌────────┬────────┬────────┬──────────┐
│ 업종   │ 지역   │ 테마   │ Cross    │
│ 42건   │ 18건   │ 12건   │ 5건      │
├────────┴────────┴────────┴──────────┤
│ 예측 정확도: 73.4% (+2.1% ↑)       │
│ [🔄 수동 동기화] [📋 상세 로그]      │
└─────────────────────────────────────┘
```

#### A4. 벤치마크 배치 실시간 진행률 `[★★★ High]`

사이트별 진행률 + 개별 결과 실시간 스트리밍

#### A5. 시드 데이터 관리 UI `[★★ Medium]`

addReferenceSite() server action → UI 폼 연결

#### A6. 사이드바 QIS 메뉴 추가 `[★★ Medium]`

QIS 3축 현황 + 예측 질문 관리 메뉴 항목

---

## 3. 실행 우선순위 매트릭스

### Phase 1 — 즉시 착수 (1주)

| # | 항목 | 노력 | 영향 |
|---|------|------|------|
| A2 | 감사 이력 DB 연동 | Low | Critical |
| F2 | 잠금 패널 미리보기 | Low | Very High |
| F3 | Next Action CTA | Low | High |
| A1 | QIS 장면 DB 연동 | Medium | Critical |

### Phase 2 — 핵심 고도화 (2주)

| # | 항목 | 노력 | 영향 |
|---|------|------|------|
| P1 | 포지셔닝 빈 화면 개선 | Medium | Very High |
| A4 | 벤치마크 실시간 진행률 | Medium | High |
| F1 | 랜딩 업종 자동 감지 | Medium | High |
| F4 | 진행 트래커 Step 설명 | Low | Medium |
| P2 | 모바일 탭 스크롤 힌트 | Low | Medium |

### Phase 3 — 프리미엄 기능 (3~4주)

| # | 항목 | 노력 | 영향 |
|---|------|------|------|
| A3 | QIS 3축 대시보드 UI | High | High |
| A5 | 시드 데이터 관리 UI | Low | Medium |
| A6 | 사이드바 QIS 메뉴 | Low | Medium |
| P3 | PDF 고도화 | Medium | Medium |
| P5 | A vs B 비교 모드 | High | High |

---

## 4. 기술 부채(Tech Debt) 개선

| # | 항목 | 현재 | 개선 |
|---|------|------|------|
| TD1 | 컴포넌트 지연 로딩 | 28개 동시 import | `React.lazy()` + `Suspense` |
| TD2 | 타입 안전성 | OverviewPanel에 `any[]` | CriticalIssue 인터페이스 |
| TD3 | 접근성(a11y) | ARIA 불완전 | 전체 ARIA 감사 |
| TD4 | 상태 관리 | 20+ `useState` | `useReducer`/Zustand |
| TD5 | 에러 바운더리 | 미적용 | 탭별 ErrorBoundary |
| TD6 | i18n | 한국어 하드코딩 | `useTranslation()` 전체 |
| TD7 | 테스트 | 없음 | E2E 핵심 경로 |
