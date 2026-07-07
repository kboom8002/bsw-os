import { getSupabaseAdminClient } from './supabase';
import { WorkspaceRole } from './schema';
import { createClient } from './supabase/server';
import { env } from './env';

// ────────────────────────────────────────────────────────────────
// Super Admin checks query the `platform_admins` database table.
// ────────────────────────────────────────────────────────────────

/**
 * Ensures the user is authenticated and returns their UUID.
 * Throws an error if they are not logged in.
 */
export async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return user.id;
}

/**
 * 현재 로그인한 유저가 Super Admin인지 확인합니다.
 * database의 platform_admins 테이블을 조회합니다.
 */
async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const adminClient = getSupabaseAdminClient();
    const { data, error } = await adminClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error || !data) {
      return false;
    }
    return true;
  } catch (err) {
    console.error('isSuperAdmin check failed:', err);
    return false;
  }
}

/**
 * Server-side RBAC helper.
 * Resolves a user's active membership role in a specific workspace.
 * Queries the database using the admin client.
 */
export async function getWorkspaceRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY BREACH: getWorkspaceRole can only be executed on the server side.');
  }

  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error || !data) {
    return null;
  }
  
  return data.role as WorkspaceRole;
}

/**
 * Server-side authorization check to enforce RBAC permissions.
 * Verifies if a user belongs to a list of allowed roles inside a workspace.
 * Super Admin은 모든 워크스페이스에 대해 자동 통과합니다.
 */
export async function checkWorkspacePermission(
  workspaceId: string,
  userId: string,
  allowedRoles: WorkspaceRole[]
): Promise<boolean> {
  // Super Admin 바이패스
  if (await isSuperAdmin(userId)) {
    return true;
  }

  const role = await getWorkspaceRole(workspaceId, userId);
  if (!role) {
    return false;
  }
  return allowedRoles.includes(role);
}

/**
 * RequireAuthOrDemo now delegates directly to requireAuth.
 */
export async function requireAuthOrDemo(): Promise<string> {
  return requireAuth();
}

/**
 * CheckWorkspacePermissionOrDemo now delegates directly to checkWorkspacePermission.
 */
export async function checkWorkspacePermissionOrDemo(
  workspaceId: string,
  userId: string,
  allowedRoles: WorkspaceRole[]
): Promise<boolean> {
  return checkWorkspacePermission(workspaceId, userId, allowedRoles);
}
