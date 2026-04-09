'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { WallBackground, FramePreset } from '@gallery/shared';

const STORAGE_KEY = 'gallery-wall-id';

export function useWalls() {
  const [walls, setWalls] = useState<WallBackground[]>([]);
  const [frames, setFrames] = useState<FramePreset[]>([]);
  const [selectedWall, setSelectedWallState] = useState<WallBackground | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([api.walls.list(), api.walls.frames()]).then(([w, f]) => {
      setWalls(w);
      setFrames(f);
      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = savedId ? w.find((wall) => wall.id === Number(savedId)) : null;
      setSelectedWallState(saved ?? w.find((wall) => wall.isDefault) ?? w[0] ?? null);
      setLoaded(true);
    });
  }, []);

  const selectWall = useCallback((wall: WallBackground) => {
    setSelectedWallState(wall);
    localStorage.setItem(STORAGE_KEY, String(wall.id));
  }, []);

  return { walls, frames, selectedWall, selectWall, loaded };
}
