import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/lib/theme-context';
import { CartProvider } from '@/lib/hooks/useCart';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { SavedItemsProvider } from '@/lib/hooks/useSavedItems';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationJsonLd } from '@/lib/utils/seo';
import './globals.css';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PureVedicGems — Heritage Vedic Gemstones Since 1937',
    template: '%s | PureVedicGems',
  },
  description:
    'Certified natural Vedic gemstones, Rudraksha, and custom jewelry from a trusted heritage brand established in 1937. Expert astrological guidance with 87+ years of legacy.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  icons: {
    icon: '/favicon.ico',
    apple: '/PVG NEW LOGO DESIGN.PNG',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'PureVedicGems',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-palette="1"
      data-font="1"
      data-scroll-behavior="smooth"
      className={`${roboto.variable} h-full antialiased`}
    >
      <head>
        {/* Preload the first hero image (LCP element) for both desktop and mobile */}
        <link
          rel="preload"
          as="image"
          href="/home/hero/pvgheropc1.webp"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/home/hero/pvgherobg1.webp"
          media="(max-width: 767px)"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-full flex flex-col font-body bg-background text-foreground">
        <GoogleAnalytics />
        <JsonLd data={organizationJsonLd()} />
        <ThemeProvider>
          <AuthProvider>
            <SavedItemsProvider>
              <CartProvider>
                <LayoutShell>{children}</LayoutShell>
                <Toaster richColors position="top-right" />
              </CartProvider>
            </SavedItemsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
