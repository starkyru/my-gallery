'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { PillGroup } from './pill-group';
import { PILL_STYLES, pillClass } from './pill-styles';

interface FilterToolbarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  typeValues?: string[];
  onTypeChange?: (values: string[]) => void;
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
  typeValues,
  onTypeChange,
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
  const typeOptions = useMemo(
    () =>
      onTypeChange
        ? [
            { label: 'Photographs', value: 'photo' },
            { label: 'Paintings', value: 'painting' },
          ]
        : [],
    [onTypeChange],
  );
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ label: string; value: string }[]>([]);
  const [mediaTypeOptions, setMediaTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [paintTypeOptions, setPaintTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const promises: Promise<void>[] = [];

    promises.push(
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
        .catch(() => {}),
    );

    if (onProjectChange) {
      promises.push(
        api.projects
          .list(artistId)
          .then((projs) => {
            setProjectOptions(
              projs.length > 0 ? projs.map((p) => ({ label: p.name, value: String(p.id) })) : [],
            );
          })
          .catch(() => {}),
      );
    }

    if (onTagChange) {
      promises.push(
        api.tags
          .list()
          .then((tags) => {
            setTagOptions(
              tags
                .filter((t) => (t.imageCount ?? 0) > 0)
                .map((t) => ({ label: t.name, value: t.slug })),
            );
          })
          .catch(() => {}),
      );
    }

    if (onMediaTypeChange) {
      promises.push(
        api.mediaTypes
          .list()
          .then((items) => {
            setMediaTypeOptions(
              items
                .filter((m) => (m.imageCount ?? 0) > 0)
                .map((m) => ({ label: m.name, value: m.slug })),
            );
          })
          .catch(() => {}),
      );
    }

    if (onPaintTypeChange) {
      promises.push(
        api.paintTypes
          .list()
          .then((items) => {
            setPaintTypeOptions(
              items
                .filter((p) => (p.imageCount ?? 0) > 0)
                .map((p) => ({ label: p.name, value: p.slug })),
            );
          })
          .catch(() => {}),
      );
    }

    Promise.all(promises).then(() => setReady(true));
  }, [artistId, onProjectChange, onTagChange, onMediaTypeChange, onPaintTypeChange]);

  const toggleSingle = (current: string, slug: string, cb: (v: string) => void) => {
    cb(current === slug ? '' : slug);
  };

  const toggleTag = (current: string[], slug: string, cb: (v: string[]) => void) => {
    cb(current.includes(slug) ? [] : [slug]);
  };

  const allTypesSelected = !typeValues || typeValues.length === 0;

  const toggleType = (value: string) => {
    if (!onTypeChange) return;
    if (allTypesSelected) {
      onTypeChange([value]);
    } else if (typeValues!.length === 1 && typeValues![0] === value) {
      onTypeChange([]);
    } else {
      onTypeChange([value]);
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

  return (
    <div
      className={`${className ?? ''} transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Type pills — separate top row */}
      {onTypeChange && typeOptions.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {typeOptions.map((opt) => (
            <button
              key={`type-${opt.value}`}
              onClick={() => toggleType(opt.value)}
              className={pillClass(
                PILL_STYLES.type,
                allTypesSelected || (typeValues?.includes(opt.value) ?? false),
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
          onChange={(v) => {
            onChange(v);
            if (v === '') {
              onTagChange?.([]);
              onMediaTypeChange?.('');
              onPaintTypeChange?.('');
            }
          }}
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
                  className={pillClass(PILL_STYLES.mediaType, active, disabled)}
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
                  className={pillClass(PILL_STYLES.paintType, active, disabled)}
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
                  className={pillClass(PILL_STYLES.tag, active, disabled)}
                >
                  {opt.label}
                </button>
              );
            })}
        </div>
      )}

      {/* Project links */}
      {onProjectChange && projectOptions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 mt-4 text-sm">
          <span className="text-gallery-gray">Projects:</span>
          {projectOptions.map((opt, i, arr) => (
            <span key={opt.value}>
              <button
                onClick={() => onProjectChange(projectValue === opt.value ? '' : opt.value)}
                className={`transition-colors ${
                  projectValue === opt.value ? 'text-white' : 'text-gallery-gray hover:text-white'
                }`}
              >
                {opt.label}
              </button>
              {i < arr.length - 1 && <span className="text-white/20 ml-1.5">/</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
