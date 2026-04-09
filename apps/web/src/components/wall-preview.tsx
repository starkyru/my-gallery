'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { UPLOAD_URL } from '@/config';
import type { ImagePrintOption, FramePreset, WallBackground } from '@gallery/shared';
import { CloseIcon } from '@/components/icons/close-icon';
import { useWalls } from '@/hooks/useWalls';

interface WallPreviewProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  printOptions: ImagePrintOption[];
}

export function WallPreview({
  open,
  onClose,
  imageUrl,
  imageWidth,
  imageHeight,
  printOptions,
}: WallPreviewProps) {
  const { walls, frames, selectedWall, selectWall } = useWalls();
  const [selectedOption, setSelectedOption] = useState<ImagePrintOption | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FramePreset | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (frames.length > 0 && !selectedFrame) {
      const noneFrame = frames.find((frame) => frame.borderWidthMm === 0) ?? frames[0] ?? null;
      setSelectedFrame(noneFrame);
    }
    if (printOptions.length > 0 && !selectedOption) {
      setSelectedOption(printOptions[0]);
    }
  }, [open, printOptions, frames, selectedFrame, selectedOption]);

  const measureContainer = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    measureContainer();
    window.addEventListener('resize', measureContainer);
    return () => window.removeEventListener('resize', measureContainer);
  }, [open, measureContainer]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  // Calculate wall dimensions — auto-calc missing dimension from aspect ratio
  const getWallDimensions = (wall: WallBackground) => {
    let widthCm = wall.wallWidthCm ? Number(wall.wallWidthCm) : null;
    let heightCm = wall.wallHeightCm ? Number(wall.wallHeightCm) : null;
    const aspect = wall.imageWidth / wall.imageHeight;

    if (widthCm && !heightCm) {
      heightCm = widthCm / aspect;
    } else if (!widthCm && heightCm) {
      widthCm = heightCm * aspect;
    } else if (!widthCm && !heightCm) {
      widthCm = 300;
      heightCm = 300 / aspect;
    }
    return { widthCm: widthCm!, heightCm: heightCm! };
  };

  // Scaling math
  const computeLayout = () => {
    if (!selectedWall || !selectedOption || containerSize.width === 0) return null;

    const wallDims = getWallDimensions(selectedWall);
    const pixelsPerCm = selectedWall.imageWidth / wallDims.widthCm;

    const printW = Number(selectedOption.widthCm) * pixelsPerCm;
    const printH = Number(selectedOption.heightCm) * pixelsPerCm;

    // Maintain artwork aspect ratio
    const artAspect = imageWidth / imageHeight;
    let artW = printW;
    let artH = printW / artAspect;
    if (artH > printH) {
      artH = printH;
      artW = printH * artAspect;
    }

    // Frame dimensions in wall pixels
    const frameBorderPx = selectedFrame
      ? (Number(selectedFrame.borderWidthMm) / 10) * pixelsPerCm
      : 0;
    const frameMatPx = selectedFrame ? (Number(selectedFrame.matWidthMm) / 10) * pixelsPerCm : 0;

    const totalW = artW + 2 * (frameBorderPx + frameMatPx);
    const totalH = artH + 2 * (frameBorderPx + frameMatPx);

    // Position centered on anchor
    const left = Number(selectedWall.anchorX) * selectedWall.imageWidth - totalW / 2;
    const top = Number(selectedWall.anchorY) * selectedWall.imageHeight - totalH / 2;

    // Scale to fit container
    const scale = Math.min(
      containerSize.width / selectedWall.imageWidth,
      containerSize.height / selectedWall.imageHeight,
    );

    return {
      wallW: selectedWall.imageWidth * scale,
      wallH: selectedWall.imageHeight * scale,
      artLeft: (left + frameBorderPx + frameMatPx) * scale,
      artTop: (top + frameBorderPx + frameMatPx) * scale,
      artW: artW * scale,
      artH: artH * scale,
      frameLeft: left * scale,
      frameTop: top * scale,
      frameTotalW: totalW * scale,
      frameTotalH: totalH * scale,
      frameBorderPx: frameBorderPx * scale,
      frameMatPx: frameMatPx * scale,
    };
  };

  const layout = computeLayout();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Top controls */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Print size selector */}
          <select
            value={selectedOption?.sku ?? ''}
            onChange={(e) => {
              const opt = printOptions.find((o) => o.sku === e.target.value);
              setSelectedOption(opt ?? null);
            }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent"
          >
            {printOptions.map((opt) => (
              <option key={opt.sku} value={opt.sku}>
                {opt.description} ({opt.widthCm}x{opt.heightCm} cm)
              </option>
            ))}
          </select>

          {/* Frame selector */}
          <div className="flex items-center gap-1.5">
            {frames.map((frame) => (
              <button
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`w-8 h-8 rounded border-2 transition-colors ${
                  selectedFrame?.id === frame.id
                    ? 'border-gallery-accent'
                    : 'border-white/20 hover:border-white/40'
                }`}
                title={frame.name}
              >
                <div
                  className="w-full h-full rounded-sm flex items-center justify-center"
                  style={{
                    border:
                      frame.borderWidthMm > 0
                        ? `${Math.max(2, Number(frame.borderWidthMm) / 3)}px solid ${frame.borderColor}`
                        : '1px solid transparent',
                    backgroundColor: frame.matWidthMm > 0 ? frame.matColor : 'transparent',
                  }}
                >
                  <div className="w-3 h-2 bg-white/40" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-gallery-gray hover:text-white transition-colors"
          aria-label="Close wall preview"
        >
          <CloseIcon size={22} />
        </button>
      </div>

      {/* Main preview area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-hidden"
      >
        {layout && selectedWall && (
          <div className="relative" style={{ width: layout.wallW, height: layout.wallH }}>
            {/* Wall background */}
            <Image
              src={`${UPLOAD_URL}/${selectedWall.imagePath}`}
              alt={selectedWall.name}
              width={selectedWall.imageWidth}
              height={selectedWall.imageHeight}
              className="w-full h-full object-contain"
              priority
            />

            {/* Frame + artwork */}
            <div
              className="absolute"
              style={{
                left: layout.frameLeft,
                top: layout.frameTop,
                width: layout.frameTotalW,
                height: layout.frameTotalH,
                backgroundColor:
                  selectedFrame && Number(selectedFrame.borderWidthMm) > 0
                    ? selectedFrame.borderColor
                    : 'transparent',
                padding: layout.frameBorderPx,
                boxShadow: selectedFrame?.shadowEnabled
                  ? '0 4px 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
                  : 'none',
              }}
            >
              {/* Mat */}
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  backgroundColor:
                    selectedFrame && Number(selectedFrame.matWidthMm) > 0
                      ? selectedFrame.matColor
                      : 'transparent',
                  padding: layout.frameMatPx,
                }}
              >
                {/* Artwork */}
                <Image
                  src={imageUrl}
                  alt="Artwork preview"
                  width={imageWidth}
                  height={imageHeight}
                  className="w-full h-full object-contain"
                  style={{ width: layout.artW, height: layout.artH }}
                />
              </div>
            </div>
          </div>
        )}

        {!selectedWall && (
          <p className="text-gallery-gray text-sm">
            No wall backgrounds available. Ask an admin to upload one.
          </p>
        )}
      </div>

      {/* Bottom wall selector */}
      {walls.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-black/80 border-t border-white/10 overflow-x-auto">
          {walls.map((wall) => (
            <button
              key={wall.id}
              onClick={() => selectWall(wall)}
              className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                selectedWall?.id === wall.id
                  ? 'border-gallery-accent'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <Image
                src={`${UPLOAD_URL}/${wall.thumbnailPath}`}
                alt={wall.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
