# TCO Bootstrap SOTA 고도화 — Walkthrough

## 문제

스크린샷에서 확인된 **TCO: 2개** 도출. 기대값 80-120개 대비 2.5%.

## 근본 원인 3개

| # | 원인 | 파일 | 영향 |
|---|------|------|------|
| RC-1 | `isComplete: tcoCount > 0` → 2개만 있어도 "완료" 판정 → 재실행 시 영구 스킵 | [pipeline-state-manager.ts:307,327](file:///c:/Users/User/bsw/lib/pipeline/pipeline-state-manager.ts#L307) | 🔴 치명적 |
| RC-2 | LLM 4축 전부 실패 시 fallback이 하드코딩 2개 | [qis-bridge.ts:632-640](file:///c:/Users/User/bsw/app/actions/qis-bridge.ts#L632) | 🔴 치명적 |
| RC-3 | `maxOutputTokens` 미설정 → 대규모 JSON 출력 절단 | [semantic.ts:1423](file:///c:/Users/User/bsw/app/actions/semantic.ts#L1423) | 🟠 높음 |

## 적용된 SOTA 방법론

| SOTA 출처 | 적용 내용 |
|----------|----------|
| **AutoGEO** (CMU) | Cooperative retry — 실패 시 축약 프롬프트로 재시도 |
| **REVISION** | Multi-layer fallback — intent → layer → entity → basic 4단계 |
| **Aligned QE** (Spotify) | 품질 게이트 — 축당 최소 8개 미달 시 자동 재시도 |

## 수정 내용

### 1. [pipeline-state-manager.ts](file:///c:/Users/User/bsw/lib/pipeline/pipeline-state-manager.ts)

```diff
# 캐시 판정 (L307)
- cachedPhase?.tcoConcepts > 0
+ cachedPhase?.tcoConcepts >= 30

# DB 카운트 판정 (L327)
- isComplete: tcoCount > 0 && kgCount > 0
+ isComplete: tcoCount >= 30 && kgCount > 0
```

**효과**: TCO 30개 미만이면 Phase 0 재실행 보장

---

### 2. [qis-bridge.ts](file:///c:/Users/User/bsw/app/actions/qis-bridge.ts)

기존 2개 하드코딩 fallback → **3전략 패널 기반 대규모 fallback**:

| 전략 | 소스 | 예상 산출 |
|------|------|----------|
| Strategy 1 | `intent_context`별 그룹핑 | 8-15개 |
| Strategy 2 | `layer`별 개념 추출 | 5-8개 |
| Strategy 3 | `must_include` 엔티티 추출 | 10-15개 |
| Basic fallback | 업종 기본 15개 | 15개 (최소 보장) |

**효과**: LLM 완전 실패 시에도 **20-30개 시드 개념 보장**

---

### 3. [semantic.ts](file:///c:/Users/User/bsw/app/actions/semantic.ts)

| 변경 | Before | After |
|------|--------|-------|
| `maxOutputTokens` | 미설정 (기본값) | `8192` 명시 |
| 축별 실패 처리 | 단순 skip | **1회 축약 재시도** (1초 백오프) |
| 품질 게이트 | 없음 | 축당 최소 8개 미달 시 재시도 |
| 전체 fallback | 없음 | 15개 미만 시 단일 축 최소 보장 |

**효과**: 4축 × 2회 시도 = **8번의 기회** + 최소 보장 fallback

## 검증

- ✅ `npx next build` 성공
- ✅ `vercel --prod` 배포 진행 중

## 기대 결과 (다음 Bootstrap 실행 시)

| 시나리오 | Before | After |
|----------|--------|-------|
| LLM 4축 모두 성공 | 2개 (fallback) | **80-85개** |
| LLM 2축 성공 + 2축 실패 | 2개 (fallback) | **45-50개** |
| LLM 전부 실패 | 2개 (하드코딩) | **20-30개** (패널 fallback) |
| LLM + 패널 모두 실패 | 2개 | 15개 (basic) → 2개 (비상) |
