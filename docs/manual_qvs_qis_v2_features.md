# QVS/QIS 시스템 v2.0 — 질문 인텔리전스 엔진 고도화 기능 매뉴얼

> **문서 버전:** 2.0.0  
> **최종 수정일:** 2026-06-18  
> **대상 독자:** BSW-OS 개발자, AEO/GEO 컨설턴트, 운영 담당자  
> **관련 코드베이스:** `lib/benchmark/`, `app/actions/qvs.ts`

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [S-13: NanoJob J1-J3 다단계 질문 도출 시스템](#2-s-13-nanojob-j1-j3-다단계-질문-도출-시스템)
3. [S-16: QVS Portfolio Manager — 질문 자산 관리](#3-s-16-qvs-portfolio-manager--질문-자산-관리)
4. [S-18: RLAF 피드백 루프 — 산업군별 가중치 자동 보정](#4-s-18-rlaf-피드백-루프--산업군별-가중치-자동-보정)
5. [기존 기능과의 연동 관계 (S-05, S-07)](#5-기존-기능과의-연동-관계-s-05-s-07)
6. [QVS 수명주기 — 전체 파이프라인 흐름도](#6-qvs-수명주기--전체-파이프라인-흐름도)
7. [데이터베이스 스키마 참조](#7-데이터베이스-스키마-참조)
8. [실전 운영 시나리오별 가이드](#8-실전-운영-시나리오별-가이드)
9. [트러블슈팅 가이드](#9-트러블슈팅-가이드)

---

## 1. 문서 개요

QVS(Question Value Score) / QIS(Question Intent System) v2.0은 단순 질문 목록 생성을 넘어 **"질문을 비즈니스 자산으로 관리하는 인텔리전스 시스템"**입니다. 본 매뉴얼은 다음 3개의 신규 모듈과 기존 2개 모듈과의 연동 관계를 코드 수준까지 상세히 기술합니다.

| 스프린트 | 코드 | 모듈명 | 핵심 역할 |
|----------|------|--------|-----------|
| S-13 | `qvs-question-generator.ts` | NanoJob J1-J3 질문 도출 | 다각도 페르소나 기반 질문 예측 |
| S-16 | `qvs-portfolio-manager.ts` | 포트폴리오 매니저 | 질문 자산 건강도·탈취 위험 관리 |
| S-18 | `rlaf-tuner.ts` | RLAF 피드백 루프 | 산업군별 QVS 공식 가중치 자동 보정 |
| S-05 | `app/actions/qvs.ts` | 5D 스코어링 엔진 | QVS Composite 수치 계산 |
| S-07 | 볼륨 프록시 | Volume Proxy | 검색 볼륨 추정 |

---

## 2. S-13: NanoJob J1-J3 다단계 질문 도출 시스템

### 2.1 기능 목적

기존의 단일 프롬프트 질문 생성 방식은 "소비자가 물어볼 법한 일반적 질문"만 도출했습니다. NanoJob J1-J3은 **3가지 페르소나 관점**을 LLM 프롬프트에 명시적으로 분리하여, 비즈니스 가치가 높은 질문을 놓치지 않도록 합니다.

### 2.2 3개 페르소나(Job) 정의

| Job | 페르소나 | 질문 성격 | 예시 (뷰티 브랜드) |
|-----|----------|-----------|---------------------|
| **J1: Consumer** | 일반 소비자 | 구매 전/후 문제 해결, 혜택, 부작용, 가성비 | "○○ 크림 건성피부에 효과 있나요?" |
| **J2: Competitor** | 비교 쇼핑객 | 대체재 비교, 1위 브랜드와의 차이점, 상황별 추천 | "○○ vs △△ 레티놀 크림 어떤 게 더 순해요?" |
| **J3: Expert** | 전문가/EEAT 검증자 | 기술 스펙, 핵심 성분, 임상 결과, 안전성 검증 | "○○의 나이아신아마이드 10% 농도의 임상 결과는?" |

### 2.3 핵심 코드 구조

**파일 위치:** `lib/benchmark/qvs-question-generator.ts`

```typescript
// 출력 인터페이스
export interface QvsPredictedQuestion {
  question: string;           // 예측된 질문 텍스트
  intent: string;             // 질문 의도 (information, comparison, verification 등)
  category: 'consumer' | 'competitor' | 'expert';  // J1/J2/J3 분류
  qvs_score_estimated: number; // 0~100 추정 QVS 점수
}

// 핵심 메서드
class QvsQuestionGenerator {
  async generateMultistageQuestions(
    brandName: string,    // 브랜드명 (예: "닥터오")
    industry: string,     // 산업군 코드 (예: "beauty")
    keywords: string[]    // 핵심 키워드 배열 (예: ["레티놀", "스쿠알란"])
  ): Promise<QvsPredictedQuestion[]>
}
```

### 2.4 LLM 프롬프트 설계 상세

프롬프트는 다음 구조로 LLM에 전송됩니다:

```
[시스템 역할] AEO/GEO 질문 예측 전문가

[입력 컨텍스트]
- 브랜드명: "${brandName}"
- 산업군: ${industry}
- 핵심 키워드: ${keywords.join(', ')}

[J1 지시] Consumer 관점 3개 질문 도출
[J2 지시] Competitor 관점 3개 질문 도출
[J3 지시] Expert 관점 3개 질문 도출

[출력 형식] JSON Schema (generateStructuredOutput)
 - 각 관점별 3개 = 총 9개 질문
 - 각 질문에 QVS 추정 점수 포함
```

### 2.5 Fallback 동작

LLM 호출 실패 시 3개의 **범용 Fallback 질문**을 반환합니다:

```typescript
// Consumer Fallback
`${brandName} 제품의 가장 큰 효과와 부작용은 무엇인가요?`  // QVS: 85

// Competitor Fallback
`${brandName}와 가장 유사한 경쟁 제품의 차이점은 무엇인가요?`  // QVS: 92

// Expert Fallback
`${brandName} 핵심 성분의 임상 데이터와 안전성은 검증되었나요?`  // QVS: 78
```

### 2.6 사용 예시

```typescript
import { QvsQuestionGenerator } from '@/lib/benchmark/qvs-question-generator';

const generator = new QvsQuestionGenerator();
const questions = await generator.generateMultistageQuestions(
  '닥터오',
  'beauty',
  ['레티놀', '스쿠알란', '민감성피부']
);

// 카테고리별 분류
const consumerQs   = questions.filter(q => q.category === 'consumer');
const competitorQs = questions.filter(q => q.category === 'competitor');
const expertQs     = questions.filter(q => q.category === 'expert');

// QVS 점수 높은 순 정렬
const topValue = [...questions].sort((a, b) => b.qvs_score_estimated - a.qvs_score_estimated);
```

---

## 3. S-16: QVS Portfolio Manager — 질문 자산 관리

### 3.1 기능 목적

도출된 질문들을 금융의 **"투자 포트폴리오"** 개념으로 자산화하여 지속적으로 모니터링합니다. 핵심 관심사는:
- **탈취 위험(Takeover Risk):** 고가치 질문에 대해 경쟁사가 AI 답변 점유율을 빼앗을 위험
- **의도 변경(Drift Detection):** AI가 해당 질문에 대한 답변의 성격을 변경한 경우
- **포트폴리오 건강도:** 전체 질문 자산의 종합 가치 평가

### 3.2 핵심 데이터 모델

**파일 위치:** `lib/benchmark/qvs-portfolio-manager.ts`

```typescript
export interface PortfolioHealth {
  overallScore: number;         // 0~100 (평균 QVS Composite)
  dominantIntent: string;       // 지배적 질문 의도 유형
  takeoverRiskCount: number;    // 탈취 위험 질문 수
  driftDetectedCount: number;   // 의도 변경 감지 질문 수
}
```

### 3.3 핵심 메서드 상세

#### 3.3.1 `evaluatePortfolioHealth()`

```typescript
async evaluatePortfolioHealth(
  workspaceId: string,
  industry: string
): Promise<PortfolioHealth>
```

**내부 알고리즘 상세:**

```
1. Supabase 쿼리
   FROM question_value_scores
   WHERE workspace_id = {workspaceId}
     AND industry = {industry}
   ORDER BY qvs_composite DESC
   SELECT id, qvs_composite, competition_score,
          predicted_question_id, probe_question_id

2. 건강도 계산
   overallScore = AVG(qvs_composite) (상한 100)

3. 탈취 위험 판정 규칙
   IF qvs_composite > 50 AND competition_score > 0.7
     → takeoverRiskCount++
   
   해석: "비즈니스 가치가 높은데(QVS>50) 경쟁사 점유율도
          높은(Competition>0.7) 질문은 방어가 시급"

4. Drift Detection
   현재: Mock (전체의 10% 추정)
   향후: 과거 AI 답변과 현재 답변의 의미론적 차이 비교
```

#### 3.3.2 `getRebalanceSuggestions()`

```typescript
async getRebalanceSuggestions(
  workspaceId: string,
  industry: string
): Promise<string[]>
```

**알림 규칙 매트릭스:**

| 조건 | 알림 유형 | 메시지 |
|------|-----------|--------|
| `takeoverRiskCount > 0` | `[경고]` 방어 시급 | "경쟁사 탈취 위험이 높은 고가치 질문이 {N}개 있습니다. EEAT 보강이 필요합니다." |
| `driftDetectedCount > 0` | `[주의]` 의도 변경 감지 | "AI의 답변 의도가 변경된 질문이 {N}개 있습니다. 최신 트렌드에 맞춰 콘텐츠를 업데이트하세요." |
| `overallScore < 40` | `[권고]` 블루오션 개척 | "전반적인 포트폴리오 가치가 낮습니다. NanoJob J1/J3를 활용해 새로운 Niche 질문을 도출하세요." |
| `overallScore >= 40` | `[유지]` 건강도 우수 | "현재 점유 중인 질문들의 답변 품질(BSF)을 모니터링하세요." |

### 3.4 사용 예시

```typescript
import { QvsPortfolioManager } from '@/lib/benchmark/qvs-portfolio-manager';

const pm = new QvsPortfolioManager();

// 건강도 평가
const health = await pm.evaluatePortfolioHealth(workspaceId, 'beauty');
console.log(`포트폴리오 점수: ${health.overallScore}`);
console.log(`탈취 위험 질문: ${health.takeoverRiskCount}개`);

// 리밸런싱 제안
const suggestions = await pm.getRebalanceSuggestions(workspaceId, 'beauty');
suggestions.forEach(s => console.log(s));
```

---

## 4. S-18: RLAF 피드백 루프 — 산업군별 가중치 자동 보정

### 4.1 기능 목적

QVS Composite 공식 `Volume × Conversion × ARPU × FirstMover × (1 - Competition)`에서 **각 요소의 가중치**는 산업군마다 다른 최적값을 가집니다. RLAF(Reinforcement Learning from AI Feedback)는 3개월 치 성과 데이터를 분석하여 이 가중치를 자동으로 보정합니다.

### 4.2 가중치 인터페이스

**파일 위치:** `lib/benchmark/rlaf-tuner.ts`

```typescript
export interface RlafWeights {
  volumeWeight: number;      // 검색 볼륨 가중치 (기본: 1.0)
  conversionWeight: number;  // 전환율 가중치 (기본: 1.0)
  arpuWeight: number;        // 객단가 가중치 (기본: 1.0)
  firstMoverWeight: number;  // 선점 이점 가중치 (기본: 1.0)
}
```

### 4.3 핵심 메서드

```typescript
class RlafTuner {
  async calibrateWeights(
    workspaceId: string,
    industry: string
  ): Promise<RlafWeights>
}
```

### 4.4 산업군별 보정 전략 상세

| 산업군 | 핵심 인사이트 | 보정된 가중치 | 근거 |
|--------|---------------|---------------|------|
| **beauty** (뷰티/코스메틱) | 검색 볼륨보다 "찐" 전환율이 매출에 더 직결 | `volumeWeight: 0.8`, `conversionWeight: 1.3` | 화장품은 검색량이 적어도 전환율이 높은 성분 키워드가 실질 매출을 좌우 |
| **tech** (IT/기술) | 신기술 선점(First Mover)이 곧 AI 노출 지배력 | `firstMoverWeight: 1.5` | 신기술 관련 질문은 최초 답변 점유 시 장기간 유지되는 경향 |
| **finance** (금융) | 고관여 상품으로 건당 객단가(ARPU)가 압도적으로 중요 | `arpuWeight: 1.4` | 대출/보험 등 단건 전환의 수익이 극히 크므로 객단가 비중 상향 |
| **기타** | 균형 잡힌 기본값 적용 | 모두 `1.0` | 데이터 축적 후 자동 보정 예정 |

### 4.5 보정된 QVS 공식 적용 방법

```typescript
import { RlafTuner } from '@/lib/benchmark/rlaf-tuner';

const tuner = new RlafTuner();
const weights = await tuner.calibrateWeights(workspaceId, 'beauty');

// 보정된 QVS Composite 계산
const calibratedQVS =
  (volume * weights.volumeWeight) *
  (conversion * weights.conversionWeight) *
  (arpu * weights.arpuWeight) *
  (firstMover * weights.firstMoverWeight) *
  (1 - competition);
```

### 4.6 향후 로드맵

현재는 산업군별 **정적 프리셋** 방식입니다. 향후 다음 단계로 진화합니다:

```
[Phase 1: 현재] 산업군별 정적 프리셋 가중치
    ↓
[Phase 2] 3개월 치 Audit 결과 + QVS 기록을 JOIN하여
          실제 AI 노출 성과와 QVS 점수 간의 피어슨 상관계수 계산
    ↓
[Phase 3] 상관계수가 높은 요소의 가중치를 자동 상향
          (Gradient-Free Optimization)
    ↓
[Phase 4] A/B 테스트: 보정 전/후 QVS 예측 정확도 비교
```

---

## 5. 기존 기능과의 연동 관계 (S-05, S-07)

### 5.1 S-05: QVS 5D 스코어링 엔진

**파일 위치:** `app/actions/qvs.ts` — `scoreQuestionValue()`

**QVS Composite 공식:**
```
QVS = Volume × Conversion × ARPU × FirstMover × (1 - Competition)
```

**입력 파라미터:**

| 파라미터 | 타입 | 범위 | 설명 |
|----------|------|------|------|
| `volume_score` | `number` | 0~1 | 예상 월간 검색 볼륨 정규화 점수 |
| `conversion_score` | `number` | 0~1 | 해당 질문 → 구매 전환 확률 |
| `arpu_score` | `number` | 0~1 | 전환 시 예상 고객당 수익 정규화 |
| `first_mover_score` | `number` | 0~2 | 선점 이점 배수 (기본 1.0) |
| `competition_score` | `number` | 0~1 | 경쟁 강도 (높을수록 점유 어려움) |
| `industry` | `string` | — | 산업군 코드 |

**3-Tier Gate 판정 (QVS → 상품 티어 매핑):**

| QVS 범위 | Gate 판정 | 상품 연결 |
|----------|-----------|-----------|
| 0 ~ 30 | `Low Value` | Free 티저 리포트에서 존재 언급만 |
| 31 ~ 70 | `Medium Value` | Tier 1 (10만원) 진단 리포트에 포함 |
| 71 ~ 100 | `High Value` | Tier 2 (50만원+) 정밀 전략 리포트에 포함 |

### 5.2 S-07: Volume Proxy 실측

Search Grounding 결과를 기반으로 검색 볼륨을 추정하는 모듈입니다. S-13에서 도출된 질문에 대해 볼륨 점수를 자동 산정하는 데 사용됩니다.

---

## 6. QVS 수명주기 — 전체 파이프라인 흐름도

```
[Stage 1: 질문 도출 (S-13)]
  QvsQuestionGenerator.generateMultistageQuestions()
    ├─ J1: Consumer 질문 3개
    ├─ J2: Competitor 질문 3개
    └─ J3: Expert 질문 3개
          │
          ▼
[Stage 2: 가중치 보정 (S-18)]
  RlafTuner.calibrateWeights(workspaceId, industry)
    └─ 산업군별 최적 가중치 반환
          │
          ▼
[Stage 3: 가치 평가 (S-05)]
  scoreQuestionValue(workspaceId, {
    volume_score,
    conversion_score,
    arpu_score,
    first_mover_score,
    competition_score,
    industry
  })
    └─ QVS Composite 산출 → DB 저장
          │
          ▼
[Stage 4: 포트폴리오 관리 (S-16)]
  QvsPortfolioManager.evaluatePortfolioHealth()
    ├─ 건강도 점수 산출
    ├─ 탈취 위험 질문 식별
    └─ 리밸런싱 제안 생성
          │
          ▼
[Stage 5: 모니터링 → Stage 1로 순환]
  ├─ 신규 트렌드 발견 시 J1-J3 재실행
  ├─ 분기별 RLAF 가중치 재보정
  └─ 탈취 위험 질문에 대한 EEAT 콘텐츠 배포
```

---

## 7. 데이터베이스 스키마 참조

**테이블:** `question_value_scores`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK → workspaces |
| `probe_question_id` | UUID | FK → probe_questions (nullable) |
| `predicted_question_id` | UUID | FK → predicted_questions (nullable) |
| `volume_score` | float | 볼륨 점수 |
| `conversion_score` | float | 전환율 점수 |
| `arpu_score` | float | 객단가 점수 |
| `first_mover_score` | float | 선점 이점 점수 |
| `competition_score` | float | 경쟁 강도 점수 |
| `qvs_composite` | float | 종합 QVS |
| `estimated_monthly_value` | float | 추정 월간 가치 (KRW) |
| `preemption_deadline` | timestamp | 선점 마감 기한 |
| `industry` | text | 산업군 코드 |
| `scoring_method` | text | 'auto' 또는 'manual' |
| `scored_at` | timestamp | 평가 일시 |

---

## 8. 실전 운영 시나리오별 가이드

### 시나리오 A: 신규 브랜드 온보딩

```
1. QvsQuestionGenerator로 J1-J3 질문 9개 도출
2. 각 질문에 대해 scoreQuestionValue() 실행
3. QVS 70점 이상 질문은 즉시 콘텐츠 제작 우선순위로 지정
4. QVS 30점 미만 질문은 무료 티저 리포트에만 포함
```

### 시나리오 B: 월간 정기 모니터링

```
1. QvsPortfolioManager.evaluatePortfolioHealth() 실행
2. takeoverRiskCount > 0 이면 해당 질문의 EEAT 보강 콘텐츠 배포
3. driftDetectedCount > 0 이면 AI 답변 재확인 및 콘텐츠 업데이트
4. overallScore 변동 추이를 월간 리포트에 포함
```

### 시나리오 C: 분기별 전략 재검토

```
1. RlafTuner.calibrateWeights()로 최신 가중치 확인
2. 변경된 가중치로 전체 포트폴리오 QVS 재계산
3. QvsQuestionGenerator로 신규 트렌드 기반 질문 추가 도출
4. 기존 Low Value 질문 중 더 이상 유효하지 않은 항목 아카이브
```

---

## 9. 트러블슈팅 가이드

| 증상 | 원인 | 해결 방법 |
|------|------|-----------|
| `generateMultistageQuestions` 항상 Fallback 3개만 반환 | `AI_PROVIDER_MODE=mock` 환경에서 프롬프트가 Mock 매핑에 걸리지 않음 | `gemini` 또는 `claude` 모드로 전환, API 키 확인 |
| `evaluatePortfolioHealth`가 항상 0점 | `question_value_scores` 테이블에 해당 workspace/industry 레코드 없음 | `scoreQuestionValue()`로 최소 1건 이상 데이터 생성 필요 |
| `calibrateWeights`에서 모든 가중치가 1.0 | 지원되지 않는 산업군 코드 사용 | `beauty`, `tech`, `finance` 중 하나 사용, 또는 신규 산업군 프리셋 추가 |
| QVS Composite가 0에 가깝게 나옴 | `competition_score`가 0.95 이상으로 설정됨 | 경쟁 강도 값 검증. `(1 - 0.95) = 0.05` 곱셈 효과로 전체 값 급감 |
| `scoreQuestionValue` 호출 시 UNAUTHORIZED 에러 | 워크스페이스 권한 부족 | `owner`, `admin`, `brand_strategist` 역할 필요 |
| Fallback 질문이 브랜드와 무관한 내용 | Fallback은 `${brandName}` 템플릿만 치환하는 범용 질문 | 실제 LLM 연동으로 전환하면 브랜드 맞춤 질문 생성됨 |
