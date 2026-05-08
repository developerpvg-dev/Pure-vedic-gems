import { getResendClient } from '@/lib/resend/client';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PureVedicGems <orders@purevedicgems.com>';

function escapeHtml(value: string | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendTrackingUpdateEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  status: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return null;

  try {
    const resend = getResendClient();
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
        <h2>Your PureVedicGems order has a tracking update</h2>
        <p>Namaste ${escapeHtml(input.customerName || 'Customer')},</p>
        <p>Order <strong>${escapeHtml(input.orderNumber)}</strong> is now <strong>${escapeHtml(input.status.replace(/_/g, ' '))}</strong>.</p>
        ${input.carrier ? `<p><strong>Carrier:</strong> ${escapeHtml(input.carrier)}</p>` : ''}
        ${input.trackingNumber ? `<p><strong>Tracking number:</strong> ${escapeHtml(input.trackingNumber)}</p>` : ''}
        ${input.estimatedDelivery ? `<p><strong>Estimated delivery:</strong> ${escapeHtml(input.estimatedDelivery)}</p>` : ''}
        ${input.trackingUrl ? `<p><a href="${escapeHtml(input.trackingUrl)}" style="color:#8a5a10">Track your package</a></p>` : ''}
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: input.to,
      subject: `Tracking update - ${input.orderNumber} | PureVedicGems`,
      html,
    });

    if (error) {
      console.error('[Resend] Failed to send tracking update:', error);
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.error('[Resend] Unexpected tracking email error:', error);
    return null;
  }
}