import { NextResponse } from 'next/server';
import { fetchShopBrowseCards } from '@/lib/categories/shop-category-page';

export const revalidate = 300;

export async function GET() {
  const categories = await fetchShopBrowseCards();
  return NextResponse.json({ categories });
}
