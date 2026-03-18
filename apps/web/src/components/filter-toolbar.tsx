'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PillGroup } from './pill-group';

interface FilterToolbarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  projectValue?: string;
  onProjectChange?: (value: string) => void;
  artistId?: number;
}

export function FilterToolbar({
  value,
  onChange,
  className,
  projectValue,
  onProjectChange,
  artistId,
}: FilterToolbarProps) {
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([
    { label: 'All', value: '' },
  ]);
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    api.categories
      .list()
      .then((cats) => {
        setCategories([
          { label: 'All', value: '' },
          ...cats
            .filter((c) => (c.imageCount ?? 0) > 0)
            .map((c) => ({ label: c.name, value: c.slug })),
        ]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (artistId === undefined || !onProjectChange) return;
    api.projects
      .list(artistId)
      .then((projs) => {
        setProjectOptions([
          { label: 'All', value: '' },
          ...projs.map((p) => ({ label: p.name, value: String(p.id) })),
        ]);
      })
      .catch(() => {});
  }, [artistId, onProjectChange]);

  return (
    <div className={className}>
      <PillGroup options={categories} value={value} onChange={onChange} />
      {onProjectChange && projectOptions.length > 1 && (
        <PillGroup
          options={projectOptions}
          value={projectValue ?? ''}
          onChange={onProjectChange}
          className="mt-4"
        />
      )}
    </div>
  );
}
