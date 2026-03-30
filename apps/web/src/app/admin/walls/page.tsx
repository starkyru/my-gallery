'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { UPLOAD_URL } from '@/config';
import { toast as notify } from 'sonner';
import type { WallBackground, FramePreset } from '@gallery/shared';

export default function AdminWallsPage() {
  const { token } = useAuthStore();
  const [walls, setWalls] = useState<WallBackground[]>([]);
  const [frames, setFrames] = useState<FramePreset[]>([]);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [wallWidthCm, setWallWidthCm] = useState('');
  const [wallHeightCm, setWallHeightCm] = useState('');
  const [anchorX, setAnchorX] = useState(0.5);
  const [anchorY, setAnchorY] = useState(0.5);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [token]); // loadData is stable

  async function loadData() {
    if (!token) return;
    const [w, f] = await Promise.all([api.walls.list(), api.walls.framesAll(token)]);
    setWalls(w);
    setFrames(f);
  }

  function handleFileChange(f: File | null) {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function handlePreviewClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    setAnchorX(Number(((e.clientX - rect.left) / rect.width).toFixed(4)));
    setAnchorY(Number(((e.clientY - rect.top) / rect.height).toFixed(4)));
  }

  async function handleUpload() {
    if (!token || !file || !name) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (wallWidthCm) formData.append('wallWidthCm', wallWidthCm);
      if (wallHeightCm) formData.append('wallHeightCm', wallHeightCm);
      formData.append('anchorX', String(anchorX));
      formData.append('anchorY', String(anchorY));
      await api.walls.create(formData, token);
      notify.success('Wall uploaded');
      setFile(null);
      setName('');
      setWallWidthCm('');
      setWallHeightCm('');
      setAnchorX(0.5);
      setAnchorY(0.5);
      setPreviewUrl(null);
      loadData();
    } catch {
      notify.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteWall(id: number) {
    if (!token || !confirm('Delete this wall?')) return;
    await api.walls.delete(id, token);
    notify.success('Wall deleted');
    loadData();
  }

  async function handleToggleFrame(frame: FramePreset) {
    if (!token) return;
    await api.walls.updateFrame(frame.id, { enabled: !frame.enabled }, token);
    loadData();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Wall Backgrounds & Frames</h1>

      {/* Upload section */}
      <div className="border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add Wall Background</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (e.g. Modern Living Room)"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
            />
            <div className="flex gap-3">
              <input
                type="number"
                value={wallWidthCm}
                onChange={(e) => setWallWidthCm(e.target.value)}
                placeholder="Width cm (or leave blank for auto)"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
              />
              <input
                type="number"
                value={wallHeightCm}
                onChange={(e) => setWallHeightCm(e.target.value)}
                placeholder="Height cm (or leave blank for auto)"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
              />
            </div>
            <p className="text-xs text-gallery-gray">
              Leave one dimension blank to auto-calculate from aspect ratio.
            </p>
            <button
              onClick={handleUpload}
              disabled={!file || !name || uploading}
              className="px-4 py-2 bg-gallery-accent text-gallery-black rounded text-sm font-medium disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Wall'}
            </button>
          </div>

          {/* Anchor point preview */}
          {previewUrl && (
            <div className="space-y-2">
              <p className="text-xs text-gallery-gray">Click to set artwork center point:</p>
              <div
                ref={previewRef}
                className="relative cursor-crosshair rounded-lg overflow-hidden border border-white/10"
                onClick={handlePreviewClick}
              >
                <img src={previewUrl} alt="Preview" className="w-full" />
                <div
                  className="absolute w-6 h-6 border-2 border-gallery-accent rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${anchorX * 100}%`, top: `${anchorY * 100}%` }}
                >
                  <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-gallery-accent rounded-full" />
                </div>
                {/* Crosshair lines */}
                <div
                  className="absolute w-px h-full bg-gallery-accent/30 pointer-events-none"
                  style={{ left: `${anchorX * 100}%` }}
                />
                <div
                  className="absolute h-px w-full bg-gallery-accent/30 pointer-events-none"
                  style={{ top: `${anchorY * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing walls */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Wall Backgrounds ({walls.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {walls.map((wall) => (
            <div key={wall.id} className="border border-white/10 rounded-lg overflow-hidden">
              <div className="relative aspect-video">
                <Image
                  src={`${UPLOAD_URL}/${wall.imagePath}`}
                  alt={wall.name}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
                {/* Show anchor point */}
                <div
                  className="absolute w-3 h-3 border-2 border-gallery-accent rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${Number(wall.anchorX) * 100}%`,
                    top: `${Number(wall.anchorY) * 100}%`,
                  }}
                />
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium">{wall.name}</p>
                <p className="text-xs text-gallery-gray">
                  {wall.wallWidthCm ? `${wall.wallWidthCm}cm` : 'auto'} x{' '}
                  {wall.wallHeightCm ? `${wall.wallHeightCm}cm` : 'auto'}
                </p>
                <button
                  onClick={() => handleDeleteWall(wall.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frame presets */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Frame Presets</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {frames.map((frame) => (
            <div
              key={frame.id}
              className={`border rounded-lg p-4 text-center space-y-2 ${
                frame.enabled ? 'border-gallery-accent/50' : 'border-white/10 opacity-50'
              }`}
            >
              {/* Frame preview */}
              <div className="flex justify-center">
                <div
                  className="w-16 h-12 flex items-center justify-center"
                  style={{
                    border:
                      Number(frame.borderWidthMm) > 0
                        ? `${Math.max(2, Number(frame.borderWidthMm) / 2)}px solid ${frame.borderColor}`
                        : '1px dashed rgba(255,255,255,0.2)',
                    boxShadow: frame.shadowEnabled ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  <div
                    className="w-10 h-7"
                    style={{
                      border:
                        Number(frame.matWidthMm) > 0
                          ? `${Math.max(2, Number(frame.matWidthMm) / 5)}px solid ${frame.matColor}`
                          : 'none',
                    }}
                  >
                    <div className="w-full h-full bg-white/20" />
                  </div>
                </div>
              </div>
              <p className="text-sm">{frame.name}</p>
              <button
                onClick={() => handleToggleFrame(frame)}
                className={`text-xs px-3 py-1 rounded ${
                  frame.enabled ? 'bg-gallery-accent text-gallery-black' : 'bg-white/10 text-white'
                }`}
              >
                {frame.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
