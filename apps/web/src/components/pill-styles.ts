interface PillStyle {
  active: string;
  inactive: string;
}

export const PILL_STYLES = {
  category: {
    active: 'border-gallery-accent text-gallery-accent bg-gallery-accent/10',
    inactive:
      'border-white/10 text-gallery-gray bg-gallery-accent/[0.03] hover:border-white/30 hover:text-white',
  },
  tag: {
    active: 'border-emerald-400/50 text-emerald-300 bg-emerald-500/15',
    inactive:
      'border-white/10 text-gallery-gray bg-emerald-500/[0.04] hover:border-white/30 hover:text-white',
  },
  mediaType: {
    active: 'border-blue-400/50 text-blue-300 bg-blue-500/15',
    inactive:
      'border-white/10 text-gallery-gray bg-blue-500/[0.04] hover:border-white/30 hover:text-white',
  },
  paintType: {
    active: 'border-amber-400/50 text-amber-300 bg-amber-500/15',
    inactive:
      'border-white/10 text-gallery-gray bg-amber-500/[0.04] hover:border-white/30 hover:text-white',
  },
  type: {
    active: 'border-white/60 text-white bg-white/10',
    inactive:
      'border-white/10 text-gallery-gray bg-white/[0.03] hover:border-white/30 hover:text-white',
  },
} as const satisfies Record<string, PillStyle>;

export function pillClass(style: PillStyle, active: boolean, disabled?: boolean) {
  const base = 'px-4 py-2 text-sm rounded-full border transition-all duration-300';
  if (active) return `${base} ${style.active}`;
  if (disabled) return `${base} border-white/5 text-white/20 cursor-not-allowed`;
  return `${base} ${style.inactive}`;
}
