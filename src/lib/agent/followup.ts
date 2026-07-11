import { getAgentConfig } from '@/lib/agent/config';
import { getAgentSession, updateAgentSession } from '@/lib/agent/session';
import { agentGetProduct } from '@/lib/agent/tools-runtime';
import { sendWhatsAppProductLink, sendWhatsAppText } from '@/lib/agent/whatsapp';
import { createAdminClient } from '@/lib/supabase/admin';

export async function queueSessionFollowup(sessionId: string) {
  const session = await getAgentSession(sessionId);
  if (!session) return { skipped: true, reason: 'no_session' };

  const phone = session.whatsapp_phone ?? session.context.phone;
  if (!phone) return { skipped: true, reason: 'no_phone' };

  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => {
        select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
      };
    };
  };

  const productIds = session.context.recommendedProducts ?? [];
  const payload = {
    locale: session.locale,
    productIds: productIds.slice(0, 3),
    siteUrl: getAgentConfig().siteUrl,
  };

  const { data, error } = await admin
    .from('agent_followups')
    .insert({
      session_id: sessionId,
      channel: 'whatsapp',
      status: 'pending',
      payload,
      idempotency_key: `followup:${sessionId}`,
    })
    .select('id')
    .single();

  if (error?.message?.includes('duplicate')) return { skipped: true, reason: 'already_queued' };
  if (error || !data) throw new Error(error?.message ?? 'Failed to queue followup');

  return processFollowup(data.id, sessionId, phone, payload);
}

async function processFollowup(
  followupId: string,
  sessionId: string,
  phone: string,
  payload: { locale: string; productIds: string[]; siteUrl: string }
) {
  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      update: (row: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
    };
  };

  try {
    const intro =
      payload.locale === 'hi'
        ? 'नमस्ते! PureVedicGems से Ratna। आपकी बातचीत के आधार पर कुछ सुझाव:'
        : 'Namaste! Ratna from PureVedicGems. Based on our chat, here are some suggestions:';

    await sendWhatsAppText(phone, intro);

    for (const productId of payload.productIds) {
      const product = await agentGetProduct(productId);
      if (product) {
        await sendWhatsAppProductLink(phone, {
          name: product.hindiName && payload.locale === 'hi' ? `${product.name} (${product.hindiName})` : product.name,
          href: product.href,
          imageUrl: product.thumbnailUrl,
        });
      }
    }

    if (!payload.productIds.length) {
      await sendWhatsAppText(phone, `${payload.siteUrl}\n\nExplore certified Vedic gemstones.`);
    }

    await admin.from('agent_followups').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', followupId);
    await updateAgentSession(sessionId, { status: 'closed', closed_at: new Date().toISOString() });
    return { sent: true };
  } catch (err) {
    await admin
      .from('agent_followups')
      .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'unknown' })
      .eq('id', followupId);
    throw err;
  }
}
