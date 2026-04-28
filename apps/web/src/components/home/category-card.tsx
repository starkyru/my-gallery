import Image from 'next/image';
import Link from 'next/link';
import type { GalleryImage } from '@/components/gallery';
import type { Category } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { blurhashToDataURL } from '@/lib/blurhash';

export function CategoryCard({
  category,
  image,
  href,
  rowSpan,
}: {
  category: Category;
  image: GalleryImage;
  href: string;
  rowSpan: number;
}) {
  const blurDataURL = image.blurHash ? blurhashToDataURL(image.blurHash) : undefined;

  return (
    <Link
      href={href}
      className="relative z-0 block overflow-hidden group"
      style={rowSpan > 1 ? { gridRow: `span ${rowSpan}` } : undefined}
    >
      <Image
        src={`${UPLOAD_URL}/${rowSpan > 1 ? image.watermarkPath : image.thumbnailPath}`}
        alt={category.name}
        fill
        className="object-cover object-top grayscale group-hover/side:grayscale-0 group-active/side:grayscale-0 transition-all duration-500 ease-out group-hover:scale-105 origin-top"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
      />
      {/* <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" /> */}
      <span className="absolute bottom-0 left-0 right-0 py-1 md:py-2 bg-gray-500/30 backdrop-blur-sm text-center font-serif text-sm md:text-lg lg:text-xl text-white tracking-wide">
        {category.name}
      </span>
    </Link>
  );
}
