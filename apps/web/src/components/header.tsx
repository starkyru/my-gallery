'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useConfigStore } from '@/store/config';

export function Header() {
  const itemCount = useCartStore((s) => s.items.length);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const galleryName = useConfigStore((s) => s.config.galleryName);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gallery-black/80 backdrop-blur-md border-b border-white/5">
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl tracking-wider text-gallery-accent">
          {galleryName}
        </Link>
        {!isAdmin && (
          <div className="flex items-center gap-6 text-sm">
            <Link href="/#works" className="hover:text-gallery-accent transition-colors">
              Works
            </Link>
            <Link href="/cart" className="relative hover:text-gallery-accent transition-colors">
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-gallery-accent text-gallery-black text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
