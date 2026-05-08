import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildGemRecommendation } from '@/lib/utils/rashi-calculator';

const recommendationSchema = z.object({
  birthDate: z.string().max(40).optional(),
  birthTime: z.string().max(40).optional(),
  birthPlace: z.string().max(160).optional(),
  rashi: z.string().max(80).optional(),
  purpose: z.string().max(80).optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = recommendationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid recommendation request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const recommendation = buildGemRecommendation(parsed.data);

  return NextResponse.json(
    {
      recommendation,
      captured: false,
      note: 'Recommendation generated without storing personal birth details. Book consultation to continue with expert review.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}