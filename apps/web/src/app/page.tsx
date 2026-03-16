import { GalleryHero } from '@/components/gallery-hero';
import { GalleryGrid } from '@/components/gallery-grid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getImages() {
  try {
    const res = await fetch(`${API_URL}/api/images`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const images = await getImages();

  return (
    <>
      <GalleryHero />
      <GalleryGrid images={images} />
    </>
  );
}
