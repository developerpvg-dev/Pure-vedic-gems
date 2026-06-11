import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const uploads = 'C:/Users/himan/.cursor/projects/c-Users-himan-OneDrive-Desktop-Purevedicgems/uploads';

const FILES = {
  'blue-sapphire': 'buy-online-blue-sapphire-gemstone-0.md',
  'yellow-sapphire': 'buy-online-yellow-sapphire-gemstone-1.md',
  ruby: 'buy-online-ruby-gemstone-2.md',
  emerald: 'buy-online-emerald-gemstone-3.md',
  'red-coral': 'red-coral-qualities-4.md',
  catseye: 'buy-online-catseye-gemstone-6.md',
  hessonite: 'hessonite-qualites-7.md',
};

function extractFaqs(text) {
  const start = text.search(/Frequently Asked Questions/i);
  if (start < 0) return [];
  const endMarkers = ['##### Pure Vedic Gems Reviews', '##### Pure Vedic Gems'];
  let end = text.length;
  for (const m of endMarkers) {
    const i = text.indexOf(m, start);
    if (i >= 0) end = Math.min(end, i);
  }
  const section = text.slice(start, end);
  const parts = section.split(/\n### /).slice(1);
  return parts
    .map((block) => {
      const nl = block.indexOf('\n');
      if (nl < 0) return null;
      const question = block.slice(0, nl).trim();
      const answer = block
        .slice(nl + 1)
        .trim()
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ');
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter(Boolean);
}

const out = {};
for (const [slug, file] of Object.entries(FILES)) {
  const text = fs.readFileSync(path.join(uploads, file), 'utf8');
  out[slug] = extractFaqs(text);
}

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'constants');
fs.writeFileSync(path.join(outDir, 'gem-legacy-faqs.json'), JSON.stringify(out, null, 2));
const ts = `// Auto-generated from legacy page markdown — do not edit by hand.\n\nimport data from './gem-legacy-faqs.json';\n\nexport const GEM_LEGACY_FAQS = data as Record<string, { question: string; answer: string }[]>;\n`;
fs.writeFileSync(path.join(outDir, 'gem-legacy-faqs.ts'), ts);
console.log('Wrote FAQs for', Object.keys(out).join(', '));
