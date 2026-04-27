'use client';

import Image from 'next/image';
import type { ImagePrintOption, WallBackground } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { ShoppingBagIcon } from '@/components/icons/shopping-bag-icon';
import { FrameIcon } from '@/components/icons/frame-icon';
import { CameraIcon } from '@/components/icons/camera-icon';

interface SidePanelProps {
  walls: WallBackground[];
  selectedWall: WallBackground | null;
  selectWall: (wall: WallBackground) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  printOptionsWithDimensions: ImagePrintOption[];
  onWallPreview: () => void;
  arSupported: boolean;
  onArView: () => void;
  hasBuyOptions: boolean;
  onBuy: () => void;
}

export function SidePanel({
  walls,
  selectedWall,
  selectWall,
  bgColor,
  setBgColor,
  printOptionsWithDimensions,
  onWallPreview,
  arSupported,
  onArView,
  hasBuyOptions,
  onBuy,
}: SidePanelProps) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 items-center">
      <div className="flex flex-col gap-1.5 mb-1">
        {walls.length > 0
          ? walls.map((wall) => (
              <button
                key={wall.id}
                type="button"
                onClick={() => selectWall(wall)}
                className={`relative w-8 h-8 rounded overflow-hidden border-2 transition-all duration-200 ${
                  selectedWall?.id === wall.id
                    ? 'border-gallery-accent scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
                aria-label={wall.name}
                title={wall.name}
              >
                <Image
                  src={`${UPLOAD_URL}/${wall.thumbnailPath}`}
                  alt={wall.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </button>
            ))
          : [
              { color: '#ffffff', label: 'White' },
              { color: '#808080', label: 'Gray' },
              { color: '#d4c5a9', label: 'Beige' },
              { color: '#000000', label: 'Black' },
            ].map(({ color, label }) => (
              <button
                key={color}
                type="button"
                onClick={() => setBgColor(color)}
                className={`w-8 h-8 rounded border transition-all duration-200 ${
                  bgColor === color
                    ? 'border-gallery-accent scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`${label} background`}
                title={`${label} background`}
              />
            ))}
      </div>
      {printOptionsWithDimensions.length > 0 && (
        <button
          type="button"
          onClick={onWallPreview}
          className="rounded-full bg-white/15 p-3 text-white backdrop-blur-sm hover:bg-gallery-accent hover:text-gallery-black transition-colors duration-300"
          aria-label="View on wall"
          title="View on wall"
        >
          <FrameIcon size={20} />
        </button>
      )}
      {arSupported && (
        <button
          type="button"
          onClick={onArView}
          className="rounded-full bg-white/15 p-3 text-white backdrop-blur-sm hover:bg-gallery-accent hover:text-gallery-black transition-colors duration-300"
          aria-label="View in AR"
          title="View in AR"
        >
          <CameraIcon size={20} />
        </button>
      )}
      {hasBuyOptions && (
        <button
          type="button"
          onClick={onBuy}
          className="rounded-full bg-white/15 p-3 text-white backdrop-blur-sm hover:bg-gallery-accent hover:text-gallery-black transition-colors duration-300"
          aria-label="Buy options"
          title="Buy options"
        >
          <ShoppingBagIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
