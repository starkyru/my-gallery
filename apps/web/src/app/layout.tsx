import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { LenisProvider } from '@/components/lenis-provider';
import { ConfigProvider } from '@/components/config-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/gallery-config`, { next: { revalidate: 60 } });
    if (res.ok) {
      const config = await res.json();
      const title = config.subtitle
        ? `${config.galleryName} — ${config.subtitle}`
        : config.galleryName || 'Gallery';
      const description = config.subtitle || '';
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: config.siteUrl || undefined,
          siteName: config.galleryName || 'Gallery',
          type: 'website',
        },
      };
    }
  } catch {
    // fall through to defaults
  }
  return {
    title: 'Gallery',
    description: '',
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body
        className="bg-gallery-black text-gallery-white font-sans antialiased"
        suppressHydrationWarning
      >
        <LenisProvider>
          <ConfigProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </ConfigProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
