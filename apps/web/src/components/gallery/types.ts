export interface GalleryImage {
  id: number;
  title: string;
  price: number;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  category: string;
  projectId?: number | null;
  project?: { id: number; name: string; slug: string };
  blurHash?: string | null;
  artist: { id: number; name: string; slug: string };
  tags?: { id: number; name: string; slug: string }[];
}
