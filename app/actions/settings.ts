"use server";

import crypto from "crypto";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermissionOrDemo, requireAuthOrDemo } from "../../lib/auth";
import { WorkspaceRole, WORKSPACE_ROLES } from "../../lib/schema";
import { revalidatePath } from "next/cache";

export async function updateBrandProfile(wsId: string, data: {
  name: string;
  brand_url: string;
  brand_description: string;
  primary_keywords: string[];
  competitor_slugs: string[];
}) {
  const userId = await requireAuthOrDemo();
  const authorized = await checkWorkspacePermissionOrDemo(wsId, userId, ["owner", "admin"]);
  if (!authorized) {
    throw new Error("UNAUTHORIZED: Only owners or admins can modify brand profiles.");
  }

  const adminClient = getSupabaseAdminClient();
  const { error } = await adminClient
    .from('workspaces')
    .update({
      name: data.name,
      brand_url: data.brand_url,
      brand_description: data.brand_description,
      primary_keywords: data.primary_keywords,
      competitor_slugs: data.competitor_slugs
    })
    .eq('id', wsId);

  if (error) {
    console.error("Profile update error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function inviteTeamMember(wsId: string, email: string, role: WorkspaceRole) {
  const userId = await requireAuthOrDemo();
  const authorized = await checkWorkspacePermissionOrDemo(wsId, userId, ["owner", "admin"]);
  if (!authorized) {
    throw new Error("UNAUTHORIZED: Only owners or admins can invite team members.");
  }

  const adminClient = getSupabaseAdminClient();
  const token = crypto.randomBytes(32).toString('hex');

  const { error } = await adminClient
    .from('workspace_invitations')
    .insert({
      workspace_id: wsId,
      inviter_user_id: userId,
      invitee_email: email,
      role: role,
      token: token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

  if (error) {
    console.error("Invitation error:", error);
    return { success: false, error: error.message };
  }

  // Option A Selected: Built-in Supabase email or manual copy link.
  // We return the invite link for manual copying as a robust backup
  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/ko/invite/${token}`;

  return { success: true, inviteLink };
}

export async function revokeInvitation(wsId: string, invitationId: string) {
  const userId = await requireAuthOrDemo();
  const authorized = await checkWorkspacePermissionOrDemo(wsId, userId, ["owner", "admin"]);
  if (!authorized) {
    throw new Error("UNAUTHORIZED");
  }

  const adminClient = getSupabaseAdminClient();
  const { error } = await adminClient
    .from('workspace_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('workspace_id', wsId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function removeTeamMember(wsId: string, membershipId: string) {
  const userId = await requireAuthOrDemo();
  const authorized = await checkWorkspacePermissionOrDemo(wsId, userId, ["owner", "admin"]);
  if (!authorized) {
    throw new Error("UNAUTHORIZED");
  }

  const adminClient = getSupabaseAdminClient();
  const { error } = await adminClient
    .from('workspace_memberships')
    .delete()
    .eq('id', membershipId)
    .eq('workspace_id', wsId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateMemberRole(wsId: string, membershipId: string, newRole: WorkspaceRole) {
  const userId = await requireAuthOrDemo();
  const authorized = await checkWorkspacePermissionOrDemo(wsId, userId, ["owner", "admin"]);
  if (!authorized) {
    throw new Error("UNAUTHORIZED");
  }

  const adminClient = getSupabaseAdminClient();
  const { error } = await adminClient
    .from('workspace_memberships')
    .update({ role: newRole })
    .eq('id', membershipId)
    .eq('workspace_id', wsId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getTeamMembers(wsId: string) {
  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from('workspace_memberships')
    .select('id, user_id, role, created_at')
    .eq('workspace_id', wsId);

  if (error) {
    console.error("Failed to load team members:", error);
    return [];
  }
  return data || [];
}

export async function getWorkspaceInvitations(wsId: string) {
  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from('workspace_invitations')
    .select('id, invitee_email, role, status, expires_at, created_at')
    .eq('workspace_id', wsId)
    .eq('status', 'pending');

  if (error) {
    console.error("Failed to load invitations:", error);
    return [];
  }
  return data || [];
}
