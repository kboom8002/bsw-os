/**
 * api/v1/answer-supply/publish/route.ts
 *
 * POST /api/v1/answer-supply/publish
 * Answer Asset → Hub 전달 + Tenant Queue 발행 API.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publishAnswerAsset } from "../../../../actions/answer-factory";

export const maxDuration = 60;

const RequestSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId는 필수입니다."),
  assetId: z.string().min(1, "assetId는 필수입니다."),
  targets: z.array(z.enum(["hub", "tenant_queue"])).min(1, "최소 1개의 발행 대상이 필요합니다."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request",
          details: parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const { workspaceId, assetId, targets } = parsed.data;
    const result = await publishAnswerAsset(workspaceId, assetId, targets);

    return NextResponse.json({
      ok: result.success,
      data: {
        publishedAssetId: result.publishedAssetId,
        hubPushed: result.hubPushed,
        queuedForTenant: result.queuedForTenant,
      },
      error: result.error,
    });
  } catch (error: any) {
    console.error("[API answer-supply/publish] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "발행 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
