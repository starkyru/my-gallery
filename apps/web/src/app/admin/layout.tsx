'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/images', label: 'Images' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/photographers', label: 'Photographers' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, setToken } = useAuthStore();

  useEffect(() => {
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [token, pathname, router]);

  if (pathname === '/admin/login') return <>{children}</>;
  if (!token) return null;

  return (
    <div className="pt-20 min-h-screen">
      <nav className="border-b border-white/10 px-6 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? 'text-gallery-accent'
                  : 'text-gallery-gray hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setToken(null);
              router.push('/admin/login');
            }}
            className="ml-auto text-sm text-gallery-gray hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
