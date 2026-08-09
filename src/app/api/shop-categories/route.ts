import { NextResponse } from 'next/server';
import { fetchShopBrowseCards } from '@/lib/categories/shop-category-page';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

export async function GET() {
  const categories = await fetchShopBrowseCards();
  return NextResponse.json({ categories });
}
