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

      if (memberships && memberships.length > 0) {
        const ws = (memberships[0] as any).workspaces;
        redirectPath = `/ko/${ws.slug}`;
      } else if (email === 'kboom8002@gmail.com') {
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
            .insert({ name: 'BSW Main Workspace', slug: 'bsw-main' })
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
        redirectPath = `/ko/demo-brand-semantic-lab`;
      }
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectPath || "/ko/demo-brand-semantic-lab");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/ko/login");
}
