'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { Logo } from '@/components/overtone/logo';

const NAV_ITEMS = [
  { href: '/about', label: 'About' },
  { href: '/photographs', label: 'Photographs' },
  { href: '/paintings', label: 'Paintings' },
  { href: '/contact', label: 'Contact Us' },
];

export function Header() {
  const itemCount = useCartStore((s) => s.items.length);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isAdmin) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-gallery-black/80 backdrop-blur-md border-b border-white/5">
        <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-xl tracking-wider text-gallery-accent">
            Overtone.art
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 backdrop-blur-[10px]"
        style={{
          padding: '22px 40px',
          background: 'rgba(244, 241, 236, 0.85)',
        }}
      >
        <nav className="flex items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`ot-nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/cart" className={`ot-nav-link ${pathname === '/cart' ? 'active' : ''}`}>
              Cart ({itemCount})
            </Link>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-3.5">
            <Link href="/cart" className="text-sm text-ot-ink">
              Cart ({itemCount})
            </Link>
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="bg-transparent border-none cursor-pointer p-1.5 text-ot-ink"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 7h18M3 12h18M3 17h18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-ot-ink/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-ot-paper p-8 flex flex-col gap-6">
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="self-end bg-transparent border-none cursor-pointer text-ot-ink p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`ot-nav-link text-lg ${pathname === item.href ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className={`ot-nav-link text-lg ${pathname === '/cart' ? 'active' : ''}`}
            >
              Cart ({itemCount})
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
