'use client';

import { useState } from 'react';
import type { Category, Project, GalleryImage, Artist } from '@gallery/shared';

interface BulkActionBarProps {
  selectedIds: Set<number>;
  images: GalleryImage[];
  categories: Category[];
  projects: Project[];
  artists: Artist[];
  selectedArtistId: number | null | undefined;
  aiProgress: { done: number; total: number } | null;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAction: (action: string, value?: string) => void;
  onBulkAiDescribe: (applyTitleDesc: boolean) => void;
  onBulkDelete: () => void;
}

const selectClass =
  'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent';

export function BulkActionBar({
  selectedIds,
  images,
  categories,
  projects,
  artists,
  selectedArtistId,
  aiProgress,
  onSelectAll,
  onDeselectAll,
  onBulkAction,
  onBulkAiDescribe,
  onBulkDelete,
}: BulkActionBarProps) {
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkProject, setBulkProject] = useState('');
  const [bulkArtist, setBulkArtist] = useState('');
  const [aiApplyTitleDesc, setAiApplyTitleDesc] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gallery-black/95 backdrop-blur-md border-t border-white/10 px-4 sm:px-6 py-3 z-50">
      <div className="mx-auto max-w-7xl flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="text-sm font-medium">{selectedIds.size} selected</span>
        <button onClick={onSelectAll} className="text-xs text-gallery-accent hover:underline">
          Select All
        </button>
        <button onClick={onDeselectAll} className="text-xs text-gallery-gray hover:text-white">
          Deselect All
        </button>
        <div className="border-l border-white/10 h-6" />
        <button
          onClick={() => onBulkAction('archive')}
          className="px-3 py-1.5 border border-white/10 rounded text-xs hover:border-white/30"
        >
          Archive
        </button>
        <button
          onClick={() => onBulkAction('unarchive')}
          className="px-3 py-1.5 border border-white/10 rounded text-xs hover:border-white/30"
        >
          Unarchive
        </button>
        <div className="border-l border-white/10 h-6" />
        <select
          value={bulkCategory}
          onChange={(e) => setBulkCategory(e.target.value)}
          className={`${selectClass} text-xs`}
        >
          <option value="">Set category...</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {bulkCategory && (
          <button
            onClick={() => {
              onBulkAction('setCategory', bulkCategory);
              setBulkCategory('');
            }}
            className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
          >
            Apply
          </button>
        )}
        <div className="border-l border-white/10 h-6" />
        <select
          value={bulkProject}
          onChange={(e) => setBulkProject(e.target.value)}
          disabled={selectedArtistId === null}
          className={`${selectClass} text-xs`}
        >
          <option value="">
            {selectedArtistId === null ? 'Set project (same artist only)' : 'Set project...'}
          </option>
          {projects
            .filter((p) => p.artistId === selectedArtistId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        {bulkProject && (
          <button
            onClick={() => {
              onBulkAction('setProject', bulkProject);
              setBulkProject('');
            }}
            className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
          >
            Apply
          </button>
        )}
        <div className="border-l border-white/10 h-6" />
        <select
          value={bulkArtist}
          onChange={(e) => setBulkArtist(e.target.value)}
          className={`${selectClass} text-xs`}
        >
          <option value="">Set artist...</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {bulkArtist && (
          <button
            onClick={() => {
              const selectedImages = images.filter((img) => selectedIds.has(img.id));
              const withProject = selectedImages.filter((img) => img.projectId);
              const message =
                withProject.length > 0
                  ? `Are you sure? ${withProject.length} image(s) have a project assigned — it will be removed.`
                  : 'Are you sure you want to change the artist?';
              if (window.confirm(message)) {
                onBulkAction('setArtist', bulkArtist);
                setBulkArtist('');
              }
            }}
            className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
          >
            Apply
          </button>
        )}
        <div className="border-l border-white/10 h-6" />
        <button
          onClick={() => onBulkAiDescribe(aiApplyTitleDesc)}
          disabled={aiProgress !== null}
          className="px-3 py-1.5 border border-white/10 rounded text-xs hover:border-white/30 disabled:opacity-50"
        >
          {aiProgress ? `AI ${aiProgress.done}/${aiProgress.total}...` : 'AI Describe'}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-gallery-gray cursor-pointer">
          <input
            type="checkbox"
            checked={aiApplyTitleDesc}
            onChange={(e) => setAiApplyTitleDesc(e.target.checked)}
            className="accent-gallery-accent"
          />
          Update title &amp; description
        </label>
        <div className="border-l border-white/10 h-6" />
        <button
          onClick={onBulkDelete}
          className="px-3 py-1.5 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
