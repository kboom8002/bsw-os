-- 0037_workspace_types.sql

-- 1. workspaces 테이블에 컬럼 추가
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS workspace_type VARCHAR(30) DEFAULT 'brand' CHECK (workspace_type IN ('main', 'brand'));
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS parent_workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. platform_admins 테이블 생성
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID
);

-- 3. 플랫폼 어드민 테이블 RLS 활성화
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- 4. 플랫폼 어드민 권한 조회 정책 (모두 조회 가능 또는 어드민만 조회)
DROP POLICY IF EXISTS platform_admins_read ON platform_admins;
CREATE POLICY platform_admins_read ON platform_admins FOR SELECT USING (true);

DROP POLICY IF EXISTS platform_admins_all ON platform_admins;
CREATE POLICY platform_admins_all ON platform_admins FOR ALL USING (
  EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
);

-- 5. 기존 데이터 마이그레이션
-- 기존 모든 워크스페이스는 기본적으로 brand 유형으로 설정
UPDATE workspaces SET workspace_type = 'brand' WHERE workspace_type IS NULL;

-- 슈퍼 어드민용 메인 워크스페이스 생성 (없을 경우)
INSERT INTO workspaces (id, name, slug, workspace_type)
VALUES ('00000000-0000-4000-b000-000000000001', 'BSW Main Workspace', 'bsw-main', 'main')
ON CONFLICT (slug) DO UPDATE SET workspace_type = 'main';

-- kboom8002@gmail.com 유저를 platform_admins에 추가
INSERT INTO platform_admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'kboom8002@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- BSW Main Workspace에 kboom8002@gmail.com 멤버십 추가 (owner 역할)
INSERT INTO workspace_memberships (workspace_id, user_id, role)
SELECT '00000000-0000-4000-b000-000000000001', id, 'owner'
FROM auth.users WHERE email = 'kboom8002@gmail.com'
ON CONFLICT (workspace_id, user_id) DO NOTHING;
