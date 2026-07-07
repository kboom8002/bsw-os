"use server";

import { createClient } from "../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = formData.get("next") as string || "";

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Resolve user's workspace for redirect
  let redirectPath = next;
  if (!redirectPath || redirectPath === "/" || redirectPath.includes("demo-brand-semantic-lab")) {
    const adminSupabase = getSupabaseAdminClient();
    const userId = authData.user?.id;

    if (userId) {
      // Check existing workspaces
      const { data: memberships } = await adminSupabase
        .from('workspace_memberships')
        .select('workspace_id, role, workspaces(slug, name)')
        .eq('user_id', userId)
        .limit(1);

      // platform_admins 테이블에서 권한 확인
      const { data: adminRow } = await adminSupabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      const isSuper = !!adminRow;

      if (memberships && memberships.length > 0) {
        const ws = (memberships[0] as any).workspaces;
        redirectPath = `/ko/${ws.slug}`;
      } else if (isSuper) {
        // Auto-create super admin workspace
        const { data: existingWs } = await adminSupabase
          .from('workspaces')
          .select('id, slug')
          .eq('slug', 'bsw-main')
          .single();

        let wsSlug = 'bsw-main';
        let wsId = existingWs?.id;

        if (!existingWs) {
          const { data: newWs } = await adminSupabase
            .from('workspaces')
            .insert({ name: 'BSW Main Workspace', slug: 'bsw-main', workspace_type: 'main' })
            .select('id')
            .single();
          wsId = newWs?.id;
        }

        if (wsId) {
          await adminSupabase
            .from('workspace_memberships')
            .upsert({
              workspace_id: wsId,
              user_id: userId,
              role: 'owner'
            }, { onConflict: 'workspace_id,user_id' });
        }

        redirectPath = `/ko/${wsSlug}`;
      } else {
        // Redirect to onboarding page for brand setup if no workspace exists
        redirectPath = `/ko/onboarding`;
      }
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectPath || "/ko/onboarding");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const inviteToken = formData.get("invite_token") as string || "";

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  let redirectPath = "/ko/onboarding";

  // Handle invitation token if present
  if (inviteToken && authData.user) {
    const adminSupabase = getSupabaseAdminClient();
    const { data: invite, error: inviteErr } = await adminSupabase
      .from('workspace_invitations')
      .select('*')
      .eq('token', inviteToken)
      .eq('status', 'pending')
      .single();

    if (invite && !inviteErr) {
      // Create membership
      await adminSupabase
        .from('workspace_memberships')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: authData.user.id,
          role: invite.role
        });

      // Mark invitation as accepted
      await adminSupabase
        .from('workspace_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invite.id);

      const { data: ws } = await adminSupabase
        .from('workspaces')
        .select('slug')
        .eq('id', invite.workspace_id)
        .single();

      if (ws) {
        redirectPath = `/ko/${ws.slug}`;
      }
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectPath);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/ko/login");
}
