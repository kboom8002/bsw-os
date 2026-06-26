import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase";

// Session creation only — no audit logic, so 60s is plenty
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteUrl, brandName, competitors = [], tier = "tier2", industry, workspaceId } = body;

    if (!websiteUrl || !brandName) {
      return NextResponse.json({ error: "Missing websiteUrl or brandName" }, { status: 400 });
    }

    const wid = workspaceId || "c2498c4f-aee3-49e0-bb80-171a0852128f";
    const db = getSupabaseAdminClient();

    const { data, error } = await db.from("audit_sessions").insert({
      workspace_id: wid,
      brand_name: brandName,
      website_url: websiteUrl,
      industry: industry || "default",
      tier,
      status: "running",
      progress: { current_step: -1, total_steps: 14, message: "세션 생성 완료. 진단 시작 대기 중...", competitors },
    }).select("id").single();

    if (error || !data) {
      throw new Error("Session create failed: " + error?.message);
    }

    return NextResponse.json({ sessionId: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
