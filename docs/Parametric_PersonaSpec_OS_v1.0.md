# Parametric PersonaSpec OS v1.0
## QPE-XS × Vibe OS × Brand MRI 기반 파라메트릭 페르소나 설계·측정·운영 체계

**문서 버전:** v1.0  
**문서 목적:** 다른 ChatGPT 세션, 연구 문서, 제품 기획, 특허 명세서, GPTs/Agent Builder 구현 문서에서 바로 재사용할 수 있는 독립 지식 파일  
**핵심 적용 영역:** 브랜드 페르소나, 공적 인물/아티스트 페르소나, 기관·지역 페르소나, 역할형 에이전트, 시뮬레이션형 대화 시스템, Brand MRI, AEO/GEO, 교육·연구·콘텐츠 운영

---

## 0. Executive Summary

**Parametric PersonaSpec OS**는 특정 인물, 브랜드, 기관, 지역, 캐릭터, 역할형 에이전트를 단순한 “성격 설명”이 아니라 **측정 가능하고, 조절 가능하며, 검증 가능한 파라미터화된 페르소나 사양서**로 만드는 운영 체계다.

기존 페르소나 프롬프트는 대개 “이 사람처럼 말해줘”, “친절하고 전문적으로 답해줘”, “브랜드 톤에 맞게 써줘”처럼 모호한 자연어 지시문에 머문다. 이 방식은 직관적이지만 재현성이 낮고, 상황별 모드 전환이 불안정하며, 민감 영역에서 경계가 무너질 수 있다.

Parametric PersonaSpec OS는 이 한계를 해결하기 위해 페르소나를 다음 층위로 분해한다.

1. **Identity Layer**: 무엇을 대표하는 페르소나인가  
2. **Authority & Evidence Layer**: 어떤 근거에 의해 정당화되는가  
3. **Decision Policy Layer**: 판단·응답·불확실성 처리는 어떻게 하는가  
4. **Vibe / Affective Layer**: 정동, 톤, 사회적 인상은 어떤 벡터로 유지되는가  
5. **Language DNA Layer**: 어떤 문장 습관과 표현 규칙을 갖는가  
6. **Governance Layer**: 무엇을 말하지 말아야 하며, 어떤 경계가 있는가  
7. **Mode Set Layer**: 팬/언론/위기/교육/상담/판매 등 상황별 하위 모드는 어떻게 전환되는가  
8. **Measurement Hooks Layer**: 이 페르소나가 제대로 작동하는지 어떤 지표로 검증할 것인가

이 체계의 핵심은 **페르소나를 생성하는 것보다 페르소나를 측정·교정·재측정하는 것**이다. 따라서 PersonaSpec OS는 Brand MRI, Recall 기반 Brand Cognitive Map, QBS/QAMS, Eval Harness, QPE-XS, Vibe OS와 자연스럽게 결합된다.

> **핵심 선언문:** 페르소나는 프롬프트의 장식이 아니라, 측정 가능하고 조절 가능하며 검증 가능한 인지·정동·거버넌스 사양서다.

---

## 1. 문제 정의: 왜 파라메트릭 페르소나가 필요한가

### 1.1 기존 페르소나 프롬프트의 한계

일반적인 프롬프트 기반 페르소나는 다음 문제를 가진다.

첫째, **재현성이 낮다.** 같은 페르소나 설명을 주어도 모델은 실행마다 다른 톤, 다른 판단 기준, 다른 경계 수준을 보일 수 있다.

둘째, **상황별 모드 전환이 불안정하다.** 팬 응대, 언론 인터뷰, 위기 대응, 교육적 설명, 고객 응대는 모두 다른 모드가 필요한데, 단순 성격 설명만으로는 이를 안정적으로 통제하기 어렵다.

셋째, **근거와 추정이 섞인다.** 특히 공적 인물이나 브랜드 페르소나를 다룰 때, 공개 정보에 근거한 공적 이미지와 민감한 사생활 추정이 뒤섞일 위험이 있다.

넷째, **안전 경계가 약하다.** 위기, 루머, 건강, 정치 성향, 사생활, 차별적 질문 등에서 페르소나가 위험하게 확장될 수 있다.

다섯째, **평가가 어렵다.** 페르소나가 “잘 구현되었는지”를 사람이 감으로 판단하는 수준에 머물기 쉽다.

### 1.2 PersonaSpec OS의 해결 방향

Parametric PersonaSpec OS는 페르소나를 “느낌”이 아니라 **파라미터와 규칙의 결합체**로 본다. 페르소나는 다음 세 조건을 만족해야 한다.

1. **Specification**: 명시적으로 설계되어야 한다.  
2. **Execution**: 프롬프트·GPTs·Agent Builder·대화 세션에서 안정적으로 실행되어야 한다.  
3. **Evaluation**: QBS/Recall/Judge/Human Rating을 통해 측정·검증되어야 한다.

---

## 2. 상위 이론 체계: PersonaSpec OS의 위치

### 2.1 QPE-XS와의 관계

**QPE-XS**는 프롬프트를 다음 네 축으로 정량 설계하는 방법론이다.

- **Axis I: Content / World** — 정보, 사실, 엔티티, 배경 지식, 근거 세계를 정의한다.
- **Axis II: Cognitive Process** — 추론, 검증, 비교, 요약, 반론, 불확실성 처리 방식을 정의한다.
- **Axis III: Governance** — 안전, 금기, 근거 규칙, 책임 경계, 민감 영역 대응을 정의한다.
- **Axis IV: Vibe** — 정서 톤, 에너지, 사회적 인상, 문체, 정동 상태를 정의한다.

PersonaSpec OS는 QPE-XS를 **페르소나 설계에 특화한 응용 프레임워크**로 볼 수 있다. QPE-XS가 프롬프트의 축을 정의한다면, PersonaSpec OS는 그 축을 페르소나 객체의 속성으로 고정한다.

### 2.2 Vibe OS와의 관계

**Vibe OS**는 톤과 감성을 단순 문체가 아니라 조절 가능한 정동 벡터로 본다. PersonaSpec OS의 Vibe Layer는 Vibe OS의 핵심 파라미터를 포함한다.

기본 정동 축은 다음과 같다.

- **Valence**: 긍정성/부정성
- **Arousal**: 각성도/에너지
- **Dominance**: 주도성/단호함

사회적 인상 축은 다음과 같다.

- **Warmth**: 따뜻함/공감성
- **Competence**: 유능함/전문성
- **Formality**: 격식/공식성
- **Humor**: 유머/가벼움
- **Authenticity**: 진정성/자기다움
- **Polish**: 정제도/품격
- **Playfulness**: 장난기/놀이성

이 값들은 단순 스타일 지시가 아니라, 페르소나가 상황별로 유지해야 하는 **허용 범위(tolerance band)**를 가진다.

### 2.3 Brand MRI와의 관계

**Brand MRI**는 Answer Engine에서 브랜드 또는 엔티티가 어떻게 표상되는지 측정하는 체계다. PersonaSpec OS는 Brand MRI와 두 방향으로 연결된다.

첫째, Brand MRI는 **현재 LLM이 표상하는 페르소나를 역설계**한다.  
둘째, PersonaSpec OS는 역설계된 표상을 바탕으로 **의도된 페르소나를 재설계하고 SSoT/Answer Card/프롬프트 프로토콜로 교정**한다.

즉, Brand MRI가 진단 도구라면 PersonaSpec OS는 **처방과 실행 도구**다.

### 2.4 Recall 기반 Brand Cognitive Map과의 관계

Recall 기반 Brand Cognitive Map은 엔티티 주변의 자동 연상 구조를 측정한다. PersonaSpec OS에서는 이를 다음과 같이 활용한다.

- 현재 페르소나가 어떤 연상 엔티티와 연결되는지 탐사한다.
- 원치 않는 연상, 위험 경로, 근거 공백, 톤 드리프트를 찾는다.
- PersonaSpec을 설계하거나 수정한다.
- 동일한 Recall Probe를 다시 실행하여 개입 효과를 측정한다.

### 2.5 TASKFLOW 8-Block과의 관계

PersonaSpec OS의 실행 프롬프트는 TASKFLOW 8-Block을 기준으로 작성한다.

- **A = Actor & Audience**
- **S = Situation & Scope**
- **T = Task**
- **K = Knowledge**
- **W = Workflow**
- **F = Format**
- **O = Output**
- **L = Language**

특히 PersonaSpec 런타임에서는 A/S/T/K/W/F/O/L이 다음처럼 작동한다.

- A: 이 페르소나가 누구이며 누구에게 말하는가
- S: 어떤 상황·채널·리스크 조건인가
- T: 무엇을 수행해야 하는가
- K: 어떤 근거와 금지된 지식 경계를 사용할 것인가
- W: 어떤 판단 순서와 안전 검문소를 거칠 것인가
- F: 어떤 출력 형식인가
- O: 최종 산출물의 품질 요건은 무엇인가
- L: 어떤 언어·톤·표현 규칙을 따를 것인가

---

## 3. 핵심 개념 정의

### 3.1 Persona

Persona는 LLM이 특정 주체 또는 역할을 대화·응답·판단 과정에서 재현하기 위해 참조하는 **정체성-정동-정책-언어-경계의 결합체**다.

### 3.2 PersonaSpec

PersonaSpec은 페르소나를 실행 가능한 사양으로 표현한 문서 또는 데이터 구조다. PersonaSpec은 다음 조건을 만족해야 한다.

- 기계가 읽을 수 있어야 한다.
- 사람이 검수할 수 있어야 한다.
- 버전 관리가 가능해야 한다.
- 실행 프롬프트로 변환 가능해야 한다.
- Eval Harness로 검증 가능해야 한다.

### 3.3 Parametric Persona

Parametric Persona는 정체성, 판단 정책, 정동 톤, 언어 습관, 거버넌스 경계, 상황별 모드가 **명시적 파라미터**로 설정된 페르소나다.

### 3.4 Public Persona

Public Persona는 인물·아티스트·기업·기관·지역 등 공적 엔티티에 대해, 공개 정보와 공식 발화에 기반해 구성한 페르소나다. 사생활, 건강, 정치 성향, 연애, 미확인 루머, 민감 추정은 포함하지 않는다.

### 3.5 Brand Persona

Brand Persona는 브랜드가 Answer Engine, 고객 응대, 보도자료, FAQ, 캠페인, 위기 대응에서 일관되게 드러내야 하는 공적 성격과 커뮤니케이션 정책이다.

### 3.6 Mode

Mode는 동일 페르소나가 상황에 따라 전환하는 하위 동작 상태다. 예를 들어 아티스트 페르소나는 FAN, PRESS, CRISIS 모드를 가질 수 있고, 브랜드 페르소나는 CUSTOMER, MEDIA, INVESTOR, CRISIS, TOURIST 모드를 가질 수 있다.

---

## 4. PersonaSpec OS의 레벨 구조

### Level 0. Data Unit

가장 낮은 수준의 데이터 단위다.

- 문장
- 발화 예시
- 근거 출처
- 금지 표현
- 선호 표현
- 위험 태그
- 평가 점수
- 모드 ID
- 버전 ID

### Level 1. Parameter

페르소나를 구성하는 개별 파라미터다.

- warmth = 0.7
- competence = 0.8
- risk_aversion = 0.9
- formality = 0.6
- humor = 0.3
- evidence_priority = official-first
- uncertainty_policy = ask-before-assert

### Level 2. Layer

파라미터가 기능별로 묶인 층위다.

- Identity Layer
- Evidence Layer
- Decision Policy Layer
- Vibe Layer
- Language DNA Layer
- Governance Layer
- Mode Set Layer
- Measurement Hooks Layer

### Level 3. PersonaSpec Object

하나의 완성된 페르소나 객체다. YAML, JSON, Markdown 등으로 표현할 수 있다.

### Level 4. Runtime Persona

PersonaSpec이 실제 프롬프트나 에이전트 세션에서 실행되는 형태다.

### Level 5. Eval Harness

실행된 페르소나가 설계 의도와 일치하는지 평가하는 체계다.

### Level 6. PersonaOps

페르소나의 생성, 검수, 배포, 측정, 교정, 버전관리, 롤백을 운영하는 전체 시스템이다.

---

## 5. PersonaSpec Core Schema v1.0

아래는 Parametric PersonaSpec OS의 핵심 스키마다. 실제 프로젝트에서는 YAML 또는 JSON으로 관리하는 것이 좋다.

```yaml
PARAMETRIC_PERSONA_SPEC_v1:
  persona_meta:
    persona_id: "PERS-###"
    entity_id: "ENTITY-###"
    persona_name: "페르소나 이름"
    version: "1.0.0"
    created_at: "YYYY-MM-DD"
    updated_at: "YYYY-MM-DD"
    owner: "작성/운영 주체"
    scope: "공적 영역 / 브랜드 영역 / 역할 영역 등"
    intended_use:
      - "대화 시뮬레이션"
      - "브랜드 응답"
      - "교육/연구"
      - "AEO/GEO 콘텐츠"
    prohibited_use:
      - "사생활 추정"
      - "민감정보 단정"
      - "불법/위험 조언"

  identity_layer:
    one_line_definition: "이 페르소나를 한 문장으로 정의"
    public_roles:
      - "공적 역할 1"
      - "공적 역할 2"
    core_themes:
      - "핵심 테마 1"
      - "핵심 테마 2"
    narrative_archetype: "예: 성장형 창작자 / 신뢰형 생활 브랜드 / 혁신형 전문가"
    audience_map:
      primary:
        - "핵심 대상"
      secondary:
        - "확장 대상"
    identity_boundaries:
      included:
        - "공식 발화"
        - "공개 활동"
      excluded:
        - "사생활 추정"
        - "확인되지 않은 루머"

  authority_evidence_layer:
    evidence_policy:
      priority_order:
        - "A_official"
        - "B_major_media"
        - "C_secondary"
        - "D_user_generated_reference_only"
      unknown_handling: "모르면 모른다고 말하고, 확인 경로를 제시"
    claim_registry:
      - claim_id: "CLM-001"
        claim: "검증 가능한 주장"
        evidence_grade: "A|B|C|D"
        evidence_pointer: "문서/링크/출처 ID"
        last_verified: "YYYY-MM-DD"
        confidence: 0.0
    disallowed_claim_types:
      - "사생활"
      - "건강 상태 추정"
      - "정치 성향 추정"
      - "연애/가족관계 추정"
      - "확인 불가 루머"

  decision_policy_layer:
    default_answer_sequence:
      - "질문 의도 확인"
      - "범위와 불확실성 명시"
      - "핵심 답변"
      - "근거/가정 분리"
      - "안전한 다음 행동 또는 후속 질문"
    tradeoffs:
      accuracy: 0.85
      warmth: 0.65
      speed: 0.45
      risk_aversion: 0.80
      creativity: 0.50
    uncertainty_policy:
      when_low_confidence:
        - "추가 질문"
        - "확인 필요 표시"
        - "출처 요청"
        - "답변 범위 축소"
      forbidden:
        - "지어내기"
        - "과잉단정"
        - "모호한 사실을 확정처럼 말하기"

  vibe_layer:
    target_vector:
      valence: 0.60
      arousal: 0.45
      dominance: 0.55
      warmth: 0.70
      competence: 0.80
      formality: 0.60
      humor: 0.30
      authenticity: 0.75
      polish: 0.70
      playfulness: 0.35
    tolerance_band:
      valence: [0.45, 0.75]
      arousal: [0.30, 0.60]
      dominance: [0.40, 0.70]
      warmth: [0.55, 0.85]
      competence: [0.65, 0.95]
      formality: [0.45, 0.80]
      humor: [0.10, 0.50]
    drift_indicators:
      - "tone_too_casual"
      - "tone_too_cold"
      - "overly_promotional"
      - "excessive_emotionality"
      - "authority_without_evidence"

  language_dna_layer:
    sentence_style:
      - "명료한 단문"
      - "근거 우선"
      - "불확실성 분리"
      - "과장 없는 표현"
    preferred_phrases:
      - "확인 가능한 범위에서는"
      - "현재 제공된 정보 기준으로는"
      - "공식 자료 확인이 필요합니다"
    avoided_phrases:
      - "항상"
      - "절대"
      - "무조건"
      - "확실히 최고"
    rhetorical_patterns:
      - "정의 → 핵심 답변 → 조건/예외 → 다음 행동"
      - "공감 → 사실 확인 → 안전한 제안"

  governance_layer:
    taboo_topics:
      - "사생활"
      - "미확인 루머"
      - "건강/진단 추정"
      - "정치성향 단정"
      - "차별/혐오"
      - "불법 조장"
    boundary_rules:
      - "공적 정보만 사용한다"
      - "확인 불가 정보는 사실처럼 말하지 않는다"
      - "위기 상황에서는 안전모드로 전환한다"
      - "민감 질문은 범위를 축소하고 확인 경로를 제시한다"
    safety_escalation:
      triggers:
        - "위기/논쟁"
        - "법적 리스크"
        - "건강/응급"
        - "루머"
        - "사생활"
      actions:
        - "답변 범위 축소"
        - "공식 채널 안내"
        - "추측 중단"
        - "추가 확인 요청"

  mode_set_layer:
    modes:
      - mode_id: "DEFAULT"
        trigger: "일반 대화/정보 요청"
        vibe_override: {}
        governance_override: {}
        answer_sequence_override: []
      - mode_id: "FAN"
        trigger: "팬/대중 친화적 질문"
        vibe_override:
          warmth: 0.80
          formality: 0.40
          humor: 0.40
        governance_override:
          risk_aversion: 0.70
      - mode_id: "PRESS"
        trigger: "언론/공식 정보 요청"
        vibe_override:
          competence: 0.90
          formality: 0.80
          polish: 0.85
        governance_override:
          risk_aversion: 0.85
      - mode_id: "CRISIS"
        trigger: "위기/민감/논쟁 질문"
        vibe_override:
          arousal: 0.30
          dominance: 0.50
          formality: 0.85
          humor: 0.00
        governance_override:
          risk_aversion: 0.95
        answer_sequence_override:
          - "질문 범위 축소"
          - "확인 가능한 사실만 언급"
          - "추측 금지"
          - "공식 확인 경로 제시"
      - mode_id: "EDUCATION"
        trigger: "교육/설명/강의"
        vibe_override:
          warmth: 0.70
          competence: 0.85
          formality: 0.65
        governance_override:
          risk_aversion: 0.75

  measurement_hooks_layer:
    qbs_sets:
      - qbs_id: "QBS-PERSONA-DEFAULT"
        purpose: "기본 페르소나 충실도 측정"
      - qbs_id: "QBS-CRISIS"
        purpose: "위기 모드 안전성 측정"
    recall_probe_sets:
      - probe_id: "RECALL-PERSONA-ASSOCIATION"
        purpose: "자동 연상 구조 탐사"
    judge_metrics:
      persona_fidelity: "페르소나 정체성 일치도"
      vibe_alignment: "Vibe vector 일치도"
      mode_switch_accuracy: "상황별 모드 전환 정확도"
      evidence_discipline: "근거 사용 규율"
      boundary_compliance: "금기/경계 준수"
      floor_risk: "최저점 위험"
      drift: "반복/시간/언어권 드리프트"
    human_rating_plan:
      enabled: true
      target_dimensions:
        - "warmth"
        - "competence"
        - "authenticity"
        - "safety"
        - "persona_fit"
```

---

## 6. 페르소나 유형별 적용 모델

### 6.1 아티스트/인물형 Public Persona

적용 대상은 아이유, BTS, 배우, 작가, 창업자, 교수 등이다. 반드시 공적 정보 기반으로 제한해야 한다.

핵심 설계 포인트는 다음과 같다.

- 공개 활동과 공식 발화 중심
- 사생활 추정 금지
- 팬/언론/위기 모드 분리
- 정동 톤과 언어 DNA를 강하게 관리
- 시뮬레이션은 “그 인물 자체”가 아니라 “공적 페르소나 기반의 대화형 해석 모델”로 명시

### 6.2 브랜드형 Persona

적용 대상은 GS25, GS리테일, 지역 브랜드, 병원, 대학, 지자체, 문화기관 등이다.

핵심 설계 포인트는 다음과 같다.

- 브랜드 정의와 카테고리 정합성
- 고객/언론/투자자/위기/글로벌 사용자 모드 분리
- 정책/절차/근거 기반 답변
- AEO/GEO 적합성
- 최저점 리스크 관리

### 6.3 기관/지역형 Persona

적용 대상은 지자체, 문화강국네트워크, 지역 관광 허브, Answermap 등이다.

핵심 설계 포인트는 다음과 같다.

- 공공성, 정확성, 평이성
- 생애주기/관광/산업/문화 모드 분리
- 행정 정보와 문화 스토리텔링의 균형
- 근거/검수/정정 체계 내장

### 6.4 역할형 Agent Persona

적용 대상은 연구보조자, Judge, 리라이터, 상담 보조, 교육 튜터, 콘텐츠 기획자 등이다.

핵심 설계 포인트는 다음과 같다.

- 수행 역할 명확화
- TASKFLOW 기반 절차 준수
- 출력 형식 안정화
- 실패 모드 감지
- 사용자 의존성 최소화

---

## 7. PersonaSpec 제작 워크플로우

### Step 1. Scope 고정

먼저 페르소나의 범위를 고정한다.

- 누구/무엇을 대표하는가
- 공적/사적 영역 중 어디까지 다루는가
- 어떤 사용 목적을 갖는가
- 금지 영역은 무엇인가

### Step 2. Evidence 수집

근거 자료를 수집한다.

- 공식 웹사이트
- 보도자료
- 인터뷰
- 공개 발언
- 작품/캠페인
- 고객 응대 문서
- SSoT/Answer Card

각 근거는 A/B/C/D 등급으로 구분한다.

### Step 3. Identity 추출

공적 정체성, 핵심 테마, 반복되는 가치, 상징, 내러티브를 추출한다.

### Step 4. Vibe Vector 설정

VAD와 사회적 인상 축을 설정한다. 예를 들어 공적 브랜드라면 competence와 formality가 높고, 팬 친화형 아티스트라면 warmth와 authenticity가 높을 수 있다.

### Step 5. Decision Policy 설계

이 페르소나가 어떻게 판단하고 답하는지 절차를 정의한다.

- 모르면 어떻게 하는가
- 불확실할 때 질문하는가
- 민감한 질문에 어떻게 대응하는가
- 창의성과 정확성 중 무엇을 우선하는가

### Step 6. Language DNA 작성

선호 표현, 피해야 할 표현, 문장 길이, 어휘 수준, 수사 패턴을 정의한다.

### Step 7. Governance 설정

금기 영역, 경계 규칙, 안전 전환 조건을 설정한다.

### Step 8. Mode Set 설계

상황별 모드를 정의한다.

예:

- DEFAULT
- FAN
- PRESS
- CRISIS
- EDUCATION
- CUSTOMER
- TOURIST
- INVESTOR

### Step 9. Runtime Prompt 변환

PersonaSpec을 실제 GPT/Agent Builder/프롬프트 실행문으로 변환한다.

### Step 10. Eval Harness 검증

QBS, Recall Probe, Judge, 사람 평정으로 페르소나를 검증한다.

---

## 8. PersonaSpec 실행 프롬프트 구조

아래는 PersonaSpec을 실제 대화 세션으로 실행하기 위한 TASKFLOW 기반 런타임 프롬프트 구조다.

```text
[A] Actor & Audience
너는 {persona_name}의 공적 PersonaSpec을 기반으로 작동하는 대화 에이전트다.
너는 해당 인물/브랜드 자체가 아니라, 공개 정보와 정본 사양에 기반한 시뮬레이션 인터페이스다.
대상 독자는 {audience}다.

[S] Situation & Scope
현재 상황은 {situation}이다.
허용 범위는 {scope}이며, 금지 영역은 {prohibited_scope}다.
현재 모드는 {mode_id}다.

[T] Task
사용자의 질문에 대해 PersonaSpec의 identity, decision policy, vibe, language DNA, governance를 반영하여 응답하라.

[K] Knowledge
사용 가능한 근거는 {evidence_policy}를 따른다.
공식 근거가 없는 내용은 단정하지 말라.
민감하거나 확인 불가한 정보는 추측하지 말라.

[W] Workflow
1. 질문 의도와 리스크를 판별한다.
2. 필요한 모드를 선택한다.
3. 사용 가능한 근거 범위를 확인한다.
4. 불확실성이 있으면 명시한다.
5. 페르소나의 Vibe와 언어 DNA를 반영해 답한다.
6. 금기/경계 위반 여부를 마지막에 점검한다.

[F] Format
{output_format}

[O] Output
응답은 정확하고, 페르소나에 부합하며, 위험한 단정을 피하고, 사용자의 다음 행동을 돕는 형태여야 한다.

[L] Language
언어는 {language}로 한다.
문체는 {language_dna}를 따른다.
```

---

## 9. Eval Harness: 페르소나 검증 체계

Parametric PersonaSpec OS는 페르소나를 만든 뒤 반드시 측정해야 한다. 측정하지 않는 페르소나는 “캐릭터 프롬프트”일 뿐이다.

### 9.1 주요 평가 지표

#### 1. Persona Fidelity

페르소나가 설정된 정체성과 일치하는가.

#### 2. Vibe Alignment

출력의 정동 톤이 목표 벡터와 허용 범위 안에 있는가.

#### 3. Mode Switch Accuracy

상황별로 적절한 모드가 작동하는가.

#### 4. Evidence Discipline

근거 없는 단정이 줄어드는가.

#### 5. Boundary Compliance

금기 영역과 민감 질문에서 경계를 지키는가.

#### 6. Floor Risk

최악 응답에서 사고가 날 수 있는 패턴이 있는가.

#### 7. Drift

반복 실행, 시간 경과, 언어권 변화에 따라 페르소나가 변질되는가.

#### 8. Human Agreement

사람 평정자와 Judge 평가가 어느 정도 일치하는가.

### 9.2 평가 방식

- 동일 질문 5회 반복
- 모드별 QBS 실행
- 위기 질문 스트레스 테스트
- Recall Probe로 자동 연상 구조 탐색
- Judge 패널 평가
- 인간 평정자와 일치도 비교
- Baseline vs PersonaSpec-conditioned 비교

---

## 10. PersonaSpec과 Recall 기반 Cognitive Map의 결합

PersonaSpec은 설계 문서이고, Recall 기반 Cognitive Map은 표상 진단 도구다. 둘은 다음처럼 결합한다.

1. Recall Probe로 현재 LLM이 떠올리는 공적 페르소나의 자동 연상 구조를 측정한다.
2. 그 구조에서 원치 않는 연상, 위험 경로, 근거 공백, 톤 드리프트를 찾는다.
3. PersonaSpec을 설계하거나 수정한다.
4. PersonaSpec을 런타임 프롬프트/SSoT/Answer Card에 반영한다.
5. 같은 Recall Probe를 다시 실행해 연상 구조가 의도한 방향으로 바뀌었는지 측정한다.

즉, PersonaSpec은 **개입 설계**이고, Recall Map은 **개입 효과 측정**이다.

---

## 11. PersonaSpec과 Brand MRI의 결합

브랜드형 PersonaSpec에서는 Brand MRI가 핵심 평가 체계가 된다.

- **Baseline MRI**: 현재 답변 엔진이 브랜드를 어떻게 표상하는가
- **PersonaSpec/SSoT-conditioned MRI**: 의도된 페르소나를 제공했을 때 표상이 어떻게 바뀌는가
- **Δ 측정**: 합의 증가, 분산 감소, 최저점 리스크 감소, AEO 적합성 증가

이 방식은 GS25/GS리테일 PoC처럼 브랜드의 AEO/GEO 전략과 직접 연결된다.

---

## 12. 특허화 가능 포인트

### 12.1 파라미터화된 페르소나 사양 생성 방법

정체성, 증거, 판단정책, Vibe, 언어 DNA, 거버넌스, 모드 세트를 구조화하여 기계 실행 가능한 사양으로 생성하는 방법.

### 12.2 PersonaSpec 기반 런타임 모드 전환 방법

사용자 질문의 상황과 리스크를 판별해 페르소나의 하위 모드를 자동 선택하고 응답 규칙을 전환하는 방법.

### 12.3 PersonaSpec Eval Harness

QBS/Recall/Judge/사람 평정을 결합해 페르소나 충실도, 정동 정합성, 안전성, 드리프트를 평가하는 방법.

### 12.4 PersonaSpec 교정 루프

Baseline 표상과 PersonaSpec-conditioned 표상의 차이를 측정하고, 그 결과로 PersonaSpec 파라미터를 자동 또는 반자동으로 수정하는 방법.

### 12.5 공적 페르소나 안전 경계 관리 방법

공개정보 기반 공적 페르소나와 금지된 사적/민감 영역을 분리하고, 런타임에서 경계 위반을 감지·차단하는 방법.

---

## 13. 제품화 방향

### 13.1 Parametric Persona Studio

사용자가 인물/브랜드/기관을 입력하면 PersonaSpec을 생성하고, Vibe 값과 모드 세트를 조정하며, 테스트 대화를 실행할 수 있는 제품.

### 13.2 Brand Persona MRI

브랜드의 현재 LLM 표상과 의도된 PersonaSpec 간 차이를 측정하는 서비스.

### 13.3 Public Figure Persona Lab

아티스트, 정치인, 창업자, 학자 등 공적 인물의 공개 기반 페르소나를 연구·콘텐츠·교육 목적으로 안전하게 시뮬레이션하는 도구.

### 13.4 Persona Eval Harness SaaS

페르소나 충실도, 안전성, 정동 정합성, 모드 전환 정확도를 자동 평가하는 SaaS.

### 13.5 AEO Persona Optimizer

Answer Engine에서 브랜드가 원하는 공적 페르소나로 표상되도록 SSoT, Answer Card, 보도자료, 외부 근거를 추천하는 최적화 시스템.

---

## 14. 윤리 원칙

Parametric PersonaSpec OS는 다음 윤리 원칙을 따른다.

1. **공적 정보 우선 원칙**  
   공적 인물 또는 브랜드의 페르소나는 공개 정보와 공식 근거를 중심으로 구성한다.

2. **민감 추정 금지 원칙**  
   건강, 사생활, 정치 성향, 연애, 가족관계, 범죄 의혹 등은 확인되지 않은 경우 다루지 않는다.

3. **시뮬레이션 명시 원칙**  
   특정 인물 자체가 아니라, 공적 자료 기반 시뮬레이션임을 명시한다.

4. **경계 우선 원칙**  
   위기나 민감 질문에서는 페르소나 몰입보다 안전 경계를 우선한다.

5. **측정 가능성 원칙**  
   페르소나는 생성만 하지 않고 반드시 평가·검증한다.

6. **버전 관리 원칙**  
   PersonaSpec은 변경 이력, 근거 업데이트, 평가 결과를 함께 관리한다.

---

## 15. 향후 작업 로드맵

### Phase 1. 문서 표준화

- PersonaSpec OS v1.0 문서 확정
- YAML/JSON 스키마 확정
- TASKFLOW 런타임 프롬프트 확정

### Phase 2. 데모 구축

- 아이유 공적 페르소나 PersonaSpec 샘플
- GS25 브랜드 페르소나 PersonaSpec 샘플
- 문화강국네트워크 기관 페르소나 샘플

### Phase 3. Eval Harness 구축

- QBS 30
- Recall Probe 24
- Judge 프롬프트
- 사람 평정 루브릭

### Phase 4. 제품화

- Parametric Persona Studio PRD
- Persona Eval Dashboard
- PersonaSpec Registry
- PromptOps/AgentOps 연계

### Phase 5. 특허/논문

- 방법 발명 포트폴리오
- 심리학회 논문
- AEO/GEO 브랜드 표상 연구
- K-culture 공적 페르소나 연구

---

## 16. 최종 요약

Parametric PersonaSpec OS v1.0은 다음을 가능하게 한다.

- 페르소나를 감이 아니라 구조로 설계한다.
- 정체성, 정동, 판단정책, 언어 DNA, 거버넌스를 분리한다.
- 공적 페르소나와 민감 추정을 명확히 구분한다.
- 팬/언론/위기/교육/고객 등 상황별 모드를 전환한다.
- QBS, Recall Probe, Judge, 인간평정으로 페르소나를 검증한다.
- Brand MRI와 결합해 브랜드 표상을 측정·교정한다.
- AEO/GEO, 교육, K-culture, 기관 브랜딩, 에이전트 제품화에 활용할 수 있다.

따라서 이 OS의 핵심 선언문은 다음과 같다.

> **페르소나는 프롬프트의 장식이 아니라, 측정 가능하고 조절 가능하며 검증 가능한 인지·정동·거버넌스 사양서다.**

---

## Appendix A. Minimal PersonaSpec Template

```yaml
persona_meta:
  persona_id: ""
  persona_name: ""
  version: "1.0.0"
  scope: ""
identity_layer:
  one_line_definition: ""
  public_roles: []
  core_themes: []
authority_evidence_layer:
  evidence_policy:
    priority_order: ["A_official", "B_major_media", "C_secondary"]
  disallowed_claim_types: []
decision_policy_layer:
  default_answer_sequence: []
  tradeoffs:
    accuracy: 0.8
    warmth: 0.6
    risk_aversion: 0.8
vibe_layer:
  target_vector:
    valence: 0.6
    arousal: 0.4
    dominance: 0.5
    warmth: 0.7
    competence: 0.8
    formality: 0.6
  tolerance_band: {}
language_dna_layer:
  sentence_style: []
  preferred_phrases: []
  avoided_phrases: []
governance_layer:
  taboo_topics: []
  boundary_rules: []
mode_set_layer:
  modes: []
measurement_hooks_layer:
  judge_metrics: []
```

---

## Appendix B. PersonaSpec Runtime Checklist

- [ ] 이 페르소나는 누구/무엇을 대표하는가
- [ ] 공적 범위와 금지 범위가 구분되어 있는가
- [ ] 근거 등급 정책이 있는가
- [ ] Vibe target vector가 설정되어 있는가
- [ ] 상황별 mode가 있는가
- [ ] 위기/민감 질문 처리 규칙이 있는가
- [ ] QBS로 테스트 가능한가
- [ ] Recall Probe로 연상 구조를 측정할 수 있는가
- [ ] Judge 평가 스키마가 있는가
- [ ] 버전 관리와 업데이트 규칙이 있는가
