# BSW-OS 지표 체계 매뉴얼 Vol.2 — 지표 레퍼런스 사전

> **Version:** v1.0  
> **System:** Brand Semantic Website OS (BSW-OS)  
> **대상 독자:** 분석가 · 전략가 · 개발자  
> **Last Updated:** 2026-06-01

---

## 목차

1. [Layer 1 — 관측 핵심 지표 (7개)](#1-layer-1--관측-핵심-지표)
2. [Layer 2 — MRI 도메인 지수 (6개)](#2-layer-2--mri-도메인-지수)
3. [Layer 3 — TCO-GEO 개념 충실도 (M1~M13)](#3-layer-3--tco-geo-개념-충실도)
4. [Layer 4 — K-Culture 확장 (M14~M15)](#4-layer-4--k-culture-확장)
5. [Layer 5 — SBS 산업 지수 (4개)](#5-layer-5--sbs-산업-지수)
6. [진화 대응표](#6-레거시--tco-geo-진화-대응표)

---

## 1. Layer 1 — 관측 핵심 지표

> **구현:** `app/actions/observatory.ts` → `computeMetricSnapshot()`  
> **DB:** `metric_snapshots` 테이블

---

### AAS — AI Answer Share (AI 응답 점유율)

| 항목 | 내용 |
|:---|:---|
| **정의** | Probe 질문 응답 중 브랜드 키워드가 언급된 비율 |
| **수식** | `AAS = (브랜드 키워드 포함 응답 수 / 전체 Probe 응답 수) × 100` |
| **범위** | 0 ~ 100 (%) |
| **데이터 소스** | `probe_runs.raw_response_text` — 브랜드명 substring 매칭 (case-insensitive) |
| **구현 위치** | `app/actions/observatory.ts` L507-513 |
| **기본값** | — |
| **TCO-GEO 진화** | → M1 (Concept Transfer Rate) |

**해석 기준:**

| 🟢 우수 | 🔵 양호 | 🟡 미흡 | 🔴 위험 |
|:---:|:---:|:---:|:---:|
| ≥ 80% | 60~79% | 40~59% | < 40% |

---

### OCR — Official Citation Rate (공식 인용률)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답에서 브랜드 공식 소스(URL, 문서)가 인용된 비율 |
| **수식** | `OCR = (is_citation_found=true 응답 수 / 전체 응답 수) × 100` |
| **범위** | 0 ~ 100 (%) |
| **데이터 소스** | `response_judgments.is_citation_found` |
| **구현 위치** | `app/actions/observatory.ts` L514-520 |
| **기본값** | — |
| **TCO-GEO 진화** | → M2 (Citation-Backed Rate) |

**해석 기준:**

| 🟢 우수 | 🔵 양호 | 🟡 미흡 | 🔴 위험 |
|:---:|:---:|:---:|:---:|
| ≥ 80% | 60~79% | 40~59% | < 40% |

---

### BSF — Brand Semantic Fidelity (브랜드 의미 충실도)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답이 브랜드의 원래 의미를 얼마나 정확하게 전달하는지의 평균 점수 |
| **수식** | `BSF = avg(brand_semantic_fidelity_score)` |
| **범위** | 0 ~ 100 |
| **데이터 소스** | `response_judgments.brand_semantic_fidelity_score` |
| **구현 위치** | `app/actions/observatory.ts` L521-527 |
| **기본값** | — |
| **TCO-GEO 진화** | → M3 (Brand Concept Fidelity) |

**해석 기준:**

| 🟢 우수 | 🔵 양호 | 🟡 미흡 | 🔴 위험 |
|:---:|:---:|:---:|:---:|
| ≥ 80 | 60~79 | 40~59 | < 40 |

---

### QTC — Question Territory Coverage (질문 영역 커버리지)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답이 질문의 핵심 의도 영역을 적절히 다루고 있는 비율 |
| **수식** | `QTC = (question_territory_covered=true 응답 수 / 전체) × 100` |
| **범위** | 0 ~ 100 (%) |
| **데이터 소스** | `response_judgments.question_territory_covered` |
| **구현 위치** | `app/actions/observatory.ts` L528-534 |

---

### GCTR — GEO Concept Transfer Rate (GEO 개념 전달률)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답에서 브랜드의 핵심 GEO 개념이 성공적으로 전달된 비율 |
| **수식** | `GCTR = (geo_concept_transferred=true 응답 수 / 전체) × 100` |
| **범위** | 0 ~ 100 (%) |
| **데이터 소스** | `response_judgments.geo_concept_transferred` |
| **TCO-GEO 진화** | → M1 + M5 조합 |

---

### ARS — AEO Readiness Score (AEO 준비 점수)

| 항목 | 내용 |
|:---|:---|
| **정의** | Layer 1 지표의 가중 복합 점수. AEO 최적화 종합 준비도. |
| **수식** | `ARS = AAS×0.2 + OCR×0.2 + BSF×0.3 + QTC×0.1 + GCTR×0.2` |
| **범위** | 0 ~ 100 |
| **가중치 근거** | BSF(의미 충실도)에 최대 가중치. 단순 노출보다 정확한 의미 전달이 중요. |
| **TCO-GEO 진화** | → M13 (AEO/GEO Readiness Score) |

```
ARS = ┌─ AAS  × 0.20 ─── AI 존재감
      ├─ OCR  × 0.20 ─── 공식 인용
      ├─ BSF  × 0.30 ─── 의미 충실도 (최대 가중치)
      ├─ QTC  × 0.10 ─── 영역 커버리지
      └─ GCTR × 0.20 ─── 개념 전달률
```

---

### SWEL — Semantic Website Exposure Lift (노출 증가율)

| 항목 | 내용 |
|:---|:---|
| **정의** | 시맨틱 웹사이트 배포 전후 AI 노출의 변화율 |
| **수식** | `SWEL = 배포 후 AAS / 배포 전 AAS` |
| **범위** | 0.0 ~ ∞ (1.0 = 변화 없음, >1.0 = 증가) |
| **의의** | 최적화 ROI를 직접 증명하는 전후 비교 지표 |

---

## 2. Layer 2 — MRI 도메인 지수

> **구현:** `app/actions/observatory.ts` → `computeDomainIndexSnapshot()`  
> **DB:** `domain_index_snapshots` 테이블

---

### B-MRI — Brand Meaning Readiness Index

| 항목 | 내용 |
|:---|:---|
| **정의** | 외부 관측 기반 브랜드 의미 준비도 (AI가 보는 브랜드) |
| **수식** | `0.20×AAS + 0.15×OCR + 0.20×BSF + 0.15×QTC + 0.15×GCTR + 0.10×ARS + 0.05×CPS − confPenalty×100 − volPenalty×100` |
| **범위** | 0 ~ 100 |
| **구현 위치** | `lib/metrics/b-mri.ts` (66 lines) |
| **CPS** | Competitive Position Score = `AAS / max(competitorAAS, 1)` (0~100 클램프) |

**가중치 구조:**

| 컴포넌트 | 가중치 | 역할 |
|:---|:---:|:---|
| AAS | 0.20 | AI 존재감 |
| BSF | 0.20 | 의미 정확성 |
| OCR | 0.15 | 공식 인용 |
| QTC | 0.15 | 영역 커버리지 |
| GCTR | 0.15 | 개념 전달 |
| ARS | 0.10 | 종합 준비도 |
| CPS | 0.05 | 경쟁사 대비 포지션 |

**등급:**

| 🏆 프리미엄 | 🟢 양호 | 🟡 보통 | 🔴 위험 |
|:---:|:---:|:---:|:---:|
| ≥ 90 | 75~89 | 60~74 | < 60 |

---

### D-MRI — Data Meaning Readiness Index

| 항목 | 내용 |
|:---|:---|
| **정의** | 내부 데이터 완성도 기반 의미 준비도 (우리가 준비한 것) |
| **범위** | 0 ~ 100 |
| **구현 위치** | `lib/metrics/d-mri.ts` (299 lines) |
| **서브-컴포넌트** | 12개 |

**12개 서브-컴포넌트:**

| 컴포넌트 | 가중치 | 데이터 소스 |
|:---|:---:|:---|
| Truth Readiness | 0.10 | `brand_strategic_truths`, `brand_operational_truths` |
| Evidence Readiness | 0.10 | `brand_truth_evidence` |
| Boundary Coverage | 0.10 | `boundary_rules` |
| Question System | 0.10 | `canonical_questions`, `probe_questions` |
| Concept Knowledge Graph | 0.10 | `brand_ontology_nodes`, `brand_ontology_edges` |
| Claim Lineage | 0.10 | `claim_lineage` |
| Object Completeness | 0.10 | `brand_objects` |
| Surface/Page Coverage | 0.10 | `semantic_pages` |
| Export Readiness | 0.05 | `export_snapshots` |
| Persona/Vibe Coverage | 0.05 | `persona_eval_runs`, `vibe_spec` |
| Observatory Coverage | 0.05 | `probe_panels`, `ai_observation_runs` |
| Fix-It Traceability | 0.05 | `fix_it_cases` |

> [!IMPORTANT]
> B-MRI와 D-MRI는 **합산하지 않습니다.** B-MRI는 외부 관측, D-MRI는 내부 준비도입니다. 둘의 갭이 개선 방향을 알려줍니다.

---

### OPS-MRI — Operations MRI

| 항목 | 내용 |
|:---|:---|
| **정의** | 운영 의미 준비도 (Truth 변경 이력 + Vibe 진단 기반) |
| **수식** | `avg(delta_severity) + avg(vibe_MSA)` |
| **데이터 소스** | `truth_delta_snapshots` + `vibe_diagnoses` |

---

### P-MRI — Persona MRI

| 항목 | 내용 |
|:---|:---|
| **정의** | 페르소나 Eval 완료율 |
| **수식** | `(미완료 persona_eval_runs / 전체) × 100` |
| **데이터 소스** | `persona_eval_runs` |

---

### V-MRI — Vibe MRI

| 항목 | 내용 |
|:---|:---|
| **정의** | 바이브 정렬도 (Vibe Alignment 부족분) |
| **수식** | `100 − avg(VPA)` |
| **데이터 소스** | `vibe_alignment_snapshots` |

---

### S-MRI — Semantic MRI

| 항목 | 내용 |
|:---|:---|
| **정의** | 시맨틱 종합 준비도 |
| **수식** | `ARS×0.4 + BSF×0.3 + QTC×0.3` |
| **데이터 소스** | `metric_snapshots` |

---

## 3. Layer 3 — TCO-GEO 개념 충실도

> **구현:** `lib/metrics/concept-fidelity-aggregator.ts`  
> **DB:** `concept_fidelity_snapshots` 테이블  
> **데이터 원천:** 6-Judge LLM Pipeline 출력

---

### M1: Concept Transfer Rate (개념 전달률)

| 항목 | 내용 |
|:---|:---|
| **정의** | Brand SSoT에 정의된 핵심 개념이 AI 응답에 정확하게 재현된 평균 비율 |
| **수식** | `M1 = avg(각 질문별 present_concepts / total_concepts)` |
| **범위** | 0.0 ~ 1.0 |
| **데이터 소스** | Judge 1 → `extracted_concepts[].present`, `accuracy` |
| **기본값** | 0.80 |

| A (≥0.85) | B (0.70~0.84) | C (0.55~0.69) | D (0.40~0.54) | F (<0.40) |
|:---:|:---:|:---:|:---:|:---:|
| 우수 | 양호 | 개선 필요 | 미흡 | 실패 |

---

### M2: Citation-Backed Rate (인용 검증률)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답에 존재하는 개념 중 공식 근거(Evidence)에 바인딩된 비율 |
| **수식** | `M2 = Σ(evidence_bound 개념 수) / Σ(present 개념 수)` |
| **범위** | 0.0 ~ 1.0 |
| **데이터 소스** | Judge 1 → `extracted_concepts[].evidence_bound` |
| **기본값** | 0.85 |
| **Legacy 대응** | OCR의 개념 단위 정밀화. BAIR에서 OCR→M2 자동 업그레이드. |

---

### M3: Brand Concept Fidelity (브랜드 개념 충실도)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답이 브랜드 SSoT의 원래 의미를 충실하게 재현하는 정도 |
| **수식** | `M3 = avg(fidelity_judgments.brand_concept_fidelity)` |
| **범위** | 0.0 ~ 1.0 |
| **데이터 소스** | Judge 2 (FidelityJudge) → `brand_concept_fidelity` |
| **기본값** | 0.82 |
| **Legacy 대응** | BSF의 LLM Judge 기반 정밀화. BAIR에서 BSF→M3×100 자동 업그레이드. |

**평가 4차원:** 정확성 · 완전성 · 맥락 적절성 · 톤 정합성

---

### M4: Concept Distortion Rate (개념 왜곡률)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답에서 브랜드 개념이 과장, 축소, 오분류된 비율 |
| **수식** | `M4 = avg(distortion_judgments.concept_distortion_rate)` |
| **범위** | 0.0 ~ 1.0 (**낮을수록 좋음**) |
| **데이터 소스** | Judge 3 (DistortionJudge) → `concept_distortion_rate`, `distortions[]` |
| **기본값** | 0.05 |

**왜곡 유형:**

| 유형 | 설명 | 예시 |
|:---|:---|:---|
| `exaggeration` | 효과/성능 과대 표현 | "99% 효과" → "100% 완벽한 효과" |
| `minimization` | 핵심 특성 축소 | "임상 검증 성분" → "일반 보습 성분" |
| `misclassification` | 카테고리 오분류 | "의약외품" → "화장품" |
| `competitor_merge` | 경쟁사 개념과 혼합 | 자사 특허 성분이 경쟁사에 귀속 |

| 🟢 안전 (≤0.05) | 🟡 주의 (0.05~0.15) | 🔴 위험 (>0.15) |
|:---:|:---:|:---:|

---

### M5: Missing Concept Gap Count (누락 개념 갭 수)

| 항목 | 내용 |
|:---|:---|
| **정의** | Recall Rate가 임계값(80%) 미만인 핵심 개념의 개수 |
| **수식** | `M5 = Count(concepts where recall_rate < 0.8)` |
| **범위** | 0 ~ N (정수, **낮을수록 좋음**) |
| **데이터 소스** | `missing_concept_gaps` 테이블 |
| **심각도** | `critical_gap` (recall < 0.4) / `moderate_gap` (0.4 ≤ recall < 0.8) |
| **비즈니스 응용** | M5 개념 목록 → Answer Card 백로그 자동 생성 |

---

### M6: Hallucinated Concept Rate (환각 개념률)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI가 Brand SSoT에 없는 개념을 마치 사실인 것처럼 생성한 비율 |
| **수식** | `M6 = avg(hallucination_judgments.hallucinated_concept_rate)` |
| **범위** | 0.0 ~ 1.0 (**낮을수록 좋음**) |
| **데이터 소스** | Judge 4 (HallucinationJudge) → `hallucinated_concept_rate`, `claims[]` |
| **기본값** | 0.03 |

**환각 유형:**

| 유형 | 위험도 | 예시 |
|:---|:---:|:---|
| `unsupported_claim` | 높음 | "FDA 승인 성분" (실제 미승인) |
| `fabricated_feature` | 높음 | "AI 맞춤 배합" (해당 기능 없음) |
| `false_association` | 중간 | "유명 피부과 추천" (추천 사실 없음) |
| `outdated_info` | 낮음 | 단종 제품을 현행으로 소개 |

| 🟢 안전 (≤0.03) | 🟡 주의 (0.03~0.10) | 🔴 위험 (>0.10) |
|:---:|:---:|:---:|

> [!CAUTION]
> YMYL 도메인(의료/법률/금융)에서는 M6 > 0.05 시 **즉시 대응** 필요

---

### M7: Attractor Stability (끌개 안정성)

| 항목 | 내용 |
|:---|:---|
| **정의** | 동일 질문 반복 관측 시 핵심 개념 구조가 일관되게 재현되는 정도 |
| **수식** | `M7 = 0.40×RecallConsistency + 0.20×RankStability + 0.20×RelationStability + 0.20×BoundarySuppression` |
| **범위** | 0.0 ~ 1.0 |
| **데이터 소스** | `AttractorStabilityCalculator.computeMetrics()` |
| **기본값** | 0.88 (단일 실행 시 1.0) |

| 컴포넌트 | 가중치 | 수식 |
|:---|:---:|:---|
| Recall Consistency | 40% | `1 − 4 × avg(p × (1−p))` |
| Rank Stability | 20% | `avg(1 / (1 + rank_variance))` |
| Relation Stability | 20% | `avg(1 − 4 × p(1−p))` |
| Boundary Suppression | 20% | 0.95 (기본값) |

| 🟢 매우 안정 (≥0.90) | 🟡 보통 (0.70~0.89) | 🔴 불안정 (<0.70) |
|:---:|:---:|:---:|

---

### M8: Drift Score (드리프트 점수)

| 항목 | 내용 |
|:---|:---|
| **정의** | Baseline 대비 Intervention 조건에서 개념 리콜 분포의 변화량 |
| **수식** | `M8 = 1 − cosine_similarity(baseline_dist, current_dist)` |
| **범위** | 0.0 ~ 1.0 (0 = 변화 없음, 1 = 완전 변화) |
| **방향성** | `positive` (개선) / `negative` (악화) / `neutral` |
| **데이터 소스** | `DriftCalculator.computeDrift()` |
| **기본값** | 0.0 (baseline 조건에서) |
| **방향 판정** | `sum(B) − sum(A) > 0.02` → positive, `< −0.02` → negative |

---

### M9: Floor Risk (바닥 리스크)

| 항목 | 내용 |
|:---|:---|
| **정의** | 상위 10% 최악 응답의 평균 리스크 점수 (Worst-case 안전성) |
| **수식** | `M9 = avg(top 10% highest risk_score values)` |
| **범위** | 0.0 ~ 1.0 (**낮을수록 안전**) |
| **데이터 소스** | Judge 5 (RiskJudge) → `risk_score` |
| **기본값** | 0.05 |

| 🟢 안전 (≤0.10) | 🟡 주의 (0.10~0.30) | 🔴 위험 (>0.30) |
|:---:|:---:|:---:|

---

### M10: Policy Alignment (정책 정합성)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답이 브랜드 톤, CTA, 안전 요구사항 등 정책을 준수하는 정도 |
| **수식** | `M10 = avg(policy_judgments.policy_alignment)` |
| **범위** | 0.0 ~ 1.0 |
| **데이터 소스** | Judge 6 (PolicyJudge) → `policy_alignment`, `violations[]` |
| **기본값** | 0.90 |

**위반 유형:**

| 유형 | 심각도 | 설명 |
|:---|:---:|:---|
| `tone_mismatch` | 2~3/5 | Vibe Spec과 불일치 |
| `unauthorized_cta` | 3~4/5 | 허가되지 않은 CTA |
| `safety_violation` | 4~5/5 | YMYL 안전 규정 위반 |
| `boundary_breach` | 5/5 | 금지 표현 사용 |

---

### M11: Consensus Score (합의 점수)

| 항목 | 내용 |
|:---|:---|
| **정의** | 반복 관측 시 응답 간 개념 집합의 유사도 |
| **수식** | `M11 = avg(Jaccard(run_i, run_j))` for all pairs |
| **범위** | 0.0 ~ 1.0 |
| **데이터 소스** | `AttractorStabilityCalculator` |
| **기본값** | 0.90 (단일 실행 시 1.0) |
| **Jaccard 공식** | `|A ∩ B| / |A ∪ B|` (A, B = present=true 개념 집합) |

---

### M12: Variance Score (분산 점수)

| 항목 | 내용 |
|:---|:---|
| **정의** | 반복 관측 시 개별 개념의 출현/소멸 분산 총합 |
| **수식** | `M12 = Σ(p_c × (1 − p_c))` for each concept c |
| **범위** | 0.0 ~ ∞ (**낮을수록 안정**) |
| **데이터 소스** | `AttractorStabilityCalculator` |
| **기본값** | 0.05 (단일 실행 시 0.0) |
| **해석** | p=0 또는 1 → 분산 0 (안정), p=0.5 → 분산 0.25 (최대 불확실성) |

---

### M13: AEO/GEO Readiness Score (준비도 점수)

| 항목 | 내용 |
|:---|:---|
| **정의** | TCO-GEO 메트릭을 가중 결합한 최종 복합 준비도 점수 |
| **범위** | 0.0 ~ 1.0 |

**가중 수식:**

```
M13 = 0.15 × SSoT_Completeness
    + 0.15 × Answer_Coverage
    + 0.10 × M2 (Citation-Backed)
    + 0.10 × Technical_Structure
    + 0.15 × M1 (Concept Transfer)
    + 0.15 × M3 (Brand Fidelity)
    + 0.10 × M10 (Policy Alignment)
    + 0.10 × (1.0 − M9 Floor Risk)
```

**등급:**

| A (≥0.85) | B (0.70~0.84) | C (0.55~0.69) | D (0.40~0.54) | F (<0.40) |
|:---:|:---:|:---:|:---:|:---:|
| 우수 — 전략적 우위 | 양호 — 안정적 전달 | 개선 필요 — 갭 존재 | 미흡 — 구조적 개선 | 실패 — SSoT 재구축 |

---

## 4. Layer 4 — K-Culture 확장

> **구현:** `lib/metrics/cultural-metrics-aggregator.ts`  
> **실행:** `app/actions/kculture-eval.ts` → `runKCultureEvaluation()`

---

### M14: Cross-Cultural Resonance (문화간 공명도)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI가 한국 문화 콘텐츠를 문화적 정확성과 안전성을 갖추어 전달하는 종합 점수 |
| **수식** | `M14 = 0.4×M3 + 0.3×(1−M4) + 0.3×(1−M9)` |
| **범위** | 0.0 ~ 1.0 |
| **구성 요소** | 충실도(M3) 40% + 비왜곡(1−M4) 30% + 안전(1−M9) 30% |

**가중치 근거:**
- M3(충실도)에 최대 가중치: 문화적 콘텐츠에서 **정확한 의미 전달**이 가장 중요
- M4(왜곡) 역수: 스테레오타입, 오리엔탈리즘 표현 억제
- M9(리스크) 역수: 문화적 오해를 유발하는 위험 표현 제거

---

### M15: Commercial Transferability (상업적 전환 가능성)

| 항목 | 내용 |
|:---|:---|
| **정의** | AI 응답이 실제 상업적 전환(구매, 관심 제고)으로 이어질 수 있는 정도 |
| **수식** | `M15 = 0.5×M1 + 0.3×M2 + 0.2×M10` |
| **범위** | 0.0 ~ 1.0 |
| **구성 요소** | 개념 전달(M1) 50% + 인용 검증(M2) 30% + 정책 준수(M10) 20% |

**가중치 근거:**
- M1(전달률)에 최대 가중치: 핵심 개념이 전달되지 않으면 상업적 전환 불가
- M2(인용): 공식 출처 인용이 구매 의사결정에 영향
- M10(정책): 정책 준수가 CTA 및 리디렉션 효과 보장

---

## 5. Layer 5 — SBS 산업 지수

---

### BAIR — Brand AI Reputation Index

| 항목 | 내용 |
|:---|:---|
| **정의** | 브랜드의 AI 검색 환경 내 종합 평판 점수 |
| **수식** | `BAIR = BSF × AAS × (1 + OCR) × SWEL` |
| **범위** | 0 ~ ∞ (상대적 점수) |
| **구현 위치** | `lib/sbs-index/bair.ts` → `BairEngine.computeBAIR()` |
| **TCO-GEO 자동 업그레이드** | `concept_fidelity_snapshots` 존재 시: BSF → **M3×100**, OCR → **M2** |

---

### AITI — AI Trust Index

| 항목 | 내용 |
|:---|:---|
| **정의** | 브랜드의 AI 응답 신뢰도 종합 점수 |
| **수식** | `AITI = (Evidence Match Rate × 100) − (Unsafe Wording Count × 5)` |
| **범위** | 0 ~ 100 |
| **구현 위치** | `lib/sbs-index/bair.ts` → `BairEngine.computeAITI()` |
| **데이터 소스** | `brand_truth_evidence.verification_status` + `unsafe_wording_findings` |

---

### AIPR — AI Power Ranking

| 항목 | 내용 |
|:---|:---|
| **정의** | 산업별 경쟁사 대비 브랜드의 AI 검색 순위 |
| **수식** | 각 브랜드별 BAIR 점수 → 내림차순 정렬 |
| **구현 위치** | `lib/sbs-index/aipr.ts` → `AiprEngine.computeAIPR()` |
| **출력** | `[{rank, brand, bairScore, details}]` |

---

### KAIVI — Korea AI Visibility Index

| 항목 | 내용 |
|:---|:---|
| **정의** | 전 산업 평균 AI 가시성 종합 지수 |
| **수식** | `KAIVI = avg(산업별 Top BAIR) × avg(MRI)` |
| **범위** | 0 ~ 100 |
| **구현 위치** | `lib/sbs-index/kaivi.ts` → `KaiviEngine.computeKAIVI()` |
| **MRI** | Meaning Readiness Index = 승인된 Brand Truth 비율 |

---

## 6. 레거시 → TCO-GEO 진화 대응표

| Legacy | → | TCO-GEO | 진화 내용 |
|:---|:---:|:---|:---|
| AAS (키워드 매칭) | → | **M1** (개념 전달률) | 키워드 → 개념 단위, 정밀도·재현율 기반 |
| OCR (URL 인용) | → | **M2** (인용 검증률) | 응답 단위 → 개념 단위, Evidence Binding |
| BSF (스코어 평균) | → | **M3** (개념 충실도) | 수동 → LLM Judge 자동 평가 |
| GCTR (불리언 전달) | → | **M1 + M5** 조합 | 개별 개념 재현율 + 갭 분석 |
| — (신규) | | **M4** (왜곡률) | 왜곡 유형별 분류 및 심각도 평가 |
| — (신규) | | **M6** (환각률) | 미검증 주장 탐지 |
| — (신규) | | **M7~M12** (안정성) | 반복 관측 기반 통계적 안정성 |
| ARS (가중 복합) | → | **M13** (준비도) | 6→8차원, 안전성·정책 포함 |

---

> **관련 문서:**
> - [Vol.1 — 아키텍처 총론](./metrics-manual-architecture.md)
> - [Vol.3 — 측정 실행 매뉴얼](./metrics-manual-operations.md)
> - [Vol.4 — 결과 해석 및 활용 가이드](./metrics-manual-interpretation.md)
> - [Vol.5 — API 및 함수 레퍼런스](./metrics-manual-api.md)
