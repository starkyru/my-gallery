export interface GalleryImage {
  id: number;
  title: string;
  price: number;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  category: string;
  blurHash?: string | null;
  artistId?: number;
  artist?: { id?: number; name: string };
}
