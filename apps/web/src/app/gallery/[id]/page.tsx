import { notFound } from 'next/navigation';
import { ImageDetail } from './image-detail';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getImage(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/images/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await getImage(id);
  if (!image) notFound();

  return <ImageDetail image={image} />;
}
