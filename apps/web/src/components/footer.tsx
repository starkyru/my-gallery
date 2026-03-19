'use client';

import { useConfigStore } from '@/store/config';

export function Footer() {
  const galleryName = useConfigStore((s) => s.config.galleryName);

  return (
    <footer className="border-t border-white/5 py-12 text-center text-sm text-gallery-gray">
      <p>
        &copy; {new Date().getFullYear()} {galleryName}. All rights reserved.
      </p>
    </footer>
  );
}
