export function isAgentEnabled() {
  return process.env.AGENT_ENABLED === 'true';
}

/** Client gate: mount chat UI only when this is true (avoids /api/agent/config on every page). Keep in sync with AGENT_ENABLED. */
export function isAgentUiEnabled() {
  return process.env.NEXT_PUBLIC_AGENT_ENABLED === 'true';
}

export type RatnaCallNumber = { region: string; number: string };

/**
 * Parse regional call numbers from env.
 * Format: "US:+1..., AU:+61..., UAE:+971..." (label:number, comma separated).
 */
export function getRatnaCallNumbers(): RatnaCallNumber[] {
  const raw = process.env.NEXT_PUBLIC_RATNA_CALL_NUMBERS ?? '';
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [region, ...rest] = entry.split(':');
      return { region: region.trim(), number: rest.join(':').trim() };
    })
    .filter((n) => n.region && n.number);
}

export function getAgentConfig() {
  return {
    enabled: isAgentEnabled(),
    openaiKey: process.env.OPENAI_API_KEY ?? '',
    sessionSecret: process.env.AGENT_SESSION_SECRET ?? process.env.CRON_SECRET ?? 'dev-agent-secret',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    leadScoreThreshold: Number(process.env.RATNA_LEAD_SCORE_THRESHOLD ?? 70),
    handoffPhone: process.env.RATNA_HANDOFF_PHONE ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
    pipecatUrl: process.env.PIPECAT_SERVICE_URL ?? '',
    callNumbers: getRatnaCallNumbers(),
    whatsapp: {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
      verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? '',
    },
    chatwoot: {
      baseUrl: process.env.CHATWOOT_BASE_URL ?? '',
      apiToken: process.env.CHATWOOT_API_TOKEN ?? '',
      inboxId: process.env.CHATWOOT_INBOX_ID ?? '',
    },
    bharatVoice: {
      apiKey: process.env.BHARATVOICE_API_KEY ?? '',
      baseUrl: process.env.BHARATVOICE_API_BASE_URL ?? 'https://api.bharatvoice.ai',
    },
  };
}

export function assertAgentReady() {
  const config = getAgentConfig();
  if (!config.enabled) {
    throw new Error('Agent is disabled');
  }
  if (!config.openaiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return config;
}
