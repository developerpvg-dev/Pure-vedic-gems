/**
 * Flexible transactional email body used across most notification types.
 */

import { Section, Text, Heading, Link, Hr, Row, Column } from '@react-email/components';
import { EmailLayout } from '@/lib/resend/templates/EmailLayout';
import {
  contentStyle,
  h1Style,
  h2Style,
  textStyle,
  highlightBoxStyle,
  highlightLabelStyle,
  highlightValueStyle,
  detailTableStyle,
  detailLabelStyle,
  detailValueStyle,
  detailLinkStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  disclaimerStyle,
  dividerStyle,
} from '@/lib/resend/templates/shared/styles';

export type EmailDetail = {
  label: string;
  value: string | number | null | undefined;
  /** Override auto link text when value is a URL */
  linkLabel?: string;
};

export type TransactionalEmailProps = {
  preview: string;
  heading: string;
  greeting?: string;
  paragraphs?: string[];
  highlight?: { label: string; value: string };
  detailsTitle?: string;
  details?: EmailDetail[];
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  disclaimer?: string;
  footerNote?: string;
};

function visibleDetails(details: EmailDetail[] | undefined) {
  return (details ?? []).filter((row) => row.value != null && String(row.value).trim() !== '');
}

function linkLabelFor(row: EmailDetail, href: string): string {
  if (row.linkLabel?.trim()) return row.linkLabel.trim();
  const label = row.label.toLowerCase();
  if (label.includes('video')) return 'Watch video';
  if (label.includes('photo') || label.includes('image') || label.includes('proof')) return 'View photo';
  if (label.includes('track')) return 'Track shipment';
  if (label.includes('whatsapp')) return 'Chat on WhatsApp';
  if (/\.(mp4|webm|mov)(\?|$)/i.test(href) || /youtube|youtu\.be|vimeo|drive\.google/i.test(href)) {
    return 'Watch video';
  }
  return 'Open link';
}

export function TransactionalEmail({
  preview,
  heading,
  greeting,
  paragraphs = [],
  highlight,
  detailsTitle = 'Details',
  details,
  cta,
  secondaryCta,
  disclaimer,
  footerNote,
}: TransactionalEmailProps) {
  const rows = visibleDetails(details);

  return (
    <EmailLayout preview={preview} footerNote={footerNote}>
      <Section style={contentStyle}>
        <Heading as="h1" style={h1Style}>
          {heading}
        </Heading>

        {greeting ? (
          <Text style={{ ...textStyle, fontWeight: 600, marginBottom: '10px' }}>{greeting}</Text>
        ) : null}

        {paragraphs.map((paragraph) => (
          <Text key={paragraph.slice(0, 48)} style={textStyle}>
            {paragraph}
          </Text>
        ))}

        {highlight ? (
          <Section style={highlightBoxStyle}>
            <Text style={highlightLabelStyle}>{highlight.label}</Text>
            <Text style={highlightValueStyle}>{highlight.value}</Text>
          </Section>
        ) : null}

        {rows.length > 0 ? (
          <>
            <Heading as="h2" style={h2Style}>
              {detailsTitle}
            </Heading>
            <table style={detailTableStyle} cellPadding={0} cellSpacing={0}>
              <tbody>
                {rows.map((row) => {
                  const text = String(row.value);
                  const isHttp = /^https?:\/\//i.test(text);
                  return (
                    <tr key={row.label}>
                      <td style={detailLabelStyle}>{row.label}</td>
                      <td style={detailValueStyle}>
                        {isHttp ? (
                          <Link href={text} style={detailLinkStyle}>
                            {linkLabelFor(row, text)}
                          </Link>
                        ) : (
                          text
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : null}

        {cta || secondaryCta ? (
          <>
            <Hr style={dividerStyle} />
            {cta && secondaryCta ? (
              <Section style={{ textAlign: 'center' as const, marginTop: '4px' }}>
                <Row>
                  <Column align="center" style={{ padding: '0 6px 12px' }}>
                    <Link href={cta.href} style={primaryButtonStyle}>
                      {cta.label}
                    </Link>
                  </Column>
                </Row>
                <Row>
                  <Column align="center" style={{ padding: '0 6px' }}>
                    <Link href={secondaryCta.href} style={secondaryButtonStyle}>
                      {secondaryCta.label}
                    </Link>
                  </Column>
                </Row>
              </Section>
            ) : (
              <>
                {cta ? (
                  <Section style={{ textAlign: 'center' as const, marginTop: '4px' }}>
                    <Link href={cta.href} style={primaryButtonStyle}>
                      {cta.label}
                    </Link>
                  </Section>
                ) : null}
                {secondaryCta ? (
                  <Section style={{ textAlign: 'center' as const, marginTop: '14px' }}>
                    <Link href={secondaryCta.href} style={secondaryButtonStyle}>
                      {secondaryCta.label}
                    </Link>
                  </Section>
                ) : null}
              </>
            )}
          </>
        ) : null}

        {disclaimer ? <Text style={disclaimerStyle}>{disclaimer}</Text> : null}
      </Section>
    </EmailLayout>
  );
}

export default TransactionalEmail;
