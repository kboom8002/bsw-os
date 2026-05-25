# Brand Semantic Website OS — Gap Report & Verification Verdict (TDD-06)

Date: 2026-05-23  
Milestone: **TDD-06: Persona / Vibe Test Hardening**  
Status: **COMPLETE (100% GREEN)**  
Test Suite Coverage: **48 Test Files, 211 Test Cases fully PASSED**

---

## 1. Executive Summary

본 문서는 Brand Semantic Website OS의 브랜드 안전성 및 경험 통제 최하단 레이어인 **Persona Spec & Vibe OS**의 비즈니스 가드레일 강화와 런타임 제어 능력에 대한 엄격한 테스트 주도 설계(TDD) 하드닝 수행 리포트입니다.

본 작업은 단순한 prompt-only 텍스트 오용을 원천 차단하고 거버넌스 및 증적에 기반한 견고한 런타임 레이어를 확보하기 위해, Zod 사양 및 런타임 Action Layer 단에서 안전장치를 엄격히 하드닝했습니다. 이에 따른 23개의 추가 검증 케이스를 확보하고 전체 211개의 테스트 케이스를 100% 무결하게 합격(Green Status)시켰습니다.

---

## 2. Hardened Guardrail Features

TDD-06 마일스톤을 통해 검증 및 보완된 핵심 안전 기능들은 다음과 같습니다.

### 2.1 PersonaSpec Governance Enforcements
- **거버넌스 레이어 필수성 확보**: 단순 프롬프트 스크롤이 아닌 `governance_layer`, `authority_scope`, `legal_guardrails` 구조체 존재를 강제화하고, 누락 시 Persona 생성을 차단합니다.
- **Allowed Mode Switch 검사**: PersonaSpec에 선언된 `allowed_modes`에 한해서만 `current_mode` 및 mode-switch 업데이트가 허용되며, 그 외의 위반 시도는 즉각 `Zod/Validation Error`를 통보합니다.

### 2.2 Mode Switching & CRISIS Mode
- **상업성 CTA 원천 봉쇄**: active mode 가 `'crisis'` 상태로 격상되면, 어조에 스며들 수 있는 상업성 CTA 유도 단어(`buy now`, `sale`, `discount`, `purchase` 등)가 포착되는 순간 즉각 `CRISIS MODE ACTION BLOCK` 에러를 터뜨려 대외 배포를 중단시킵니다.
- **월권 행위 탐지 (Authority Overreach)**: `authority_scope`에 허가되지 않은 지식 범위(예: `clinical`)를 침범하여 clinical text를 발화/생성하려 할 때 즉시 경고 및 violations 배열을 빌드하여 월권을 예방합니다.

### 2.3 Persona Evaluation (P-MRI) & Warning Emission
- **가짜 정밀도(Fake Precision) 방지**: P-MRI(Persona Mismatch Risk Index) 계산 및 Evaluation Run 수행 시, `legal_guardrails`와 같은 법률 가이드라인 정보가 유실되어 있을 시 임의로 100% 완벽한 정밀도로 산출하는 것을 금하고, `details.warnings` 배열에 성실히 경고(`"Legal guardrails missing: P-MRI score includes default variance penalty."`)를 적재하여 감사를 촉구합니다.

### 2.4 VibeSpec & Vibe OS Alignment
- **VibeSpec과 Vibe OS 분리**: Vibe 스키마에 `anti_vibe_keywords` 배열을 정식 지원하여 브랜드의 Experiential Tone 에 반하는 금기 어휘들을 통합 통제합니다.
- **No Evidence, No Vibe Score 원칙 고수**: Vibe 평점 등록(`createVibeRatingEvent`) 시 증적(`evidence_item_id`)이 없거나, 등록되어 있어도 임상 리뷰어에 의해 `is_verified`가 완료되지 않은 미인증 증적일 경우 평점 인입을 원천 거절합니다.
- **타겟 매핑 제한 및 에러 차단**: Vibe Spec target_type을 `qis`, `object`, `surface`, `page`, `section` 로 제한하는 Zod Enum을 적용하여, 이상 범위를 지정하려 할 경우 Zod ZodError 수준에서 즉각 거절합니다.

### 2.5 precise Mathematical Metrics Validation
- **경험 수학 검증**:
  - **VPA (Vibe-to-Page Alignment)**: target vector 와 actual vector 간의 absolute difference sum을 계산하여 align율 산출.
  - **VCS (Vibe Consistency Score)**: 역사적 rating 데이터들에 대해 target vector 와의 차이에 대한 표준편차(StdDev)를 정밀 연산하여 일관성 산출.
  - **VMRI (Vibe Mismatch Risk Index)**: active page 들의 평균 MSA(Mismatch Severity)와 일관성 VCS의 비중(60:40)을 정교하게 결합한 리스크 지표 정밀 산출.

---

## 3. Automated Verification Status

신규 구축 및 보완한 테스트들이 모두 합격함을 검증했습니다:

| Test File | Verified Invariants | Status |
|---|---|---|
| `tests/unit/persona-validation.test.ts` | Governance layer presence & current_mode allowed_modes inclusion | ✅ PASS |
| `tests/unit/persona-mode-switch.test.ts` | CRISIS mode aggressive CTA blocking & Authority Overreach detection | ✅ PASS |
| `tests/unit/vibe-rating.test.ts` | Verified evidence requirement ("No evidence, no vibe score") & Target vector 100% sum check | ✅ PASS |
| `tests/unit/vibe-metrics.test.ts` | Precise mathematical calculations (VPA, VCS, VMRI, MSA absolute vectors) | ✅ PASS |
| `tests/unit/dark-pattern.test.ts` | False urgency, fear-based selling, and pressure CTA linguistic checks | ✅ PASS |
| `tests/integration/persona-vibe-actions.test.ts` | Invalid vibe target assignments rejection & target enum safety checks | ✅ PASS |
| `tests/e2e/persona-vibe-studio.spec.ts` | E2E Page Studio router smoke-rendering compilation validation | ✅ PASS |

---

## 4. Remaining Gaps & Roadmap

본 마일스톤에 따라 Persona & Vibe OS 의 런타임 제어 능력이 안전하게 굳어짐으로써 갭이 완전히 해소되었습니다.

- **향후 권장 과제**:
  1. **실시간 벡터 유사도(Cosine Similarity) 산출**: 현재 1차원 absolute difference 방식의 정량 연산을 고도화하여 Vector DB 및 Embedding 을 연계한 코사인 유사도 분석 엔진 결합.
  2. **Gemini Pro API & Residential Crawlers 연동**: mock crawling 및 mock observation을 실제 live AI 답변 엔진 수집 레이어와 정식 파이프라인으로 연결.
