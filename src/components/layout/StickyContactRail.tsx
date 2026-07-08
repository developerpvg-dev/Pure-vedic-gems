'use client';

/** Clears the fixed scroll-to-top control (48px tall, 24px from bottom) plus rail gap. */
const STICKY_CONTACT_BOTTOM_OFFSET = 'calc(env(safe-area-inset-bottom, 0px) + 82px)';
const STICKY_CONTACT_BOTTOM_OFFSET_MOBILE = 'calc(env(safe-area-inset-bottom, 0px) + 76px)';

export function StickyContactRail() {
  const railStyle = {
    position: 'fixed',
    top: 'auto',
    bottom: STICKY_CONTACT_BOTTOM_OFFSET,
    left: 'auto',
    right: '0px',
    width: 'fit-content',
    transform: 'none',
    zIndex: 920,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: 0,
    borderRadius: '14px 0 0 14px',
    background: 'transparent',
    border: 0,
    boxShadow: 'none',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as const;

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '12px 0 0 12px',
    boxShadow: '0 10px 20px rgba(148, 163, 184, 0.16)',
    textDecoration: 'none',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    background: '#ffffff',
  } as const;

  const callStyle = {
    ...buttonStyle,
    background: '#A746F4',
    borderColor: '#A746F4',
    boxShadow: '0 12px 24px rgba(167, 70, 244, 0.28)',
    color: '#ffffff',
  } as const;

  const whatsappStyle = {
    ...buttonStyle,
    background: '#25D366',
    borderColor: '#25D366',
    boxShadow: '0 12px 24px rgba(37, 211, 102, 0.28)',
    color: '#ffffff',
  } as const;

  const iconStyle = {
    width: '18px',
    height: '18px',
    flex: '0 0 auto',
  } as const;

  return (
    <>
      <style>{`
        .pvg-sticky-contact-rail {
          top: auto !important;
          bottom: ${STICKY_CONTACT_BOTTOM_OFFSET} !important;
          left: auto !important;
          right: 0 !important;
          width: fit-content !important;
          transform: none !important;
          gap: 10px !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .pvg-sticky-contact-link {
          width: 48px !important;
          height: 48px !important;
          border-radius: 12px 0 0 12px !important;
          box-shadow: 0 10px 20px rgba(148, 163, 184, 0.16) !important;
        }

        .pvg-sticky-contact-link svg {
          width: 18px !important;
          height: 18px !important;
        }

        @media (max-width: 1024px) {
          .pvg-sticky-contact-rail {
            top: auto !important;
            bottom: ${STICKY_CONTACT_BOTTOM_OFFSET} !important;
            left: auto !important;
            right: 0 !important;
            transform: none !important;
            gap: 9px !important;
          }

          .pvg-sticky-contact-link {
            width: 46px !important;
            height: 46px !important;
          }

          .pvg-sticky-contact-link svg {
            width: 17px !important;
            height: 17px !important;
          }
        }

        @media (max-width: 767px) {
          .pvg-sticky-contact-rail {
            top: auto !important;
            bottom: ${STICKY_CONTACT_BOTTOM_OFFSET_MOBILE} !important;
            left: auto !important;
            right: env(safe-area-inset-right, 0px) !important;
            transform: none !important;
            gap: 6px !important;
          }

          .pvg-sticky-contact-link {
            width: 46px !important;
            height: 46px !important;
          }

          .pvg-sticky-contact-link svg {
            width: 17px !important;
            height: 17px !important;
          }
        }
      `}</style>

      <div className="pvg-sticky-contact-rail" aria-label="Quick contact actions" style={railStyle}>
        <a href="tel:+919310172512" className="pvg-sticky-contact-link pvg-sticky-contact-call" aria-label="Call us" style={callStyle}>
          <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.64 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l1.15-1.15a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2.02z" />
          </svg>
        </a>

        <a
          href="https://wa.me/919310172512"
          className="pvg-sticky-contact-link pvg-sticky-contact-whatsapp"
          style={whatsappStyle}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
            <path d="M20.52 3.48A11.8 11.8 0 0 0 12.13 0C5.58 0 .25 5.34.25 11.9c0 2.09.55 4.14 1.58 5.94L0 24l6.34-1.66a11.9 11.9 0 0 0 5.79 1.48h.01c6.55 0 11.88-5.34 11.88-11.9 0-3.17-1.23-6.14-3.5-8.44ZM12.13 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.22-3.76.99 1-3.67-.24-.38a9.86 9.86 0 0 1-1.52-5.24c0-5.46 4.44-9.9 9.91-9.9 2.64 0 5.11 1.03 6.98 2.91a9.82 9.82 0 0 1 2.9 6.99c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.19.3-.76.97-.93 1.17-.17.19-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.77-1.65-2.06-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.19.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.38-.28.29-1.04 1.01-1.04 2.47s1.06 2.88 1.21 3.08c.15.19 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.72.22 1.37.19 1.89.11.57-.08 1.77-.72 2.02-1.42.25-.69.25-1.28.18-1.41-.08-.12-.28-.19-.57-.34Z" />
          </svg>
        </a>
      </div>
    </>
  );
}