/**
 * Order Confirmation Email Template — React Email
 * Sent via Resend after successful payment.
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Row,
  Column,
  Heading,
} from '@react-email/components';

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
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
  orderId,
  items,
  subtotal,
  shippingCost,
  gstAmount,
  total,
  shippingAddress,
  siteUrl,
}: OrderConfirmationEmailProps) {
  const trackUrl = `${siteUrl}/account/orders`;
  const whatsappUrl = `https://wa.me/919871582404?text=Hi%2C%20I%20just%20placed%20order%20${encodeURIComponent(orderNumber)}`;

  return (
    <Html>
      <Head />
      <Preview>Your PureVedicGems order {orderNumber} is confirmed!</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>PureVedicGems</Text>
            <Text style={taglineStyle}>Heritage Vedic Gemstones Since 1937</Text>
          </Section>

          {/* Greeting */}
          <Section style={contentStyle}>
            <Heading as="h1" style={h1Style}>
              Order Confirmed ✨
            </Heading>
            <Text style={textStyle}>
              Dear {customerName},
            </Text>
            <Text style={textStyle}>
              Thank you for your order! We have received your payment and your order is
              being processed. Our gemologists will carefully prepare your order with
              utmost care.
            </Text>

            {/* Order Number */}
            <Section style={orderBoxStyle}>
              <Text style={orderLabelStyle}>Order Number</Text>
              <Text style={orderNumberStyle}>{orderNumber}</Text>
            </Section>

            {/* Items */}
            <Heading as="h2" style={h2Style}>
              Order Summary
            </Heading>
            {items.map((item, i) => (
              <Row key={i} style={itemRowStyle}>
                <Column style={{ width: '60%' }}>
                  <Text style={itemNameStyle}>
                    {item.name} × {item.quantity}
                  </Text>
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' as const }}>
                  <Text style={itemPriceStyle}>{formatINR(item.line_total)}</Text>
                </Column>
              </Row>
            ))}

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
                💬 Need Help? WhatsApp Us
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Pure Vedic Gems Pvt. Ltd. · Est. 1937
            </Text>
            <Text style={footerTextStyle}>
              📞 +91-9871582404 · 📧 info@purevedicgems.com
            </Text>
            <Text style={{ ...footerTextStyle, fontSize: '11px', color: '#999' }}>
              This email was sent because you placed an order on PureVedicGems.
              If you did not make this purchase, please contact us immediately.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const bodyStyle = {
  backgroundColor: '#FDF7EE',
  fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#FFFFFF',
};

const headerStyle = {
  backgroundColor: '#3D2B1F',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const logoStyle = {
  color: '#C9A84C',
  fontSize: '28px',
  fontWeight: '700' as const,
  fontFamily: "'Playfair Display', Georgia, serif",
  margin: 0,
  letterSpacing: '1px',
};

const taglineStyle = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '12px',
  margin: '4px 0 0 0',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
};

const contentStyle = {
  padding: '32px 24px',
};

const h1Style = {
  color: '#3D2B1F',
  fontSize: '24px',
  fontWeight: '700' as const,
  fontFamily: "'Playfair Display', Georgia, serif",
  marginBottom: '16px',
};

const h2Style = {
  color: '#3D2B1F',
  fontSize: '18px',
  fontWeight: '600' as const,
  fontFamily: "'Playfair Display', Georgia, serif",
  marginTop: '28px',
  marginBottom: '12px',
};

const textStyle = {
  color: '#261A10',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px 0',
};

const orderBoxStyle = {
  backgroundColor: '#FDF7EE',
  border: '1px solid rgba(201,168,76,0.3)',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const orderLabelStyle = {
  color: '#7A6250',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 4px 0',
};

const orderNumberStyle = {
  color: '#3D2B1F',
  fontSize: '22px',
  fontWeight: '700' as const,
  fontFamily: "'Playfair Display', Georgia, serif",
  margin: 0,
};

const itemRowStyle = {
  padding: '8px 0',
};

const itemNameStyle = {
  color: '#261A10',
  fontSize: '14px',
  margin: 0,
};

const itemPriceStyle = {
  color: '#3D2B1F',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: 0,
};

const dividerStyle = {
  borderColor: 'rgba(61,43,31,0.12)',
  margin: '16px 0',
};

const totalRowStyle = {
  padding: '4px 0',
};

const totalLabelStyle = {
  color: '#7A6250',
  fontSize: '14px',
  margin: 0,
};

const totalValueStyle = {
  color: '#261A10',
  fontSize: '14px',
  margin: 0,
};

const grandTotalLabelStyle = {
  color: '#3D2B1F',
  fontSize: '16px',
  fontWeight: '700' as const,
  margin: 0,
};

const grandTotalValueStyle = {
  color: '#C9A84C',
  fontSize: '20px',
  fontWeight: '700' as const,
  margin: 0,
};

const addressStyle = {
  color: '#261A10',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
};

const primaryButtonStyle = {
  backgroundColor: '#C9A84C',
  color: '#FFFFFF',
  padding: '14px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600' as const,
  fontSize: '15px',
  display: 'inline-block',
};

const secondaryButtonStyle = {
  backgroundColor: 'transparent',
  color: '#3D2B1F',
  padding: '12px 28px',
  border: '1px solid rgba(61,43,31,0.2)',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '500' as const,
  fontSize: '14px',
  display: 'inline-block',
};

const footerStyle = {
  backgroundColor: '#FDF7EE',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerTextStyle = {
  color: '#7A6250',
  fontSize: '12px',
  margin: '0 0 6px 0',
};

export default OrderConfirmationEmail;
