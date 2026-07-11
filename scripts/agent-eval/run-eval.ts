/**
 * ponytail: smoke eval — run with OPENAI_API_KEY + AGENT_ENABLED=true
 * node --import tsx scripts/agent-eval/run-eval.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { computeLeadScore } from '../../src/lib/agent/lead-scorer';
import { detectLanguage } from '../../src/lib/agent/language';
import { buildGemRecommendation } from '../../src/lib/utils/rashi-calculator';

type Fixture = {
  id: string;
  locale: string;
  input: string;
  expectTools?: string[];
  mustNotContain?: string[];
};

const fixtures: Fixture[] = JSON.parse(
  readFileSync(join(__dirname, 'fixtures.json'), 'utf8')
);

let passed = 0;

for (const fx of fixtures) {
  let ok = true;

  const lang = detectLanguage(fx.input);
  if (fx.locale === 'hi' && lang !== 'hi') ok = false;
  if (fx.locale === 'en' && !fx.id.includes('rashi') && lang !== 'en') ok = false;

  if (fx.id.includes('rashi')) {
    const rec = buildGemRecommendation({ birthDate: '1990-08-15' });
    if (rec.primaryGemNames.length + rec.supportingGemNames.length === 0) ok = false;
  }

  if (fx.id.includes('budget') || fx.id.includes('handoff')) {
    const score = computeLeadScore({
      context: { budgetMax: 200000, handoffRequested: fx.id.includes('handoff'), urgencySignals: ['wedding'] },
      messageCount: 4,
      channel: 'chat',
    });
    if (fx.id.includes('handoff') && score < 40) ok = false;
  }

  if (ok) passed += 1;
  else console.error('FAIL', fx.id);
}

console.log(`Agent eval: ${passed}/${fixtures.length} passed`);
if (passed < Math.ceil(fixtures.length * 0.9)) process.exit(1);
