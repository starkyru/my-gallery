'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import { ServiceCard, inputClass } from '@/components/service-card';
import type { ServiceConfig } from '@gallery/shared';

export default function SettingsPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [skus, setSkus] = useState<Record<string, { sku: string; description: string }[]>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [newSku, setNewSku] = useState<Record<string, { sku: string; description: string }>>({});
  const [sandboxState, setSandboxState] = useState<Record<string, boolean>>({});

  const [galleryName, setGalleryName] = useState('');
  const [savingGallery, setSavingGallery] = useState(false);

  useEffect(() => {
    if (token) {
      loadConfigs();
      api.galleryConfig
        .get()
        .then((c) => setGalleryName(c.galleryName || 'Gallery'))
        .catch(() => {});
    }
  }, [token]);

  async function handleSaveGalleryName() {
    if (!token) return;
    setSavingGallery(true);
    try {
      await api.galleryConfig.update({ galleryName }, token);
      notify.success('Gallery name saved');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to save gallery name');
    } finally {
      setSavingGallery(false);
    }
  }

  async function loadConfigs() {
    if (!token) return;
    const data = await api.services.list(token);
    setConfigs(data);
    const sk: Record<string, { sku: string; description: string }[]> = {};
    const sb: Record<string, boolean> = {};
    for (const c of data) {
      sk[c.provider] = [...(c.skus || [])];
      sb[c.provider] = c.sandbox;
    }
    setSkus(sk);
    setSandboxState(sb);
  }

  async function handleToggle(provider: string, enabled: boolean) {
    if (!token) return;
    try {
      await api.services.update(provider, { enabled }, token);
      notify.success('Service updated');
      loadConfigs();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to update service');
    }
  }

  async function handleSaveSkus(provider: string) {
    if (!token) return;
    setSaving(provider);
    try {
      await api.services.update(provider, { skus: skus[provider] }, token);
      notify.success('SKUs saved');
      loadConfigs();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to save SKUs');
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
        <h2 className="font-serif text-xl mb-4">Gallery Settings</h2>
        <div className="p-4 border border-white/10 rounded-lg flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gallery-gray mb-1">Gallery Name</label>
            <input
              value={galleryName}
              onChange={(e) => setGalleryName(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <button
            onClick={handleSaveGalleryName}
            disabled={savingGallery}
            className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {savingGallery ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>

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
              />
              {expanded === config.provider && (
                <div className="ml-4 mt-2 p-4 border border-white/10 rounded-lg">
                  <label className="flex items-center gap-2 mb-4 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sandboxState[config.provider] ?? true}
                      onChange={async (e) => {
                        if (!token) return;
                        const checked = e.target.checked;
                        if (!checked) {
                          const confirmed = window.confirm(
                            'Disabling sandbox mode will route orders to the production API. Continue?',
                          );
                          if (!confirmed) return;
                        }
                        setSandboxState((prev) => ({ ...prev, [config.provider]: checked }));
                        try {
                          await api.services.update(config.provider, { sandbox: checked }, token);
                          notify.success('Sandbox mode updated');
                          loadConfigs();
                        } catch (err: unknown) {
                          notify.error(
                            err instanceof Error ? err.message : 'Failed to update sandbox mode',
                          );
                        }
                      }}
                      className="accent-gallery-accent"
                    />
                    Sandbox mode
                    <span className="text-xs text-gallery-gray">
                      (uses sandbox API when enabled)
                    </span>
                  </label>
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
                  <button
                    onClick={() => handleSaveSkus(config.provider)}
                    disabled={saving === config.provider}
                    className="mt-3 px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
                  >
                    {saving === config.provider ? 'Saving...' : 'Save SKUs'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
