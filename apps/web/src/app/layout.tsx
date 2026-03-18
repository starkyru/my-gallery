import { Inter, Playfair_Display } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { LenisProvider } from '@/components/lenis-provider';
import { siteMetadata } from '@/lib/consts';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata = siteMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body
        className="bg-gallery-black text-gallery-white font-sans antialiased"
        suppressHydrationWarning
      >
        <LenisProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
