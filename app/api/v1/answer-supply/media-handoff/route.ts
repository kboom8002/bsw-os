/**
 * api/v1/answer-supply/media-handoff/route.ts
 *
 * GET  /api/v1/answer-supply/media-handoff — 미디어 파트너 CMS용 기사 큐/JSON-LD 조회 API
 * POST /api/v1/answer-supply/media-handoff — 미디어 파트너 발행 완료 콜백 및 상태 업데이트
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEditorialHandoffQueue, updateHandoffStatus } from "@/app/actions/media-series";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || "ws-demo-1";
    const partner = searchParams.get("partner") as any;

    const items = await getEditorialHandoffQueue(workspaceId, partner);

    return NextResponse.json({
      ok: true,
      count: items.length,
      data: items,
    });
  } catch (error: any) {
    console.error("[API media-handoff GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "핸드오프 데이터 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

const PostSchema = z.object({
  workspaceId: z.string().min(1),
  handoffId: z.string().min(1),
  status: z.enum(["draft", "in_review", "approved", "scheduled", "published", "rejected"]),
  notes: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { workspaceId, handoffId, status, notes, scheduledAt } = parsed.data;
    const result = await updateHandoffStatus(workspaceId, handoffId, status, notes, scheduledAt);

    return NextResponse.json({
      ok: result.success,
      data: result.item,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[API media-handoff POST] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "핸드오프 상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
