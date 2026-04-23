'use client';

import type { Category, Artist } from '@gallery/shared';

interface FilterSortBarProps {
  filterArtist: string;
  onFilterArtistChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  filterArchive: 'all' | 'active' | 'archived';
  onFilterArchiveChange: (value: 'all' | 'active' | 'archived') => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  colsPerRow: number;
  onColsPerRowChange: (value: number) => void;
  imageCount: number;
  selectedCount: number;
  onToggleSelectAll: () => void;
  artists: Artist[];
  categories: Category[];
}

const selectClass =
  'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent';

const gridOptions = [
  { cols: 1, label: '1 per row' },
  { cols: 3, label: '3 per row' },
  { cols: 5, label: '5 per row' },
  { cols: 10, label: '10 per row' },
];

export function FilterSortBar({
  filterArtist,
  onFilterArtistChange,
  filterCategory,
  onFilterCategoryChange,
  filterArchive,
  onFilterArchiveChange,
  sortValue,
  onSortChange,
  colsPerRow,
  onColsPerRowChange,
  imageCount,
  selectedCount,
  onToggleSelectAll,
  artists,
  categories,
}: FilterSortBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6 items-center">
      <select
        value={filterArtist}
        onChange={(e) => onFilterArtistChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Artists</option>
        {artists.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <select
        value={filterCategory}
        onChange={(e) => onFilterCategoryChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={filterArchive}
        onChange={(e) => onFilterArchiveChange(e.target.value as 'all' | 'active' | 'archived')}
        className={selectClass}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
      <select
        value={sortValue}
        onChange={(e) => onSortChange(e.target.value)}
        className={selectClass}
      >
        <option value="createdAt:desc">Date (newest)</option>
        <option value="createdAt:asc">Date (oldest)</option>
        <option value="price:desc">Price (high-low)</option>
        <option value="price:asc">Price (low-high)</option>
        <option value="artistName:asc">Artist (A-Z)</option>
        <option value="artistName:desc">Artist (Z-A)</option>
        <option value="printsSold:desc">Sales (most)</option>
        <option value="printsSold:asc">Sales (least)</option>
      </select>
      <label className="flex items-center gap-1.5 ml-auto cursor-pointer text-xs text-gallery-gray">
        <input
          type="checkbox"
          checked={imageCount > 0 && selectedCount === imageCount}
          onChange={onToggleSelectAll}
          className="accent-gallery-accent"
        />
        {imageCount} image{imageCount !== 1 ? 's' : ''}
      </label>
      <select
        value={colsPerRow}
        onChange={(e) => onColsPerRowChange(Number(e.target.value))}
        className={selectClass}
      >
        {gridOptions.map((opt) => (
          <option key={opt.cols} value={opt.cols}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
