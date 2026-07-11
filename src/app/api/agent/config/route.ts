import { NextResponse } from 'next/server';
import { getAgentConfig, isAgentEnabled } from '@/lib/agent/config';

export async function GET() {
  const config = getAgentConfig();
  return NextResponse.json({
    enabled: isAgentEnabled(),
    pipecatUrl: config.pipecatUrl || null,
    callNumbers: config.callNumbers,
  });
}
