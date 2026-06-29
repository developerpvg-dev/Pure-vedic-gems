/**
 * Branded email shell — logo, header, footer.
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Img,
  Link,
} from '@react-email/components';
import {
  getEmailLogoUrl,
  getEmailWordmarkUrl,
  getEmailSiteUrl,
  getSupportEmail,
  getSupportPhone,
} from '@/lib/resend/email-config';
import {
  bodyStyle,
  containerStyle,
  headerStyle,
  logoImageStyle,
  wordmarkStyle,
  taglineStyle,
  footerStyle,
  footerTextStyle,
  footerLinkStyle,
} from '@/lib/resend/templates/shared/styles';

type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
  footerNote?: string;
};

export function EmailLayout({ preview, children, footerNote }: EmailLayoutProps) {
  const siteUrl = getEmailSiteUrl();

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text
              style={{
                color: '#C9A84C',
                fontSize: '26px',
                fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                margin: '0 0 12px',
                letterSpacing: '0.5px',
              }}
            >
              Pure Vedic Gems
            </Text>
            <Img
              src={getEmailLogoUrl()}
              alt=""
              width="64"
              height="64"
              style={logoImageStyle}
            />
            <Img
              src={getEmailWordmarkUrl()}
              alt=""
              width="180"
              height="42"
              style={wordmarkStyle}
            />
            <Text style={taglineStyle}>Heritage Vedic Gemstones · Since 1937</Text>
          </Section>

          {children}

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Pure Vedic Gems Pvt. Ltd. · Est. 1937
            </Text>
            <Text style={footerTextStyle}>
              <Link href={`tel:${getSupportPhone().replace(/\s/g, '')}`} style={footerLinkStyle}>
                {getSupportPhone()}
              </Link>
              {' · '}
              <Link href={`mailto:${getSupportEmail()}`} style={footerLinkStyle}>
                {getSupportEmail()}
              </Link>
            </Text>
            <Text style={footerTextStyle}>
              <Link href={siteUrl} style={footerLinkStyle}>
                {siteUrl.replace(/^https?:\/\//, '')}
              </Link>
            </Text>
            {footerNote ? (
              <Text style={{ ...footerTextStyle, fontSize: '11px', marginTop: '12px' }}>
                {footerNote}
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EmailLayout;
