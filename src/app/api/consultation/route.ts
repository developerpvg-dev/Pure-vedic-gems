import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Consultation bookings now require login and payment. Use the paid consultation checkout.' },
    { status: 410 }
  );
}
