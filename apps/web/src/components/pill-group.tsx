interface PillGroupProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabledValues?: Set<string>;
}

export function PillGroup({ options, value, onChange, className, disabledValues }: PillGroupProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ''}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        const disabled = !active && opt.value !== '' && disabledValues?.has(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`px-4 py-2 text-sm rounded-full border transition-all duration-300 ${
              active
                ? 'border-gallery-accent text-gallery-accent bg-gallery-accent/10'
                : disabled
                  ? 'border-white/5 text-white/20 cursor-not-allowed'
                  : 'border-white/10 text-gallery-gray hover:border-white/30 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
