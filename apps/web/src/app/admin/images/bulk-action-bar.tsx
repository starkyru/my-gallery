'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { Category, Project, GalleryImage, Artist } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { Modal } from '@/components/common/modal';

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

type DialogType = 'category' | 'project' | 'artist' | null;

function SelectedThumbnails({
  images,
  selectedIds,
}: {
  images: GalleryImage[];
  selectedIds: Set<number>;
}) {
  const selected = images.filter((img) => selectedIds.has(img.id));
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {selected.map((img) => (
        <div key={img.id} className="w-8 h-8 rounded overflow-hidden bg-white/5 shrink-0">
          <Image
            src={`${UPLOAD_URL}/${img.thumbnailPath}`}
            alt={img.title}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

const selectClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent';

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
  const [aiApplyTitleDesc, setAiApplyTitleDesc] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [confirming, setConfirming] = useState(false);
  const [dialogValue, setDialogValue] = useState('');

  const openDialog = useCallback((type: DialogType) => {
    setActiveDialog(type);
    setDialogValue('');
    setConfirming(false);
  }, []);

  const closeDialog = useCallback(() => {
    if (confirming) {
      setConfirming(false);
    } else {
      setActiveDialog(null);
      setDialogValue('');
    }
  }, [confirming]);

  const handleConfirm = useCallback(() => {
    if (!dialogValue || !activeDialog) return;
    setConfirming(true);
  }, [dialogValue, activeDialog]);

  const handleApply = useCallback(() => {
    if (!activeDialog || !dialogValue) return;
    const actionMap: Record<string, string> = {
      category: 'setCategory',
      project: 'setProject',
      artist: 'setArtist',
    };
    onBulkAction(actionMap[activeDialog], dialogValue);
    setActiveDialog(null);
    setDialogValue('');
    setConfirming(false);
  }, [activeDialog, dialogValue, onBulkAction]);

  const getDialogTitle = () => {
    switch (activeDialog) {
      case 'category':
        return 'Set Category';
      case 'project':
        return 'Set Project';
      case 'artist':
        return 'Set Artist';
      default:
        return '';
    }
  };

  const getConfirmMessage = () => {
    if (!activeDialog || !dialogValue) return '';
    switch (activeDialog) {
      case 'category': {
        const cat = categories.find((c) => c.slug === dialogValue);
        return `Set category to "${cat?.name}" for ${selectedIds.size} image(s)?`;
      }
      case 'project': {
        const proj = projects.find((p) => String(p.id) === dialogValue);
        return `Set project to "${proj?.name}" for ${selectedIds.size} image(s)?`;
      }
      case 'artist': {
        const artist = artists.find((a) => String(a.id) === dialogValue);
        const selectedImages = images.filter((img) => selectedIds.has(img.id));
        const withProject = selectedImages.filter((img) => img.projectId);
        const warning =
          withProject.length > 0
            ? `\n\n${withProject.length} image(s) have a project assigned — it will be removed.`
            : '';
        return `Set artist to "${artist?.name}" for ${selectedIds.size} image(s)?${warning}`;
      }
      default:
        return '';
    }
  };

  const iconBtnClass =
    'p-1.5 border border-white/10 rounded hover:border-white/30 transition-colors';

  return (
    <>
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
          {/* Type buttons */}
          <button
            onClick={() => {
              if (window.confirm(`Set ${selectedIds.size} image(s) as Photographs?`)) {
                onBulkAction('setType', 'photo');
              }
            }}
            title="Set as Photograph"
            className={iconBtnClass}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Set ${selectedIds.size} image(s) as Paintings?`)) {
                onBulkAction('setType', 'painting');
              }
            }}
            title="Set as Painting"
            className={iconBtnClass}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
          </button>
          <div className="border-l border-white/10 h-6" />
          {/* Category / Project / Artist icon buttons */}
          <button
            onClick={() => openDialog('category')}
            title="Set Category"
            className={iconBtnClass}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </button>
          <button
            onClick={() => openDialog('project')}
            title={
              selectedArtistId === null
                ? 'Set Project (select images from same artist)'
                : 'Set Project'
            }
            disabled={selectedArtistId === null}
            className={`${iconBtnClass} ${selectedArtistId === null ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </button>
          <button onClick={() => openDialog('artist')} title="Set Artist" className={iconBtnClass}>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </button>
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

      {/* Selection dialog */}
      <Modal
        open={activeDialog !== null && !confirming}
        onClose={closeDialog}
        title={getDialogTitle()}
      >
        <SelectedThumbnails images={images} selectedIds={selectedIds} />

        {activeDialog === 'category' && (
          <select
            value={dialogValue}
            onChange={(e) => setDialogValue(e.target.value)}
            className={selectClass}
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {activeDialog === 'project' && (
          <select
            value={dialogValue}
            onChange={(e) => setDialogValue(e.target.value)}
            className={selectClass}
          >
            <option value="">Select project...</option>
            {projects
              .filter((p) => p.artistId === selectedArtistId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        )}

        {activeDialog === 'artist' && (
          <select
            value={dialogValue}
            onChange={(e) => setDialogValue(e.target.value)}
            className={selectClass}
          >
            <option value="">Select artist...</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={closeDialog}
            className="px-4 py-2 border border-white/10 rounded text-sm hover:border-white/30"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!dialogValue}
            className="px-4 py-2 bg-gallery-accent text-gallery-black rounded text-sm font-medium disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </Modal>

      {/* Confirmation dialog */}
      <Modal open={confirming} onClose={closeDialog} title="Confirm">
        <p className="text-sm text-gallery-gray whitespace-pre-line">{getConfirmMessage()}</p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={closeDialog}
            className="px-4 py-2 border border-white/10 rounded text-sm hover:border-white/30"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-gallery-accent text-gallery-black rounded text-sm font-medium"
          >
            OK
          </button>
        </div>
      </Modal>
    </>
  );
}
