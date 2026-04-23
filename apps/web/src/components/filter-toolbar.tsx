'use client';

import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { api } from '@/lib/api';
import { PillGroup } from './pill-group';
import { darkSelectStyles } from '@/lib/select-styles';

interface FilterToolbarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  artistValues?: string[];
  onArtistChange?: (values: string[]) => void;
  projectValue?: string;
  onProjectChange?: (value: string) => void;
  artistId?: number;
  tagValues?: string[];
  onTagChange?: (values: string[]) => void;
  mediaTypeValue?: string;
  onMediaTypeChange?: (value: string) => void;
  paintTypeValue?: string;
  onPaintTypeChange?: (value: string) => void;
  availableFilters?: {
    categories: Set<string>;
    tags: Set<string>;
    mediaTypes: Set<string>;
    paintTypes: Set<string>;
  };
}

export function FilterToolbar({
  value,
  onChange,
  className,
  artistValues,
  onArtistChange,
  projectValue,
  onProjectChange,
  artistId,
  tagValues,
  onTagChange,
  mediaTypeValue,
  onMediaTypeChange,
  paintTypeValue,
  onPaintTypeChange,
  availableFilters,
}: FilterToolbarProps) {
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([
    { label: 'All', value: '' },
  ]);
  const [artistOptions, setArtistOptions] = useState<{ label: string; value: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ label: string; value: string }[]>([]);
  const [mediaTypeOptions, setMediaTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [paintTypeOptions, setPaintTypeOptions] = useState<{ label: string; value: string }[]>([]);

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
          setArtistOptions(artists.map((a) => ({ label: a.name, value: String(a.id) })));
        }
      })
      .catch(() => {});
  }, [onArtistChange]);

  useEffect(() => {
    if (!onProjectChange) return;
    const id =
      artistId !== undefined
        ? artistId
        : artistValues && artistValues.length === 1
          ? Number(artistValues[0])
          : undefined;
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
  }, [artistId, artistValues, onProjectChange]);

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

  useEffect(() => {
    if (!onMediaTypeChange) return;
    api.mediaTypes
      .list()
      .then((items) => {
        setMediaTypeOptions(
          items
            .filter((m) => (m.imageCount ?? 0) > 0)
            .map((m) => ({ label: m.name, value: m.slug })),
        );
      })
      .catch(() => {});
  }, [onMediaTypeChange]);

  useEffect(() => {
    if (!onPaintTypeChange) return;
    api.paintTypes
      .list()
      .then((items) => {
        setPaintTypeOptions(
          items
            .filter((p) => (p.imageCount ?? 0) > 0)
            .map((p) => ({ label: p.name, value: p.slug })),
        );
      })
      .catch(() => {});
  }, [onPaintTypeChange]);

  const toggleSingle = (current: string, slug: string, cb: (v: string) => void) => {
    cb(current === slug ? '' : slug);
  };

  const toggleTag = (current: string[], slug: string, cb: (v: string[]) => void) => {
    cb(current.includes(slug) ? [] : [slug]);
  };

  const allArtistsSelected = !artistValues || artistValues.length === 0;

  const toggleArtist = (id: string) => {
    if (!onArtistChange) return;
    if (allArtistsSelected) {
      // All selected → select only this one
      onArtistChange([id]);
    } else if (artistValues!.length === 1 && artistValues![0] === id) {
      // Only this one selected, clicking it again → select all
      onArtistChange([]);
    } else {
      // Multiple (but not all) selected → select only this one
      onArtistChange([id]);
    }
  };

  // Build disabled sets from availableFilters
  const disabledCategories = useMemo(() => {
    if (!availableFilters) return undefined;
    const disabled = new Set<string>();
    for (const opt of categories) {
      if (opt.value && !availableFilters.categories.has(opt.value)) disabled.add(opt.value);
    }
    return disabled;
  }, [availableFilters, categories]);

  const pillClass = (active: boolean, disabled?: boolean) =>
    `px-4 py-2 text-sm rounded-full border transition-all duration-300 ${
      active
        ? 'border-gallery-accent text-gallery-accent bg-gallery-accent/10'
        : disabled
          ? 'border-white/5 text-white/20 cursor-not-allowed'
          : 'border-white/10 text-gallery-gray hover:border-white/30 hover:text-white'
    }`;

  const artistPillClass = (active: boolean) =>
    `px-5 py-2 text-base rounded-full border transition-all duration-300 ${
      active
        ? 'border-white/60 text-white bg-white/10'
        : 'border-white/10 text-gallery-gray hover:border-white/30 hover:text-white'
    }`;

  const mediaPillClass = (active: boolean, disabled?: boolean) =>
    `px-4 py-2 text-sm rounded-full border transition-all duration-300 ${
      active
        ? 'border-blue-400/50 text-blue-300 bg-blue-500/15'
        : disabled
          ? 'border-white/5 text-white/20 cursor-not-allowed'
          : 'border-white/10 text-gallery-gray hover:border-white/30 hover:text-white'
    }`;

  const paintPillClass = (active: boolean, disabled?: boolean) =>
    `px-4 py-2 text-sm rounded-full border transition-all duration-300 ${
      active
        ? 'border-yellow-500/40 text-yellow-300 bg-yellow-500/15'
        : disabled
          ? 'border-white/5 text-white/20 cursor-not-allowed'
          : 'border-white/10 text-gallery-gray hover:border-white/30 hover:text-white'
    }`;

  return (
    <div className={className}>
      {/* Artist pills — separate top row */}
      {onArtistChange && artistOptions.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {artistOptions.map((opt) => (
            <button
              key={`artist-${opt.value}`}
              onClick={() => toggleArtist(opt.value)}
              className={artistPillClass(
                allArtistsSelected || (artistValues?.includes(opt.value) ?? false),
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PillGroup
          options={categories}
          value={value}
          onChange={onChange}
          disabledValues={disabledCategories}
        />
      </div>

      {/* Tags, media types, paint types */}
      {((onTagChange && tagOptions.length > 0) ||
        (onMediaTypeChange && mediaTypeOptions.length > 0) ||
        (onPaintTypeChange && paintTypeOptions.length > 0)) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
          {onMediaTypeChange &&
            mediaTypeOptions.length > 0 &&
            mediaTypeOptions.map((opt) => {
              const active = mediaTypeValue === opt.value;
              const disabled = !active && !availableFilters?.mediaTypes.has(opt.value);
              return (
                <button
                  key={`media-${opt.value}`}
                  onClick={() => toggleSingle(mediaTypeValue ?? '', opt.value, onMediaTypeChange)}
                  disabled={disabled}
                  className={mediaPillClass(active, disabled)}
                >
                  {opt.label}
                </button>
              );
            })}
          {onPaintTypeChange &&
            paintTypeOptions.length > 0 &&
            paintTypeOptions.map((opt) => {
              const active = paintTypeValue === opt.value;
              const disabled = !active && !availableFilters?.paintTypes.has(opt.value);
              return (
                <button
                  key={`paint-${opt.value}`}
                  onClick={() => toggleSingle(paintTypeValue ?? '', opt.value, onPaintTypeChange)}
                  disabled={disabled}
                  className={paintPillClass(active, disabled)}
                >
                  {opt.label}
                </button>
              );
            })}
          {onTagChange &&
            tagOptions.length > 0 &&
            tagOptions.map((opt) => {
              const active = tagValues?.includes(opt.value) ?? false;
              const disabled = !active && !availableFilters?.tags.has(opt.value);
              return (
                <button
                  key={`tag-${opt.value}`}
                  onClick={() => toggleTag(tagValues ?? [], opt.value, onTagChange)}
                  disabled={disabled}
                  className={pillClass(active, disabled)}
                >
                  {opt.label}
                </button>
              );
            })}
        </div>
      )}

      {/* Project selector */}
      {onProjectChange && projectOptions.length > 1 && (
        <div className="flex justify-center mt-3">
          <div className="w-44">
            <Select
              options={projectOptions}
              value={
                projectOptions.find((o) => o.value === (projectValue ?? '')) ?? projectOptions[0]
              }
              onChange={(opt) => onProjectChange((opt as { value: string } | null)?.value ?? '')}
              placeholder="All Projects"
              styles={darkSelectStyles<{ label: string; value: string }, false>()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
