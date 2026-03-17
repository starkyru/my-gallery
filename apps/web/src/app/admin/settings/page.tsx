'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { ServiceConfig } from '@gallery/shared';

const inputClass =
  'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

export default function SettingsPage() {
  const { token } = useAuthStore();
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [settings, setSettings] = useState<Record<string, Record<string, any>>>({});
  const [skus, setSkus] = useState<Record<string, { sku: string; description: string }[]>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [newSku, setNewSku] = useState<Record<string, { sku: string; description: string }>>({});

  useEffect(() => {
    if (token) loadConfigs();
  }, [token]);

  async function loadConfigs() {
    if (!token) return;
    const data = await api.services.list(token);
    setConfigs(data);
    const creds: Record<string, Record<string, string>> = {};
    const sets: Record<string, Record<string, any>> = {};
    const sk: Record<string, { sku: string; description: string }[]> = {};
    for (const c of data) {
      creds[c.provider] = {};
      sets[c.provider] = { ...c.settings };
      sk[c.provider] = [...(c.skus || [])];
    }
    setCredentials(creds);
    setSettings(sets);
    setSkus(sk);
  }

  async function handleToggle(provider: string, enabled: boolean) {
    if (!token) return;
    await api.services.update(provider, { enabled }, token);
    loadConfigs();
  }

  async function handleSave(provider: string) {
    if (!token) return;
    setSaving(provider);
    try {
      const creds = credentials[provider] || {};
      const hasCredentials = Object.values(creds).some((v) => v !== '');
      await api.services.update(
        provider,
        {
          ...(hasCredentials && { credentials: creds }),
          settings: settings[provider] || {},
          skus: skus[provider],
        },
        token,
      );
      loadConfigs();
    } finally {
      setSaving(null);
    }
  }

  function addSku(provider: string) {
    const entry = newSku[provider];
    if (!entry?.sku || !entry?.description) return;
    setSkus((prev) => ({
      ...prev,
      [provider]: [...(prev[provider] || []), { sku: entry.sku, description: entry.description }],
    }));
    setNewSku((prev) => ({ ...prev, [provider]: { sku: '', description: '' } }));
  }

  function removeSku(provider: string, index: number) {
    setSkus((prev) => ({
      ...prev,
      [provider]: prev[provider].filter((_, i) => i !== index),
    }));
  }

  const paymentConfigs = configs.filter((c) => c.type === 'payment');
  const fulfillmentConfigs = configs.filter((c) => c.type === 'fulfillment');

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Settings</h1>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-4">Payment Providers</h2>
        <div className="space-y-3">
          {paymentConfigs.map((config) => (
            <ServiceCard
              key={config.provider}
              config={config}
              expanded={expanded === config.provider}
              onToggle={() => setExpanded(expanded === config.provider ? null : config.provider)}
              onEnableChange={(enabled) => handleToggle(config.provider, enabled)}
              credentials={credentials[config.provider] || {}}
              onCredentialChange={(key, value) =>
                setCredentials((prev) => ({
                  ...prev,
                  [config.provider]: { ...prev[config.provider], [key]: value },
                }))
              }
              settings={settings[config.provider] || {}}
              onSettingChange={(key, value) =>
                setSettings((prev) => ({
                  ...prev,
                  [config.provider]: { ...prev[config.provider], [key]: value },
                }))
              }
              onSave={() => handleSave(config.provider)}
              saving={saving === config.provider}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">Print Fulfillment</h2>
        <div className="space-y-3">
          {fulfillmentConfigs.map((config) => (
            <div key={config.provider}>
              <ServiceCard
                config={config}
                expanded={expanded === config.provider}
                onToggle={() => setExpanded(expanded === config.provider ? null : config.provider)}
                onEnableChange={(enabled) => handleToggle(config.provider, enabled)}
                credentials={credentials[config.provider] || {}}
                onCredentialChange={(key, value) =>
                  setCredentials((prev) => ({
                    ...prev,
                    [config.provider]: { ...prev[config.provider], [key]: value },
                  }))
                }
                settings={settings[config.provider] || {}}
                onSettingChange={(key, value) =>
                  setSettings((prev) => ({
                    ...prev,
                    [config.provider]: { ...prev[config.provider], [key]: value },
                  }))
                }
                onSave={() => handleSave(config.provider)}
                saving={saving === config.provider}
              />
              {expanded === config.provider && (
                <div className="ml-4 mt-2 p-4 border border-white/10 rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Print Products</h3>
                  <div className="space-y-2">
                    {(skus[config.provider] || []).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-gallery-gray">{s.sku}</span>
                        <span className="flex-1">{s.description}</span>
                        <button
                          onClick={() => removeSku(config.provider, idx)}
                          className="text-red-400 hover:text-red-300 text-xs px-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      value={newSku[config.provider]?.sku || ''}
                      onChange={(e) =>
                        setNewSku((prev) => ({
                          ...prev,
                          [config.provider]: {
                            ...prev[config.provider],
                            sku: e.target.value,
                            description: prev[config.provider]?.description || '',
                          },
                        }))
                      }
                      placeholder="SKU code"
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      value={newSku[config.provider]?.description || ''}
                      onChange={(e) =>
                        setNewSku((prev) => ({
                          ...prev,
                          [config.provider]: {
                            ...prev[config.provider],
                            description: e.target.value,
                            sku: prev[config.provider]?.sku || '',
                          },
                        }))
                      }
                      placeholder="Description"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={() => addSku(config.provider)}
                      className="px-3 py-1 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ServiceCard({
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
