import { createHmac, timingSafeEqual } from 'crypto';
import { getAgentConfig } from '@/lib/agent/config';
import { createAdminClient } from '@/lib/supabase/admin';

export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signatureHeader?.startsWith('sha256=')) return !secret;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = signatureHeader.slice(7);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

export async function isDuplicateWebhook(provider: string, externalId: string) {
  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message: string } | null }>;
    };
  };

  const { error } = await admin.from('agent_webhook_events').insert({
    provider,
    external_id: externalId,
    payload: {},
  });

  return error?.code === '23505';
}

export async function sendWhatsAppText(to: string, body: string) {
  const { whatsapp } = getAgentConfig();
  if (!whatsapp.accessToken || !whatsapp.phoneNumberId) {
    throw new Error('WhatsApp not configured');
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${whatsapp.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${err}`);
  }
  return res.json();
}

export async function sendWhatsAppProductLink(to: string, product: { name: string; href: string; imageUrl?: string | null }) {
  const siteUrl = getAgentConfig().siteUrl;
  const fullHref = product.href.startsWith('http') ? product.href : `${siteUrl}${product.href}`;
  const text = `*${product.name}*\n${fullHref}\n\n— Ratna, PureVedicGems`;
  return sendWhatsAppText(to, text);
}

export function extractWhatsAppMessages(payload: Record<string, unknown>) {
  const entries = (payload.entry as Array<Record<string, unknown>>) ?? [];
  const messages: Array<{ id: string; from: string; text: string; timestamp: string }> = [];

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      const value = (change.value as Record<string, unknown>) ?? {};
      const msgs = (value.messages as Array<Record<string, unknown>>) ?? [];
      for (const msg of msgs) {
        if (msg.type === 'text') {
          const text = (msg.text as { body?: string })?.body ?? '';
          messages.push({
            id: String(msg.id),
            from: String(msg.from),
            text,
            timestamp: String(msg.timestamp ?? ''),
          });
        }
      }
    }
  }
  return messages;
}
