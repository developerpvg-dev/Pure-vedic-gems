/**
 * Shared styles for PureVedicGems transactional emails.
 */

export const emailColors = {
  background: '#FDF7EE',
  surface: '#FFFFFF',
  header: '#3D2B1F',
  gold: '#C9A84C',
  text: '#261A10',
  muted: '#7A6250',
  border: 'rgba(61,43,31,0.12)',
  highlightBg: '#FBF4E8',
  highlightBorder: 'rgba(201,168,76,0.35)',
};

export const emailFonts = {
  serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
  sans: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
};

export const bodyStyle = {
  backgroundColor: emailColors.background,
  fontFamily: emailFonts.sans,
  margin: 0,
  padding: '24px 0',
};

export const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: emailColors.surface,
  border: `1px solid ${emailColors.border}`,
  borderRadius: '12px',
  overflow: 'hidden' as const,
};

export const headerStyle = {
  backgroundColor: emailColors.header,
  padding: '28px 24px 24px',
  textAlign: 'center' as const,
};

export const logoImageStyle = {
  margin: '0 auto 10px',
  display: 'block' as const,
};

export const wordmarkStyle = {
  margin: '0 auto 6px',
  display: 'block' as const,
};

export const taglineStyle = {
  color: 'rgba(255,255,255,0.72)',
  fontSize: '11px',
  margin: '8px 0 0 0',
  letterSpacing: '2.5px',
  textTransform: 'uppercase' as const,
  fontFamily: emailFonts.sans,
};

export const contentStyle = {
  padding: '32px 28px',
};

export const h1Style = {
  color: emailColors.header,
  fontSize: '26px',
  fontWeight: 700 as const,
  fontFamily: emailFonts.serif,
  margin: '0 0 18px 0',
  lineHeight: '1.3',
};

export const h2Style = {
  color: emailColors.header,
  fontSize: '17px',
  fontWeight: 600 as const,
  fontFamily: emailFonts.serif,
  margin: '28px 0 12px 0',
};

export const textStyle = {
  color: emailColors.text,
  fontSize: '15px',
  lineHeight: '26px',
  margin: '0 0 14px 0',
};

export const highlightBoxStyle = {
  backgroundColor: emailColors.highlightBg,
  border: `1px solid ${emailColors.highlightBorder}`,
  borderRadius: '10px',
  padding: '18px 20px',
  textAlign: 'center' as const,
  margin: '22px 0',
};

export const highlightLabelStyle = {
  color: emailColors.muted,
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 6px 0',
};

export const highlightValueStyle = {
  color: emailColors.header,
  fontSize: '22px',
  fontWeight: 700 as const,
  fontFamily: emailFonts.serif,
  margin: 0,
};

export const detailTableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  margin: '18px 0 8px',
};

export const detailLabelStyle = {
  color: emailColors.muted,
  fontSize: '13px',
  padding: '10px 0',
  borderBottom: `1px solid ${emailColors.border}`,
  width: '38%',
  verticalAlign: 'top' as const,
};

export const detailValueStyle = {
  color: emailColors.text,
  fontSize: '14px',
  padding: '10px 0 10px 12px',
  borderBottom: `1px solid ${emailColors.border}`,
  verticalAlign: 'top' as const,
  fontWeight: 500 as const,
};

export const primaryButtonStyle = {
  backgroundColor: emailColors.gold,
  color: '#FFFFFF',
  padding: '14px 30px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600 as const,
  fontSize: '15px',
  display: 'inline-block',
};

export const secondaryButtonStyle = {
  backgroundColor: 'transparent',
  color: emailColors.header,
  padding: '12px 26px',
  border: `1px solid ${emailColors.border}`,
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 500 as const,
  fontSize: '14px',
  display: 'inline-block',
};

export const dividerStyle = {
  borderColor: emailColors.border,
  margin: '20px 0',
};

export const disclaimerStyle = {
  color: emailColors.muted,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '24px 0 0 0',
  padding: '14px 16px',
  backgroundColor: emailColors.highlightBg,
  borderRadius: '8px',
};

export const footerStyle = {
  backgroundColor: emailColors.background,
  padding: '24px 28px',
  textAlign: 'center' as const,
  borderTop: `1px solid ${emailColors.border}`,
};

export const footerTextStyle = {
  color: emailColors.muted,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 6px 0',
};

export const footerLinkStyle = {
  color: emailColors.gold,
  textDecoration: 'none',
};

export const itemRowStyle = {
  padding: '8px 0',
};

export const itemNameStyle = {
  color: emailColors.text,
  fontSize: '14px',
  margin: 0,
};

export const itemPriceStyle = {
  color: emailColors.header,
  fontSize: '14px',
  fontWeight: 600 as const,
  margin: 0,
};

export const totalRowStyle = {
  padding: '4px 0',
};

export const totalLabelStyle = {
  color: emailColors.muted,
  fontSize: '14px',
  margin: 0,
};

export const totalValueStyle = {
  color: emailColors.text,
  fontSize: '14px',
  margin: 0,
};

export const grandTotalLabelStyle = {
  color: emailColors.header,
  fontSize: '16px',
  fontWeight: 700 as const,
  margin: 0,
};

export const grandTotalValueStyle = {
  color: emailColors.gold,
  fontSize: '20px',
  fontWeight: 700 as const,
  margin: 0,
};

export const addressStyle = {
  color: emailColors.text,
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
};
