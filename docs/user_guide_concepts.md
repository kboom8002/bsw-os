# BSW-OS 주요 개념과 용어 정의 · 기능 명세

> **Brand Semantic Website OS (BSW-OS) v1.0**  
> 최종 업데이트: 2026-05-23

---

## 목차

1. [핵심 용어 사전](#1-핵심-용어-사전)
2. [Brand Truth 모듈 상세](#2-brand-truth-모듈-상세)
3. [Semantic Core 모듈 상세](#3-semantic-core-모듈-상세)
4. [Object / Surface / Website 모듈 상세](#4-object--surface--website-모듈-상세)
5. [Persona & Vibe 모듈 상세](#5-persona--vibe-모듈-상세)
6. [Observatory & Metrics 모듈 상세](#6-observatory--metrics-모듈-상세)
7. [Report Publisher 모듈 상세](#7-report-publisher-모듈-상세)
8. [Fix-It & Factory 모듈 상세](#8-fix-it--factory-모듈-상세)
9. [메트릭 용어 사전](#9-메트릭-용어-사전)
10. [안전 언어 규칙](#10-안전-언어-규칙)
11. [데이터 스키마 참조](#11-데이터-스키마-참조)

---

## 1. 핵심 용어 사전

### 시스템 기본 용어

| 용어 | 영문 | 정의 |
|---|---|---|
| **워크스페이스** | Workspace | 테넌트의 최상위 격리 단위. 모든 데이터는 워크스페이스에 귀속됨 |
| **도메인** | Domain | 워크스페이스 내 사업 영역 (예: K-뷰티, 편의점, 웨딩) |
| **도메인 팩** | Domain Pack | 도메인별 설정 번들 (메트릭 가중치, 프로브 설정 등) |
| **브랜드 엔티티** | Brand Entity | 도메인 내 개별 브랜드 (예: PureBarrier, Quick25) |
| **서버 액션** | Server Action | Next.js `"use server"` 기반의 안전한 데이터 변경 함수 |
| **RLS** | Row-Level Security | 데이터베이스 행 단위 보안 정책 |
| **RBAC** | Role-Based Access Control | 역할 기반 접근 제어 |
| **아티팩트** | Artifact | 시스템이 관리하는 모든 구조화된 데이터 객체의 총칭 |
| **게이트** | Gate | 아티팩트의 품질/안전성을 프로그래밍 방식으로 판정하는 검사 |
| **Candidate** | — | AI 또는 자동화가 생성한 아티팩트의 기본 상태 (인간 검토 대기) |

### 비즈니스 전략 용어

| 용어 | 영문 | 정의 |
|---|---|---|
| **SEO** | Search Engine Optimization | 검색 엔진 최적화 |
| **AEO** | Answer Engine Optimization | AI 답변 엔진 최적화 |
| **GEO** | Generative Engine Optimization | 생성형 엔진 최적화 |
| **YMYL** | Your Money or Your Life | 건강·금융 등 고위험 콘텐츠 분류 |
| **MeaningOps** | — | 브랜드의 의미를 구조적으로 정의·관리·측정하는 운영 체계 |
| **프록시 측정** | Proxy Measurement | AI 응답 관측은 실제 시장 점유율이 아닌 패널 기반 간접 측정치 |

---

## 2. Brand Truth 모듈 상세

### 개요

Brand Truth Studio는 **브랜드가 의미하고자 하는 바**, **입증할 수 있는 바**, **AI가 실제로 재구성하는 바** 사이의 차이를 구조적으로 관리합니다.

### 아티팩트 정의

#### 2-1. Strategic Truth (전략적 진실)

| 필드 | 타입 | 설명 |
|---|---|---|
| `statement` | string | 브랜드의 핵심 전략적 선언 |
| `vision` | string? | 브랜드 비전 텍스트 |
| `core_pillars` | string[] | 핵심 기둥 목록 (예: "순수 성분", "피부과학 근거") |

**예시:**
```json
{
  "statement": "PureBarrier는 민감성 피부를 위한 과학 기반 스킨케어 브랜드입니다.",
  "vision": "모든 사람이 자신감 있는 피부를 가질 수 있도록",
  "core_pillars": ["피부과학 근거", "순수 성분", "임상 검증"]
}
```

#### 2-2. Operational Truth (운영적 진실)

입증 가능한 개별 클레임(주장)입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `claim` | string | 구체적인 주장 (최소 5자) |
| `risk_level` | enum | `low` / `medium` / `high` / `critical` |
| `confidence_score` | number | 0~100 신뢰도 점수 |
| `review_status` | enum | `draft` / `in_review` / `approved` / `rejected` |

**예시:**
```json
{
  "claim": "레티놀 0.05% 함유 크림이 4주 임상시험에서 피부 수분량 23% 향상",
  "risk_level": "high",
  "confidence_score": 87,
  "review_status": "approved"
}
```

#### 2-3. Observed Truth (관찰된 진실)

AI가 실제로 재구성한 브랜드 클레임입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `observed_claim` | string | AI가 생성한 관찰 클레임 |
| `source_domain` | string | 관찰 출처 (예: "google_sge", "perplexity") |
| `is_aligned_with_operational` | boolean | 운영적 진실과 일치 여부 |
| `raw_payload` | JSON | 원시 응답 데이터 |

#### 2-4. Evidence Item (증거 항목)

| 필드 | 타입 | 설명 |
|---|---|---|
| `title` | string | 증거 제목 |
| `content` | string | 증거 내용 |
| `evidence_type` | enum | `clinical_trial` / `lab_report` / `certificate` / `manual_verify` |
| `is_verified` | boolean | 검증 완료 여부 |

#### 2-5. Boundary Rule (경계 규칙)

콘텐츠에서 사용 금지 표현과 필수 고지사항을 정의합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `rule_name` | string | 규칙 이름 (예: "YMYL 스킨케어 경계") |
| `forbidden_terms` | string[] | 금지 표현 목록 |
| `required_disclosures` | string[] | 필수 고지사항 목록 |
| `risk_level` | enum | `low` / `medium` / `high` / `critical` |

**예시:**
```json
{
  "rule_name": "YMYL 스킨케어 경계",
  "forbidden_terms": ["치료", "완치", "의학적 효과 보장"],
  "required_disclosures": ["개인 피부 반응이 다를 수 있습니다", "피부과 전문의 상담 권장"],
  "risk_level": "critical"
}
```

#### 2-6. Truth Delta Snapshot (진실 차이 스냅샷)

Observed Truth와 Operational Truth 사이의 차이(Delta)를 기록합니다.

#### 2-7. Truth Lock Evaluation (진실 잠금 평가)

| 게이트 레벨 | 설명 |
|---|---|
| **L0** | 초기 상태 — 미검증 |
| **L1** | 기본 구조 검증 완료 |
| **L2** | 증거 연결 확인 완료 |
| **L3** | 경계 규칙 적용 확인 완료 |
| **L4** | 최종 잠금 — 수정 시 새 버전 필요 |

---

## 3. Semantic Core 모듈 상세

### 개요

Semantic Core Studio는 Brand Truth를 **질문, 개념, 지식 그래프, QIS, 클레임 계보(lineage)**로 변환합니다.

### 아티팩트 정의

#### 3-1. Question Signal (질문 신호)

검색 엔진에서 수집된 원시 검색 질문입니다.

| 필드 | 설명 |
|---|---|
| `query` | 원시 검색 쿼리 |
| `volume` | 검색 볼륨 (0 이상) |
| `intent` | `informational` / `transactional` / `commercial` / `local` |
| `status` | `mined` (수집) → `promoted` (승격) 또는 `ignored` (무시) |

#### 3-2. Question Capital Node (질문 자본 노드)

전략적 가치를 가진 질문 클러스터입니다.

| 필드 | 설명 |
|---|---|
| `title` | 질문 자본 노드 제목 |
| `strategic_weight` | 전략적 가중치 (0~100) |
| `parent_id` | 상위 노드 (계층 구조) |

**예시:** "민감성 피부 레티놀" → 전략적 가중치 85

#### 3-3. Canonical Question (정규 질문)

동일한 의도를 가진 질문들의 대표 질문입니다.

| 필드 | 설명 |
|---|---|
| `normalized_question` | 정규화된 질문 텍스트 |
| `slug` | URL-safe 식별자 |
| `signature` | 안정적 해시 서명 (최대 64자) |

**예시:**
```
"민감성 피부에 좋은 레티놀 사용법" 
→ slug: "sensitive-skin-retinol-usage"
→ signature: "a1b2c3d4..."
```

#### 3-4. QIS Scene (질문 의도 장면)

Canonical Question에서 파생된 **실행 가능한 검색 장면**입니다.

| 필드 | 설명 |
|---|---|
| `scene_name` | 장면 이름 |
| `query_template` | 쿼리 템플릿 |
| `intent_model` | 의도 모델 유형 |
| `scenario_context` | 시나리오 맥락 설명 |
| `risk_level` | 장면의 위험 수준 |

**예시:**
```json
{
  "scene_name": "레티놀 루틴 추천 장면",
  "query_template": "민감성 피부 레티놀 루틴 추천해줘",
  "intent_model": "informational_routine",
  "scenario_context": "사용자가 민감성 피부에 적합한 레티놀 사용 순서를 찾는 상황",
  "risk_level": "high"
}
```

#### 3-5. TCO Concept (주제 개념 온톨로지)

단순 태그가 아닌 **의미론적 개념**입니다.

| 필드 | 설명 |
|---|---|
| `concept_name` | 개념 이름 |
| `definition` | 개념 정의 (5자 이상) |
| `is_strategic` | 전략적 개념 여부 |
| `concept_type` | 개념 유형 (기본: `tco_domain_entity`) |

**예시:** "레티놀 농도 가이드라인" — 정의: "피부 타입별 레티놀 적정 농도 범위와 사용 빈도 지침"

#### 3-6. Brand Ontology Node / Edge (브랜드 온톨로지)

지식 그래프의 노드와 간선입니다.

#### 3-7. Claim Node (클레임 노드)

Operational Truth에서 파생된 개별 클레임 단위입니다.

#### 3-8. Lineage Record (계보 기록)

클레임 → 증거 → 경계 규칙 간의 추적 가능한 연결 기록입니다.

| 필드 | 설명 |
|---|---|
| `claim_node_id` | 연결된 클레임 노드 |
| `evidence_item_id` | 뒷받침하는 증거 (선택) |
| `boundary_rule_id` | 적용된 경계 규칙 (선택) |
| `is_publishable` | 발행 가능 여부 |
| `verification_signature` | 검증 서명 |

---

## 4. Object / Surface / Website 모듈 상세

### 개요

시맨틱 아티팩트를 추적 가능한 페이지와 SEO/AEO/GEO 내보내기로 변환합니다.

### 핵심 원칙: Object-first, Page-later

```
잘못된 방식:  페이지부터 작성 → 나중에 사실 확인
올바른 방식:  사실(Object) 정의 → 표면(Surface) 계약 → 페이지(Page) 생성
```

### 아티팩트 정의

#### 4-1. Representation Object (표현 객체)

페이지의 원자적 사실 단위입니다.

| 필드 | 설명 |
|---|---|
| `object_name` | 객체 이름 |
| `object_type` | 유형 (예: `ingredient`, `menu_combo`, `venue`) |
| `qis_refs` | 연결된 QIS 장면 ID 배열 |
| `claim_refs` | 연결된 클레임 ID 배열 |
| `evidence_refs` | 연결된 증거 ID 배열 |
| `boundary_refs` | 연결된 경계 규칙 ID 배열 |
| `readiness_status` | `draft` / `ready` / `failed_safety` |

**예시:**
```json
{
  "object_name": "PureBarrier 레티놀 루틴",
  "object_type": "ingredient",
  "qis_refs": ["uuid-1", "uuid-2"],
  "claim_refs": ["uuid-3"],
  "evidence_refs": ["uuid-4"],
  "boundary_refs": ["uuid-5"],
  "readiness_status": "ready"
}
```

#### 4-2. Surface Contract (표면 계약)

페이지가 **어떤 객체를 포함해야 하고, 어떤 블록이 필수인지** 정의합니다.

| 필드 | 설명 |
|---|---|
| `allowed_objects` | 허용된 객체 ID 배열 |
| `qis_refs` | 연결된 QIS 장면 |
| `required_blocks` | 필수 블록 목록 (예: `["clinical_facts", "safety_notice"]`) |
| `is_valid` | 유효성 검증 통과 여부 |

#### 4-3. Semantic Page (의미론적 페이지)

실제 렌더링되는 웹 페이지입니다.

| 필드 | 설명 |
|---|---|
| `surface_contract_id` | 기반이 되는 표면 계약 |
| `visible_content` | 사용자에게 보이는 콘텐츠 |
| `source_content` | 원본/출처 콘텐츠 |
| `object_refs` | 포함된 객체 참조 |
| `qis_refs` / `claim_refs` / `concept_refs` | 추적성 참조 |

#### 4-4. Schema Mapping (스키마 매핑)

JSON-LD 구조화 데이터 매핑입니다.

| 필드 | 설명 |
|---|---|
| `schema_type` | Schema.org 유형 (예: `Product`, `LocalBusiness`) |
| `jsonld_mapping` | JSON-LD 매핑 데이터 |
| `is_valid` | JSON-LD 유효성 |

#### 4-5. SEO/AEO/GEO Export (내보내기)

| 필드 | 설명 |
|---|---|
| `export_type` | 내보내기 유형 |
| `rendered_payload` | 렌더링된 출력물 |
| `traceability_carrier` | 추적성 메타데이터 |

#### 4-6. Internal Link Rule (내부 링크 규칙)

개념과 페이지 간의 전략적 내부 링크 규칙입니다.

---

## 5. Persona & Vibe 모듈 상세

### 개요

**PersonaSpec**은 브랜드가 응답자로서 **누구인지**, **VibeSpec**은 콘텐츠 표면이 **어떤 경험적 신호를 만들어야 하는지** 정의합니다.

### 아티팩트 정의

#### 5-1. PersonaSpec (페르소나 사양)

| 필드 | 설명 |
|---|---|
| `persona_name` | 페르소나 이름 (예: "피부과학 어드바이저") |
| `governance_layer` | 거버넌스 설정 (JSON) |
| `authority_scope` | 권위 범위 배열 |
| `legal_guardrails` | 법적 가드레일 배열 |
| `allowed_modes` | 허용 모드 (예: `["standard", "advisory", "crisis"]`) |
| `current_mode` | 현재 모드 (`standard` / `advisory` / `crisis`) |
| `prompt_text` | AI 프롬프트 텍스트 |
| `version` | 버전 번호 (양의 정수) |

**모드 설명:**

| 모드 | 설명 |
|---|---|
| `standard` | 일반 운영 모드 |
| `advisory` | 자문/주의 모드 (보수적 톤) |
| `crisis` | 위기 모드 — 공격적 CTA 억제, 안전 우선 |

#### 5-2. VibeSpec (바이브 사양)

콘텐츠의 경험적 벡터를 정의합니다.

| 필드 | 설명 |
|---|---|
| `vibe_name` | 바이브 이름 (예: "신뢰 우선 임상") |
| `target_vector` | 목표 벡터 (예: `{ clinical: 50, warm: 30, luxury: 20 }`) |
| `anti_vibe_keywords` | 안티 바이브 키워드 (콘텐츠에서 배제할 표현) |

**예시:**
```json
{
  "vibe_name": "trust-first-clinical",
  "target_vector": { "clinical": 50, "warm": 30, "luxury": 20 },
  "anti_vibe_keywords": ["마법", "기적", "즉시", "100%"]
}
```

#### 5-3. Vibe Rating Event (바이브 평가 이벤트)

| 필드 | 설명 |
|---|---|
| `vibe_spec_id` | 평가 기준 바이브 |
| `target_id` / `target_type` | 평가 대상 (페이지, 섹션 등) |
| `rating_scores` | 차원별 점수 (예: `{ clinical: 45, warm: 35, luxury: 20 }`) |
| `evidence_item_id` | **필수** — 증거 없는 바이브 점수 불가 |

> ⚠️ **핵심 규칙: "증거 없이는 바이브 점수 없음."** `evidence_item_id`는 필수 필드입니다.

#### 5-4. Vibe Alignment Snapshot (바이브 정렬 스냅샷)

| 필드 | 설명 |
|---|---|
| `vpa` | Vibe-Page Alignment (바이브-페이지 정렬도) |
| `vcs` | Vibe Consistency Score (바이브 일관성 점수) |

#### 5-5. Dark Pattern Rule (다크 패턴 규칙)

| 필드 | 설명 |
|---|---|
| `rule_name` | 규칙 이름 |
| `forbidden_linguistic_triggers` | 금지 언어 트리거 목록 |

---

## 6. Observatory & Metrics 모듈 상세

### 개요

AI/검색 엔진의 응답에서 브랜드 노출을 **패널 기반 프록시 측정치**로 관측합니다.

### 아티팩트 정의

#### 6-1. Probe Panel (프로브 패널)

관측 질문의 버전 관리되는 세트입니다.

| 필드 | 설명 |
|---|---|
| `panel_name` | 패널 이름 |
| `version` | 버전 번호 (양의 정수) |
| `is_locked` | 잠금 여부 — 잠긴 패널은 수정 불가, 새 버전 필요 |

#### 6-2. Probe Question (프로브 질문)

패널 내 개별 관측 질문입니다.

| 필드 | 설명 |
|---|---|
| `question_text` | 질문 텍스트 |
| `intent_context` | 의도 맥락 |
| `target_keyword` | 대상 키워드 |

#### 6-3. AI Observation Run (AI 관측 실행)

프로브 패널에 대한 하나의 관측 세션입니다.

#### 6-4. Probe Run (프로브 실행)

개별 질문에 대한 AI 응답 실행입니다.

| 필드 | 설명 |
|---|---|
| `engine_name` | AI 엔진 이름 (기본: `mock_provider`) |
| `raw_response_text` | **원시 응답 텍스트** — 반드시 저장 |
| `metadata` | 실행 메타데이터 (모델, 파라미터 등) |

#### 6-5. Response Judgment (응답 판정)

| 필드 | 설명 |
|---|---|
| `is_citation_found` | 인용 발견 여부 |
| `brand_semantic_fidelity_score` | 브랜드 의미 충실도 점수 |
| `question_territory_covered` | 질문 영역 커버 여부 |
| `geo_concept_transferred` | GEO 개념 전이 여부 |
| `review_status` | 기본 `candidate` — AI 판정은 후보 상태 |

#### 6-6. Metric Snapshot (메트릭 스냅샷)

| 필드 | 설명 |
|---|---|
| `metric_name` | 메트릭 이름 (예: "AAS", "OCR", "BSF") |
| `metric_value` | 측정 값 |
| `ai_observation_run_id` | 원본 관측 실행 연결 |

#### 6-7. Domain Index Definition / Snapshot (도메인 지수)

여러 메트릭을 가중 합산한 도메인 종합 지수입니다.

```json
{
  "configured_weights": {
    "AAS": 0.2,
    "OCR": 0.2,
    "BSF": 0.3,
    "QTC": 0.1,
    "GCTR": 0.2
  }
}
```

---

## 7. Report Publisher 모듈 상세

### 개요

메트릭 스냅샷과 도메인 지수를 **안전하고, 검토 가능하며, 방법론이 공개된 벤치마크 보고서**로 변환합니다.

### 아티팩트 정의

#### 7-1. Benchmark Report (벤치마크 보고서)

| 필드 | 설명 |
|---|---|
| `report_name` | 보고서 이름 |
| `panel_version` | 사용된 패널 버전 |
| `scores` | 점수 데이터 (JSON) |
| `methodology_disclosure_id` | 방법론 공개 문서 연결 |

#### 7-2. Report Section (보고서 섹션)

| 섹션 유형 | 설명 |
|---|---|
| `executive_summary` | 경영진 요약 |
| `metrics_analysis` | 메트릭 분석 |
| `competitive_landscape` | 경쟁 환경 |
| `methodology_appendix` | 방법론 부록 |

#### 7-3. Methodology Disclosure (방법론 공개)

| 필드 | 설명 |
|---|---|
| `methodology_description` | 방법론 설명 |
| `proxy_caveat_text` | **프록시 주의사항** — 필수 |

#### 7-4. Report Export (보고서 내보내기)

| 필드 | 설명 |
|---|---|
| `export_format` | `markdown` 또는 `html` |
| `exported_payload` | 렌더링된 출력물 |
| `is_published` | 발행 여부 |

#### 7-5. Unsafe Wording Finding (안전하지 않은 표현 발견)

| 필드 | 설명 |
|---|---|
| `finding_type` | 발견 유형 |
| `offending_text` | 문제 표현 |
| `is_resolved` | 해결 여부 |

### 보고서 내보내기 게이트 규칙

보고서는 다음 조건을 **모두** 충족해야만 내보낼 수 있습니다:

```
✅ 방법론 공개(Methodology Disclosure) 첨부
✅ 프록시 주의사항(Proxy Caveat) 포함
✅ 안전하지 않은 표현(Unsafe Wording) 검사 통과
✅ 실제 브랜드 순위 포함 시 리뷰 완료
✅ AI 초안은 candidate 상태 유지 (자동 승인 불가)
```

---

## 8. Fix-It & Factory 모듈 상세

### 개요

메트릭 약점으로부터 **근본 원인 분석(RCA) → 패치 → 재검증(Retest) → 성과(Lift) → 재사용 패턴 승격**까지의 폐쇄 루프(closed loop)를 관리합니다.

### 아티팩트 정의

#### 8-1. RCA Case (근본 원인 분석 케이스)

| 필드 | 설명 |
|---|---|
| `source_metric_snapshot_id` | 문제 메트릭 출처 |
| `metric_name` | 문제 메트릭 이름 |
| `metric_value` | 문제 메트릭 값 |
| `cause_hypothesis` | **구조화된 원인 가설** (최소 10자) — 필수 |
| `status` | `candidate` / `approved` / `rejected` |

**예시:**
```json
{
  "metric_name": "ARS",
  "metric_value": 0.23,
  "cause_hypothesis": "PureBarrier 레티놀 루틴 페이지의 JSON-LD 스키마에 dosage 정보가 누락되어 AI가 복용량을 정확히 인용하지 못함",
  "status": "candidate"
}
```

#### 8-2. Patch Ticket (패치 티켓)

| 필드 | 설명 |
|---|---|
| `rca_case_id` | 연결된 RCA 케이스 |
| `patch_name` | 패치 이름 |
| `patch_hypothesis` | **패치 가설** (최소 10자) — 필수 |
| `status` | `candidate` → `approved` → `applied` → `completed` / `rejected` |

> 📌 모든 패치는 **가설**입니다. "확실한 해결책"이라고 표현할 수 없습니다.

#### 8-3. Patch Artifact Change (패치 아티팩트 변경)

| 필드 | 설명 |
|---|---|
| `target_artifact_type` | 변경 대상 유형 (예: `semantic_page`, `schema_mapping`) |
| `target_artifact_id` | 변경 대상 ID |
| `original_payload` | 변경 전 상태 |
| `modified_payload` | 변경 후 상태 |

#### 8-4. Retest Plan (재검증 계획)

| 필드 | 설명 |
|---|---|
| `patch_ticket_id` | 검증할 패치 |
| `probe_panel_id` | 사용할 프로브 패널 |
| `baseline_run_id` | 기준선(baseline) 관측 실행 |

#### 8-5. Retest Run (재검증 실행)

| 필드 | 설명 |
|---|---|
| `retest_plan_id` | 재검증 계획 |
| `retest_observation_run_id` | 재검증 관측 실행 |
| `status` | `pending` → `running` → `completed` / `failed` |
| `retest_verdict` | `pass` 또는 `fail` |

#### 8-6. Post-Patch Lift Snapshot (패치 후 성과 스냅샷)

| 필드 | 설명 |
|---|---|
| `baseline_scores` | 기준선 점수 |
| `retest_scores` | 재검증 점수 |
| `lift_values` | 성과 변동량 |
| `is_guardrail_regressed` | **가드레일 회귀 여부** |
| `final_verdict` | `pass` 또는 `fail` |

> ⚠️ **핵심 규칙:** `is_guardrail_regressed = true`이면 `final_verdict`는 긍정적 리프트와 무관하게 `fail`이 됩니다.

#### 8-7. Factory Reuse Candidate (팩토리 재사용 후보)

| 필드 | 설명 |
|---|---|
| `candidate_name` | 재사용 후보 이름 |
| `artifact_type` | 아티팩트 유형 |
| `artifact_payload` | 재사용 가능한 아티팩트 데이터 |
| `status` | `candidate` → `promoted` / `rejected` |

#### 8-8. Fix-It Playbook Rule (Fix-It 플레이북 규칙)

| 필드 | 설명 |
|---|---|
| `trigger_metric` | 트리거 메트릭 이름 |
| `threshold_operator` | `<` 또는 `<=` |
| `threshold_value` | 임계값 |
| `recommended_action` | 권장 조치 |

**예시:**
```json
{
  "rule_name": "ARS 낮음 → 스키마 점검",
  "trigger_metric": "ARS",
  "threshold_operator": "<",
  "threshold_value": 0.3,
  "recommended_action": "JSON-LD 스키마 매핑 및 클레임 커버리지 점검"
}
```

---

## 9. 메트릭 용어 사전

### Business AEO/GEO 메트릭

| 약어 | 전체 이름 | 설명 |
|---|---|---|
| **AAS** | AI Answer Share | AI 응답에서 브랜드가 언급되는 비율 (프록시) |
| **OCR** | Official Citation Rate | AI 응답에서 공식 출처가 인용되는 비율 |
| **BSF** | Brand Semantic Fidelity | 브랜드 의미가 AI 응답에서 정확히 전달되는 정도 |
| **QTC** | Question Territory Coverage | 전략적 질문 영역 중 AI가 커버하는 비율 |
| **GCTR** | GEO Concept Transfer Rate | GEO 개념이 AI 응답에 전이되는 비율 |
| **ARS** | AEO Readiness Score | AEO 준비 상태 종합 점수 |
| **SWEL** | Semantic Website Effect Lift | 시맨틱 웹사이트 적용 전후 성과 변동 |

### MRI 패밀리 (종합 준비 지수)

| 약어 | 전체 이름 | 설명 |
|---|---|---|
| **OPS-MRI** | Operational Diagnosis Index | 운영 품질 / 진단 준비 상태 |
| **B-MRI** | Brand MRI | 브랜드 전략적 결과 / 경쟁 관측 성과 |
| **TCO-GEO** | TCO-GEO Transfer | 개념 전이 효과성 |
| **S-MRI** | Semantic MRI | 시맨틱 웹사이트 준비 상태 |
| **P-MRI** | Persona MRI | 페르소나 충실도 |
| **V-MRI** | Vibe MRI | 바이브 정렬 및 다크 패턴 안전 품질 |

### 중요한 주의사항

> ⚠️ **모든 AI/검색 관측 메트릭은 달리 검증되지 않는 한 패널 기반 프록시 측정치입니다.**

이 메트릭들은:
- ❌ 실제 AI 시장 점유율이 **아닙니다**
- ❌ 숨겨진 LLM 선호도를 **드러내지 않습니다**
- ❌ 소비자 선호를 **증명하지 않습니다**
- ✅ 특정 프로브 패널과 방법론 하에서의 **관측된 응답 패턴**입니다

---

## 10. 안전 언어 규칙

### 사용해야 하는 표현

| 표현 | 예시 |
|---|---|
| 패널 기반 프록시 측정 | "이 패널 기반 프록시 측정에서..." |
| 관측된 AI/검색형 응답 | "관측된 AI 응답에서 브랜드 노출이..." |
| 관측된 답변 점유율 | "관측된 답변 점유율 기준..." |
| 이 프로브 패널 내에서 | "이 프로브 패널 내에서의 결과는..." |
| 이 방법론 하에서 | "이 방법론 하에서 측정된 수치는..." |
| 측정 기간 | "2026년 Q2 측정 기간 동안..." |
| 신뢰도/변동성 | "신뢰도 및 변동성 고려 시..." |
| 제한 사항 | "본 측정의 제한 사항으로는..." |

### 사용해서는 안 되는 표현

| 금지 표현 | 이유 |
|---|---|
| ❌ 실제 시장 점유율 | 프록시 측정은 실제 시장 점유율이 아님 |
| ❌ 실제 AI 선호도 | LLM 내부 선호를 관측할 수 없음 |
| ❌ 숨겨진 모델 선호 | 과학적으로 입증 불가 |
| ❌ 확정적 AI 순위 | 순위는 패널과 시점에 따라 변동 |
| ❌ 보장된 가시성 | 어떤 가시성도 보장할 수 없음 |
| ❌ 소비자 선호 증명 | 관측과 인과관계는 다름 |

### 보고서 규칙

> **관측 메트릭을 사용하는 모든 보고서에는 반드시 방법론 공개(Methodology Disclosure)와 프록시 주의사항(Proxy Caveat)이 포함되어야 합니다.**

---

## 11. 데이터 스키마 참조

BSW-OS는 `lib/schema.ts`에 **74개의 Zod 스키마**를 정의합니다. 이 스키마들은 모듈별로 조직됩니다:

### 스키마 인덱스

| # | 모듈 | 스키마 수 | 주요 스키마 |
|---|---|---|---|
| 1-10 | Core Foundation | 10 | Workspace, Membership, Domain, BrandEntity, AuditEvent, AgentRun, ActionPolicy, ReleaseGateResult |
| 11-17 | Brand Truth | 7 | StrategicTruth, OperationalTruth, ObservedTruth, EvidenceItem, BoundaryRule, TruthDelta, TruthLock |
| 18-28 | Semantic Core | 11 | QuestionSignal, QuestionCapital, CanonicalQuestion, QIS, TCOConcept, OntologyNode/Edge, ConceptRelation, ConceptOperator, ClaimNode, LineageRecord |
| 29-36 | Object/Surface/Website | 8 | RepresentationObject, SurfaceContract, SemanticPage, PageSection, SEOExport, SchemaMapping, InternalLinkRule, WebsiteGenerationRun |
| 37-50 | Persona & Vibe | 14 | PersonaSpec, PersonaAssignment, PersonaEval, PersonaObservatory, PersonaPatch, VibeSpec, VibeAssignment, VibeRating, VibeProfile, VibeAlignment, VibeDiagnosis, VibeIntervention, VibeValidation, DarkPatternRule |
| 51-61 | Observatory & Metrics | 11 | ProbePanel, ProbeQuestion, AIObservationRun, ProbeRun, ResponseJudgment, MetricSnapshot, DomainIndexDef/Snapshot, BenchmarkReport, MethodologyDisclosure, SemanticWebsiteLift |
| 62-66 | Report Publisher | 5 | ReportSection, ReportExport, ReportReview, ReportGateResult, UnsafeWordingFinding |
| 67-74 | Fix-It & Factory | 8 | RCACase, PatchTicket, PatchArtifactChange, RetestPlan, RetestRun, PostPatchLiftSnapshot, FactoryReuseCandidate, FixitPlaybookRule |

> **참조:** 전체 스키마 정의는 [`lib/schema.ts`](../lib/schema.ts)에서 확인할 수 있습니다.

---

> **이전 문서:** 시스템 아키텍처 → [`user_guide_architecture.md`](./user_guide_architecture.md)  
> **다음 문서:** 기능별 활용법 → [`user_guide_usage.md`](./user_guide_usage.md)
