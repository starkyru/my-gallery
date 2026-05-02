interface PillStyle {
  active: string;
  inactive: string;
}

export const PILL_STYLES = {
  category: {
    active: 'border-ot-ochre text-ot-ochre-deep bg-ot-ochre/10',
    inactive:
      'border-ot-line text-ot-ink-soft bg-transparent hover:border-ot-ochre hover:text-ot-ochre-deep',
  },
  tag: {
    active: 'border-emerald-600/50 text-emerald-700 bg-emerald-500/10',
    inactive:
      'border-ot-line text-ot-ink-soft bg-transparent hover:border-ot-ochre hover:text-ot-ochre-deep',
  },
  mediaType: {
    active: 'border-blue-600/50 text-blue-700 bg-blue-500/10',
    inactive:
      'border-ot-line text-ot-ink-soft bg-transparent hover:border-ot-ochre hover:text-ot-ochre-deep',
  },
  paintType: {
    active: 'border-amber-600/50 text-amber-700 bg-amber-500/10',
    inactive:
      'border-ot-line text-ot-ink-soft bg-transparent hover:border-ot-ochre hover:text-ot-ochre-deep',
  },
  type: {
    active: 'border-ot-ink/40 text-ot-ink bg-ot-ink/10',
    inactive:
      'border-ot-line text-ot-ink-soft bg-transparent hover:border-ot-ochre hover:text-ot-ochre-deep',
  },
} as const satisfies Record<string, PillStyle>;

export function pillClass(style: PillStyle, active: boolean, disabled?: boolean) {
  const base = 'px-4 py-2 text-sm rounded-full border transition-all duration-300';
  if (active) return `${base} ${style.active}`;
  if (disabled) return `${base} border-ot-line-soft text-ot-mute/40 cursor-not-allowed`;
  return `${base} ${style.inactive}`;
}
