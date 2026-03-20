import type { ServiceConfig } from '@gallery/shared';

export const inputClass =
  'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

export function ServiceCard({
  config,
  expanded,
  onToggle,
  onEnableChange,
  disabled,
}: {
  config: ServiceConfig;
  expanded: boolean;
  onToggle: () => void;
  onEnableChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <button onClick={onToggle} className="flex-1 text-left">
          <div className="flex items-center gap-3">
            <svg
              className={`w-4 h-4 text-gallery-gray transition-transform ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{config.displayName}</span>
            {config.configured ? (
              <span className="text-xs text-green-400">configured</span>
            ) : (
              <span className="text-xs text-gallery-gray">not configured</span>
            )}
          </div>
        </button>
        <label
          className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onEnableChange(e.target.checked)}
            disabled={disabled}
            className="accent-gallery-accent"
          />
          <span className="text-sm text-gallery-gray">Enabled</span>
          {disabled && <span className="text-xs text-red-400">Encryption key required</span>}
        </label>
      </div>
      {expanded && !config.configured && config.configHint && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3">
          <p className="text-sm text-gallery-gray">
            {config.configHint} — set in the <code className="text-white/70">.env</code> file in the
            provider folder.
          </p>
        </div>
      )}
    </div>
  );
}
