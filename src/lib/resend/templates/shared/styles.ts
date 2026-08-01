/**
 * Shared styles for PureVedicGems transactional emails.
 */

export const emailColors = {
  background: '#F5EFE6',
  surface: '#FFFFFF',
  header: '#2A1F18',
  headerAccent: '#3D2B1F',
  gold: '#C9A84C',
  goldSoft: '#E8D5A3',
  text: '#2A1F18',
  muted: '#7A6554',
  border: '#E8DFD2',
  highlightBg: '#FBF6EE',
  highlightBorder: '#E5D4A8',
  buttonText: '#1A140F',
};

export const emailFonts = {
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export const bodyStyle = {
  backgroundColor: emailColors.background,
  backgroundImage: 'linear-gradient(180deg, #EFE6D8 0%, #F5EFE6 120px)',
  fontFamily: emailFonts.sans,
  margin: 0,
  padding: '32px 12px',
};

export const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: emailColors.surface,
  border: `1px solid ${emailColors.border}`,
  borderRadius: '4px',
  overflow: 'hidden' as const,
  boxShadow: '0 8px 28px rgba(42, 31, 24, 0.08)',
};

export const headerStyle = {
  backgroundColor: emailColors.header,
  backgroundImage: `linear-gradient(165deg, ${emailColors.headerAccent} 0%, ${emailColors.header} 55%, #1A140F 100%)`,
  padding: '36px 28px 28px',
  textAlign: 'center' as const,
};

export const logoImageStyle = {
  margin: '0 auto 16px',
  display: 'block' as const,
  border: 0,
  outline: 'none',
};

export const wordmarkStyle = {
  margin: '0 auto 0',
  display: 'block' as const,
  border: 0,
};

export const brandNameStyle = {
  color: '#E8D5A3',
  fontSize: '20px',
  fontWeight: 700 as const,
  fontFamily: emailFonts.serif,
  margin: '0 0 2px 0',
  letterSpacing: '3.5px',
  textTransform: 'uppercase' as const,
  lineHeight: '1.3',
  textAlign: 'center' as const,
};

export const taglineStyle = {
  color: 'rgba(232, 213, 163, 0.72)',
  fontSize: '10px',
  margin: '10px 0 0 0',
  letterSpacing: '2.8px',
  textTransform: 'uppercase' as const,
  fontFamily: emailFonts.sans,
};

export const headerRuleStyle = {
  height: '3px',
  backgroundColor: emailColors.gold,
  backgroundImage: `linear-gradient(90deg, transparent 0%, ${emailColors.gold} 20%, ${emailColors.goldSoft} 50%, ${emailColors.gold} 80%, transparent 100%)`,
  border: 0,
  margin: 0,
  padding: 0,
  lineHeight: 0,
  fontSize: 0,
};

export const contentStyle = {
  padding: '36px 32px 28px',
};

export const h1Style = {
  color: emailColors.header,
  fontSize: '28px',
  fontWeight: 700 as const,
  fontFamily: emailFonts.serif,
  margin: '0 0 20px 0',
  lineHeight: '1.25',
  letterSpacing: '-0.2px',
};

export const h2Style = {
  color: emailColors.header,
  fontSize: '13px',
  fontWeight: 700 as const,
  fontFamily: emailFonts.sans,
  margin: '28px 0 12px 0',
  letterSpacing: '1.6px',
  textTransform: 'uppercase' as const,
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
  borderLeft: `3px solid ${emailColors.gold}`,
  borderRadius: '2px',
  padding: '20px 22px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

export const highlightLabelStyle = {
  color: emailColors.muted,
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2.2px',
  margin: '0 0 8px 0',
  fontWeight: 600 as const,
};

export const highlightValueStyle = {
  color: emailColors.header,
  fontSize: '24px',
  fontWeight: 700 as const,
  fontFamily: emailFonts.serif,
  margin: 0,
  letterSpacing: '0.3px',
};

export const detailTableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  margin: '8px 0 8px',
};

export const detailLabelStyle = {
  color: emailColors.muted,
  fontSize: '13px',
  padding: '12px 0',
  borderBottom: `1px solid ${emailColors.border}`,
  width: '38%',
  verticalAlign: 'top' as const,
};

export const detailValueStyle = {
  color: emailColors.text,
  fontSize: '14px',
  padding: '12px 0 12px 12px',
  borderBottom: `1px solid ${emailColors.border}`,
  verticalAlign: 'top' as const,
  fontWeight: 500 as const,
};

export const detailLinkStyle = {
  color: emailColors.header,
  fontSize: '14px',
  fontWeight: 600 as const,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
};

export const primaryButtonStyle = {
  backgroundColor: emailColors.gold,
  color: emailColors.buttonText,
  padding: '15px 32px',
  borderRadius: '2px',
  textDecoration: 'none',
  fontWeight: 700 as const,
  fontSize: '14px',
  letterSpacing: '0.6px',
  display: 'inline-block',
  border: `1px solid ${emailColors.gold}`,
};

export const secondaryButtonStyle = {
  backgroundColor: emailColors.surface,
  color: emailColors.header,
  padding: '14px 28px',
  border: `1px solid ${emailColors.header}`,
  borderRadius: '2px',
  textDecoration: 'none',
  fontWeight: 600 as const,
  fontSize: '14px',
  letterSpacing: '0.4px',
  display: 'inline-block',
};

export const dividerStyle = {
  borderColor: emailColors.border,
  borderTop: `1px solid ${emailColors.border}`,
  margin: '28px 0 22px',
};

export const disclaimerStyle = {
  color: emailColors.muted,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '28px 0 0 0',
  padding: '16px 18px',
  backgroundColor: emailColors.highlightBg,
  borderRadius: '2px',
  border: `1px solid ${emailColors.border}`,
};

export const footerStyle = {
  backgroundColor: '#F8F3EB',
  padding: '28px 32px',
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
  color: emailColors.header,
  textDecoration: 'none',
  fontWeight: 600 as const,
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
