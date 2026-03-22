'use client';

import { useEffect, useState } from 'react';
import Select from 'react-select';
import { api } from '@/lib/api';
import { PillGroup } from './pill-group';
import { darkSelectStyles } from '@/lib/select-styles';

interface FilterToolbarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  artistValue?: string;
  onArtistChange?: (value: string) => void;
  projectValue?: string;
  onProjectChange?: (value: string) => void;
  artistId?: number;
  tagValues?: string[];
  onTagChange?: (values: string[]) => void;
}

export function FilterToolbar({
  value,
  onChange,
  className,
  artistValue,
  onArtistChange,
  projectValue,
  onProjectChange,
  artistId,
  tagValues,
  onTagChange,
}: FilterToolbarProps) {
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([
    { label: 'All', value: '' },
  ]);
  const [artistOptions, setArtistOptions] = useState<{ label: string; value: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ label: string; value: string }[]>([]);

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
    if (!onArtistChange) return;
    api.artists
      .list()
      .then((artists) => {
        if (artists.length > 1) {
          setArtistOptions([
            { label: 'All Artists', value: '' },
            ...artists.map((a) => ({ label: a.name, value: String(a.id) })),
          ]);
        }
      })
      .catch(() => {});
  }, [onArtistChange]);

  useEffect(() => {
    if (!onProjectChange) return;
    const id = artistId !== undefined ? artistId : artistValue ? Number(artistValue) : undefined;
    api.projects
      .list(id)
      .then((projs) => {
        if (projs.length > 0) {
          setProjectOptions([
            { label: 'All Projects', value: '' },
            ...projs.map((p) => ({ label: p.name, value: String(p.id) })),
          ]);
        } else {
          setProjectOptions([]);
        }
      })
      .catch(() => {});
  }, [artistId, artistValue, onProjectChange]);

  useEffect(() => {
    if (!onTagChange) return;
    api.tags
      .list()
      .then((tags) => {
        setTagOptions(
          tags
            .filter((t) => (t.imageCount ?? 0) > 0)
            .map((t) => ({ label: t.name, value: t.slug })),
        );
      })
      .catch(() => {});
  }, [onTagChange]);

  return (
    <div className={`${className} flex flex-wrap items-center gap-3`}>
      <PillGroup options={categories} value={value} onChange={onChange} />
      {onArtistChange && artistOptions.length > 1 && (
        <div className="w-44">
          <Select
            options={artistOptions}
            value={artistOptions.find((o) => o.value === (artistValue ?? '')) ?? artistOptions[0]}
            onChange={(opt) => onArtistChange(opt?.value ?? '')}
            placeholder="All Artists"
            styles={darkSelectStyles<{ label: string; value: string }, false>()}
          />
        </div>
      )}
      {onProjectChange && projectOptions.length > 1 && (
        <div className="w-44">
          <Select
            options={projectOptions}
            value={
              projectOptions.find((o) => o.value === (projectValue ?? '')) ?? projectOptions[0]
            }
            onChange={(opt) => onProjectChange(opt?.value ?? '')}
            placeholder="All Projects"
            styles={darkSelectStyles<{ label: string; value: string }, false>()}
          />
        </div>
      )}
      {onTagChange && tagOptions.length > 0 && (
        <div className="w-56">
          <Select
            isMulti
            options={tagOptions}
            value={tagOptions.filter((o) => tagValues?.includes(o.value))}
            onChange={(opts) => onTagChange(opts.map((o) => o.value))}
            placeholder="Tags..."
            styles={darkSelectStyles()}
          />
        </div>
      )}
    </div>
  );
}
