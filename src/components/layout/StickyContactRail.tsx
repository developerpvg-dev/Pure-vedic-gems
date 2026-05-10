'use client';

export function StickyContactRail() {
  const railStyle = {
    position: 'fixed',
    top: 'auto',
    bottom: 'clamp(88px, 10vh, 120px)',
    right: 'clamp(6px, 0.9vw, 12px)',
    transform: 'none',
    zIndex: 920,
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(6px, 0.8vw, 8px)',
    padding: 'clamp(8px, 1vw, 10px) clamp(7px, 0.9vw, 8px)',
    borderRadius: '999px',
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(249, 246, 240, 0.96) 100%)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    boxShadow: '0 12px 28px rgba(148, 163, 184, 0.18), 0 2px 8px rgba(255, 255, 255, 0.9) inset',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as const;

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'clamp(28px, 2.2vw, 32px)',
    height: 'clamp(42px, 3.4vw, 48px)',
    borderRadius: '999px',
    boxShadow: '0 10px 20px rgba(148, 163, 184, 0.16)',
    textDecoration: 'none',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    background: '#ffffff',
  } as const;

  const callStyle = {
    ...buttonStyle,
    background: 'linear-gradient(180deg, #f8fbff 0%, #edf5ff 100%)',
    borderColor: 'rgba(191, 219, 254, 0.95)',
    boxShadow: '0 10px 20px rgba(59, 130, 246, 0.14)',
    color: '#111111',
  } as const;

  const whatsappStyle = {
    ...buttonStyle,
    background: 'linear-gradient(180deg, #f6fff8 0%, #ebfff1 100%)',
    borderColor: 'rgba(187, 247, 208, 0.95)',
    boxShadow: '0 10px 20px rgba(34, 197, 94, 0.14)',
    color: '#111111',
  } as const;

  const iconStyle = {
    width: 'clamp(12px, 1.1vw, 14px)',
    height: 'clamp(12px, 1.1vw, 14px)',
    flex: '0 0 auto',
  } as const;

  return (
    <>
      <style>{`
        .pvg-sticky-contact-rail {
          top: auto !important;
          bottom: clamp(88px, 10vh, 120px) !important;
          right: 12px !important;
          gap: 8px !important;
          padding: 9px 8px !important;
        }

        .pvg-sticky-contact-link {
          width: 32px !important;
          height: 48px !important;
          box-shadow: 0 10px 20px rgba(148, 163, 184, 0.16) !important;
        }

        .pvg-sticky-contact-link svg {
          width: 14px !important;
          height: 14px !important;
        }

        @media (max-width: 1024px) {
          .pvg-sticky-contact-rail {
            bottom: clamp(80px, 9vh, 104px) !important;
            right: 8px !important;
            gap: 7px !important;
            padding: 8px 7px !important;
          }

          .pvg-sticky-contact-link {
            width: 28px !important;
            height: 42px !important;
          }

          .pvg-sticky-contact-link svg {
            width: 12px !important;
            height: 12px !important;
          }
        }

        @media (max-width: 767px) {
          .pvg-sticky-contact-rail {
            bottom: calc(env(safe-area-inset-bottom, 0px) + 72px) !important;
            right: 6px !important;
            gap: 6px !important;
            padding: 7px 6px !important;
          }

          .pvg-sticky-contact-link {
            width: 24px !important;
            height: 36px !important;
          }

          .pvg-sticky-contact-link svg {
            width: 10px !important;
            height: 10px !important;
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
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </a>
      </div>
    </>
  );
}