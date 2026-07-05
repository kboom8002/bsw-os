-- 1. workspaces 테이블에 브랜드 프로필 컬럼 추가
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS industry_slug VARCHAR(100);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS brand_url TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS brand_logo_url TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS brand_description TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS primary_keywords TEXT[] DEFAULT '{}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS competitor_slugs TEXT[] DEFAULT '{}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'starter';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- 2. workspace_invitations 테이블 (팀 초대 시스템)
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL DEFAULT 'brand_strategist',
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  accepted_at TIMESTAMPTZ,
  UNIQUE(workspace_id, invitee_email)
);

-- 3. onboarding_events 테이블 (온보딩 퍼널 트래킹)
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- 정책 생성
DROP POLICY IF EXISTS workspace_invitations_read ON workspace_invitations;
CREATE POLICY workspace_invitations_read ON workspace_invitations FOR SELECT USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS workspace_invitations_insert ON workspace_invitations;
CREATE POLICY workspace_invitations_insert ON workspace_invitations FOR INSERT WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS workspace_invitations_update ON workspace_invitations;
CREATE POLICY workspace_invitations_update ON workspace_invitations FOR UPDATE USING (has_workspace_role(workspace_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS onboarding_events_all ON onboarding_events;
CREATE POLICY onboarding_events_all ON onboarding_events FOR ALL USING (is_workspace_member(workspace_id));
