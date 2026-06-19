# BSW 시스템을 활용한 AI 검색 경쟁 분석 & 개선 리포트 가이드

> **잠재 고객 브랜드의 AI 검색 현황 진단부터 콘텐츠 전략 제안까지** — BSW 시스템의 기능을 어떤 순서로, 어떻게 조합하여 활용해야 최대 가치의 리포트를 산출할 수 있는지를 정리한 운영 가이드입니다.
>
> 최종 갱신: 2026-06-18

---

## 전체 구조: 4단계 컨설팅 워크플로

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    BSW 4-Phase Consulting Workflow                       │
│                                                                         │
│   Phase A           Phase B            Phase C           Phase D         │
│   현황 진단          경쟁 벤치마크       심층 분석          전략 제안       │
│   (WHERE)           (vs WHO)           (WHY)             (HOW)          │
│                                                                         │
│   ┌─────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐    │
│   │D-MRI    │      │Observatory│      │Deep Dive│      │Blueprint │    │
│   │진단     │  ─→  │벤치마크   │  ─→  │딥다이브  │  ─→  │콘텐츠전략│    │
│   └─────────┘      └──────────┘      └─────────┘      └──────────┘    │
│                                                                         │
│   산출물:            산출물:            산출물:            산출물:         │
│   브랜드 건강 점수    업종 순위표        기회 분석 보고서    콘텐츠 설계도  │
│   시맨틱 성숙도       KPI 비교표        E-E-A-T 갭맵      ROI 시뮬레이션 │
│   진실 감사 결과      질문별 승패표      타겟 질문 목록     경영진 요약문  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Phase A: 현황 진단 — "브랜드가 지금 어디에 있는가?"

### 활용 기능

| 시스템 기능 | 위치 | 역할 |
|---|---|---|
| **D-MRI (Digital Market Readiness Index)** | `lib/metrics/d-mri.ts` | 워크스페이스의 디지털 시장 준비도를 종합 지수로 산출 |
| **Truth Audit (진실 감사)** | `DiagnosticEngine` 내부 | 브랜드가 보유한 전략적·운영적 클레임의 승인 상태, 증거 커버리지, 경계 규칙 준수 상태 점검 |
| **Semantic Audit (시맨틱 감사)** | `DiagnosticEngine` 내부 | 시맨틱 코어의 구축 수준 — Question Capital 노드 수, CQ 수, QIS 씬 수, 연결율 점검 |

### 산출 리포트: 「브랜드 디지털 건강 진단서」

```markdown
# [브랜드명] AI 검색 준비도 진단 리포트

## 1. D-MRI 종합 점수: XX / 100
   - 구성 요소별 점수: { 시맨틱 성숙도, 진실 준비도, 콘텐츠 커버리지, ... }

## 2. 진실(Truth) 감사 결과
   - 전략적 진실(Strategic Truth) 정의 여부: ✅ / ❌
   - 운영적 클레임 현황: 총 N건 중 승인 N건, 제한 N건
   - 증거 커버리지: XX%
   - Truth Lock 게이트 레벨: L0 ~ L4

## 3. 시맨틱 코어 성숙도
   - Question Capital 노드: N개
   - 정규 질문(CQ): N개
   - QIS 씬: N개
   - CQ-Capital 연결율: XX%
   - 진단: "시맨틱 인프라 미구축" / "기초 단계" / "운영 가능" / "고도화"
```

**핵심 인사이트**: 이 리포트는 브랜드가 AI 검색에 대응하기 위한 **내부 인프라의 현재 상태**를 보여줍니다. 콘텐츠를 만들기 전에 "만들 수 있는 기반"이 있는지를 확인하는 전제 조건 점검입니다.

---

## Phase B: 경쟁 벤치마크 — "업종에서 몇 등인가?"

### 활용 기능

| 시스템 기능 | 위치 | 역할 |
|---|---|---|
| **Observatory (관측소)** | `app/[locale]/(workspace)/[workspace_slug]/observatory/` | 업종별 AI 검색 벤치마크 대시보드. 여러 브랜드를 동시에 측정 |
| **Probe Panel (탐침 패널)** | `db/seed/industry-panels/` | 업종별 사전 정의된 질문 세트(L1~L7 레이어)를 AI 엔진에 투사 |
| **Per-Layer Metrics** | `lib/benchmark/per-layer-metrics.ts` | IRI, BDR, CWR, OPP 4대 KPI 산출 |
| **Lightweight Metric Runner** | `lib/benchmark/lightweight-metric-runner.ts` | 프로브 질문을 AI에 실제로 물어보고, 응답에서 브랜드 언급을 추출 |

### 핵심 KPI 4종

| KPI | 정식 명칭 | 의미 | 계산 로직 |
|---|---|---|---|
| **IRI** | Industry Readiness Index | 업종 일반 질문에 대해 AI가 *어떤 브랜드든* 언급하는 비율. 업종 자체의 AI 검색 성숙도 | `업종 일반 질문 중 브랜드 언급 있는 비율` |
| **BDR** | Brand Defense Rate | L7(브랜드 직접 언급) 질문에서 해당 브랜드가 실제로 AI 응답에 등장하는 비율. **자기 이름을 지키는 능력** | `브랜드명 포함 질문 중 AI가 해당 브랜드를 언급한 비율` |
| **CWR** | Competitive Win Rate | L2(경쟁 비교) 질문에서 경쟁사보다 먼저 언급되는 비율. **비교 싸움에서 이기는 능력** | `비교 질문 중 우리 브랜드가 경쟁사보다 먼저 등장한 비율` |
| **OPP** | Opportunity Score | AI가 아직 어떤 브랜드도 언급하지 않는 무주공산(無主空山) 질문 비율. **선점 가능 영역** | `업종 일반 질문 중 브랜드 언급 0인 비율` |

### 산출 리포트: 「AI 검색 경쟁력 벤치마크 보고서」

```markdown
# [업종명] AI 검색 벤치마크 보고서

## 1. 업종 리더보드 (Top 5)
| 순위 | 브랜드 | AAS | BDR | CWR | OPP |
|------|--------|-----|-----|-----|-----|
| 1    | A사    | 78  | 92  | 65  | 15  |
| 2    | B사    | 72  | 88  | 58  | 22  |
| ...  | ...    | ... | ... | ... | ... |
| 5    | [고객] | 45  | 60  | 30  | 55  |

## 2. 질문별 승패표 (Question-Level Cross Map)
| 질문 | ChatGPT | Gemini | Perplexity | 고객 언급? |
|------|---------|--------|------------|-----------|
| "XX 추천" | A사 ✅ | B사 ✅ | 언급 없음   | ❌ GAP    |
| "XX 비교" | 고객 ✅ | A사 ✅ | 고객 ✅     | ✅ WIN    |

## 3. 엔진별 편차 분석
- ChatGPT에서 강하지만 Gemini에서 약한 질문 N건
- 전체 엔진에서 누락된 질문 N건 (최우선 공략 대상)

## 4. E-E-A-T 갭 요약
- Expertise 갭: N건
- Experience 갭: N건
- Authority 갭: N건
- Trust 갭: N건
```

**핵심 인사이트**: 이 리포트는 고객 브랜드를 **동일 업종 경쟁사와 나란히 놓고 비교**합니다. "왜 경쟁사 A는 AI 검색에서 보이는데 우리는 안 보이는가?"에 대한 데이터 기반 답변을 제공합니다.

---

## Phase C: 심층 분석 (Deep Dive) — "왜 이런 결과가 나왔는가?"

### 활용 기능

| 시스템 기능 | 위치 | 역할 |
|---|---|---|
| **DiagnosticEngine** | `lib/deep-dive/diagnostic-engine.ts` | 5차원 종합 진단 (D-MRI + 벤치마크 + 기회분석 + 진실감사 + 시맨틱감사) |
| **OpportunityAnalyzer** | `lib/benchmark/opportunity-analyzer.ts` | 벤치마크 결과에서 GAP, BLIND_SPOT, VOLATILE, WEAK_MENTION, DOMINANCE 5가지 기회 유형 식별 |
| **TargetQisEngine** | `lib/deep-dive/target-qis-engine.ts` | 기회 분석 결과에서 공략할 타겟 질문 후보 도출 + 니치 질문 발견 |
| **LlmAnalyst** | `lib/deep-dive/llm-analyst.ts` | LLM 기반 타겟 질문 발굴, 니치 질문 발견, 멘션 품질 분석, 경영진 요약 |
| **Upstream Signal Pipeline** | `lib/signal-collection/orchestrator.ts` | 메타질문→탐색체인→재귀트리→자동평가 파이프라인으로 질문 영토 확장 |

### 기회 분석 5가지 유형

| 유형 | 코드 | 의미 | 전략적 함의 |
|---|---|---|---|
| **GAP** | `gap` | 경쟁사는 AI에 노출되지만 우리 브랜드는 누락 | 🔴 **가장 위험** — 경쟁사에게 질문 영토를 빼앗기고 있음 |
| **BLIND SPOT** | `blind_spot` | 어떤 브랜드도 AI에 노출되지 않는 무주공산 질문 | 🟢 **선점 기회** — 가장 낮은 비용으로 영토 획득 가능 |
| **VOLATILE** | `volatile` | 측정 시점마다 언급 여부가 불안정하게 변동 | 🟡 **방어 필요** — 콘텐츠 보강으로 안정화 가능 |
| **WEAK MENTION** | `weak_mention` | 언급은 되지만 경쟁사 목록에 묻혀 있는 약한 노출 | 🟠 **품질 개선** — 첫 번째 추천으로 올라가야 함 |
| **DOMINANCE** | `dominance` | 우리 브랜드가 압도적으로 잘 노출되는 질문 | 🔵 **방어 유지** — 경쟁사 진입 모니터링 |

### 산출 리포트: 「AI 검색 기회 분석 보고서」

```markdown
# [브랜드명] AI 검색 기회 분석 보고서

## 1. 기회 요약
- 총 발견 기회: XX건
- 고우선순위 기회: XX건
- 최우선 행동 항목 Top 3:
  1. "나이아신아마이드 민감성 피부" 질문에 전문가 콘텐츠 구축 (GAP, E-E-A-T: Expertise)
  2. "XX vs YY 비교" 질문에 비교 리뷰 콘텐츠 확보 (WEAK_MENTION, CWR 개선)
  3. "XX 부작용 대처법" 질문에 의료 근거 기반 답변 준비 (BLIND_SPOT, Trust)

## 2. 기회 유형별 분포
| 유형 | 건수 | 비율 |
|------|------|------|
| GAP | 12 | 40% |
| BLIND_SPOT | 8 | 27% |
| VOLATILE | 5 | 17% |
| WEAK_MENTION | 3 | 10% |
| DOMINANCE | 2 | 7% |

## 3. E-E-A-T 갭 맵
| 차원 | 갭 수 | 대표 질문 | 대응 전략 |
|------|-------|-----------|-----------|
| Expertise | 8 | "성분 효능 근거" | 임상 데이터 기반 콘텐츠 |
| Experience | 5 | "실제 사용 후기" | 사용자 UGC 수집·큐레이션 |
| Authority | 4 | "전문가 추천" | 피부과 의사 인터뷰 확보 |
| Trust | 3 | "부작용 안전성" | FDA/식약처 인증 정보 제공 |

## 4. 타겟 질문 후보 (우선순위 정렬)
| # | 질문 | 유형 | E-E-A-T | 영향도 | 난이도 | BDR 예상 변동 |
|---|------|------|---------|--------|--------|---------------|
| 1 | "XX 세럼 민감성 피부" | GAP | Expertise | +8.2 | 낮음 | +5.5% |
| 2 | "XX vs 경쟁사 비교" | WEAK | Authority | +6.1 | 중간 | +3.2% |
| ... | ... | ... | ... | ... | ... | ... |

## 5. 니치(Niche) 질문 발견
- 정규 질문 "레티놀 사용법"에서 파생된 공략 가능 니치 질문들:
  - "레티놀 크림 초보자 농도 추천" (난이도: 25, 적합도: 92)
  - "레티놀 바르고 선크림 안 바르면?" (난이도: 18, 적합도: 88)
```

---

## Phase D: 전략 제안 — "구체적으로 무엇을 만들어야 하는가?"

### 활용 기능

| 시스템 기능 | 위치 | 역할 |
|---|---|---|
| **ContentBlueprintGenerator** | `lib/deep-dive/content-blueprint-gen.ts` | 타겟 질문별 콘텐츠 설계도 생성 (제목, 헤딩 구조, 필수 포함 요소, 금지 사항) |
| **ImpactSimulator** | `lib/deep-dive/impact-simulator.ts` | 콘텐츠 실행 시 BDR/CWR 변동 시뮬레이션 |
| **LlmAnalyst.generateExecutiveSummary** | `lib/deep-dive/llm-analyst.ts` | LLM이 생성하는 경영진용 전략 요약 |
| **S-Score Calculator** | `lib/s-score/calculator.ts` | 각 CQ의 전략적 가치를 4차원(완전성·가시성·기회·준비도)으로 평가 |

### 산출 리포트: 「콘텐츠 전략 & ROI 시뮬레이션 보고서」

```markdown
# [브랜드명] AI 검색 콘텐츠 전략 보고서

## 1. 경영진 요약 (Executive Summary)
   [LLM이 자동 생성하는 1~2단락 분량의 전략 요약]
   - 현재 BDR: 60%, 업종 평균 대비 -15%
   - 3개 핵심 질문 공략 시 예상 BDR: 72% (+12%p)
   - 예상 CWR 향상: 30% → 38%

## 2. ROI 시뮬레이션
| 시나리오 | 타겟 질문 | 예상 BDR | 필요 노력 |
|----------|-----------|----------|-----------|
| 시나리오 1 | "XX 세럼 민감성 피부" | 65% | Low |
| 시나리오 2 | "XX vs 경쟁사 비교" | 68% | Medium |
| 시나리오 3 | "XX 성분 부작용" | 72% | Low |

## 3. 콘텐츠 블루프린트 (질문별 상세 설계도)

### 타겟 질문 #1: "XX 세럼 민감성 피부에 안전한가요?"
- **추천 콘텐츠 제목**: "민감성 피부를 위한 XX 세럼 완벽 가이드"
- **헤딩 구조**:
  - H2: 민감성 피부에 XX 세럼이 적합한 이유 (Question Heading)
  - H3: 핵심 성분 분석 — 나이아신아마이드, 세라마이드
  - H3: 사용 전 패치 테스트 방법
  - H2: 피부과 전문의가 말하는 민감성 피부 세럼 선택 기준
  - H3: XX vs 경쟁사 비교표
- **필수 포함 사항 (Must Include)**:
  - 브랜드명(XX), 임상 데이터 출처, 사용법 단계별 이미지
- **강력 권장 사항 (Strongly Recommended)**:
  - FAQ Schema 마크업, 피부과 전문의 인용
- **주의 사항 (Caution)**:
  - "모든 피부에 안전합니다" 같은 절대적 주장 금지
- **금지 사항 (Must Not Do)**:
  - 경쟁사 비방, 의학적 치료 효과 주장
- **Schema 제안**: FAQPage, HowTo, Product

## 4. S-Score 기반 CQ 전략 우선순위
| CQ | 완전성 | 가시성 | 기회 | 준비도 | 종합 S-Score | 전략 의견 |
|----|--------|--------|------|--------|-------------|-----------|
| "XX 세럼 민감성 피부" | 85 | 30 | 90 | 70 | 65 | 기회 높음, 콘텐츠 우선 생성 |
| "XX 성분 부작용" | 40 | 20 | 95 | 30 | 45 | 콘텐츠 준비 후 프로브 재측정 |
```

---

## 통합 리포트: 「AI 검색 경쟁력 종합 컨설팅 리포트」

위 4개 Phase의 리포트를 하나로 통합한 종합 보고서 구조:

```
┌────────────────────────────────────────────────────────────────┐
│  Part 0. 경영진 요약 (1~2 페이지)                               │
│  ├─ 현재 상태 한 줄 요약                                       │
│  ├─ 핵심 지표 3개 (BDR, CWR, OPP)                             │
│  ├─ 가장 위험한 GAP 3건                                        │
│  └─ 즉시 실행 가능한 Quick Win 3건                              │
│                                                                │
│  Part 1. 브랜드 건강 진단 [Phase A]                              │
│  ├─ D-MRI 종합 점수 및 구성 요소                                │
│  ├─ 진실 감사 (Truth Audit) 결과                               │
│  └─ 시맨틱 코어 성숙도 진단                                     │
│                                                                │
│  Part 2. 업종 경쟁 벤치마크 [Phase B]                            │
│  ├─ 업종 리더보드                                              │
│  ├─ KPI 비교 (IRI, BDR, CWR, OPP)                             │
│  ├─ 질문별 크로스맵 (엔진 × 브랜드 매트릭스)                     │
│  └─ 엔진별 편차 분석                                            │
│                                                                │
│  Part 3. 기회 분석 [Phase C]                                     │
│  ├─ 5가지 기회 유형별 분포                                      │
│  ├─ E-E-A-T 갭 맵                                              │
│  ├─ 타겟 질문 후보 + 니치 질문                                   │
│  └─ 상류 시그널 발굴 결과 (메타질문·탐색·재귀)                   │
│                                                                │
│  Part 4. 콘텐츠 전략 & ROI [Phase D]                             │
│  ├─ 질문별 콘텐츠 블루프린트                                     │
│  ├─ BDR/CWR 향상 시뮬레이션                                     │
│  ├─ S-Score 기반 우선순위                                       │
│  └─ 실행 로드맵 (Week 1~4 액션 플랜)                            │
│                                                                │
│  Appendix                                                       │
│  ├─ 프로브 패널 전체 질문 목록 & 응답 원문                       │
│  ├─ 벤치마크 RAW 데이터                                         │
│  └─ 시스템 방법론 요약 (OGDE Pipeline, S-Score)                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 실행 체크리스트: 새 고객 온보딩 시

| 단계 | 작업 | 시스템 기능 | 소요 시간 |
|------|------|------------|-----------|
| **0** | 워크스페이스 생성 + 브랜드 정보 입력 | Workspace CRUD | 10분 |
| **1** | 업종 도메인 선택 (또는 신규 생성) | Domain Config | 5분 |
| **2** | 프로브 패널에 브랜드 추가 | Seed Panel + Brand Config | 15분 |
| **3** | Observatory에서 벤치마크 실행 | Lightweight Metric Runner | 3~5분 (AI 응답 대기) |
| **4** | Deep Dive 세션 시작 | DiagnosticEngine.runDiagnostic() | 1~2분 |
| **5** | 기회 분석 결과 검토 | OpportunityAnalyzer.analyze() | 자동 |
| **6** | 상류 시그널 파이프라인 실행 | SignalOrchestrator.runFullPipeline() | 2~3분 |
| **7** | 시그널 배치 리뷰 (HITL) | Signals Dashboard | 10~15분 |
| **8** | 타겟 질문 확정 + 블루프린트 생성 | ContentBlueprintGenerator | 자동 |
| **9** | ROI 시뮬레이션 | ImpactSimulator.simulate() | 자동 |
| **10** | 경영진 요약 생성 | LlmAnalyst.generateExecutiveSummary() | 자동 |
| **11** | 통합 리포트 편집 및 납품 | 수동 편집 | 1~2시간 |

**총 예상 소요 시간**: 약 **3~4시간** (AI 자동 처리 + 사람의 리뷰·편집 시간 포함)

---

## 부록: 기능-리포트 매핑 테이블

| BSW 기능 모듈 | 산출 데이터 | 리포트 섹션 활용처 |
|---|---|---|
| D-MRI | 종합 건강 점수 (0~100) | Part 1 |
| Truth Audit | 클레임 승인율, 게이트 레벨 | Part 1 |
| Semantic Audit | CQ/QIS/KG 노드 수 | Part 1 |
| Probe Panel | 업종별 질문 세트 (L1~L7) | Part 2 입력 |
| Metric Runner | 질문별 AI 응답 + 브랜드 언급 | Part 2 |
| Per-Layer Metrics | IRI, BDR, CWR, OPP | Part 2 핵심 KPI |
| Opportunity Analyzer | GAP/BLIND_SPOT 등 5유형 분류 | Part 3 |
| Upstream Pipeline | 메타/탐색/재귀 시그널 | Part 3 영토 확장 |
| Signal Evaluator | 인텐트·적합성·YMYL 평가 | Part 3 필터링 |
| Target QIS Engine | 타겟 질문 후보 + 니치 | Part 3/4 |
| LLM Analyst | 타겟 발굴, 멘션 분류 | Part 3/4 |
| Content Blueprint | 콘텐츠 설계도 | Part 4 |
| Impact Simulator | BDR/CWR 변동 예측 | Part 4 ROI |
| S-Score Calculator | CQ 전략 가치 4차원 | Part 4 우선순위 |
| Executive Summary | 경영진용 전략 요약문 | Part 0 |
