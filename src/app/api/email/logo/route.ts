import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Public email logo — remote HTTPS img (not a CID attachment). */
export async function GET() {
  const file = path.join(process.cwd(), 'public', 'email', 'pvg-emblem.png');
  try {
    const buf = await readFile(file);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Logo not found', { status: 404 });
  }
}
