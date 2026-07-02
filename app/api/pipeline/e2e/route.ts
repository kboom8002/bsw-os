import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runE2EPipeline } from '../../../actions/qis-bridge';

export const maxDuration = 300; // 5분 — Vercel Pro 플랜 기준

const RequestSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  domainName: z.string().min(1, 'domainName is required'),
  brandName: z.string().optional(),
  options: z.object({
    mode: z.enum(['hub', 'standalone']).default('standalone'),
    autoPromoteTopN: z.number().int().min(1).max(20).default(5),
    brandUSP: z.string().max(1000).optional(),
    industryKey: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const { workspaceId, domainName, brandName, options } = parsed.data;

    const result = await runE2EPipeline(workspaceId, domainName, brandName, options);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    // 동시 실행 오류 등 명시적 에러
    if (err?.message?.includes('already running')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    console.error('[API /pipeline/e2e] Unhandled error:', err);
    return NextResponse.json(
      { error: err?.message || '파이프라인 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
