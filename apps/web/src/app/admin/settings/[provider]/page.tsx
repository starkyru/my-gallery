'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import { inputClass } from '@/components/service-card';
import { ChevronLeftIcon } from '@/components/icons/chevron-left-icon';
import { CatalogueBrowser } from '@/components/catalogue-browser';
import { FULFILLMENT_COUNTRY, FULFILLMENT_CURRENCY } from '@/config';
import type { ServiceConfig } from '@gallery/shared';

export default function ProviderSettingsPage() {
  const { provider } = useParams<{ provider: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const notify = useNotification();

  const [config, setConfig] = useState<ServiceConfig | null>(null);
  const [skus, setSkus] = useState<{ sku: string; description: string }[]>([]);
  const [newSku, setNewSku] = useState({ sku: '', description: '' });
  const [sandbox, setSandbox] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, { price: string; currency: string }>>({});
  const [fetchingPrices, setFetchingPrices] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!token) return;
    const data = await api.services.list(token);
    const found = data.find((c: ServiceConfig) => c.provider === provider);
    if (!found) {
      notify.error(`Provider "${provider}" not found`);
      router.push('/admin/settings');
      return;
    }
    setConfig(found);
    setSkus([...(found.skus || [])]);
    setSandbox(found.sandbox);
  }, [token, provider, notify, router]);

  useEffect(() => {
    if (token && provider) loadConfig();
  }, [token, provider, loadConfig]);

  async function handleSaveSkus() {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await api.services.update(provider, { skus }, token);
      setConfig(updated);
      setSkus([...(updated.skus || [])]);
      notify.success('SKUs saved');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to save SKUs');
    } finally {
      setSaving(false);
    }
  }

  function addSku() {
    if (!newSku.sku || !newSku.description) return;
    setSkus((prev) => [...prev, { sku: newSku.sku, description: newSku.description }]);
    setNewSku({ sku: '', description: '' });
  }

  function removeSku(index: number) {
    setSkus((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpdatePrices() {
    if (!token || skus.length === 0) return;
    setFetchingPrices(true);
    try {
      const result = await api.services.getQuotes(
        skus.map((s) => s.sku),
        FULFILLMENT_COUNTRY,
        FULFILLMENT_CURRENCY,
        token,
      );
      const map: Record<string, { price: string; currency: string }> = {};
      for (const item of result) {
        map[item.sku] = { price: item.price, currency: item.currency };
      }
      setPrices(map);
      notify.success('Prices updated');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to fetch prices');
    } finally {
      setFetchingPrices(false);
    }
  }

  function handleCatalogueSelect(selected: { sku: string; description: string }[]) {
    setSkus((prev) => {
      const existingCodes = new Set(prev.map((s) => s.sku));
      const newItems = selected.filter((s) => !existingCodes.has(s.sku));
      return [...prev, ...newItems];
    });
  }

  if (!config) {
    return <div className="text-gallery-gray">Loading...</div>;
  }

  return (
    <div>
      <button
        onClick={() => router.push('/admin/settings')}
        className="text-sm text-gallery-gray hover:text-white transition-colors mb-6 flex items-center gap-1"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to Settings
      </button>

      <h1 className="font-serif text-3xl mb-8">{config.displayName}</h1>

      {!config.configured && config.configHint && (
        <div className="mb-6 p-4 border border-white/10 rounded-lg">
          <p className="text-sm text-gallery-gray">
            {config.configHint} — set in the <code className="text-white/70">.env</code> file in the
            provider folder.
          </p>
        </div>
      )}

      <div className="p-4 border border-white/10 rounded-lg">
        <label className="flex items-center gap-2 mb-6 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={sandbox}
            onChange={async (e) => {
              if (!token) return;
              const checked = e.target.checked;
              if (!checked) {
                const confirmed = window.confirm(
                  'Disabling sandbox mode will route orders to the production API. Continue?',
                );
                if (!confirmed) return;
              }
              setSandbox(checked);
              try {
                const updated = await api.services.update(provider, { sandbox: checked }, token);
                setConfig(updated);
                notify.success('Sandbox mode updated');
              } catch (err: unknown) {
                notify.error(err instanceof Error ? err.message : 'Failed to update sandbox mode');
              }
            }}
            className="accent-gallery-accent"
          />
          Sandbox mode
          <span className="text-xs text-gallery-gray">(uses sandbox API when enabled)</span>
        </label>

        <h3 className="text-sm font-medium mb-3">Print Products</h3>
        <div className="space-y-2">
          {skus.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-gallery-gray">{s.sku}</span>
              <span className="flex-1">{s.description}</span>
              {prices[s.sku] && (
                <span className="text-xs text-gallery-gray">
                  {prices[s.sku].currency} {prices[s.sku].price}
                </span>
              )}
              <button
                onClick={() => removeSku(idx)}
                className="text-red-400 hover:text-red-300 text-xs px-1"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={newSku.sku}
            onChange={(e) => setNewSku((prev) => ({ ...prev, sku: e.target.value }))}
            placeholder="SKU code"
            className={`${inputClass} flex-1`}
          />
          <input
            value={newSku.description}
            onChange={(e) => setNewSku((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={addSku}
            className="px-3 py-1 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
          >
            Add
          </button>
          {config.configured && (
            <button
              onClick={() => setCatalogueOpen(true)}
              className="px-3 py-1 border border-white/10 text-white rounded text-xs font-medium hover:bg-white/5 transition-colors"
            >
              Browse Catalogue
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSaveSkus}
            disabled={saving}
            className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save SKUs'}
          </button>
          {config.configured && skus.length > 0 && (
            <button
              onClick={handleUpdatePrices}
              disabled={fetchingPrices}
              className="px-4 py-1.5 border border-white/10 text-white rounded text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {fetchingPrices ? 'Fetching...' : 'Update Prices'}
            </button>
          )}
        </div>
        {config.configured && token && (
          <CatalogueBrowser
            open={catalogueOpen}
            onClose={() => setCatalogueOpen(false)}
            onSelectSkus={handleCatalogueSelect}
            token={token}
          />
        )}
      </div>
    </div>
  );
}
