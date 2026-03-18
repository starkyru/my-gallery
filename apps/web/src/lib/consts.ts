import type { Metadata } from 'next';

export const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

export const siteMetadata: Metadata = {
  title: 'Gallery — Fine Art Photography',
  description: 'Curated fine art photography prints available for purchase.',
  openGraph: {
    title: 'Gallery — Fine Art Photography',
    description: 'Curated fine art photography prints available for purchase.',
    url: 'https://gallery.ilia.to',
    siteName: 'Gallery',
    type: 'website',
  },
};
