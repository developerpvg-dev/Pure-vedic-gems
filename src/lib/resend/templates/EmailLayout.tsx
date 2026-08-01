/**
 * Branded email shell — logo, header, footer.
 * Used by every transactional email.
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
  Hr,
} from '@react-email/components';
import {
  getEmailLogoUrl,
  getEmailSiteUrl,
  getSupportEmail,
  getSupportPhone,
} from '@/lib/resend/email-config';
import {
  bodyStyle,
  containerStyle,
  headerStyle,
  logoImageStyle,
  brandNameStyle,
  taglineStyle,
  headerRuleStyle,
  footerStyle,
  footerTextStyle,
  footerLinkStyle,
  emailColors,
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
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Link href={siteUrl} style={{ textDecoration: 'none' }}>
              <Img
                src={getEmailLogoUrl()}
                alt="Pure Vedic Gems"
                width="88"
                height="88"
                style={logoImageStyle}
              />
              <Text style={brandNameStyle}>Pure Vedic Gems</Text>
            </Link>
            <Text style={taglineStyle}>Heritage Vedic Gemstones · Since 1937</Text>
          </Section>
          <Hr style={headerRuleStyle} />

          {children}

          <Section style={footerStyle}>
            <Text
              style={{
                ...footerTextStyle,
                color: emailColors.header,
                fontFamily: "Georgia, 'Times New Roman', Times, serif",
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                marginBottom: '10px',
              }}
            >
              Pure Vedic Gems Pvt. Ltd. · Est. 1937
            </Text>
            <Text style={footerTextStyle}>
              <Link href={`tel:${getSupportPhone().replace(/\s/g, '')}`} style={footerLinkStyle}>
                {getSupportPhone()}
              </Link>
              {'  ·  '}
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
              <Text
                style={{
                  ...footerTextStyle,
                  fontSize: '11px',
                  marginTop: '14px',
                  color: emailColors.muted,
                  lineHeight: '18px',
                }}
              >
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
