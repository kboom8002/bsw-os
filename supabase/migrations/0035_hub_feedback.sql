-- BSW-OS: AI Hub 역방향 피드백 저장 테이블
CREATE TABLE IF NOT EXISTS hub_feedback_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  region          TEXT NOT NULL,
  feedback_date   DATE NOT NULL,
  source          TEXT NOT NULL DEFAULT 'hub_push',  -- 'hub_push' | 'pipeline_pull' | 'manual_pull'
  payload         JSONB NOT NULL,
  processed       BOOLEAN NOT NULL DEFAULT false,
  process_result  JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, region, feedback_date, source)
);

CREATE INDEX IF NOT EXISTS idx_hub_feedback_workspace ON hub_feedback_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hub_feedback_date ON hub_feedback_logs(feedback_date DESC);
