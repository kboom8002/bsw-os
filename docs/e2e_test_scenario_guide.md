# E2E 테스트 시나리오 가이드 — jeju_smb 전체 순환

> **대상 환경**: 프로덕션  
> **BSW-OS**: `https://bsw-os.vercel.app` (또는 커스텀 도메인)  
> **AiHompyHub**: `https://admin.aihompy.kr` (또는 해당 프로덕션 도메인)  
> **Workspace Slug**: `demo-brand-semantic-lab`  
> **Domain Key**: `jeju_smb`  
> **Region**: `jeju`

---

## 전체 흐름 개요

```
Step 1: 사전 점검 (환경변수, DB 테이블)
  ↓
Step 2: E2E 파이프라인 실행 (질문 자산 수집)
  ↓
Step 3: 산출물 확인 (CQ, QIS Scene, Pipeline Run)
  ↓
Step 4: AI Hub Push 확인 (BSW → AiHompyHub 전송)
  ↓
Step 5: AiHompyHub 수신 확인 (인제스트 결과)
  ↓
Step 6: 역방향 피드백 수집 (AiHompyHub → BSW)
  ↓
Step 7: 피드백 환류 결과 확인 (신규 시그널 + CPS 보정)
```

---

## Step 1. 사전 점검

### 1.1 BSW-OS 환경변수 확인

Vercel 대시보드(Settings → Environment Variables)에서 다음 변수가 설정되어 있는지 확인:

| 변수 | 용도 | 필수 |
|---|---|:---:|
| `BSW_DOMAIN_KEYS` | `jeju_smb` 포함 | ✅ |
| `HUB_API_URL` 또는 `AIHOMPY_HUB_URL` | AiHompyHub API 주소 | ✅ (Push/Pull 시) |
| `BSW_HUB_INGEST_SECRET` | CQ/Scene Push 인증 시크릿 | ✅ (Push 시) |
| `HUB_FEEDBACK_SECRET` | 역방향 피드백 수신 인증 시크릿 | ✅ (피드백 수신 시) |
| `OPENAI_API_KEY` 또는 `GOOGLE_AI_API_KEY` | S-OGDE 시그널 생성 | ✅ |

> [!NOTE]
> **Hub URL이 없는 경우**: Push/Pull이 mock 모드로 동작합니다. 실제 연동 테스트를 하려면 반드시 설정해야 합니다.  
> **Hub URL이 있지만 AiHompyHub 측 미구현인 경우**: Push/Pull은 실패하지만, BSW 파이프라인의 Phase 0~3(질문 자산 수집)과 Phase 5(포화도 측정)는 정상 동작합니다.

### 1.2 DB 테이블 존재 확인

Supabase Dashboard에서 다음 테이블이 존재하는지 확인:

```
✅ workspaces              (workspace 해석용)
✅ question_signals         (Phase 1 시그널)
✅ canonical_questions      (Phase 3 CQ)
✅ qis_scenes               (Phase 3 QIS Scene)
✅ pipeline_runs            (실행 이력)
✅ hub_feedback_logs        (역방향 피드백 — 없으면 0035_hub_feedback.sql 실행)
```

### 1.3 Workspace ID 확인

```bash
# Supabase SQL Editor에서 실행
SELECT id, slug, name FROM workspaces WHERE slug = 'demo-brand-semantic-lab';
```

이 ID를 기록해 두세요. API 호출 시 내부적으로 사용됩니다.

---

## Step 2. E2E 파이프라인 실행 (질문 자산 수집)

### 방법 A: Cron API 직접 호출 (권장)

```bash
curl -X GET "https://<BSW_DOMAIN>/api/cron/qis-sync?phase=standalone" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

> [!TIP]
> `CRON_SECRET`이 설정되어 있지 않다면 인증 없이 호출 가능할 수 있습니다.  
> `phase=standalone`은 Hub 없이도 자체 파이프라인을 실행합니다.

### 방법 B: 관리자 UI에서 실행

1. BSW-OS → 워크스페이스 → **Semantic Core** → **Pipeline Artifacts** 접속
2. 도메인 선택: `🏝️ 제주 소상공인` (jeju_smb)
3. **실행 이력** 탭 확인 (이전 실행 결과가 있으면 참조)

### 방법 C: 브라우저에서 데모 페이지

```
https://<BSW_DOMAIN>/ko/demo-brand-semantic-lab/demo/jeju-smb
```

이 페이지에서 "E2E 파이프라인 실행" 버튼이 있다면 클릭.

### ✅ 검증 포인트

| 항목 | 예상 결과 |
|---|---|
| 응답 status | `200 OK` |
| `standaloneResults.jeju_smb.status` | `completed` |
| `standaloneResults.jeju_smb.signalsCollected` | `> 0` (보통 20~100건) |
| `standaloneResults.jeju_smb.cqCreated` | `> 0` (보통 5~30건) |

---

## Step 3. 산출물 확인

### 3.1 Pipeline Artifacts 대시보드

```
https://<BSW_DOMAIN>/ko/demo-brand-semantic-lab/semantic-core/pipeline-artifacts
```

각 탭을 순회하며 산출물 존재 여부를 확인:

| 탭 | 확인 항목 | 최소 기대치 |
|---|---|---|
| **질문 시그널** | source별 시그널 수 | 20+ 건 |
| **정규 질문(CQ)** | 승격된 CQ 목록, CPS 점수 | 5+ 건 |
| **QIS Scenes** | 생성된 Scene, risk_level, readiness_score | 2+ 건 |
| **실행 이력** | 최신 run의 status=completed, phase별 결과 | 1건 |

### 3.2 JSON 내보내기 API로 확인 (선택)

```bash
curl "https://<BSW_DOMAIN>/api/pipeline/export?workspace=demo-brand-semantic-lab&domain=jeju_smb&format=json" \
  -o bsw_export_jeju.json
```

파일을 열어 `questions[]`, `scenes[]`, `summary`를 확인합니다.

### ✅ 검증 포인트

| 항목 | 확인 |
|---|---|
| `questions[].text` | 한글 질문이 존재하는가 |
| `questions[].cps_score` | 숫자가 할당되어 있는가 |
| `scenes[].scene_name` | Scene 이름이 존재하는가 |
| `scenes[].must_do` | 빈 배열이 아닌가 |

---

## Step 4. AI Hub Push 확인 (BSW → AiHompyHub)

### 4.1 실행 이력에서 Phase 4 결과 확인

**Pipeline Artifacts → 실행 이력** 탭에서 최신 실행의 결과를 확인합니다.

```json
{
  "phase4_hubPush": {
    "pushed": true,          // ← true여야 정상
    "cqCount": 15,           // ← 전송된 CQ 수
    "sceneCount": 3,         // ← 전송된 Scene 수
    "arenaCreated": 2,       // ← Hub에서 생성된 Arena 수
    "errors": []             // ← 빈 배열이어야 정상
  }
}
```

### 4.2 Hub URL 미설정 시 예상 결과

```json
{
  "phase4_hubPush": {
    "pushed": false,
    "errors": ["Hub URL not configured"]
  }
}
```

> [!WARNING]
> `pushed: false`인 경우 AiHompyHub 측 수신 확인(Step 5)은 건너뜁니다.

### 4.3 수동 Push 확인 (선택)

```bash
# JSON 내보내기 파일을 AiHompyHub에 수동 전송
curl -X POST "https://<AIHOMPYHUB_DOMAIN>/api/v1/ai-hub/bsw/ingest" \
  -H "Content-Type: application/json" \
  -H "x-bsw-secret: <BSW_HUB_INGEST_SECRET>" \
  -d @bsw_export_jeju.json
```

### ✅ 검증 포인트

| 항목 | 조건 |
|---|---|
| `pushed` | `true` |
| `cqCount` | `> 0` |
| `errors` | `[]` (빈 배열) |

---

## Step 5. AiHompyHub 수신 확인

> [!IMPORTANT]
> 이 단계는 **AiHompyHub 측이 BSW_INTEGRATION_V2_GUIDE.md를 기반으로 구현을 완료한 경우**에만 테스트 가능합니다.

### 5.1 인제스트 상태 API

```bash
curl "https://<AIHOMPYHUB_DOMAIN>/api/v1/ai-hub/bsw/ingest?region=jeju" \
  -H "x-bsw-secret: <BSW_HUB_INGEST_SECRET>"
```

**예상 응답:**
```json
{
  "totalQuestions": 15,
  "bswSourced": 15,
  "lastIngestedAt": "2026-07-05T08:15:00Z"
}
```

### 5.2 Supabase에서 직접 확인 (AiHompyHub DB)

```sql
-- CQ 수신 확인
SELECT COUNT(*) FROM ai_hub_canonical_questions 
WHERE source = 'bsw_auto' AND hub_domain_id = '<jeju_hub_domain_id>';

-- Scene 수신 확인
SELECT COUNT(*) FROM ai_hub_qis_scenes
WHERE source = 'bsw_auto' AND hub_domain_id = '<jeju_hub_domain_id>';

-- 인제스트 로그
SELECT * FROM ai_hub_ingest_logs 
WHERE hub_domain_id = '<jeju_hub_domain_id>' 
ORDER BY created_at DESC LIMIT 5;
```

### ✅ 검증 포인트

| 항목 | 조건 |
|---|---|
| `ai_hub_canonical_questions` 행 수 | BSW에서 전송한 cqCount와 일치 |
| `ai_hub_qis_scenes` 행 수 | BSW에서 전송한 sceneCount와 일치 |
| `ai_hub_ingest_logs.status` | `success` 또는 `partial` |

---

## Step 6. 역방향 피드백 수집 (AiHompyHub → BSW)

### 6.1 방법 A: BSW 관리자 UI에서 수동 Pull (권장)

1. BSW-OS → Pipeline Artifacts → **역방향 피드백** 탭
2. 도메인: `🏝️ 제주 소상공인` 선택
3. **🔄 피드백 즉시 수집** 버튼 클릭
4. 결과 배너 확인:
   - ✅ "피드백 동기화 성공 — 신규 시그널 N건 수집 완료 / CQ 점수 N개 보정 완료"
   - ❌ "피드백 동기화 실패 — [에러 메시지]"

### 6.2 방법 B: Webhook API 직접 호출 (AiHompyHub Cron 시뮬레이션)

```bash
curl -X POST "https://<BSW_DOMAIN>/api/v1/feedback/ingest" \
  -H "Content-Type: application/json" \
  -H "x-hub-secret: <HUB_FEEDBACK_SECRET>" \
  -d '{
    "version": "1.0",
    "region": "jeju",
    "hub_domain_id": "test-uuid",
    "date": "2026-07-05",
    "workspace": "demo-brand-semantic-lab",
    "search_patterns": [
      {
        "query": "제주 해녀의부엌 웨이팅 시간",
        "tco": {"context": "웨이팅", "objective": "해녀의부엌"},
        "at_ctx": {},
        "matched_count": 5,
        "resolved": false
      },
      {
        "query": "비 오는 날 제주 아이랑 실내 카페",
        "tco": {"context": "비 오는 날", "objective": "실내 카페"},
        "at_ctx": {"weather": "비", "companion": "아이"},
        "matched_count": 3,
        "resolved": false
      },
      {
        "query": "제주 흑돼지 맛집 돈사돈 주차",
        "tco": {"context": "주차", "objective": "돈사돈"},
        "at_ctx": {},
        "matched_count": 1,
        "resolved": true
      }
    ],
    "top_cqs": [],
    "arena_top_answers": [],
    "diagnosis_summary": {
      "avg_readiness": 42,
      "merchants_diagnosed": 28,
      "top_deficit_axis": "proofVisibility"
    }
  }'
```

**예상 응답:**
```json
{
  "ok": true,
  "message": "Feedback received and processed",
  "data": {
    "newSignals": 2,
    "cpsUpdated": 0,
    "errors": []
  }
}
```

> [!NOTE]
> **`newSignals: 2`인 이유**: 3개 패턴 중 `resolved=false` & `matched_count >= 2`인 패턴만 시그널로 등록됩니다.
> - ✅ "제주 해녀의부엌 웨이팅 시간" (resolved=false, matched=5)
> - ✅ "비 오는 날 제주 아이랑 실내 카페" (resolved=false, matched=3)
> - ❌ "제주 흑돼지 맛집 돈사돈 주차" (resolved=true → 이미 답변됨이라 제외)

### 6.3 방법 C: E2E 파이프라인 내 자동 Pull (Phase 0.6)

E2E 파이프라인을 다시 실행하면 Phase 0.6에서 자동으로 Hub 피드백을 Pull합니다.
Step 2를 반복 실행한 후, 결과에서 `phase0_6_hubFeedback`을 확인:

```json
{
  "phase0_6_hubFeedback": {
    "newSignals": 2,
    "cpsUpdated": 0,
    "source": "pipeline_pull"
  }
}
```

### ✅ 검증 포인트

| 항목 | 조건 |
|---|---|
| 응답 `ok` | `true` |
| `newSignals` | `>= 1` (mock 피드백이라도 1건 이상) |
| `errors` | `[]` (빈 배열) |
| Webhook: HTTP status | `200` |

---

## Step 7. 피드백 환류 결과 확인

### 7.1 신규 시그널 등록 확인

**Pipeline Artifacts → 질문 시그널** 탭에서:
- **source** 컬럼에 `hub_feedback`이 표시된 시그널이 존재하는지 확인

또는 Supabase SQL:
```sql
SELECT id, query, source, status, created_at 
FROM question_signals 
WHERE workspace_id = '<WORKSPACE_ID>' 
  AND source = 'hub_feedback'
ORDER BY created_at DESC;
```

### 7.2 CPS 점수 보정 확인

Step 6.2에서 `top_cqs`에 실제 CQ ID를 넣었다면:

```sql
SELECT id, normalized_question, cps_score, 
       metadata->>'hub_view_count_24h' as hub_views,
       metadata->>'last_feedback_at' as feedback_at
FROM canonical_questions 
WHERE workspace_id = '<WORKSPACE_ID>'
  AND metadata->>'last_feedback_at' IS NOT NULL
ORDER BY cps_score DESC;
```

### 7.3 피드백 이력 확인

**Pipeline Artifacts → 역방향 피드백** 탭에서:
- 최근 동기화 이력이 나타나는지
- `PUSH (자동)` / `PULL (수동)` 태그가 올바른지
- `처리됨` 상태이고 `신규 시그널: N건`, `CQ 보정: N건`이 표시되는지

```sql
SELECT id, region, feedback_date, source, processed, 
       process_result->>'newSignals' as new_signals,
       process_result->>'cpsUpdated' as cps_updated,
       created_at
FROM hub_feedback_logs 
WHERE workspace_id = '<WORKSPACE_ID>'
ORDER BY created_at DESC;
```

### ✅ 최종 검증 체크리스트

| # | 검증 항목 | 상태 |
|:---:|---|:---:|
| 1 | E2E 파이프라인 실행 → `status: completed` | ⬜ |
| 2 | CQ 20+ 건 생성 확인 | ⬜ |
| 3 | QIS Scene 2+ 건 생성 확인 | ⬜ |
| 4 | Phase 4 Hub Push → `pushed: true` | ⬜ |
| 5 | AiHompyHub DB에 CQ/Scene 수신 확인 | ⬜ |
| 6 | 역방향 피드백 Webhook → `ok: true` | ⬜ |
| 7 | `source='hub_feedback'` 시그널 등록 확인 | ⬜ |
| 8 | CPS 점수 보정 반영 확인 (top_cqs 사용 시) | ⬜ |
| 9 | 관리자 UI 피드백 이력 표시 확인 | ⬜ |

---

## 트러블슈팅

### Phase 4 Push 실패

| 증상 | 원인 | 해결 |
|---|---|---|
| `Hub URL not configured` | `HUB_API_URL` 미설정 | Vercel 환경변수에 AiHompyHub URL 추가 |
| `Hub API responded with status 401` | 시크릿 불일치 | `BSW_HUB_INGEST_SECRET` 확인 |
| `Hub API responded with status 500` | Hub 측 미구현 | `BSW_INTEGRATION_V2_GUIDE.md` 참조하여 Hub 측 구현 |

### 피드백 수신 실패

| 증상 | 원인 | 해결 |
|---|---|---|
| `401 UNAUTHORIZED` | `x-hub-secret` 헤더 불일치 | `HUB_FEEDBACK_SECRET` 환경변수 확인 |
| `500 SERVER_NOT_CONFIGURED` | `HUB_FEEDBACK_SECRET` 미설정 | Vercel 환경변수 추가 |
| `404 WORKSPACE_NOT_FOUND` | workspace slug 오류 | body에 `"workspace": "demo-brand-semantic-lab"` 포함 |
| Mock 피드백만 반환 | Hub Pull API 미구현 또는 Hub URL 미설정 | 정상 (Hub 연결 전에는 mock 데이터로 동작) |

---

## 테스트 순서 권장

### Phase I: BSW 단독 (Hub 연결 없이)
1. Step 1 → Step 2 → Step 3 (**질문 자산 수집** 검증)
2. Step 6.1 또는 6.2 → Step 7 (**역방향 피드백 mock 동작** 검증)

### Phase II: BSW ↔ AiHompyHub 연동
3. Hub 환경변수 설정 후 Step 2 → Step 4 → Step 5 (**Push 연동** 검증)
4. Step 6 → Step 7 (**Pull 연동 + 환류** 검증)

> [!TIP]
> Phase I만 진행해도 BSW의 파이프라인 및 피드백 처리 로직이 정상 동작하는지 충분히 검증할 수 있습니다.
> Phase II는 AiHompyHub 측 구현이 완료된 후 진행하세요.
