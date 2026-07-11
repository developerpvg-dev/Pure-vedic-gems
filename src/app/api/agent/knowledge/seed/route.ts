import { NextRequest, NextResponse } from 'next/server';
import { seedDefaultKnowledge } from '@/lib/agent/knowledge';

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await seedDefaultKnowledge();
  return NextResponse.json({ ok: true });
}
