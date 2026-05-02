import Link from 'next/link';
import Image from 'next/image';
import type { GalleryImage } from '@/components/gallery/types';
import { UPLOAD_URL } from '@/config';
import { blurhashToDataURL } from '@/lib/blurhash';

interface TileProps {
  image: GalleryImage;
  aspect?: number;
  showMeta?: boolean;
  fill?: boolean;
}

export function Tile({ image, aspect, showMeta = true, fill = false }: TileProps) {
  const computedAspect = aspect ?? image.width / image.height;
  const blurDataURL = image.blurHash ? blurhashToDataURL(image.blurHash) : undefined;
  const medium = image.type === 'photo' ? 'Photograph' : 'Painting';

  return (
    <Link
      href={`/gallery/${image.id}`}
      className="ot-tile"
      style={fill ? { width: '100%', height: '100%' } : { aspectRatio: computedAspect }}
    >
      <Image
        src={`${UPLOAD_URL}/${image.watermarkPath}`}
        alt={image.title}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
        className="ot-tile-img"
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
      />
      <div className="ot-tile-overlay">
        <div className="w-full">
          <div className="ot-tile-title">{image.title}</div>
          {showMeta && (
            <div className="ot-tile-price">
              {medium} &middot; ${image.price}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
