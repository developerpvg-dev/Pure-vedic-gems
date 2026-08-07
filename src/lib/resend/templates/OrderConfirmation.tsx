/**
 * Order Confirmation Email Template — React Email
 * Sent via Resend after successful payment.
 */

import { Section, Text, Link, Hr, Row, Column, Heading } from '@react-email/components';
import { EmailLayout } from '@/lib/resend/templates/EmailLayout';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import {
  contentStyle,
  h1Style,
  h2Style,
  textStyle,
  highlightBoxStyle,
  highlightLabelStyle,
  highlightValueStyle,
  itemRowStyle,
  itemNameStyle,
  itemPriceStyle,
  dividerStyle,
  totalRowStyle,
  totalLabelStyle,
  totalValueStyle,
  grandTotalLabelStyle,
  grandTotalValueStyle,
  addressStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '@/lib/resend/templates/shared/styles';
import { formatConfigurationDetailText } from '@/lib/utils/rudraksha-order-display';
import {
  buildOrderPriceLines,
  orderItemMerchandiseTotal,
  type OrderChargeFields,
} from '@/lib/orders/price-breakdown-lines';
import {
  formatOrderMoney,
  type OrderChargeContext,
} from '@/lib/currency/format-charged';

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  configuration_summary?: string;
  configuration_snapshot?: unknown;
}

export interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderId: string;
  items: OrderItem[];
  charges: OrderChargeFields;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod?: string;
  /** Advance payments: what landed now and what is still owed. */
  amountPaid?: number;
  amountDue?: number;
  /** Locked storefront FX for this order — amounts render as $X (₹Y). */
  chargeContext?: OrderChargeContext | null;
  siteUrl: string;
  /** Sealed link to upload ring internal-diameter photo (ring orders only). */
  ringSizeConfirmUrl?: string;
  ringSizeConfirmCopy?: string;
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  items,
  charges,
  shippingAddress,
  amountPaid,
  amountDue,
  chargeContext = null,
  siteUrl,
  ringSizeConfirmUrl,
  ringSizeConfirmCopy,
}: OrderConfirmationEmailProps) {
  const money = (n: number) => formatOrderMoney(n, chargeContext);
  const resolvedSiteUrl = siteUrl || getEmailSiteUrl();
  const trackUrl = `${resolvedSiteUrl}/account/orders`;
  const whatsappUrl = getWhatsAppUrl(`Hi, I just placed order ${orderNumber}`);
  const priceLines = buildOrderPriceLines(charges).filter((line) => line.key !== 'gst');
  const total = Number(charges.total ?? 0);
  const due = Number(amountDue ?? 0);
  // Never invent "paid = total" when amountPaid was omitted — that made partial
  // settlements look fully paid in the confirmation email.
  const paid = amountPaid != null ? Number(amountPaid) : due > 0.009 ? 0 : total;
  const isAdvance = due > 0.009;

  return (
    <EmailLayout
      preview={`Your PureVedicGems order ${orderNumber} is confirmed`}
      footerNote="This email was sent because you placed an order on PureVedicGems. If you did not make this purchase, please contact us immediately."
    >
      <Section style={contentStyle}>
            <Heading as="h1" style={h1Style}>
              Order Confirmed
            </Heading>
            <Text style={textStyle}>
              Dear {customerName},
            </Text>
            <Text style={textStyle}>
              {isAdvance
                ? `Thank you for your order! We have received your advance payment of ${money(paid)} and your order is confirmed. Our gemologists will now prepare your order with utmost care.`
                : 'Thank you for your order! We have received your payment and your order is being processed. Our gemologists will carefully prepare your order with utmost care.'}
            </Text>
            {isAdvance ? (
              <Text style={textStyle}>
                The remaining balance of <strong>{money(due)}</strong> becomes payable once your
                order is ready. We will email you with a secure payment link at that point — your
                order ships after the balance is settled.
              </Text>
            ) : null}

            <Section style={highlightBoxStyle}>
              <Text style={highlightLabelStyle}>Order Number</Text>
              <Text style={highlightValueStyle}>{orderNumber}</Text>
            </Section>

            {/* Items */}
            <Heading as="h2" style={h2Style}>
              Order Summary
            </Heading>
            {items.map((item, i) => {
              const configDetail = formatConfigurationDetailText(
                item.configuration_snapshot,
                item.configuration_summary
              );
              return (
              <Row key={i} style={itemRowStyle}>
                <Column style={{ width: '60%' }}>
                  <Text style={itemNameStyle}>
                    {item.name} × {item.quantity}
                  </Text>
                  {configDetail ? (
                    <Text style={{ ...textStyle, fontSize: '12px', color: '#6b5b4e', marginTop: '4px' }}>
                      {configDetail}
                    </Text>
                  ) : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' as const }}>
                  <Text style={itemPriceStyle}>{money(orderItemMerchandiseTotal(item))}</Text>
                </Column>
              </Row>
            );
            })}

            <Hr style={dividerStyle} />

            {/* Totals — same lines as checkout confirmation / account / admin */}
            {priceLines.map((line) => (
              <Row key={line.key} style={totalRowStyle}>
                <Column><Text style={totalLabelStyle}>{line.label}</Text></Column>
                <Column style={{ textAlign: 'right' as const }}>
                  <Text style={totalValueStyle}>
                    {line.sign < 0 ? '−' : ''}
                    {money(line.amount)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={dividerStyle} />

            <Row style={totalRowStyle}>
              <Column><Text style={grandTotalLabelStyle}>Order Total</Text></Column>
              <Column style={{ textAlign: 'right' as const }}><Text style={grandTotalValueStyle}>{money(total)}</Text></Column>
            </Row>

            {isAdvance ? (
              <>
                <Row style={totalRowStyle}>
                  <Column><Text style={totalLabelStyle}>Advance paid now</Text></Column>
                  <Column style={{ textAlign: 'right' as const }}>
                    <Text style={totalValueStyle}>{money(paid)}</Text>
                  </Column>
                </Row>
                <Row style={totalRowStyle}>
                  <Column><Text style={grandTotalLabelStyle}>Balance due later</Text></Column>
                  <Column style={{ textAlign: 'right' as const }}>
                    <Text style={grandTotalValueStyle}>{money(due)}</Text>
                  </Column>
                </Row>
              </>
            ) : (
              <Row style={totalRowStyle}>
                <Column><Text style={totalLabelStyle}>Amount paid</Text></Column>
                <Column style={{ textAlign: 'right' as const }}>
                  <Text style={totalValueStyle}>{money(paid)}</Text>
                </Column>
              </Row>
            )}

            {/* Shipping Address */}
            <Heading as="h2" style={h2Style}>
              Shipping Address
            </Heading>
            <Text style={addressStyle}>
              {shippingAddress.line1}
              {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}
              <br />
              {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
              <br />
              {shippingAddress.country}
            </Text>

            {ringSizeConfirmUrl && ringSizeConfirmCopy ? (
              <>
                <Hr style={dividerStyle} />
                <Text style={{ ...textStyle, marginTop: '24px' }}>
                  <strong>Regarding your ring size,</strong>{' '}
                  {ringSizeConfirmCopy.replace(/^\*?Regarding your ring size,?\*?/i, '').trim()}
                </Text>
                <Section style={{ textAlign: 'center' as const, marginTop: '20px' }}>
                  <Link href={ringSizeConfirmUrl} style={primaryButtonStyle}>
                    Submit ring diameter photo
                  </Link>
                </Section>
              </>
            ) : null}

            {/* CTA Buttons */}
            <Section style={{ textAlign: 'center' as const, marginTop: '32px' }}>
              <Link href={trackUrl} style={ringSizeConfirmUrl ? secondaryButtonStyle : primaryButtonStyle}>
                Track Your Order
              </Link>
            </Section>

            <Section style={{ textAlign: 'center' as const, marginTop: '16px' }}>
              <Link href={whatsappUrl} style={secondaryButtonStyle}>
                Need Help? WhatsApp Us
              </Link>
            </Section>
      </Section>
    </EmailLayout>
  );
}

export default OrderConfirmationEmail;
