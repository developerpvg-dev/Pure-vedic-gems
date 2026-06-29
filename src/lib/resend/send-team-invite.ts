import { sendBrandedEmail } from '@/lib/resend/send-email';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

type SendTeamInviteEmailInput = {
  to: string;
  name: string;
  roleLabel: string;
  inviteUrl: string;
  expiresMinutes: number;
  invitedByName?: string | null;
};

export async function sendTeamInviteEmail({
  to,
  name,
  roleLabel,
  inviteUrl,
  expiresMinutes,
  invitedByName,
}: SendTeamInviteEmailInput) {
  return sendBrandedEmail({
    to,
    subject: `You're invited to join Pure Vedic Gems as ${roleLabel}`,
    channel: 'general',
    react: TransactionalEmail({
      preview: `Accept your ${roleLabel} invitation within ${expiresMinutes} minutes.`,
      heading: 'Team invitation',
      greeting: `Hello ${name},`,
      paragraphs: [
        invitedByName
          ? `${invitedByName} has invited you to join the Pure Vedic Gems team as ${roleLabel}.`
          : `You have been invited to join the Pure Vedic Gems team as ${roleLabel}.`,
        `This secure link expires in ${expiresMinutes} minutes. After accepting, you can sign in and access your assigned workspace.`,
      ],
      cta: { label: 'Accept invitation', href: inviteUrl },
      footerNote: 'If you did not expect this invitation, you can ignore this email.',
    }),
  });
}

export async function sendDesignerOrderAssignedEmail({
  to,
  designerName,
  orderNumber,
  orderUrl,
}: {
  to: string;
  designerName: string;
  orderNumber: string;
  orderUrl: string;
}) {
  return sendBrandedEmail({
    to,
    subject: `New design assignment — ${orderNumber}`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Order ${orderNumber} has been assigned to you for jewelry design.`,
      heading: 'New design assignment',
      greeting: `Hello ${designerName},`,
      paragraphs: [
        `Order ${orderNumber} has been routed to you for ring, pendant, or jewelry design work.`,
        'Open the assignment to review specifications, configuration details, and customer notes.',
      ],
      cta: { label: 'Open design order', href: orderUrl },
    }),
  });
}
