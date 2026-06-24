import { NextResponse } from 'next/server';
import { startAuditSession } from '../../../actions/site-audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteUrl, brandName, competitors = [], tier = 'tier2', industry, workspaceId } = body;

    if (!websiteUrl || !brandName) {
      return NextResponse.json({ error: 'Missing websiteUrl or brandName' }, { status: 400 });
    }

    const wid = workspaceId || 'c2498c4f-aee3-49e0-bb80-171a0852128f';
    const sessionId = await startAuditSession(wid, websiteUrl, brandName, competitors, tier, industry);

    return NextResponse.json({ sessionId });
  } catch (err: any) {
    console.error('[API /audit/full-start] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
