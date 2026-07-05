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
  subtotal: number;
  shippingCost: number;
  gstAmount: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod?: string;
  siteUrl: string;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  items,
  subtotal,
  shippingCost,
  gstAmount,
  total,
  shippingAddress,
  siteUrl,
}: OrderConfirmationEmailProps) {
  const resolvedSiteUrl = siteUrl || getEmailSiteUrl();
  const trackUrl = `${resolvedSiteUrl}/account/orders`;
  const whatsappUrl = getWhatsAppUrl(`Hi, I just placed order ${orderNumber}`);

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
              Thank you for your order! We have received your payment and your order is
              being processed. Our gemologists will carefully prepare your order with
              utmost care.
            </Text>

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
                  <Text style={itemPriceStyle}>{formatINR(item.line_total)}</Text>
                </Column>
              </Row>
            );
            })}

            <Hr style={dividerStyle} />

            {/* Totals */}
            <Row style={totalRowStyle}>
              <Column><Text style={totalLabelStyle}>Subtotal</Text></Column>
              <Column style={{ textAlign: 'right' as const }}><Text style={totalValueStyle}>{formatINR(subtotal)}</Text></Column>
            </Row>
            {shippingCost > 0 && (
              <Row style={totalRowStyle}>
                <Column><Text style={totalLabelStyle}>Shipping</Text></Column>
                <Column style={{ textAlign: 'right' as const }}><Text style={totalValueStyle}>{formatINR(shippingCost)}</Text></Column>
              </Row>
            )}
            {shippingCost === 0 && (
              <Row style={totalRowStyle}>
                <Column><Text style={totalLabelStyle}>Shipping</Text></Column>
                <Column style={{ textAlign: 'right' as const }}><Text style={{ ...totalValueStyle, color: '#16a34a' }}>FREE</Text></Column>
              </Row>
            )}
            {gstAmount > 0 && (
              <Row style={totalRowStyle}>
                <Column><Text style={totalLabelStyle}>GST (3%)</Text></Column>
                <Column style={{ textAlign: 'right' as const }}><Text style={totalValueStyle}>{formatINR(gstAmount)}</Text></Column>
              </Row>
            )}

            <Hr style={dividerStyle} />

            <Row style={totalRowStyle}>
              <Column><Text style={grandTotalLabelStyle}>Total Paid</Text></Column>
              <Column style={{ textAlign: 'right' as const }}><Text style={grandTotalValueStyle}>{formatINR(total)}</Text></Column>
            </Row>

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

            {/* CTA Buttons */}
            <Section style={{ textAlign: 'center' as const, marginTop: '32px' }}>
              <Link href={trackUrl} style={primaryButtonStyle}>
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
