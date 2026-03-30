'use client';

import { useState, useEffect } from 'react';

export type ArMode = 'webxr' | 'camera' | null;

export function useArSupport() {
  const [mode, setMode] = useState<ArMode>(null);

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      setMode(null);
      return;
    }

    const nav = navigator as Navigator & {
      xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
    };

    if (nav.xr) {
      nav.xr
        .isSessionSupported('immersive-ar')
        .then((isSupported: boolean) => {
          setMode(isSupported ? 'webxr' : 'camera');
        })
        .catch(() => {
          setMode('camera');
        });
    } else if (
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      setMode('camera');
    } else {
      setMode(null);
    }
  }, []);

  return { supported: mode !== null, mode };
}
