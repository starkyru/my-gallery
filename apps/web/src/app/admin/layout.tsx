'use client';

import Link from 'next/link';
import { usePathname, useRouter, redirect } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/images', label: 'Images' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/artists', label: 'Artists' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/users', label: 'Users' },
];

const ARTIST_NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/profile', label: 'My Profile' },
];

const ADMIN_ONLY_ROUTES = [
  '/admin/images',
  '/admin/orders',
  '/admin/artists',
  '/admin/categories',
  '/admin/projects',
  '/admin/settings',
  '/admin/users',
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, role, hydrated, setAuth } = useAuthStore();

  useEffect(() => {
    if (token && role === 'artist' && ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
      router.push('/admin');
    }
  }, [token, role, pathname, router]);

  if (pathname === '/admin/login' || pathname === '/admin/reset-password') return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gallery-gray text-sm">Loading...</div>
      </div>
    );
  }

  if (!token) {
    redirect('/admin/login');
  }

  const navItems = role === 'admin' ? ADMIN_NAV : ARTIST_NAV;

  return (
    <div className="pt-20 min-h-screen">
      <nav className="border-b border-white/10 px-6 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-6">
          {navItems.map((item) => (
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
              setAuth(null);
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
