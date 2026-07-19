# BSW-OS + Media Service 통합 수익 모델 MECE 분석

> BSW-OS Answer Supply Chain + aihompy 콘텐츠 운영 SaaS + 미디어 파트너십
> 전체 자산을 통합하여 MECE 프레임워크로 수익 모델 발산

---

## 보유 자산 인벤토리

수익 모델 도출의 전제: **우리가 이미 가지고 있는 것**

### BSW-OS (bsw 프로젝트)

| 자산 | 모듈 수 | 수익화 가능 가치 |
|------|:------:|---------------|
| Signal Collection 파이프라인 | 16개 | 질문 발견 + 트렌드 분석 |
| Answer Supply Chain | 11개 | 답변 자산 생산 |
| Governance (Evidence/Safety/Claim) | 6개 | 검증/인증 체계 |
| Domain Pack (skincare/jeju 등) | 8개 | 산업별 즉시 가동 |
| Observatory Probe | 포함 | AI 엔진 비교 분석 |
| Citation Tracker | 포함 | 성과 추적 |
| JSON-LD / llms.txt / hreflang | 포함 | AI 유통 인프라 |

### aihompy (aihompyhub 프로젝트)

| 자산 | 구현 | 수익화 가능 가치 |
|------|------|---------------|
| **Turnkey Engine** | `turnkey-engine.ts` (145KB) | 원클릭 웹사이트 생성 |
| **SEO Audit Engine** | `seo-audit-engine.ts` + `seo-remediation-engine.ts` | SEO 진단+자동 교정 |
| **Vibe OS** (DNA/Match/Lab/Tune) | `/vibe-*` 라우트 6개 | 브랜드 정체성 AI 분석 |
| **DealCard Engine** | `packages/dealcard-engine/` | 프로모션 카드 생성 |
| **Visual Intelligence** | `packages/visual-intelligence/` + `vibeMatch.ts` | 비주얼 분석/매칭 |
| **Pulse Engine** | `pulseEngine.ts` + `beauty-pulse/` 등 | 시장 트렌드 분석 |
| **AI Hub / Writer Hub** | `/ai-hub`, `/writer-hub` 라우트 | 콘텐츠 생성/관리 |
| **Media Hub** | `/media-hub` 라우트 | 미디어 자산 관리 |
| **Hub Factory** | `/hub-factory` 라우트 | 허브 대량 생산 |
| **Storefront** (다국어) | `apps/storefront/` + i18n | 멀티 테넌트 스토어 |
| **Archetype System** | `archetypeDetector/Materializer/Variant` 등 12개 | 업종별 자동 맞춤 |
| **Ambassador / Community** | `/ambassador`, `community/` | 앰배서더/커뮤니티 |
| **Billing / Subscription** | `billing/`, `subscription/` | 결제 인프라 |
| **Tier Gate** | `tierGate.ts` | 상품 등급 관리 |
| **Clone Transform Engine** | `clone-transform-engine.ts` | 콘텐츠 복제/변형 |
| **Skin Check / Skin School** | `/skin-check`, `/skin-school` | 뷰티 특화 도구 |

### 미디어 파트너

| 파트너 | 가치 |
|--------|------|
| 뷰티경제 | 국내 업계 E-E-A-T 권위 + 브랜드 인맥 |
| BNT뉴스 | 글로벌 K-style 권위 + 다국어 채널 |

---

## MECE 프레임워크: 3축 매트릭스

```
축 1: 가치 레이어 (무엇을 파는가)
  L1. 콘텐츠 (Content)
  L2. 플랫폼/도구 (Platform/Tool)
  L3. 데이터/인텔리전스 (Data)
  L4. 인증/표준 (Certification)

축 2: 결제 모델 (어떻게 받는가)
  P1. 건별 거래 (Transaction)
  P2. 정기 구독 (Subscription)
  P3. 성과 연동 (Performance)

축 3: 고객 세그먼트 (누구에게 파는가)
  C1. 미디어/언론사
  C2. 브랜드/기업
  C3. 소상공인/자영업
  C4. 공공/지자체
```

**총 매트릭스: 4 x 3 x 4 = 48셀**
이 중 **실행 가능성 높은 22개 수익원**을 선별합니다.

---

## L1. 콘텐츠 레이어 수익 모델

> "답변 자산을 생산하여 직접 판매하거나 유통한다"

### R01. 스폰서드 앤서 (Sponsored Answer)

- 가치 체인: BSW-OS 파이프라인 -> 미디어 발행 -> AI Citation
- 결제: 건별 (CQ당 50~100만원) 또는 구독
- 고객: 브랜드
- 구현: BSW-OS 전 파이프라인

| 상품 | 단가 | 내용 |
|------|------|------|
| Basic (한국어 단일) | 50만원/CQ | 뷰티경제 1개 채널 발행 |
| Pro (한+영 동시) | 100만원/CQ | 뷰티경제 + BNT 동시 발행 |
| Burst (4 CQ 패키지) | 350만원 | 1개 주제 4개 질문 일괄 선점 |

### R02. AI 기사 콘텐츠 공급 (Media Content Supply)

- 가치 체인: BSW-OS -> 기사 초안 + JSON-LD + 이미지 자동 생성
- 결제: 월정액 구독
- 고객: 미디어/언론사
- 구현: AnswerAssetGenerator + AnswerMissionCompiler + CloneTransformEngine

| 상품 | 월 가격 | 내용 |
|------|:------:|------|
| Lite | 100만원 | 주 2편 초안 + JSON-LD |
| Standard | 250만원 | 주 5편 + JSON-LD + 이미지 |
| Enterprise | 500만원 | 무제한 + 전용 도메인 Pack |

### R03. 턴키 Answer Page (원클릭 랜딩)

- 가치 체인: CQ 입력 -> aihompy Turnkey Engine -> SEO/AEO 최적화 페이지 자동 생성
- 결제: 건별
- 고객: 브랜드 + 소상공인
- 구현: turnkey-engine.ts + AnswerPageCompiler + json-ld-factory.ts

| 상품 | 단가 | 내용 |
|------|------|------|
| Answer Landing | 30만원/페이지 | CQ 1개 -> 랜딩 페이지 1개 자동 생성 |
| Answer Hub (5P) | 120만원 | 5개 CQ -> 내부 링크 연결된 미니 허브 |
| Answer Hub (20P) | 400만원 | 20개 CQ -> 풀 허브 + 사이트맵 + llms.txt |

### R04. DRO 콘텐츠 에셋 패키지

- 가치 체인: BSW-OS DRO(Digital Readiness Optimization) 자산 일괄 생성
- 결제: 건별 패키지
- 고객: 브랜드 + 소상공인
- 구현: dro-migration.ts + answer-asset-generator.ts

| 패키지 | 단가 | 내용 |
|--------|------|------|
| DRO Starter | 50만원 | FAQ 10개 + JSON-LD + llms.txt |
| DRO Pro | 150만원 | FAQ 30개 + 답변 페이지 + 사이트맵 |
| DRO Enterprise | 500만원 | 전 카테고리 커버 + 다국어 |

### R05. 앰배서더 콘텐츠 프로그램

- 가치 체인: aihompy Ambassador 시스템 -> 인플루언서 UGC 수집 -> BSW-OS 검증 -> AI 최적화
- 결제: 프로그램 운영비 + 성과 연동
- 고객: 브랜드
- 구현: ambassador/ + contentAuthority.ts + ValidatorGuild

| 상품 | 가격 | 내용 |
|------|------|------|
| Ambassador Program | 300만원/월 | 앰배서더 5명 매칭 + UGC 수집 + AEO 변환 |

---

## L2. 플랫폼/도구 레이어 수익 모델

> "도구와 인프라를 서비스로 제공한다"

### R06. aihompy SaaS (턴키 웹사이트)

- 가치 체인: aihompy Turnkey Engine -> 원클릭 AEO 최적화 웹사이트
- 결제: 월정액 구독
- 고객: 소상공인 + 브랜드
- 구현: turnkey-engine.ts (145KB) + Archetype System + Storefront

| 플랜 | 월 가격 | 내용 |
|------|:------:|------|
| Starter | 5만원 | 기본 웹사이트 + SEO 기본 + JSON-LD 자동 |
| Growth | 15만원 | + AEO 최적화 + llms.txt + DealCard |
| Pro | 30만원 | + Vibe OS + AI Hub + 다국어(영) |
| Enterprise | 100만원 | + 전용 도메인 + API + 무제한 |

### R07. Brand MRI (AI 가시성 진단)

- 가치 체인: Observatory Probe + SEO Audit Engine -> 브랜드 AI 노출 정밀 진단
- 결제: 건별 리포트 + 구독 모니터링
- 고객: 브랜드
- 구현: signal-performance-tracker.ts + seo-audit-engine.ts + seo-remediation-engine.ts

| 상품 | 가격 | 내용 |
|------|------|------|
| MRI Snapshot | 50만원 (1회) | 현재 AI 5개 엔진 노출 현황 + 경쟁사 비교 |
| MRI Monthly | 30만원/월 | 월간 변동 추적 + Alert |
| MRI Quarterly | 80만원/분기 | 분기 리포트 + 전략 제안 + 교정 가이드 |

### R08. Vibe OS (브랜드 정체성 AI)

- 가치 체인: Vibe DNA 분석 -> Vibe Match -> Vibe Tune -> Vibe Lab
- 결제: 구독 (SaaS 기능)
- 고객: 브랜드 + 소상공인
- 구현: vibe-dna/ + vibeMatch.ts + vibe-lab/ + vibe-tune/ + vibeTheory.ts

| 상품 | 가격 | 내용 |
|------|------|------|
| Vibe Audit (1회) | 20만원 | 브랜드 바이브 분석 리포트 |
| Vibe OS Monthly | 10만원/월 | 바이브 모니터링 + 경쟁사 비교 + Tune 추천 |
| Vibe Challenge | 5만원/회 | 소비자 참여형 바이브 투표 캠페인 |

### R09. DealCard Engine (프로모션 자동화)

- 가치 체인: DealCard 생성 -> AEO 최적화 프로모 카드 -> 다채널 배포
- 결제: 건별 + 구독
- 고객: 소상공인 + 브랜드
- 구현: packages/dealcard-engine/ + vibe-dealcard/

| 상품 | 가격 | 내용 |
|------|------|------|
| DealCard Lite | 무료 (Freemium) | 월 3장 생성 |
| DealCard Pro | 5만원/월 | 무제한 + A/B 테스트 + 성과 추적 |
| DealCard API | 20만원/월 | API 연동 + 자동 갱신 |

### R10. Hub Factory (허브 대량 생산)

- 가치 체인: Hub Factory -> 업종/지역별 허브 사이트 대량 프로비저닝
- 결제: 건별 (프랜차이즈/체인 대상)
- 고객: 프랜차이즈 본사 + 지자체
- 구현: hub-factory/ + turnkey-engine.ts + Archetype System

| 상품 | 가격 | 내용 |
|------|------|------|
| 10개 허브 팩 | 200만원 | 프랜차이즈 10개 지점 일괄 생성 |
| 50개 허브 팩 | 800만원 | 지자체 관내 50개 소상공인 일괄 |
| 커스텀 | 협의 | 100+ 대규모 |

### R11. Writer Hub + AI Copilot (콘텐츠 운영 도구)

- 가치 체인: Writer Hub 에디터 + AI Copilot + Clone Transform Engine
- 결제: 구독
- 고객: 미디어/언론사 + 브랜드 마케팅팀
- 구현: writer-hub/ + copilot/ + clone-transform-engine.ts

| 플랜 | 월 가격 | 내용 |
|------|:------:|------|
| Writer | 10만원 | AI 보조 에디터 + SEO 제안 |
| Editor | 30만원 | + Clone/Transform + 다국어 변환 |
| Newsroom | 100만원 | + 팀 관리 + 발행 워크플로우 + API |

### R12. SEO to AEO 전환 도구 (Remediation SaaS)

- 가치 체인: SEO Audit -> 개선 항목 도출 -> AEO 자동 교정
- 결제: 구독
- 고객: 브랜드 + 에이전시
- 구현: seo-audit-engine.ts + seo-remediation-engine.ts + seo-audit-registry.ts

| 플랜 | 월 가격 | 내용 |
|------|:------:|------|
| Audit Only | 20만원 | 월간 SEO/AEO 진단 리포트 |
| Audit + Fix | 50만원 | 진단 + JSON-LD/llms.txt 자동 교정 |
| Full Service | 150만원 | 진단 + 교정 + 콘텐츠 개선 + 모니터링 |

---

## L3. 데이터/인텔리전스 레이어 수익 모델

> "시그널과 분석 결과를 판매한다"

### R13. Q-Intelligence (질문 트렌드 리포트)

- 가치 체인: Signal Collection 10채널 -> 클러스터링 -> 트렌드 분석 리포트
- 결제: 구독
- 고객: 브랜드 마케팅팀 + 미디어
- 구현: orchestrator.ts + volume-estimator.ts + exploratory-chain.ts

| 플랜 | 월 가격 | 내용 |
|------|:------:|------|
| Industry Pulse | 50만원 | 업종별 월간 질문 트렌드 TOP 50 |
| Brand Pulse | 100만원 | 자사 브랜드 관련 질문 전수 분석 |
| Competitive Pulse | 200만원 | 경쟁사 비교 + Answer Gap 분석 |

### R14. Answer Gap Intelligence (AI 공백 지도)

- 가치 체인: Observatory Probe -> 5개 AI 답변 비교 -> 공백/오답 맵핑
- 결제: 구독 또는 건별 리포트
- 고객: 브랜드 + 에이전시 + 미디어
- 구현: signal-performance-tracker.ts + Observatory Probe

| 상품 | 가격 | 내용 |
|------|------|------|
| Gap Snapshot | 30만원 (1회) | 특정 카테고리 AI 공백 20개 발굴 |
| Gap Monitor | 50만원/월 | 지속 모니터링 + 신규 공백 알림 |
| Gap + Action | 100만원/월 | 공백 발굴 + 선점 콘텐츠 자동 생성 |

### R15. Beauty Pulse / Trend Pulse (시장 인텔리전스)

- 가치 체인: Pulse Engine + Beauty Pulse + Trend Pulse -> 시장 동향 분석
- 결제: 구독
- 고객: 브랜드 + 유통사 + 투자사
- 구현: pulseEngine.ts + beauty-pulse/ + trend-pulse/

| 플랜 | 월 가격 | 내용 |
|------|:------:|------|
| Pulse Basic | 30만원 | 주간 트렌드 다이제스트 |
| Pulse Pro | 80만원 | + 성분/카테고리별 분석 + 예측 |
| Pulse Enterprise | 200만원 | + 커스텀 리서치 + API |

### R16. Citation Performance Data (성과 데이터)

- 가치 체인: Citation Tracker -> AI 인용 패턴 분석 -> 벤치마크 데이터
- 결제: 성과 연동 또는 데이터 구독
- 고객: 브랜드 + 에이전시
- 구현: signal-performance-tracker.ts + Citation Tracker

| 상품 | 가격 | 내용 |
|------|------|------|
| Citation Alert | 무료 | 자사 인용 알림만 |
| Citation Analytics | 30만원/월 | 인용 추이 + 경쟁사 비교 |
| Citation ROI | 성과 연동 | Citation 1건당 10만원 |

---

## L4. 인증/표준 레이어 수익 모델

> "검증 체계를 브랜드 자산으로 판매한다"

### R17. Trust Seal (BSW 거버넌스 인증)

- 가치 체인: Evidence 6단계 + Safety Gate + Validator Guild -> 인증 마크 발급
- 결제: 연간 인증료
- 고객: 브랜드
- 구현: evidence-registry.ts + safety-gate.ts + validator-guild.ts

| 등급 | 연간 가격 | 기준 |
|------|:--------:|------|
| Bronze | 100만원 | Evidence Level 3+ / Safety SAFE |
| Silver | 250만원 | Evidence Level 2+ / 3개 AI Citation |
| Gold | 500만원 | Evidence Level 1 / 5개+ AI Citation + 다국어 |

### R18. K-Verified (한류 원산지 인증)

- 가치 체인: BNT 한국 현지 미디어 + BSW-OS 거버넌스 -> "한국산 정보" 인증
- 결제: 연간 인증료
- 고객: 글로벌 K-beauty 브랜드
- 구현: evidence-registry.ts + hreflang-manager.ts

| 상품 | 연간 가격 | 내용 |
|------|:--------:|------|
| K-Verified Badge | 200만원 | 한류 원산지 검증 마크 + BNT 영문 기사 |

### R19. AEO Readiness Certification (AEO 준비도 인증)

- 가치 체인: SEO Audit Engine + Observatory -> 웹사이트 AEO 준비도 평가 -> 인증서
- 결제: 건별 평가 + 연간 갱신
- 고객: 브랜드 + 에이전시
- 구현: seo-audit-engine.ts + Observatory Probe

| 상품 | 가격 | 내용 |
|------|------|------|
| AEO Assessment | 50만원 (1회) | 현재 AEO 준비도 점수 + 개선 로드맵 |
| AEO Certification | 150만원/년 | 인증서 발급 + 분기 갱신 심사 |

---

## 추가 수익원 (교차/파생)

### R20. 교육/아카데미

- 가치 체인: 축적된 AEO 노하우 -> 온라인 코스 + 워크숍
- 결제: 건별 + 구독
- 고객: 마케터 + 에이전시 + 미디어 실무자

| 상품 | 가격 | 내용 |
|------|------|------|
| AEO 마스터클래스 (온라인) | 50만원 | 8주 코스 |
| 브랜드 워크숍 (오프라인) | 200만원/회 | 4시간 실습 워크숍 |
| 에이전시 파트너 프로그램 | 500만원/년 | BSW-OS 리셀러 인증 + 교육 + 도구 접근 |

### R21. Skin Check / Skin School (뷰티 특화)

- 가치 체인: AI 피부 분석 -> 성분 교육 -> 제품 추천 (커머스 연결)
- 결제: Freemium + 제휴 커미션
- 고객: 소비자 (B2C) -> 브랜드 리드 전환
- 구현: skin-check/ + skin-school/

| 상품 | 가격 | 내용 |
|------|------|------|
| Skin Check | 무료 | AI 피부 분석 (트래픽 유입) |
| Skin School | 무료 | 성분 교육 콘텐츠 (SEO 유입) |
| 제품 추천 커미션 | CPA 기반 | 분석 결과 -> 제품 추천 -> 구매 시 커미션 |

### R22. Place Hub (지역 소상공인 SaaS)

- 가치 체인: aihompy Storefront + BSW-OS 지역 Pack -> K-Place Hub
- 결제: 구독 (B2B2C)
- 고객: 소상공인 + 지자체
- 구현: place/ + storefront/ + jeju-context-travel Pack

| 플랜 | 월 가격 | 내용 |
|------|:------:|------|
| Place Basic | 5만원 | 장소 페이지 + JSON-LD + 기본 CQ 3개 |
| Place Pro | 15만원 | + AI 성적표 + CQ 10개 + DealCard |
| Place Premium | 30만원 | + 다국어 + 풀 AEO + 전담 매니저 |

---

## 수익 매트릭스 전체 조감

```
              | Transaction(건별) | Subscription(구독) | Performance(성과) |
--------------+-------------------+--------------------+-------------------+
L1.콘텐츠     | R01 스폰서드 앤서  | R02 기사 공급       | R16 Citation ROI  |
              | R03 턴키 Answer   | R05 앰배서더        |                   |
              | R04 DRO 패키지    |                    |                   |
--------------+-------------------+--------------------+-------------------+
L2.플랫폼     | R10 Hub Factory   | R06 aihompy SaaS   |                   |
              |                   | R07 Brand MRI      |                   |
              |                   | R08 Vibe OS        |                   |
              |                   | R09 DealCard       |                   |
              |                   | R11 Writer Hub     |                   |
              |                   | R12 SEO->AEO 전환  |                   |
--------------+-------------------+--------------------+-------------------+
L3.데이터     | R14 Gap Snapshot  | R13 Q-Intelligence | R16 Citation 연동  |
              |                   | R14 Gap Monitor    |                   |
              |                   | R15 Beauty Pulse   |                   |
--------------+-------------------+--------------------+-------------------+
L4.인증       | R19 AEO 평가      | R17 Trust Seal     |                   |
              |                   | R18 K-Verified     |                   |
              |                   | R19 AEO 인증       |                   |
--------------+-------------------+--------------------+-------------------+
교차/파생     | R20 워크숍        | R20 아카데미        | R21 Skin 커미션    |
              |                   | R22 Place Hub      |                   |
```

---

## 고객 세그먼트별 상품 매핑

### C1. 미디어/언론사

| 상품 | 가치 제안 |
|------|----------|
| R02 기사 공급 | "AI가 인용하는 기사를 우리가 초안까지 만들어드립니다" |
| R11 Writer Hub | "AEO 최적화 에디터 + 발행 워크플로우" |
| R14 Gap Intelligence | "AI 공백을 찾아 기사 주제로 추천" |

### C2. 브랜드/기업

| 상품 | 가치 제안 |
|------|----------|
| R01 스폰서드 앤서 | "AI에게 물으면 귀사가 추천되게 만듭니다" |
| R07 Brand MRI | "AI 5개 엔진에서 귀사가 어떻게 보이는지 진단" |
| R12 SEO->AEO 전환 | "기존 웹사이트를 AI 친화적으로 전환" |
| R13 Q-Intelligence | "소비자가 AI에게 무엇을 묻는지 알려드립니다" |
| R17 Trust Seal | "검증된 정보라는 인증 마크" |

### C3. 소상공인/자영업

| 상품 | 가치 제안 |
|------|----------|
| R06 aihompy SaaS | "월 5만원으로 AI가 추천하는 가게 웹사이트" |
| R09 DealCard | "프로모션 카드 자동 생성" |
| R22 Place Hub | "AI에게 물으면 내 가게가 나오게" |

### C4. 공공/지자체

| 상품 | 가치 제안 |
|------|----------|
| R10 Hub Factory | "관내 소상공인 50개 웹사이트 일괄 생성" |
| R22 Place Hub | "우리 지역 관광지가 AI에서 제대로 답변되게" |
| R14 Gap Intelligence | "우리 지역의 AI 정보 공백 파악" |

---

## 실행 우선순위: 단기 / 중기 / 장기

### 즉시 (8월, Stage 1과 동시)

| # | 상품 | 추가 개발 | 예상 수익 |
|---|------|:--------:|----------|
| R01 | 스폰서드 앤서 | 없음 | CQ당 50~100만 |
| R06 | aihompy SaaS Starter | 최소 (가격 페이지만) | 월 5만/사 |
| R07 | Brand MRI Snapshot | Observatory UI만 | 건당 50만 |
| R21 | Skin Check (무료) | 없음 (구현됨) | 트래픽 유입 |

### 중기 (Q4, Stage 2)

| # | 상품 | 추가 개발 | 예상 수익 |
|---|------|:--------:|----------|
| R02 | 기사 공급 | 템플릿 + API | 월 100~500만/사 |
| R03 | 턴키 Answer Page | 랜딩 빌더 | 건당 30~400만 |
| R09 | DealCard Pro | 빌링 연동 | 월 5만/사 |
| R12 | SEO->AEO 전환 | Remediation UI | 월 20~150만/사 |
| R13 | Q-Intelligence | 리포트 자동화 | 월 50~200만/사 |
| R17 | Trust Seal | 인증 워크플로우 | 연 100~500만/사 |

### 장기 (2027, Stage 3~4)

| # | 상품 | 추가 개발 | 예상 수익 |
|---|------|:--------:|----------|
| R10 | Hub Factory | 대량 프로비저닝 | 건당 200~800만 |
| R11 | Writer Hub Newsroom | 팀 기능 | 월 100만/사 |
| R14 | Gap Intelligence | 자동화 파이프라인 | 월 30~100만/사 |
| R15 | Beauty/Trend Pulse | 데이터 수집 강화 | 월 30~200만/사 |
| R18 | K-Verified | BNT 연동 | 연 200만/사 |
| R19 | AEO Certification | 평가 프레임워크 | 건당 50만 + 연 150만 |
| R20 | 아카데미 | 커리큘럼 | 건당 50~500만 |
| R22 | Place Hub | K-Place Hub 연동 | 월 5~30만/사 |

---

## 수익 시뮬레이션 (안정화 후, 월간)

| 레이어 | 주요 수익원 | 월 매출 |
|--------|-----------|:------:|
| L1. 콘텐츠 | R01 스폰서드 앤서 (5사 x 100만) | 500만원 |
| | R02 기사 공급 (3사 x 250만) | 750만원 |
| | R03 턴키 Answer (월 5건 x 120만) | 600만원 |
| L2. 플랫폼 | R06 aihompy SaaS (200사 x 10만 평균) | 2,000만원 |
| | R07 Brand MRI (20사 x 30만) | 600만원 |
| | R09 DealCard (100사 x 5만) | 500만원 |
| | R11 Writer Hub (10사 x 30만) | 300만원 |
| | R12 SEO->AEO (15사 x 50만) | 750만원 |
| L3. 데이터 | R13 Q-Intelligence (10사 x 100만) | 1,000만원 |
| | R15 Pulse (5사 x 80만) | 400만원 |
| L4. 인증 | R17 Trust Seal (20사 x 250만 / 12) | 420만원 |
| 교차 | R22 Place Hub (300사 x 10만) | 3,000만원 |
| | R20 아카데미 + R21 커미션 | 200만원 |
| **합계** | | **~11,020만원/월** |
| **연간** | | **~13.2억원** |

### K-Place Hub 전국 확장 시

| 추가 수익 | 월 매출 |
|----------|:------:|
| 17개 광역 x Place Hub | +10,000만원 |
| 지자체 계약 | +3,000만원 |
| **전국 확장 합산** | **~24,000만원/월** |
| **연간** | **~28.8억원** |

### 최종 합산

```
전문 미디어 + 브랜드 서비스:  ~13억/년
K-Place Hub 전국 확장:       ~29억/년
------------------------------
총 잠재 매출:               ~42억/년
```
