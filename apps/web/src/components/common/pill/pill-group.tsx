import { PILL_STYLES, pillClass } from './pill-styles';

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
            className={pillClass(PILL_STYLES.category, active, disabled)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
