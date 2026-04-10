import { create } from 'zustand';

export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SharedTransitionState {
  active: boolean;
  sourceRect: SourceRect | null;
  imageUri: string;
  aspectRatio: number;
  start: (rect: SourceRect, uri: string, aspectRatio: number) => void;
  finish: () => void;
}

export const useSharedTransition = create<SharedTransitionState>((set) => ({
  active: false,
  sourceRect: null,
  imageUri: '',
  aspectRatio: 1,
  start: (sourceRect, imageUri, aspectRatio) =>
    set({ active: true, sourceRect, imageUri, aspectRatio }),
  finish: () => set({ active: false, sourceRect: null, imageUri: '', aspectRatio: 1 }),
}));
