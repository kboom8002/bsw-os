import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();
    if (!token || !userId) {
      return NextResponse.json({ success: false, message: "Invalid parameters." }, { status: 400 });
    }

    const adminClient = getSupabaseAdminClient();

    // 1. Fetch invitation
    const { data: invite, error: inviteErr } = await adminClient
      .from('workspace_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteErr || !invite) {
      return NextResponse.json({ success: false, message: "Invitation not found or already processed." }, { status: 404 });
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ success: false, message: "Invitation has expired." }, { status: 400 });
    }

    // 2. Create membership
    const { error: memError } = await adminClient
      .from('workspace_memberships')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        role: invite.role
      });

    if (memError) {
      // If membership already exists, proceed to accept anyway
      if (!memError.message.includes("unique_id_user_id") && !memError.message.includes("duplicate key")) {
        console.error("Failed to insert membership:", memError);
        return NextResponse.json({ success: false, message: memError.message }, { status: 500 });
      }
    }

    // 3. Update invitation status
    await adminClient
      .from('workspace_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    // 4. Fetch workspace slug
    const { data: ws } = await adminClient
      .from('workspaces')
      .select('slug')
      .eq('id', invite.workspace_id)
      .single();

    return NextResponse.json({
      success: true,
      workspaceSlug: ws?.slug || "demo-brand-semantic-lab"
    });
  } catch (err: any) {
    console.error("Accept invite API failure:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
