'use client';

import { usePathname } from 'next/navigation';

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isImageDetail = pathname.startsWith('/gallery/');

  return (
    <main id="main-content" className={isImageDetail ? 'h-[calc(100dvh-61px)]' : 'min-h-screen'}>
      {children}
    </main>
  );
}
