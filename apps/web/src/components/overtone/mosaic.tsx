import type { GalleryImage } from '@/components/gallery/types';
import { Tile } from './tile';

const SPANS = [
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
];

interface MosaicProps {
  images: GalleryImage[];
  columns?: number;
  gap?: number;
}

export function Mosaic({ images, columns = 6, gap = 8 }: MosaicProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: '180px',
        gap,
      }}
    >
      {images.map((img, i) => {
        const s = SPANS[i % SPANS.length];
        return (
          <div
            key={img.id}
            style={{
              gridColumn: `span ${s.c}`,
              gridRow: `span ${s.r}`,
            }}
          >
            <Tile image={img} fill showMeta={false} />
          </div>
        );
      })}
    </div>
  );
}
