import type { ServiceConfig } from '@gallery/shared';

export const inputClass =
  'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

export function ServiceCard({
  config,
  expanded,
  onToggle,
  onEnableChange,
  credentials,
  onCredentialChange,
  settings,
  onSettingChange,
  onSave,
  saving,
}: {
  config: ServiceConfig;
  expanded: boolean;
  onToggle: () => void;
  onEnableChange: (enabled: boolean) => void;
  credentials: Record<string, string>;
  onCredentialChange: (key: string, value: string) => void;
  settings: Record<string, any>;
  onSettingChange: (key: string, value: any) => void;
  onSave: () => void;
  saving: boolean;
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onEnableChange(e.target.checked)}
            className="accent-gallery-accent"
          />
          <span className="text-sm text-gallery-gray">Enabled</span>
        </label>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          {config.credentialFields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-gallery-gray mb-1">{field.label}</label>
              <input
                type={field.type === 'password' ? 'password' : 'text'}
                value={credentials[field.key] || ''}
                onChange={(e) => onCredentialChange(field.key, e.target.value)}
                placeholder={
                  config.maskedCredentials[field.key] ? '(set - leave blank to keep)' : ''
                }
                className={inputClass}
              />
            </div>
          ))}
          {(config.settingsSchema || []).map((field) => (
            <div key={field.key}>
              {field.type === 'boolean' ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings[field.key] ?? field.default ?? false}
                    onChange={(e) => onSettingChange(field.key, e.target.checked)}
                    className="accent-gallery-accent"
                  />
                  {field.label}
                </label>
              ) : (
                <>
                  <label className="block text-xs text-gallery-gray mb-1">{field.label}</label>
                  <input
                    value={settings[field.key] ?? ''}
                    onChange={(e) => onSettingChange(field.key, e.target.value)}
                    className={inputClass}
                  />
                </>
              )}
            </div>
          ))}
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
