import type { Metadata } from 'next';
import { Inter_Tight, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MainContent } from '@/components/layout/main-content';
import { LenisProvider } from '@/components/providers/lenis-provider';
import { ConfigProvider } from '@/components/providers/config-provider';
import { ChatWidget } from '@/components/chat/chat-widget';
import { Toaster } from 'sonner';
import { ImageCacheProvider } from '@/hooks/useImageCache';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['400', '500', '600'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500'],
  style: ['normal', 'italic'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'overtone.art — Art Studio',
  description: 'A two-artist studio in Charlotte, North Carolina. Photographs and paintings.',
  openGraph: {
    title: 'overtone.art — Art Studio',
    description: 'A two-artist studio in Charlotte, North Carolina. Photographs and paintings.',
    siteName: 'overtone.art',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          defer
          src="https://stats.ilia.to/script.js"
          data-website-id="2ff8284a-49fa-47f5-ad4e-9ae40a9dc464"
        />
      </head>
      <body className="bg-ot-paper text-ot-ink font-sans antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-ot-ochre focus:text-white focus:rounded focus:text-sm focus:font-medium"
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
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    fontFamily: 'var(--font-inter-tight)',
                    background: 'var(--color-ot-paper)',
                    color: 'var(--color-ot-ink)',
                    border: '1px solid var(--color-ot-line)',
                  },
                }}
              />
            </ConfigProvider>
          </ImageCacheProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
