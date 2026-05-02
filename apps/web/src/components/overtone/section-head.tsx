import type { ReactNode } from 'react';

interface SectionHeadProps {
  tag: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHead({ tag, title, subtitle, action, className = '' }: SectionHeadProps) {
  return (
    <div className={`flex items-end justify-between gap-8 mb-9 ${className}`}>
      <div>
        <div className="ot-section-tag mb-[18px]">{tag}</div>
        <h2 className="ot-display text-[56px] m-0 leading-[1.05]">{title}</h2>
        {subtitle && (
          <p className="mt-6 text-ot-ink-soft text-[15px] max-w-[520px] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
