'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { ArMode } from '@/hooks/useArSupport';
import { CloseIcon } from '@/components/icons/close-icon';

interface ArViewerProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  mode: ArMode;
}

export function ArViewer({
  open,
  onClose,
  imageUrl,
  imageWidth,
  imageHeight,
  mode,
}: ArViewerProps) {
  if (!open || !mode) return null;

  if (mode === 'camera') {
    return (
      <CameraOverlay
        onClose={onClose}
        imageUrl={imageUrl}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />
    );
  }

  // WebXR mode — for now fall back to camera overlay
  // Full WebXR with Three.js can be added in a future iteration
  return (
    <CameraOverlay
      onClose={onClose}
      imageUrl={imageUrl}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
    />
  );
}

function CameraOverlay({
  onClose,
  imageUrl,
  imageWidth,
  imageHeight,
}: {
  onClose: () => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [artPos, setArtPos] = useState({ x: 0, y: 0 });
  const [artScale, setArtScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        setError('Camera access denied. Please allow camera access to use AR mode.');
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    setArtPos({
      x: window.innerWidth / 2 - (window.innerWidth * 0.4) / 2,
      y: window.innerHeight / 2 - (window.innerWidth * 0.4) / (imageWidth / imageHeight) / 2,
    });
  }, [imageWidth, imageHeight]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          posX: artPos.x,
          posY: artPos.y,
        };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStart.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: artScale };
      }
    },
    [artPos, artScale],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragStart.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setArtPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy });
    } else if (e.touches.length === 2 && pinchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = pinchStart.current.scale * (dist / pinchStart.current.dist);
      setArtScale(Math.max(0.2, Math.min(3, newScale)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragStart.current = null;
    pinchStart.current = null;
  }, []);

  const artW = window.innerWidth * 0.4 * artScale;
  const artH = artW / (imageWidth / imageHeight);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-white text-center px-8">{error}</p>
        </div>
      )}

      {/* Artwork overlay */}
      {!error && (
        <div
          ref={artRef}
          className="absolute touch-none"
          style={{
            left: artPos.x,
            top: artPos.y,
            width: artW,
            height: artH,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={imageUrl}
            alt="AR artwork preview"
            width={imageWidth}
            height={imageHeight}
            className="w-full h-full object-contain drop-shadow-2xl"
            draggable={false}
          />
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
        aria-label="Close AR view"
      >
        <CloseIcon size={22} />
      </button>

      {/* Hint */}
      {!error && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
          <span className="px-4 py-2 bg-black/50 rounded-full text-white/80 text-sm backdrop-blur-sm">
            Drag to move, pinch to resize
          </span>
        </div>
      )}
    </div>
  );
}
