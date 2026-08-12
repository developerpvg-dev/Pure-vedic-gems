/**
 * ponytail: fails if Ratna UI can still fetch config while the public gate is off.
 * Run: node scripts/check-phase2-agent-gate.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const shell = readFileSync(join(root, 'src/components/layout/LayoutShell.tsx'), 'utf8');
const widget = readFileSync(join(root, 'src/components/agent/AgentChatWidget.tsx'), 'utf8');
const config = readFileSync(join(root, 'src/lib/agent/config.ts'), 'utf8');
const envExample = readFileSync(join(root, '.env.example'), 'utf8');

let failed = false;
function ok(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  } else {
    console.log(`ok: ${msg}`);
  }
}

ok(config.includes('isAgentUiEnabled'), 'isAgentUiEnabled helper exists');
ok(config.includes('NEXT_PUBLIC_AGENT_ENABLED'), 'config reads NEXT_PUBLIC_AGENT_ENABLED');
ok(shell.includes('isAgentUiEnabled()'), 'LayoutShell gates AgentChatWidget');
ok(widget.includes('isAgentUiEnabled()'), 'AgentChatWidget skips fetch when gate off');
ok(envExample.includes('NEXT_PUBLIC_AGENT_ENABLED'), '.env.example documents public gate');

if (failed) process.exit(1);
console.log('phase2 agent-gate check passed');
