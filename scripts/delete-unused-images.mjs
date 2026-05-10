import { existsSync, rmSync, statSync } from 'fs';
import { join } from 'path';

const publicDir = new URL('../public/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const files = [
  // Next.js template defaults
  'file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg',

  // Old root-level lab logos (superseded by labslogo/ folder)
  'CUBELIN LAB-PVG.webp', 'GIA-PVG.webp', 'GII-PVG.webp', 'GRS-PVG.webp', 'IGI-PVG.webp',
  'IIGJ.jpg', 'IIGJ.webp',

  // Truly unused background images (never referenced in any source file)
  'navratnassectionbg.png', 'navratnassectionbg.webp',
  'herosectionimg.png', 'herosectionimg.webp',
  'collection-bg.png', 'collection-bg.webp',

  // Algerian wordmark original (code now uses .webp)
  'Algerian.png',

  // Unused imgandicon heroes (never referenced in code)
  'home/imgandicon/hero1.png', 'home/imgandicon/hero1.webp',
  'home/imgandicon/hero2.png', 'home/imgandicon/hero2.webp',
  'home/imgandicon/hero3.png', 'home/imgandicon/hero3.webp',

  // Hero originals — code now uses .webp
  'home/hero/pvgherobg1.png', 'home/hero/pvgherobg2.png', 'home/hero/pvgherobg3.png',
  'home/hero/pvgheropc1.png', 'home/hero/pvgheropc2.png', 'home/hero/pvgheropc3.png',

  // Who We Are originals — code now uses .webp
  'home/whoweare/1Heritage.jpeg',
  'home/whoweare/2Sourcing.png',
  'home/whoweare/3Certification.png',
  'home/whoweare/4Energization.png',

  // Certificate originals — code now uses .webp
  'home/certificates/1116x1676 pixle GIA (1).png',
  'home/certificates/1116x1676 pixle IGI.png',
  'home/certificates/1116x1676 pixle GII.png',
  'home/certificates/1170x826 pexile certificate IGI.png',

  // Configurator step originals — code uses .webp via template literal
  'home/configuratorsteps/step1.png', 'home/configuratorsteps/step2.png',
  'home/configuratorsteps/step3.png', 'home/configuratorsteps/step4.png',
  'home/configuratorsteps/step5.png', 'home/configuratorsteps/step6.png',

  // Service image originals — code now uses .webp
  'home/ourservicesimg/service1.png', 'home/ourservicesimg/service2.png',
  'home/ourservicesimg/service3.png', 'home/ourservicesimg/service4.png',
  'home/ourservicesimg/service5.png', 'home/ourservicesimg/service6.png',

  // Gem recommendation background original — CSS now uses .webp
  'home/gemrecomndation/getgemrec.png',

  // Lab logo JPG originals — code now uses .webp
  'labslogo/GIA.jpg', 'labslogo/IGI.jpg', 'labslogo/GRS.jpg', 'labslogo/GUBELIN.jpg',
  'labslogo/GII.jpg', 'labslogo/IIGJ.jpg', 'labslogo/GJEPC.jpg',
  'labslogo/SSEF.jpg', 'labslogo/GFCO.jpg', 'labslogo/HRD ANTWERP.jpg',

  // CTA originals — code now uses .webp
  'home/ctas/cta1.png', 'home/ctas/cta2.png', 'home/ctas/cta3.png',

  // Director's pick original — code now uses .webp
  "home/director'spick/director'spick.png",

  // Rudraksha JPG originals 1-15 — code now uses .webp
  'home/rudrakhshas images/1Mukhi-150x150.jpg',
  'home/rudrakhshas images/2Mukhi-150x150.jpg',
  'home/rudrakhshas images/3Mukhi-150x150.jpg',
  'home/rudrakhshas images/4Mukhi-150x150.jpg',
  'home/rudrakhshas images/5Mukhi-150x150.jpg',
  'home/rudrakhshas images/6Mukhi-150x150.jpg',
  'home/rudrakhshas images/7Mukhi-150x150.jpg',
  'home/rudrakhshas images/8Mukhi-150x150.jpg',
  'home/rudrakhshas images/9Mukhi-150x150.jpg',
  'home/rudrakhshas images/10Mukhi-150x150.jpg',
  'home/rudrakhshas images/11Mukhi-150x150.jpg',
  'home/rudrakhshas images/12Mukhi-150x150.jpg',
  'home/rudrakhshas images/13Mukhi-150x150.jpg',
  'home/rudrakhshas images/14Mukhi-150x150.jpg',
  'home/rudrakhshas images/15Mukhi--150x150.jpg',

  // Navratna stone PNGs — code now uses .webp
  'home/navratnaimg/stone1.png', 'home/navratnaimg/stone2.png',
  'home/navratnaimg/stone3.png', 'home/navratnaimg/stone4.png',
  'home/navratnaimg/stone5.png', 'home/navratnaimg/stone6.png',
  'home/navratnaimg/stone7.png', 'home/navratnaimg/stone8.png',
  'home/navratnaimg/stone9.png',

  // stones_img — only stone1.webp is used; all others unused
  'stones_img/stone1.png',
  'stones_img/stone2.png', 'stones_img/stone2.webp',
  'stones_img/stone3.png', 'stones_img/stone3.webp',
  'stones_img/stone4.png', 'stones_img/stone4.webp',
  'stones_img/stone5.png', 'stones_img/stone5.webp',
  'stones_img/stone6.png', 'stones_img/stone6.webp',
  'stones_img/stone7.png', 'stones_img/stone7.webp',
  'stones_img/stone8.png', 'stones_img/stone8.webp',
  'stones_img/stone9.png', 'stones_img/stone9.webp',

  // Config img originals — code now uses .webp
  'config_img/ring.png', 'config_img/pandent.png',
  'config_img/bracelet.png', 'config_img/loose.png',

  // Expert photo originals — code now uses .webp
  'our_expets_img/Mr. Vikash Mehra.jpeg',
  'our_expets_img/Mrs . Tanya Mehra.jpeg',
  'our_expets_img/Mr. Vrayas Mehra.jpeg',
];

let deleted = 0, notFound = 0, totalBytes = 0;

for (const rel of files) {
  const fullPath = join(publicDir, rel);
  if (existsSync(fullPath)) {
    const size = statSync(fullPath).size;
    rmSync(fullPath);
    totalBytes += size;
    deleted++;
    console.log(`✓ DEL (${Math.round(size / 1024)}KB) ${rel}`);
  } else {
    notFound++;
    console.log(`  SKIP (not found): ${rel}`);
  }
}

console.log(`\n=== DONE ===`);
console.log(`Deleted:   ${deleted} files`);
console.log(`Not found: ${notFound} files`);
console.log(`Freed:     ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
