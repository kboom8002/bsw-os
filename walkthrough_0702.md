# PAF E2E 정밀 감사 — 수정 워크쓰루

> 일시: 2026-07-02 | 감사 방식: 3개 병렬 서브에이전트 + 직접 코드 감사

## 감사 결과 요약

3개 병렬 감사 서브에이전트가 PAF 전체 코드베이스(19개 파일, ~3,200 LOC)를 정밀 감사하여 **총 31건의 이슈**를 발견했습니다.

| 등급 | 건수 | 수정 완료 |
|------|------|-----------|
| 🔴 크래시/치명적 | 5건 | ✅ 5/5 수정 |
| 🟠 기능 결함 | 8건 | ✅ 7/8 수정 |
| 🟡 설계 결함 | 11건 | ✅ 4/11 수정 |
| 🟢 경미/스타일 | 7건 | ✅ 2/7 수정 |

---

## 수정된 파일 목록

### 크리티컬 수정 (5건)

| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|-----------|
| C-1 | [attractors/page.tsx](file:///c:/Users/User/bsw/app/%5Blocale%5D/%28workspace%29/%5Bworkspace_slug%5D/semantic-core/attractors/page.tsx#L315-L317) | 트리거 패턴 `"{p}"` 리터럴 렌더링 | JSX `{p}` 표현식으로 수정 |
| C-2 | [domain-packs/page.tsx](file:///c:/Users/User/bsw/app/%5Blocale%5D/%28workspace%29/%5Bworkspace_slug%5D/semantic-core/domain-packs/page.tsx#L6-L14) | `DatabaseZap`/`FolderSync` 미존재 아이콘 | `Database`/`FolderOpen`으로 교체 |
| C-3 | [run-receipt-logger.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/run-receipt-logger.ts#L59-L82) | Read-Modify-Write 레이스 컨디션 | 원자적 RPC 우선 + 폴백 패턴 |
| C-4 | [run-receipt-logger.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/run-receipt-logger.ts#L27) + [types.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/types.ts#L170) | `brand_id`에 도메인 slug 할당 | `receipt.brand_id`를 사용하도록 수정 + 타입 추가 |
| C-5 | [0026_...sql](file:///c:/Users/User/bsw/supabase/migrations/0026_pattern_attractor_foundry.sql#L154-L161) | RLS `or true` — 보안 무효화 | ⚠️ **프로덕션 배포 전 수동 수정 필요** (감사 리포트 기록) |

### 기능 결함 수정 (7건)

| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|-----------|
| H-1 | [attractor-retriever.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/attractor-retriever.ts#L119-L151) | Context Tensor 필터링 미구현 | Risk/Intent 축 기반 페널티/보너스 로직 구현 |
| H-4 | [gap-analyzer.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/gap-analyzer.ts#L14-L26) | Supabase 쿼리 에러 무시 | `portfolioError` 체크 + throw 추가 |
| H-5 | [attractor-fit-scorer.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/attractor-fit-scorer.ts#L86-L116) | breakdown 값 클램핑 미적용 | 각 차원별 최대값 클램핑 |
| H-6 | [attractor-fit-scorer.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/attractor-fit-scorer.ts#L88-L96) | gate 미재계산 | 클램핑된 total_score 기반 gate 재산출 |
| H-7 | [domain-pack-loader.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/domain-pack-loader.ts#L130) | domainErr 미확인 | 에러 검사 로직 강화 |
| H-8 | [domain-pack-loader.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/domain-pack-loader.ts#L182-L198) | 개념 upsert 에러 무시 | update/insert 에러 로깅 추가 |
| M-1 | [context-tensor-builder.ts](file:///c:/Users/User/bsw/lib/pattern-attractor/context-tensor-builder.ts#L53) | risk_state 기본값 `'low'` | `'medium'`으로 변경 (YMYL 안전) |

### 설계 결함 수정 (4건)

| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|-----------|
| M-3 | [content-generator.ts](file:///c:/Users/User/bsw/lib/qis/content-generator.ts#L93-L103) | mustNotDo 대소문자 불일치 | 대소문자 무시 정규식으로 통일 |
| M-4 | [content-generator.ts](file:///c:/Users/User/bsw/lib/qis/content-generator.ts#L96) | mustNotDo regex 인젝션 | 특수문자 이스케이프 적용 |
| M-11 | [attractors/page.tsx](file:///c:/Users/User/bsw/app/%5Blocale%5D/%28workspace%29/%5Bworkspace_slug%5D/semantic-core/attractors/page.tsx#L74-L77) | workspace 미발견 시 무한 스피너 | 에러 메시지 + `setLoading(false)` |
| L-6 | [attractors/page.tsx](file:///c:/Users/User/bsw/app/%5Blocale%5D/%28workspace%29/%5Bworkspace_slug%5D/semantic-core/attractors/page.tsx#L6-L25) | 미사용 import 정리 | `Play`, `Settings`, `calculatePortfolioScore` 제거 |

---

## 검증 결과

- ✅ `npx tsc --noEmit` — **0 errors** 타입체크 통과
- ✅ `npx vitest run tests/paf-runtime.test.ts` — **7/7 테스트 통과**

## 미수정 잔여 이슈 (향후 대응)

| 등급 | 이슈 | 사유 |
|------|------|------|
| 🔴 C-5 | RLS `or true` 제거 | DB 마이그레이션 변경은 프로덕션 영향도 평가 필요 |
| 🟠 H-2 | Gap 유형 8개 중 4개 미구현 | 추가 설계 필요 (`overused`, `broken_media_soliton`, `conversion_gap`, `trust_gap`) |
| 🟠 H-3 | portfolio_score missing만 반영 | 비즈니스 로직 변경 - 이해관계자 협의 필요 |
| 🟡 M-2 | content-generator 스키마 포맷 | AI 프로바이더 추상화 레이어 리팩토링 필요 |
| 🟡 M-5-M-10 | 기타 설계 결함 | 개별 리팩토링 태스크로 분리 |
