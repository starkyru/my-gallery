'use client';

import { useEffect } from 'react';
import { useConfigStore } from '@/store/config';

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useConfigStore((s) => s.hydrated);
  const load = useConfigStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gallery-gray text-sm">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
