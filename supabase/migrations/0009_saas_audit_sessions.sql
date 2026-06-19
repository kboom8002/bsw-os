-- 0009_saas_audit_sessions.sql

-- 진단 세션 관리 테이블
CREATE TABLE IF NOT EXISTS audit_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL, -- references workspaces(id) if applicable
  brand_name    TEXT NOT NULL,
  website_url   TEXT NOT NULL,
  industry      TEXT,
  tier          TEXT NOT NULL CHECK (tier IN ('free', 'tier1', 'tier1.5', 'tier2', 'tier3')),
  status        TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  progress      JSONB DEFAULT '{}'::jsonb,
  result_data   JSONB,
  email         TEXT,
  payment_id    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- RLS 설정
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

-- 임시 전체 허용 (RLS 정책)
CREATE POLICY "Enable all for audit_sessions"
  ON audit_sessions
  FOR ALL
  USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_sessions_workspace ON audit_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_created ON audit_sessions(created_at DESC);
