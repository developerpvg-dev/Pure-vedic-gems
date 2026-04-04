import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/lib/theme-context';
import { CartProvider } from '@/lib/hooks/useCart';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { SplashAnimation } from '@/components/home/SplashAnimation';
import './globals.css';

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
    icon: '/PVG NEW LOGO DESIGN.PNG',
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
      className={`${playfairDisplay.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <SplashAnimation />
              <LayoutShell>{children}</LayoutShell>
              <ThemeSwitcher />
              <Toaster richColors position="top-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
