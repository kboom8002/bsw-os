import { getSupabaseAdminClient } from './supabase';
import { WorkspaceRole } from './schema';

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
 */
export async function checkWorkspacePermission(
  workspaceId: string,
  userId: string,
  allowedRoles: WorkspaceRole[]
): Promise<boolean> {
  const role = await getWorkspaceRole(workspaceId, userId);
  if (!role) {
    return false;
  }
  return allowedRoles.includes(role);
}
