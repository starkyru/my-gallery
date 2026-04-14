import { notFound } from 'next/navigation';
import { ArtistDetail } from './artist-detail';

export const revalidate = 60;

const API_URL =
  process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getArtist(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/artists/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getArtistImages(artistId: number) {
  try {
    const res = await fetch(`${API_URL}/api/images?artistId=${artistId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist || artist.isActive === false) notFound();

  const images = await getArtistImages(artist.id);
  return <ArtistDetail artist={artist} images={images} />;
}
