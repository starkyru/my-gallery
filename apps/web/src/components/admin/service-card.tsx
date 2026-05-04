import Link from 'next/link';
import type { ServiceConfig } from '@gallery/shared';
import { ChevronDownIcon } from '../icons/chevron-down-icon';

export const inputClass =
  'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

export function ServiceCard({
  config,
  expanded,
  onToggle,
  onEnableChange,
  disabled,
  configUrl,
}: {
  config: ServiceConfig;
  expanded: boolean;
  onToggle: () => void;
  onEnableChange: (enabled: boolean) => void;
  disabled?: boolean;
  configUrl?: string;
}) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4">
        {configUrl ? (
          <div className="flex-1 flex items-center gap-3 pl-7">
            <span className="font-medium">{config.displayName}</span>
            {config.configured ? (
              <span className="text-xs text-green-400">configured</span>
            ) : (
              <span className="text-xs text-gallery-gray">not configured</span>
            )}
          </div>
        ) : (
          <button onClick={onToggle} className="flex-1 text-left">
            <div className="flex items-center gap-3">
              <ChevronDownIcon
                className={`w-4 h-4 text-gallery-gray transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
              <span className="font-medium">{config.displayName}</span>
              {config.configured ? (
                <span className="text-xs text-green-400">configured</span>
              ) : (
                <span className="text-xs text-gallery-gray">not configured</span>
              )}
            </div>
          </button>
        )}
        <div className="flex items-center gap-3">
          {configUrl && (
            <Link
              href={configUrl}
              className="px-3 py-1 border border-white/10 text-white rounded text-xs font-medium hover:bg-white/5 transition-colors"
            >
              Configure
            </Link>
          )}
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
      </div>
      {!configUrl && expanded && !config.configured && config.configHint && (
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
