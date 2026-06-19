import { NextResponse } from 'next/server';
import { runDeepDiveMeasure } from '../../../../lib/deep-dive/measure-engine';

export const maxDuration = 120; // Vercel Pro

export async function POST(req: Request) {
  try {
    const { workspace_id, brand_slug, domain_slug } = await req.json();

    if (!workspace_id || !brand_slug || !domain_slug) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const diagnosticData = await runDeepDiveMeasure(workspace_id, brand_slug, domain_slug);

    return NextResponse.json({
      success: true,
      diagnostic: diagnosticData
    });

  } catch (error: any) {
    console.error('[deep-dive] Measure failed:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
