'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PillGroup } from './pill-group';

interface FilterToolbarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterToolbar({ value, onChange, className }: FilterToolbarProps) {
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([
    { label: 'All', value: '' },
  ]);

  useEffect(() => {
    api.categories
      .list()
      .then((cats) => {
        setCategories([
          { label: 'All', value: '' },
          ...cats.map((c) => ({ label: c.name, value: c.slug })),
        ]);
      })
      .catch(() => {});
  }, []);

  return <PillGroup options={categories} value={value} onChange={onChange} className={className} />;
}
