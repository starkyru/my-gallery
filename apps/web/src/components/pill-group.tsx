interface PillGroupProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PillGroup({ options, value, onChange, className }: PillGroupProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ''}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-sm rounded-full border transition-all duration-300 ${
            value === opt.value
              ? 'border-gallery-accent text-gallery-accent bg-gallery-accent/10'
              : 'border-white/10 text-gallery-gray hover:border-white/30 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
