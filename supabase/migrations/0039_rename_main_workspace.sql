-- 0039_rename_main_workspace.sql
-- 상황: bsw-main 워크스페이스가 이미 존재함
-- 해결: demo-brand-semantic-lab의 이름을 사람이 읽기 좋게 변경하고
--       bsw-main을 공식 메인 워크스페이스로 확정

-- bsw-main을 공식 Main Workspace로 확정
UPDATE workspaces
SET
  name = 'BSW Main Workspace',
  workspace_type = 'main'
WHERE slug = 'bsw-main';

-- demo-brand-semantic-lab 워크스페이스: 이름에서 'demo' 제거하고 brand 타입으로 명시
-- (slug는 URL 참조가 있으므로 그대로 유지)
UPDATE workspaces
SET
  name = 'Brand Semantic Lab',
  workspace_type = 'brand'
WHERE slug = 'demo-brand-semantic-lab';
