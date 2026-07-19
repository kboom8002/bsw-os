/**
 * api/v1/answer-supply/pipeline/route.ts
 *
 * POST /api/v1/answer-supply/pipeline
 * Answer Factory 원클릭 에셋 생성 파이프라인 API.
 * Attractor-guided Answer Asset 생성 + SafetyGate + VPA Check.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAnswerPipeline } from "../../../../actions/answer-factory";

export const maxDuration = 300; // LLM 호출 포함 최대 5분

const RequestSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId는 필수입니다."),
  canonicalQuestionId: z.string().uuid("유효한 UUID가 필요합니다."),
  sceneId: z.string().uuid("유효한 UUID가 필요합니다."),
  attractorId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  targetVpa: z.number().int().min(50).max(100).default(75),
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

    const result = await runAnswerPipeline(parsed.data);

    return NextResponse.json({
      ok: result.success,
      data: {
        readyToPublish: result.readyToPublish,
        assetId: result.asset?.id,
        vpaScore: result.draft?.vpaScore,
        safetyPassed: result.draft?.safetyPassed,
        attractorFit: result.attractorFit,
        page: result.page ? { title: result.page.title, htmlLength: result.page.html.length } : null,
        jsonLdType: result.jsonLd?.["@type"],
        missionId: result.mission?.id,
        blueprintId: result.blueprint?.id,
      },
      error: result.error,
    });
  } catch (error: any) {
    console.error("[API answer-supply/pipeline] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "파이프라인 실행 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
