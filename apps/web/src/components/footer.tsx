'use client';

import { usePathname } from 'next/navigation';
import { useConfigStore } from '@/store/config';

export function Footer() {
  const galleryName = useConfigStore((s) => s.config.galleryName);
  const pathname = usePathname();

  if (pathname.startsWith('/gallery/')) return null;

  return (
    <footer className="border-t border-white/5 py-12 text-center text-sm text-gallery-gray">
      <p>
        &copy; {new Date().getFullYear()} {galleryName}. All rights reserved.
      </p>
    </footer>
  );
}
