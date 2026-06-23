/**
 * Build optimized WebP nav cards for Upratna mega-menu thumbnails.
 * Output: public/home/upratna-cards/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'home', 'upratna-cards');
const CARD_WIDTH = 160;

const SOURCES = {
  opal: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/images/1775313481570-opal__1_.png',
  pitambari: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781250291760-3c3081dc-dad7-4ab9-a049-95d0d78f90f2_80.png',
  turquoise: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1778523152139-ChatGPT_Image_May_11__2026__11_41_12_PM.png',
  amethyst: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/images/1775313809941-amithyst.png',
  moonstone: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/images/1775314056332-moon_stone.png',
  garnet: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/images/1775314102314-garnet.png',
  peridot: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1778524434962-ChatGPT_Image_May_12__2026__12_03_29_AM.png',
  tanzanite: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781246949698-ChatGPT_Image_Jun_12__2026__11_33_29_AM__1_.png',
  'lapis-lazuli': 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781247071030-ChatGPT_Image_Jun_12__2026__12_19_50_PM__1_.png',
  citrine: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/images/1775314352753-citrine.png',
  aquamarine: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/images/1775313688895-aquamarine1.png',
  'blue-topaz': 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781247693540-fa139429-f6c7-4608-8fac-e6ad5d095ced__1_.png',
  'white-topaz': 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781248507660-1a748000-2b47-453b-8541-7c7e5253b09f__1_.png',
  zircon: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781248654773-23a24bf4-4c91-4811-8aab-b3caa8cf1bdc__1_.png',
  iolite: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781248767143-f975f1a5-3fdf-4266-b085-000d8c4d7427__1_.png',
  diopside: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781248849549-6d849a86-840d-4dc7-b15a-75571a313773__1_.png',
  malachite: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781248936997-f55c9f6a-5b7a-4073-afff-2f148d9c6187__1_.png',
  'tiger-eye': 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781249028792-478bd3f7-a959-4888-accb-674f12b8a86d__1_.png',
  kyanite: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781249144429-ChatGPT_Image_Jun_12__2026__12_54_55_PM__1_.png',
  sunstone: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781249457006-ada9fd4e-1c7d-461f-8948-61248f7dd4ba_70.png',
  hakik: 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781249611763-51842e0d-b172-42c5-8226-f96c24e4cd55_1_80.png',
  'rose-quartz': 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781249851839-8d7767b6-6254-43a0-a00e-f335a59381a8_78.png',
  'white-coral': 'https://kjsyhuybvzzfpybtlvei.supabase.co/storage/v1/object/public/products/homepage-categories/images/1781249943373-f41dcd6d-0729-45c5-9e7b-8421ef1b425b.png',
};

async function optimizeFromUrl(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer)
    .resize({ width: CARD_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outputPath);
  const kb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  return kb;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [slug, url] of Object.entries(SOURCES)) {
    const outputPath = path.join(outDir, `${slug}.webp`);
    const kb = await optimizeFromUrl(url, outputPath);
    console.log(`✓ ${slug}.webp (${kb} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
