import { NextResponse } from 'next/server';
import { getAvailableExperts } from '@/lib/queries/experts';

export async function GET() {
  const experts = await getAvailableExperts();
  return NextResponse.json({ experts });
}
