import { NextResponse } from 'next/server';
import { fetchAllShopCategoryPages, toBrowseCard } from '@/lib/categories/shop-category-page';

export const revalidate = 300;

export async function GET() {
  const pages = await fetchAllShopCategoryPages();
  const categories = pages.map(toBrowseCard);
  return NextResponse.json({ categories });
}
