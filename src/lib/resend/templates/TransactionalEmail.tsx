/**
 * Flexible transactional email body used across most notification types.
 */

import { Section, Text, Heading, Link, Hr } from '@react-email/components';
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
  primaryButtonStyle,
  secondaryButtonStyle,
  disclaimerStyle,
  dividerStyle,
} from '@/lib/resend/templates/shared/styles';

export type EmailDetail = {
  label: string;
  value: string | number | null | undefined;
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

        {greeting ? <Text style={textStyle}>{greeting}</Text> : null}

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
                          <Link href={text} style={{ ...detailValueStyle, color: '#1c1917' }}>
                            View photo
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
            <Section style={{ textAlign: 'center' as const, marginTop: '8px' }}>
              {cta ? (
                <Link href={cta.href} style={primaryButtonStyle}>
                  {cta.label}
                </Link>
              ) : null}
            </Section>
            {secondaryCta ? (
              <Section style={{ textAlign: 'center' as const, marginTop: '14px' }}>
                <Link href={secondaryCta.href} style={secondaryButtonStyle}>
                  {secondaryCta.label}
                </Link>
              </Section>
            ) : null}
          </>
        ) : null}

        {disclaimer ? <Text style={disclaimerStyle}>{disclaimer}</Text> : null}
      </Section>
    </EmailLayout>
  );
}

export default TransactionalEmail;
