# BSW-OS Answer Asset Supply System
## 시스템 아키텍처 · E2E 파이프라인 · 기능 명세서 · 활용 가이드

> **Version**: 2.0 (2026-07-19)
> **코드베이스**: `c:\Users\User\bsw\lib\answer-supply\` (11 모듈, ~98KB)
> **의존 모듈**: prediction(4), governance(2), pattern-attractor(3), qis(3)

---

## 1. 시스템 개요

### 1.1 미션

> **"AI가 묻는 질문에 대한 정본(正本) 답변을 자동으로 생산하고,
> AEO 최적화된 형태로 발행하여 AI 엔진이 인용하게 한다."**

### 1.2 핵심 설계 원칙

| 원칙 | 설명 |
|------|------|
| **질문 주도 (Question-Driven)** | 콘텐츠가 아닌 "질문"이 생산의 출발점 |
| **미션 기반 (Mission-Based)** | 매 에셋에 계약(Contract)이 부여되고 이에 따라 생산 |
| **다층 검증 (Multi-Gate)** | Safety → Policy → Vibe → Validator → Human Gate |
| **7채널 동시 변형** | 1편의 콘텐츠 → 7개 채널 포맷 동시 생산 |
| **Attractor 가이드** | 패턴 어트랙터가 콘텐츠 방향성을 제어 |

### 1.3 아키텍처 전체도

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BSW-OS Answer Asset Supply                   │
│                                                                     │
│  ┌─── Signal Layer ───┐  ┌─── Intelligence Layer ──┐               │
│  │ Signal Collection   │  │ QEP (질문 예측)          │               │
│  │ Observatory Probe   │→│ QVS (질문 가치 산출)      │               │
│  │ Benchmark           │  │ PAT (정확도 자가학습)    │               │
│  └─────────────────────┘  └──────────┬─────────────┘               │
│                                      ↓                              │
│  ┌─── Scene Layer ─────────────────────────────────┐               │
│  │ SceneBuilder → ContextTensor → AttractorPromoter │               │
│  └──────────────────────┬──────────────────────────┘               │
│                          ↓                                          │
│  ┌═══ Answer Factory Pipeline (9 Stages) ═══════════════════════┐  │
│  ║                                                               ║  │
│  ║  [1] Attractor Fit → [2] Mission → [3] Blueprint             ║  │
│  ║        ↓                   ↓              ↓                   ║  │
│  ║  [4] Draft → [5] Safety Gate → [6] Vibe Check                ║  │
│  ║        ↓                                    ↓                 ║  │
│  ║  [7] Asset (7ch) → [8] HTML Page → [9] JSON-LD               ║  │
│  ║                                                               ║  │
│  └═══════════════════════════════════════════════════════════════┘  │
│                          ↓                                          │
│  ┌─── Quality Layer ──────────────────────────────┐                │
│  │ ValidatorGuild (10종 검증)                       │                │
│  │ ThinPageGuard (중복 방지)                        │                │
│  │ SafetyGate + PolicyEngine (거버넌스)              │                │
│  └──────────────────────┬─────────────────────────┘                │
│                          ↓                                          │
│  ┌─── Distribution Layer ─────────────────────────┐                │
│  │ AnswerPageCompiler → HTML                       │                │
│  │ JsonLdFactory → @graph (5 schema types)         │                │
│  │ CanonicalManager → URL 정규화                    │                │
│  │ HreflangManager → 다국어 태그                    │                │
│  │ SitemapGenerator → XML sitemap                  │                │
│  │ InternalLinkGraphBuilder → 내부 링크 그래프       │                │
│  └──────────────────────┬─────────────────────────┘                │
│                          ↓                                          │
│  ┌─── Publish Layer ──────────────────────────────┐                │
│  │ QisHubClient.pushToAiHub() → aihompy 인제스트    │                │
│  │ sendToTenantQueue() → 고객 열람 큐               │                │
│  └─────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 모듈 구성표

### 2.1 `lib/answer-supply/` — 핵심 모듈 (11파일)

| # | 모듈 | 파일 | 줄 수 | 역할 |
|---|------|------|:-----:|------|
| 1 | **AnswerMissionCompiler** | `answer-mission-compiler.ts` | 311 | CQ + Scene → 생산 미션(계약) 컴파일 |
| 2 | **AnswerAssetGenerator** | `answer-asset-generator.ts` | 342 | 미션 → 7채널 Answer Asset 생산 |
| 3 | **AnswerPageCompiler** | `answer-page-compiler.ts` | 213 | Asset → AEO 최적화 HTML 페이지 빌드 |
| 4 | **JsonLdFactory** | `json-ld-factory.ts` | 191 | Asset → JSON-LD 구조화 데이터 생성 |
| 5 | **ValidatorGuild** | `validator-guild.ts` | 408 | 10종 품질 검증기 합주 |
| 6 | **ThinPageGuard** | `thin-page-guard.ts` | 213 | 임베딩 기반 중복 페이지 방지 |
| 7 | **CanonicalManager** | `canonical-manager.ts` | 143 | URL 정규화 + 301 리다이렉트 관리 |
| 8 | **HreflangManager** | `hreflang-manager.ts` | 112 | 다국어 hreflang 태그 생성 |
| 9 | **InternalLinkGraphBuilder** | `internal-link-graph-builder.ts` | 307 | 내부 링크 지식 그래프 빌드 |
| 10 | **SitemapGenerator** | `sitemap-generator.ts` | 156 | XML 사이트맵 생성 + 페이지 등록 |
| 11 | **DROMigrationPipeline** | `dro-migration.ts` | 315 | 레거시 데이터 마이그레이션 (PII 마스킹) |

### 2.2 의존 모듈

| 카테고리 | 모듈 | 파일 | 줄 수 | 역할 |
|---------|------|------|:-----:|------|
| **Prediction** | PreemptiveContentFactory | `prediction/content-factory.ts` | 244 | Draft 생성 + Safety Gate + Vibe Check |
| | VibeBalancedForecaster | `prediction/vibe-forecaster.ts` | 140 | Vibe 기반 콘텐츠 블루프린트 생성 |
| | QuestionPredictor | `prediction/question-predictor.ts` | 298 | 시그널 → 예측 질문 변환 |
| | PredictionAccuracyTracker | `prediction/accuracy-tracker.ts` | 163 | 예측 정확도 추적 + 가중치 재보정 |
| **Governance** | SafetyGate | `governance/safety-gate.ts` | 174 | 8-입력 안전성 판정 (5단계 결정) |
| | PolicyEngine | `governance/policy-engine.ts` | 310 | YAML 기반 업종별 정책 시행 |
| **Attractor** | AttractorFitScorer | `pattern-attractor/attractor-fit-scorer.ts` | 149 | 7차원 어트랙터 적합도 평가 |
| | AttractorRetriever | `pattern-attractor/attractor-retriever.ts` | 156 | 후보 어트랙터 검색 |
| | ContextTensorBuilder | `pattern-attractor/context-tensor-builder.ts` | — | 7축 컨텍스트 텐서 생성 |
| **QIS** | SceneBuilder | `qis/scene-builder.ts` | 267 | CQ → QIS Scene 결정론적 빌드 |
| | QisHubClient | `qis/hub-client.ts` | 521 | aihompy Hub 통신 클라이언트 |
| | AttractorPromoter | `qis/attractor-promoter.ts` | 285 | Scene → Pattern Attractor 승격 |

### 2.3 오케스트레이션

| 레이어 | 파일 | 줄 수 | 역할 |
|--------|------|:-----:|------|
| **Server Action** | `app/actions/answer-factory.ts` | 548 | 9단계 파이프라인 + 발행 + 대시보드 |
| **API Route** | `app/api/v1/answer-supply/pipeline/route.ts` | 65 | POST 원클릭 파이프라인 API |
| **API Route** | `app/api/v1/answer-supply/publish/route.ts` | 56 | POST 발행 API |
| **E2E Bridge** | `app/actions/qis-bridge.ts` | 1,605 | 7-Phase 전체 파이프라인 오케스트레이터 |

---

## 3. E2E 파이프라인 상세

### 3.1 Answer Factory — 9단계 파이프라인

```
runAnswerPipeline(input: AnswerPipelineInput): Promise<AnswerPipelineResult>
```

#### 입력 인터페이스

```typescript
interface AnswerPipelineInput {
  workspaceId: string;          // 워크스페이스 ID
  canonicalQuestionId: string;  // 표준 질문 ID
  sceneId: string;              // QIS Scene ID
  attractorId?: string;         // Pattern Attractor ID (선택)
  tenantId?: string;            // 고객 테넌트 ID (선택)
  targetVpa?: number;           // 목표 VPA 점수 (기본 75)
}
```

#### 9단계 상세

| Stage | 명칭 | 모듈 | 입력 | 출력 | 실패 시 |
|:-----:|------|------|------|------|---------|
| **1** | Attractor Fit | `AttractorFitScorer` | attractorId + CQ | `AttractorFitResult` (activate/conditional/skip) | skip (진행) |
| **2** | Mission Compile | `AnswerMissionCompiler` | workspaceId + CQ + Scene | `AnswerMission` (계약 명세) | ❌ abort |
| **3** | Blueprint | `VibeBalancedForecaster` | Mission + targetVpa | `ContentBlueprint` (톤/구조/금지어) | ❌ abort |
| **4** | Draft | `PreemptiveContentFactory` | Blueprint | Draft 텍스트 | ❌ abort |
| **5** | Safety Gate | `PreemptiveContentFactory` | Draft + Blueprint | `{passed, reason?}` | ⚠️ flag (진행) |
| **6** | Vibe Check | `PreemptiveContentFactory` | Draft + workspaceId | VPA 점수 (0-100) | ⚠️ flag (진행) |
| **7** | Asset Generate | `AnswerAssetGenerator` | Mission + tenantId | `AnswerAssetSpec` (7채널) | ❌ abort |
| **8** | Page Compile | `AnswerPageCompiler` | AssetSpec | HTML 문자열 | ⚠️ degraded |
| **9** | JSON-LD | `JsonLdFactory` | AssetSpec | JSON-LD 객체 | ⚠️ degraded |

#### 발행 판정

```
readyToPublish = safetyPassed AND (vpaScore ≥ targetVpa × 0.8)
```

#### 출력 인터페이스

```typescript
interface AnswerPipelineResult {
  success: boolean;
  mission?: AnswerMission;
  blueprint?: any;
  draft?: string;
  asset?: AnswerAssetSpec;
  page?: string;               // HTML
  jsonLd?: Record<string, any>;
  attractorFit?: {
    gate: 'activate' | 'conditional' | 'skip';
    score: number;
  };
  readyToPublish: boolean;
  error?: string;
}
```

---

### 3.2 Stage 1: Attractor Fit — 7차원 적합도 평가

```
AttractorFitScorer.scoreAttractorFit(
  attractor: PatternAttractorSpec,
  query: string,
  tensor: ContextTensor,
  availableEvidence: string[]
): Promise<AttractorFitResult>
```

**7차원 평가 기준:**

| 차원 | 배점 | 설명 |
|------|:----:|------|
| `concept_match` | 0-20 | 어트랙터 개념과 질문의 의미 일치도 |
| `context_fit` | 0-15 | 컨텍스트 텐서와의 정합성 |
| `intent_fit` | 0-15 | 사용자 의도(intent)와의 부합도 |
| `risk_policy_fit` | 0-15 | 리스크 정책 준수 수준 |
| `evidence_availability` | 0-15 | 필요 근거 자료 확보 여부 |
| `vibe_requirement_fit` | 0-20 | 브랜드 Vibe 요구사항 충족 |
| `forbidden_condition_penalty` | 0-(-30) | 금지 조건 위반 시 감점 |

**Gate 판정:**

| 총점 | 판정 | 의미 |
|:----:|:----:|------|
| ≥ 70 | `activate` | 어트랙터 가이드라인 완전 적용 |
| 40-69 | `conditional` | 부분 적용 (일부 조건 완화) |
| < 40 | `skip` | 어트랙터 미적용 (범용 생산) |

---

### 3.3 Stage 2: AnswerMission — 계약 명세

```
AnswerMissionCompiler.compile(
  workspaceId: string,
  questionId: string,
  sceneId: string
): Promise<AnswerMission>
```

**AnswerMission 주요 계약 (Contract):**

```typescript
interface AnswerMission {
  // === Identity ===
  id: string;
  workspaceId: string;
  questionId: string;
  sceneId: string;
  verticalId: string;

  // === Question Context ===
  question: {
    normalizedQuestion: string;
    slug: string;
    primaryIntent: string;
    riskLevel: string;        // 'low' | 'medium' | 'high' | 'critical'
  };

  // === Scene Context ===
  scene: {
    sceneName: string;
    scenarioContext: string;
    sceneType: string;
    riskLevel: string;
  };

  // === 5대 계약 ===

  // 1. 답변 계약 — "어떻게 답할 것인가"
  directAnswerContract: {
    maxCharacters?: number;
    requiredTone?: string;
    coreMessage?: string;
  };

  // 2. 표면 계약 — "어디에 배포할 것인가"
  surfaceContract: {
    allowedChannels: string[];     // 7채널 중 허용 목록
    requiredSections?: string[];   // 필수 섹션
  };

  // 3. 구조화 데이터 계약 — "어떤 스키마를 쓸 것인가"
  structuredDataContract: {
    schemaType: string;           // FAQPage, Article, Product...
    primaryFields: string[];
  };

  // 4. 근거 계약 — "어떤 증거가 필요한가"
  evidenceContract: {
    requiredEvidenceTypes: string[];
    minimumConfidenceScore?: number;
    requireVerification: boolean;
  };

  // 5. 내부링크 계약 — "어디와 연결할 것인가"
  internalLinkContract: {
    conceptRefs: string[];
    targetEntitySlug?: string;
    anchorTextPattern?: string;
  };

  // === Guardrails ===
  mustInclude: string[];          // 반드시 포함할 내용
  mustNotInclude: string[];       // 절대 포함하면 안 되는 내용
  warnings: string[];             // 주의사항
  decisionCriteria: string[];     // 판단 기준
  requiredClaims: string[];       // 필수 주장
  requiredEvidence: string[];     // 필수 근거
}
```

---

### 3.4 Stage 3~6: 콘텐츠 생산 + 검증

#### Stage 3: Vibe Blueprint

```
VibeBalancedForecaster.createContentBlueprint(
  workspaceId, predictedQuestionId, {targetVpa?}
): Promise<ContentBlueprint>
```

- Vibe 스펙 + 브랜드 Truth를 기반으로 톤 가이드라인 수립
- `warmth_score > professional_score` → 친근한 톤 우선
- 금지 표현 목록 자동 생성 (업종별 의료/법률 표현)
- 구조 결정: `guide`(가이드형) 또는 `qna`(질문답변형)

#### Stage 4: Draft 생성

```
PreemptiveContentFactory.generateDraft(blueprintId): Promise<string>
```

- Blueprint의 `recommended_structure`에 따라 가이드/QnA 포맷 선택
- 예측 질문 컨텍스트를 프롬프트에 주입
- Supabase `content_drafts` 테이블에 저장

#### Stage 5: Safety Gate

```
PreemptiveContentFactory.safetyGate(draftText, blueprintId): Promise<{passed, reason?}>
```

- `MUST INCLUDE` 항목 검증 (예: "개인차가 있을 수 있습니다")
- `MUST NOT DO` 항목 검증 (예: "100% 효과", "완치", "의사 대체")
- 위반 시 사유 반환, 파이프라인은 계속 진행 (flag)

#### Stage 6: Vibe Check

```
PreemptiveContentFactory.vibeCheck(draftText, workspaceId): Promise<number>
```

**VPA (Vibe Performance Alignment) 점수 산출:**

| 요소 | 점수 | 설명 |
|------|:----:|------|
| 기준선 | 70 | 기본 시작 점수 |
| 따뜻함 정렬 | +15 | Vibe warmth와 일치 |
| 전문성 정렬 | +10 | 전문적 톤 일치 |
| 금지 표현 | -30/건 | 금지어 포함 시 감점 |
| EEAT 사실 누락 | -10/건 | 전문성 근거 누락 시 |
| 주의 키워드 | -5/건 | 주의 표현 포함 시 |

---

### 3.5 Stage 7: Answer Asset — 7채널 동시 생산

```
AnswerAssetGenerator.generate(
  mission: AnswerMission,
  tenantId?: string,
  authorId?: string  // default: 'system-generator'
): Promise<AnswerAssetSpec>
```

#### 7채널 변형 (ContentVariation)

| 채널 | 용도 | 특성 |
|------|------|------|
| `homepage` | 웹사이트 메인 랜딩 | 상세 구조적 HTML, 모든 섹션 포함 |
| `answer_card` | 요약 카드 | 150자 이내, 핵심 답변만 |
| `chatbot` | 대화형 답변 | 구어체, 단계별 대화 흐름 |
| `cardnews` | 카드뉴스 | 시각적, 슬라이드 5~7장 분량 |
| `ad` | 광고 카피 | USP 강조, CTA 포함 |
| `sales_script` | 오프라인 영업 대본 | 전화/대면 상담용 스크립트 |
| `llm_txt` | AI 학습용 텍스트 | llms.txt 추가분, 영문 |

#### AnswerAssetSpec 전체 인터페이스

```typescript
interface AnswerAssetSpec {
  id: string;                          // UUID
  questionId: string;                  // 원본 CQ ID
  workspaceId: string;                 // 워크스페이스
  verticalId: string;                  // 업종
  tenantId?: string;                   // 고객 테넌트
  missionId: string;                   // 미션 ID

  // === Content ===
  canonicalRoute: string;              // 정규 URL 경로
  title: string;                       // 페이지 제목
  directAnswer: string;                // 핵심 답변 (150자)
  contentBlocks: ContentBlock[];       // 구조화된 본문 블록
  variations: ContentVariation[];      // 7채널 변형

  // === Governance ===
  claimIds: string[];                  // 연결된 주장 ID
  evidenceIds: string[];               // 연결된 근거 ID
  applicability: string[];             // 적용 범위
  exclusions: string[];                // 제외 사항
  warnings: string[];                  // 주의사항

  // === Actions ===
  nextActions: NextAction[];           // CTA 목록

  // === SEO/AEO ===
  seo: SeoContract;                    // title, meta, keywords, robots
  structuredData: StructuredDataContract; // JSON-LD 스키마
  internalLinks: LinkContract[];       // 내부 링크

  // === Workflow ===
  authorId: string;
  reviewerIds: string[];
  reviewedAt?: string;
  validUntil?: string;
  status: 'draft' | 'under_review' | 'approved' | 'published' | 'stale';
  version: string;
  createdAt: string;
}
```

---

### 3.6 Stage 8: HTML 페이지 컴파일

```
AnswerPageCompiler.compileHtml(spec: AnswerAssetSpec): string
```

**6섹션 시맨틱 HTML 구조:**

```
<article>
  ┌─ <header> ─────────────────────────────────────────┐
  │  <h1>질문 제목</h1>                                 │
  │  날짜 | 작성자 | "정본 답변 Verified" 배지            │
  └────────────────────────────────────────────────────┘
  ┌─ <section class="direct-answer-section"> ──────────┐
  │  핵심 답변 (Direct Answer) — AEO Card               │
  │  AI가 인용할 핵심 단락 (150자)                       │
  └────────────────────────────────────────────────────┘
  ┌─ <section class="proof-section"> ──────────────────┐
  │  사실 검증 및 입증 근거 (Proof & Evidence)            │
  │  ContentBlock(type='paragraph'|'quote') 렌더링       │
  └────────────────────────────────────────────────────┘
  ┌─ <section class="routines-section"> ───────────────┐
  │  실천 가이드 및 추천 절차 (Actionable Routines)       │
  │  ContentBlock(type='step'|'list') 렌더링             │
  └────────────────────────────────────────────────────┘
  ┌─ <section class="cautions-section"> ───────────────┐
  │  주의사항 및 적용 예외 (Cautions & Warnings)          │
  │  warnings[] + exclusions[] 렌더링                    │
  └────────────────────────────────────────────────────┘
  ┌─ <section class="references-section"> ─────────────┐
  │  근거 자료 출처 목록 (References)                     │
  │  evidenceRefs[] + applicability[] 렌더링             │
  └────────────────────────────────────────────────────┘
  ┌─ <footer class="cta-section"> ─────────────────────┐
  │  CTA 버튼 (예약/전화/상담/링크)                      │
  │  nextActions[] 렌더링                                │
  └────────────────────────────────────────────────────┘
</article>
```

---

### 3.7 Stage 9: JSON-LD 구조화 데이터

```
JsonLdFactory.generate(spec: AnswerAssetSpec, domainUrl?): Record<string, any>
JsonLdFactory.compileToScriptTag(spec, domainUrl?): string
JsonLdFactory.validateMatch(spec, jsonld): { matches: boolean; reason?: string }
```

**지원 스키마 타입 (5종):**

| 타입 | 매핑 규칙 |
|------|----------|
| **FAQPage** | 기본값/폴백. `spec.title` → Question.name, `spec.directAnswer` → Answer.text |
| **NewsArticle** | headline, articleBody, datePublished, author(Organization), publisher |
| **Product** | name, description, sku=spec.id, brand=tenantId, AggregateOffer(KRW) |
| **LocalBusiness** | name, description, url, telephone, PostalAddress |
| **HowTo** | name, description, HowToStep[] from step/list ContentBlocks |

---

### 3.8 발행 (Publish)

```
publishAnswerAsset(
  workspaceId: string,
  assetId: string,
  targets: ('hub' | 'tenant_queue')[]
): Promise<PublishResult>
```

**2개 발행 대상:**

| 대상 | 메커니즘 | 수신측 |
|------|---------|--------|
| **hub** | `QisHubClient.pushToAiHub()` → POST `/api/v1/ai-hub/bsw/ingest` | aihompy BSW 추천 질문 대시보드 |
| **tenant_queue** | `PreemptiveContentFactory.sendToTenantQueue()` → DB status="queued" | 고객 테넌트 큐 |

**Hub Push 프로토콜:**

```typescript
QisHubClient.pushToAiHub(
  region: string,
  questions: BSWQuestion[],   // id, text, industry_type, cps_score, ...
  scenes?: BSWScene[]          // scene_name, risk_level, must_do[], ...
): Promise<AiHubPushResult>

// Headers: { 'x-bsw-secret': process.env.BSW_HUB_SHARED_SECRET }
// Endpoint: {HUB_BASE_URL}/api/v1/ai-hub/bsw/ingest
// Retry: exponential backoff, max 2 retries
```

---

## 4. 품질 보증 시스템

### 4.1 ValidatorGuild — 10종 검증기

```
ValidatorGuild.validate(
  asset: AnswerAssetSpec,
  mission: AnswerMission
): Promise<ValidationReport>
```

| # | 검증기 | 검증 내용 | 유형 |
|---|--------|----------|:----:|
| 1 | **Schema** | 필수 필드 존재 여부 (id, title, directAnswer, contentBlocks) | error |
| 2 | **Right-to-Answer** | 답변 권리 검증 (해당 질문에 답할 자격이 있는가) | error |
| 3 | **Evidence Coverage** | 요구 근거 충족 여부 (evidenceContract 대비) | warning |
| 4 | **Claim Policy** | 주장 정책 준수 (requiredClaims vs mustNotInclude) | error |
| 5 | **Freshness** | 콘텐츠 유효기간 내 여부 (expiry 검증) | warning |
| 6 | **Duplicate** | 기존 에셋과의 중복 여부 | warning |
| 7 | **Unique Value** | 독자적 가치 제공 여부 (피상적 콘텐츠 차단) | warning |
| 8 | **Structured Data** | JSON-LD 스키마 정합성 | warning |
| 9 | **Language** | 언어 품질 + 적절성 | warning |
| 10 | **Human Review Gate** | 수동 검토 필요 여부 판정 (고위험 주제) | error |

**출력:**

```typescript
interface ValidationReport {
  isValid: boolean;           // error가 0건이면 true
  issues: ValidationIssue[];  // { validator, type, message, details? }
  validatedAt: string;
}
```

### 4.2 ThinPageGuard — 중복 방지

```
ThinPageGuard.evaluate(
  workspaceId: string,
  questionText: string
): Promise<GuardDecision>
```

- **메커니즘**: 입력 질문의 임베딩 벡터를 기존 발행 에셋의 벡터와 코사인 유사도 비교
- **임계값**: `similarityThreshold = 0.88` (88% 이상 유사 시 차단)
- **출력**: `{ blocked, highestSimilarity, matchedQuestionId, suggestion }`

### 4.3 SafetyGate — 8-입력 안전성 판정

```
SafetyGate.evaluate(
  inputs: SafetyGateInputs,
  defaultCTAs: CTAPolicyConfig
): SafetyGateOutput
```

**8개 입력 게이트:**

| 입력 | 타입 | 설명 |
|------|------|------|
| `userSeverity` | SeverityLevel | 사용자 상태 심각도 |
| `symptomDurationDays` | number | 증상 지속 일수 |
| `isYMYLContext` | boolean | YMYL(의료/재무) 맥락 여부 |
| `ingredientConcentration` | number | 성분 농도 (%) |
| `isCoUsageCaution` | boolean | 병용 주의 여부 |
| `hasProhibitedWords` | boolean | 금지어 포함 여부 |
| `weatherAlertLevel` | WeatherAlert | 기상 경보 수준 |
| `demographicRisk` | boolean | 취약 인구(임산부/소아) |

**5단계 결정:**

| 결정 | 조건 | 조치 |
|------|------|------|
| `REFUSE` | 금지어 or 농도 > 2.0% | 응답 차단 |
| `URGENT` | 중증 or ≥14일 증상 or 기상 위기 | "즉시 전문가 상담" CTA |
| `CONSULT_FIRST` | 중등도 + YMYL or 취약 인구 | "전문가 상담 권장" 면책 |
| `CONDITIONAL` | 경도 주의 사항 | 면책 조항 추가 |
| `SAFE_GENERAL` | 기본 | 정상 진행 |

### 4.4 PolicyEngine — 업종별 정책

```
PolicyEngine.evaluatePolicy(context: PolicyContext): PolicyEvaluation
```

- **YAML 기반**: `packs/{vertical}/policies.yaml` 에서 업종별 정책 로드
- **6개 업종 매핑**: skincare→kbeauty-skincare, travel→jeju-context-travel, k-wedding, k-food, k-cafe, senior-care
- **검증 항목**: 차단 액션, 허용 액션, 에스컬레이션 조건, 금지 용어
- **금지어 예시** (스킨케어): "완치", "100% 효과", "의사 처방 대체", "피부과 불필요"

---

## 5. 분배 시스템 (Distribution)

### 5.1 CanonicalManager — URL 정규화

```typescript
class CanonicalManager {
  // URL 정규화 (UTM/추적 파라미터 제거, 소문자, 트레일링 슬래시 정리)
  generateCanonicalUrl(rawUrl, locale?, domainUrl?): string

  // 301 리다이렉트 등록 (질문 병합 시)
  async registerMergeRedirect(workspaceId, sourceSlug, targetSlug): Promise<void>

  // 리다이렉트 확인
  async checkRedirect(workspaceId, slug): Promise<RedirectResult | null>
}

// 제거 대상 파라미터: utm_*, gclid, fbclid, yclid, msclkid, cx, ie, cof, siteurl
```

### 5.2 HreflangManager — 다국어

```typescript
class HreflangManager {
  // hreflang 태그 배열 생성
  async generateHreflangTags(workspaceId, questionId, currentLocale, domainUrl?): Promise<HreflangLink[]>

  // HTML <link> 태그 문자열 생성
  async generateHtmlString(workspaceId, questionId, currentLocale, domainUrl?): Promise<string>

  // 유효성 검증 (x-default 포함 여부 등)
  validateHreflangs(links: HreflangLink[]): boolean
}
```

### 5.3 InternalLinkGraphBuilder — 지식 그래프

```typescript
class InternalLinkGraphBuilder {
  // 워크스페이스 전체 내부 링크 그래프 빌드
  async buildGraphForWorkspace(workspaceId, domainUrl?): Promise<{
    nodes: GraphNode[];  // 9종 노드 타입
    edges: GraphEdge[];  // 8종 관계 타입
  }>

  // 특정 에셋에 대한 내부 링크 추천
  async suggestLinksForAsset(asset, workspaceId): Promise<LinkContract[]>
}

// 노드 타입: question, scene, guide, place, merchant, product, ingredient, expert, evidence
// 엣지 관계: answers, applies_to, related_to, compare_with, supported_by, next_step, provided_by, located_near
```

### 5.4 SitemapGenerator — XML 사이트맵

```typescript
class SitemapGenerator {
  // XML 사이트맵 전체 생성
  async generateXml(workspaceId, domainUrl?): Promise<string>

  // 발행된 페이지 등록 (changefreq: weekly, priority: 0.8)
  async registerPublishedPage(workspaceId, assetId, assetVersion, canonicalUrl): Promise<string>
}
```

---

## 6. API 레퍼런스

### 6.1 `POST /api/v1/answer-supply/pipeline`

**원클릭 에셋 생성 파이프라인.**

```
Request:
{
  "workspaceId": "ws_abc123",
  "canonicalQuestionId": "uuid-of-cq",
  "sceneId": "uuid-of-scene",
  "attractorId": "uuid-of-attractor",     // optional
  "tenantId": "uuid-of-tenant",           // optional
  "targetVpa": 75                          // 50-100, default 75
}

Response (200):
{
  "ok": true,
  "data": {
    "readyToPublish": true,
    "assetId": "uuid-of-asset",
    "vpaScore": 82,
    "safetyPassed": true,
    "attractorFit": { "gate": "activate", "score": 78 },
    "page": "<article>...</article>",
    "jsonLdType": "FAQPage",
    "missionId": "uuid-of-mission",
    "blueprintId": "uuid-of-blueprint"
  }
}

Timeout: 300초 (5분)
```

### 6.2 `POST /api/v1/answer-supply/publish`

**에셋 발행 (Hub Push + Tenant Queue).**

```
Request:
{
  "workspaceId": "ws_abc123",
  "assetId": "uuid-of-asset",
  "targets": ["hub", "tenant_queue"]
}

Response (200):
{
  "ok": true,
  "data": {
    "hubPushed": true,
    "queuedForTenant": true,
    "publishedAssetId": "uuid-of-asset"
  }
}

Timeout: 60초
```

### 6.3 Server Actions (내부)

| 함수 | 용도 | 반환 |
|------|------|------|
| `runAnswerPipeline(input)` | 9단계 파이프라인 실행 | `AnswerPipelineResult` |
| `publishAnswerAsset(wsId, assetId, targets)` | 발행 | `PublishResult` |
| `getAnswerFactoryDashboard(wsId)` | 대시보드 데이터 | runs, CQs, scenes, attractors, stats |
| `getAnswerFactoryRunDetail(wsId, runId)` | 개별 실행 상세 | run with joined data |
| `getAvailableCqScenePairs(wsId, domainId?)` | 생산 가능 CQ 목록 | CQ-Scene pairs |

---

## 7. 모듈 의존성 그래프

```
answer-mission-compiler ◄── supabase
        ↓
answer-asset-generator  ◄── supabase, ai-provider
        ↓
  ┌─────┼─────────────────────────────────┐
  ↓     ↓                                 ↓
answer-page-compiler  json-ld-factory  validator-guild
                                            ↑
                                   ┌────────┘
                                   ↓
                          thin-page-guard ◄── embedding-provider

canonical-manager ◄── supabase (독립)
hreflang-manager  ◄── supabase (독립)
sitemap-generator ◄── supabase (독립)
internal-link-graph-builder ◄── supabase, answer-asset-generator

dro-migration ◄── validator-guild, answer-asset-generator,
                   answer-mission-compiler, governance/*

───── 오케스트레이션 ─────

answer-factory.ts ◄── answer-supply/* (전체)
                   ◄── prediction/* (content-factory, vibe-forecaster)
                   ◄── pattern-attractor/* (fit-scorer, retriever, tensor-builder)
                   ◄── qis/hub-client (발행)

qis-bridge.ts ◄── answer-factory.ts (파이프라인 호출)
              ◄── signal-collection, benchmark, deep-dive, pipeline-state
```

---

## 8. 활용 가이드

### 8.1 Answer Factory UI — 5단계 워크플로우

**경로**: `Semantic Core > Answer Factory`

```
Step 1: 질문 & Attractor 선택
────────────────────────────
• CQ 목록에서 대상 질문 선택 (QVS 점수순 정렬)
• Scene 선택 (또는 자동 매칭)
• Pattern Attractor 선택 (선택사항)
• [다음] 클릭

Step 2: Answer Mission 컴파일
────────────────────────────
• 시스템이 자동으로 5대 계약 생성
• mustInclude[], requiredEvidence[], warnings[] 확인
• 필요시 수동 조정
• [컴파일 실행] 클릭

Step 3: Blueprint + 초안 생성
────────────────────────────
• Vibe Blueprint 자동 생성 (톤/구조/금지어)
• AI가 초안 자동 작성
• Safety Gate 결과 표시 (✅ 통과 / ⚠️ 경고)
• VPA 점수 표시 (목표 대비)
• [초안 확인] 클릭

Step 4: Answer Asset 미리보기
────────────────────────────
• 7채널 변형 탭 전환하며 확인
  [homepage] [answer_card] [chatbot] [cardnews] [ad] [sales_script] [llm_txt]
• HTML 페이지 실시간 미리보기
• JSON-LD 스키마 확인
• 내부 링크 그래프 확인

Step 5: 발행
────────────────────────────
• 발행 대상 선택:
  ☑ Hub Push (aihompy 인제스트)
  ☑ Tenant Queue (고객 열람 큐)
• [발행 실행] 클릭
• 결과: publishedAssetId 반환
```

### 8.2 API를 통한 자동화

```bash
# 1. 원클릭 에셋 생성
curl -X POST https://bsw.os/api/v1/answer-supply/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "ws_abc123",
    "canonicalQuestionId": "cq-uuid",
    "sceneId": "scene-uuid",
    "targetVpa": 80
  }'

# 2. readyToPublish === true 확인 후 발행
curl -X POST https://bsw.os/api/v1/answer-supply/publish \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "ws_abc123",
    "assetId": "asset-uuid-from-step1",
    "targets": ["hub", "tenant_queue"]
  }'
```

### 8.3 qis-bridge E2E 파이프라인

```
runE2EPipeline(workspaceId, domainName, brandName?, options?)
```

**7-Phase 전체 파이프라인:**

| Phase | 명칭 | 내용 |
|:-----:|------|------|
| **0** | Bootstrap | TCO/KG 초기화, 외부 시그널 수집, Hub 피드백 |
| **1** | Collect | 시그널 수집, 브랜드 로테이션, Deep Dive |
| **2** | Enrich | 기회 분석, 리포트 갭, Surface persist |
| **3** | Promote | CQ 승격, 브랜드 할당 |
| **4** | Hub Push | aihompy 인제스트 |
| **5** | Saturation Check | 포화도 체크 |
| **full** | 전체 실행 | Phase 0~5 순차 실행 |

**이어하기 지원**: `existingRunId` + `resumeFromPhase`로 실패 지점부터 재개 가능.

### 8.4 DRO Migration — 레거시 데이터 이관

```typescript
const pipeline = new DROMigrationPipeline();
const result = await pipeline.migrate(workspaceId, 'skincare', legacyRecords);
// { processed: 100, succeeded: 95, failed: 5, assets: [...], errors: [...] }
```

- **PII 마스킹**: 주민등록번호, 전화번호, 이메일, 한국어 이름 패턴 자동 처리
- **검증 포함**: ValidatorGuild + EvidenceRegistry + ClaimRegistry 연동

---

## 9. 데이터베이스 테이블

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `answer_factory_runs` | 파이프라인 실행 기록 | workspace_id, cq_id, scene_id, attractor_id, status, result |
| `content_blueprints` | Vibe 블루프린트 | predicted_question_id, tone_guidelines, forbidden_expressions |
| `content_drafts` | 초안 저장 | blueprint_id, draft_text, vpa_score, safety_passed |
| `question_signals_hub` | Hub 인제스트 데이터 | question_text, industry_type, cps_score, source |
| `pattern_attractors` | 패턴 어트랙터 | workspace_id, domain_id, natural_definition, type, status |
| `canonical_questions` | 표준 질문 | normalized_question, slug, primary_intent, risk_level |
| `qis_scenes` | QIS Scene | scene_name, risk_level, readiness_score, must_do |
