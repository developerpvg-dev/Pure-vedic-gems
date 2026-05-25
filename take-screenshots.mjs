import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 900 });

// Homepage testimonials
await p.goto('http://localhost:3000/');
await p.waitForTimeout(5000);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(500);
await p.evaluate(() => window.scrollBy(0, -2500));
await p.waitForTimeout(1000);
await p.screenshot({ path: 'home-testi-final.png' });
console.log('Homepage screenshot done');

// Testimonials page
await p.goto('http://localhost:3000/testimonials');
await p.waitForTimeout(3000);
await p.screenshot({ path: 'page-testi-final.png' });
console.log('Testimonials page screenshot done');

await b.close();
console.log('done');
