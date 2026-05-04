'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/overtone/logo';

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return (
    <footer
      className="flex flex-col gap-16 border-t border-ot-line-soft"
      style={{ padding: '100px 40px 28px' }}
    >
      {/* Quote */}
      <p className="ot-footer-quote">
        &ldquo;Art is not what you see, but what you make others see.&rdquo;
        <span className="attr">&mdash; Edgar Degas</span>
      </p>

      {/* Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-10 pt-10 border-t border-ot-line-soft">
        {/* Brand */}
        <div>
          <Logo linked={false} />
          <p className="text-sm text-ot-ink-soft leading-relaxed mt-4 max-w-[360px]">
            A two-artist studio in Charlotte, North Carolina. Photographs and paintings, made and
            shipped from one room.
          </p>
        </div>

        {/* Browse */}
        <div>
          <h4 className="font-sans text-[10px] font-semibold tracking-[0.28em] uppercase text-ot-mute mb-4">
            Browse
          </h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
            <li>
              <Link
                href="/photographs"
                className="text-sm text-ot-ink no-underline hover:text-ot-ochre-deep transition-colors"
              >
                Photographs
              </Link>
            </li>
            <li>
              <Link
                href="/paintings"
                className="text-sm text-ot-ink no-underline hover:text-ot-ochre-deep transition-colors"
              >
                Paintings
              </Link>
            </li>
          </ul>
        </div>

        {/* Studio */}
        <div>
          <h4 className="font-sans text-[10px] font-semibold tracking-[0.28em] uppercase text-ot-mute mb-4">
            Studio
          </h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
            <li>
              <Link
                href="/about"
                className="text-sm text-ot-ink no-underline hover:text-ot-ochre-deep transition-colors"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-sm text-ot-ink no-underline hover:text-ot-ochre-deep transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex justify-between items-center font-mono text-[11px] text-ot-mute tracking-[0.06em]">
        <span>&copy; {new Date().getFullYear()} Overtone.art &middot; All rights reserved</span>
        <span>Charlotte, NC</span>
      </div>
    </footer>
  );
}
