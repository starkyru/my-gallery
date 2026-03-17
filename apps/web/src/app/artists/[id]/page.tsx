import { notFound } from 'next/navigation';
import { ArtistDetail } from './artist-detail';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getArtist(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/artists/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getArtistImages(artistId: string) {
  try {
    const res = await fetch(`${API_URL}/api/images?artistId=${artistId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artist, images] = await Promise.all([getArtist(id), getArtistImages(id)]);
  if (!artist || artist.isActive === false) notFound();

  return <ArtistDetail artist={artist} images={images} />;
}
