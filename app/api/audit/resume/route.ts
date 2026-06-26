import { NextResponse } from 'next/server';
import { resumeAuditSession } from '@/app/actions/site-audit';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ ok: false, message: 'Missing sessionId' }, { status: 400 });
  const result = await resumeAuditSession(sessionId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
