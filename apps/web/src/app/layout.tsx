import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MainContent } from '@/components/main-content';
import { LenisProvider } from '@/components/lenis-provider';
import { ConfigProvider } from '@/components/config-provider';
import { ChatWidget } from '@/components/chat/chat-widget';
import { ImageCacheProvider } from '@/hooks/useImageCache';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/api/gallery-config`, {
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
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
      <head>
        <script
          defer
          src="https://stats.ilia.to/script.js"
          data-website-id="2ff8284a-49fa-47f5-ad4e-9ae40a9dc464"
        />
      </head>
      <body
        className="bg-gallery-black text-gallery-white font-sans antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gallery-accent focus:text-gallery-black focus:rounded focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <LenisProvider>
          <ImageCacheProvider>
            <ConfigProvider>
              <Header />
              <MainContent>{children}</MainContent>
              <Footer />
              <ChatWidget />
            </ConfigProvider>
          </ImageCacheProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
