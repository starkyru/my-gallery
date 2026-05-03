'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import { inputClass } from '@/components/service-card';
import { ChevronLeftIcon } from '@/components/icons/chevron-left-icon';
import { CatalogueBrowser } from '@/components/catalogue-browser';
import { FULFILLMENT_COUNTRY, FULFILLMENT_CURRENCY } from '@/config';
import type { ServiceConfig } from '@gallery/shared';

const cmToInch = (cm: number) => {
  if (!cm) return 0;
  const raw = cm / 2.54;
  const rounded = Math.round(raw);
  // If within 0.05" of an integer, snap to it
  return Math.abs(raw - rounded) < 0.05 ? rounded : +raw.toFixed(1);
};
const inchToCm = (inch: number) => (inch ? +(inch * 2.54).toFixed(1) : 0);

const PRESET_SIZES: { label: string; widthCm: number; heightCm: number }[] = [
  { label: '5×7"', widthCm: 12.7, heightCm: 17.8 },
  { label: 'A5', widthCm: 14.8, heightCm: 21.0 },
  { label: '8×10"', widthCm: 20.3, heightCm: 25.4 },
  { label: 'Letter', widthCm: 21.6, heightCm: 27.9 },
  { label: 'A4', widthCm: 21.0, heightCm: 29.7 },
  { label: '11×14"', widthCm: 27.9, heightCm: 35.6 },
  { label: 'A3', widthCm: 29.7, heightCm: 42.0 },
  { label: '12×16"', widthCm: 30.5, heightCm: 40.6 },
  { label: '13×19"', widthCm: 33.0, heightCm: 48.3 },
  { label: 'A3+', widthCm: 32.9, heightCm: 48.3 },
  { label: '16×20"', widthCm: 40.6, heightCm: 50.8 },
  { label: '17×22"', widthCm: 43.2, heightCm: 55.9 },
];

const MEDIA_TYPE_SUGGESTIONS = [
  'Glossy Photo Paper',
  'Matte Photo Paper',
  'Semi-Gloss Photo Paper',
  'Canvas',
  'Watercolor Paper',
  'Fine Art Rag',
  'Baryta Paper',
  'Metallic Paper',
  'Cotton Rag',
  'Bamboo Paper',
];

export default function ProviderSettingsPage() {
  const { provider } = useParams<{ provider: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const notify = useNotification();

  const [config, setConfig] = useState<ServiceConfig | null>(null);
  const [skus, setSkus] = useState<
    {
      sku: string;
      description: string;
      price?: string;
      widthCm?: number;
      heightCm?: number;
      mediaType?: string;
    }[]
  >([]);
  const [newSku, setNewSku] = useState({
    sku: '',
    description: '',
    widthCm: '',
    heightCm: '',
    widthIn: '',
    heightIn: '',
    mediaType: '',
  });
  const [sandbox, setSandbox] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [fetchingPrices, setFetchingPrices] = useState(false);

  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const routerRef = useRef(router);
  routerRef.current = router;

  const loadConfig = useCallback(() => {
    if (!token || !provider) return;
    api.services.list(token).then((data) => {
      const found = data.find((c: ServiceConfig) => c.provider === provider);
      if (!found) {
        notifyRef.current.error(`Provider "${provider}" not found`);
        routerRef.current.push('/admin/settings');
        return;
      }
      setConfig(found);
      setSkus([...(found.skus || [])]);
      setSandbox(found.sandbox);
    });
  }, [token, provider]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
    setSkus((prev) => [
      ...prev,
      {
        sku: newSku.sku,
        description: newSku.description,
        ...(newSku.widthCm ? { widthCm: +newSku.widthCm } : {}),
        ...(newSku.heightCm ? { heightCm: +newSku.heightCm } : {}),
        ...(newSku.mediaType ? { mediaType: newSku.mediaType } : {}),
      },
    ]);
    setNewSku({
      sku: '',
      description: '',
      widthCm: '',
      heightCm: '',
      widthIn: '',
      heightIn: '',
      mediaType: '',
    });
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
      const priceMap = new Map(result.map((r) => [r.sku, r.price]));
      const updatedSkus = skus.map((s) => ({
        ...s,
        price: priceMap.get(s.sku) ?? s.price,
      }));
      const updated = await api.services.update(provider, { skus: updatedSkus }, token);
      setConfig(updated);
      setSkus([...(updated.skus || [])]);
      notify.success('Prices updated and saved');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to fetch prices');
    } finally {
      setFetchingPrices(false);
    }
  }

  async function handleCatalogueSelect(selected: { sku: string; description: string }[]) {
    if (!token) return;
    const existingCodes = new Set(skus.map((s) => s.sku));
    const newItems = selected.filter((s) => !existingCodes.has(s.sku));
    if (newItems.length === 0) return;
    try {
      const quotes = await api.services.getQuotes(
        newItems.map((s) => s.sku),
        FULFILLMENT_COUNTRY,
        FULFILLMENT_CURRENCY,
        token,
      );
      const priceMap = new Map(quotes.map((q) => [q.sku, q.price]));
      const withPrices = newItems.map((s) => ({ ...s, price: priceMap.get(s.sku) }));
      const merged = [...skus, ...withPrices];
      setSkus(merged);
      const updated = await api.services.update(provider, { skus: merged }, token);
      setConfig(updated);
      setSkus([...(updated.skus || [])]);
      notify.success(`${newItems.length} item(s) added`);
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to save');
    }
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
              <span className="font-mono text-xs text-gallery-gray min-w-0 truncate max-w-[140px]">
                {s.sku}
              </span>
              <span className="flex-1 min-w-0 truncate">{s.description}</span>
              {s.price && <span className="text-xs text-gallery-gray">${s.price}</span>}
              <input
                key={`w-in-${idx}-${s.widthCm}`}
                defaultValue={s.widthCm ? cmToInch(s.widthCm) : ''}
                onBlur={(e) =>
                  setSkus((prev) =>
                    prev.map((sk, i) =>
                      i === idx
                        ? { ...sk, widthCm: e.target.value ? inchToCm(+e.target.value) : undefined }
                        : sk,
                    ),
                  )
                }
                type="number"
                step="0.01"
                placeholder="W"
                className={`${inputClass} w-16`}
              />
              <input
                key={`h-in-${idx}-${s.heightCm}`}
                defaultValue={s.heightCm ? cmToInch(s.heightCm) : ''}
                onBlur={(e) =>
                  setSkus((prev) =>
                    prev.map((sk, i) =>
                      i === idx
                        ? {
                            ...sk,
                            heightCm: e.target.value ? inchToCm(+e.target.value) : undefined,
                          }
                        : sk,
                    ),
                  )
                }
                type="number"
                step="0.01"
                placeholder="H"
                className={`${inputClass} w-16`}
              />
              <input
                value={s.mediaType ?? ''}
                onChange={(e) =>
                  setSkus((prev) =>
                    prev.map((sk, i) =>
                      i === idx ? { ...sk, mediaType: e.target.value || undefined } : sk,
                    ),
                  )
                }
                list="media-type-suggestions"
                placeholder="Media type"
                className={`${inputClass} w-32`}
              />
              <button
                onClick={() => removeSku(idx)}
                className="text-red-400 hover:text-red-300 text-xs px-1"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <input
            value={newSku.sku}
            onChange={(e) => setNewSku((prev) => ({ ...prev, sku: e.target.value }))}
            placeholder="SKU code"
            className={`${inputClass} flex-1 min-w-[100px]`}
          />
          <input
            value={newSku.description}
            onChange={(e) => setNewSku((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className={`${inputClass} flex-1 min-w-[100px]`}
          />
          <input
            value={newSku.widthIn}
            onChange={(e) => {
              const inch = e.target.value;
              setNewSku((prev) => ({
                ...prev,
                widthIn: inch,
                widthCm: inch ? String(inchToCm(+inch)) : '',
              }));
            }}
            type="number"
            step="0.01"
            placeholder="W"
            className={`${inputClass} w-16`}
          />
          <input
            value={newSku.heightIn}
            onChange={(e) => {
              const inch = e.target.value;
              setNewSku((prev) => ({
                ...prev,
                heightIn: inch,
                heightCm: inch ? String(inchToCm(+inch)) : '',
              }));
            }}
            type="number"
            step="0.01"
            placeholder="H"
            className={`${inputClass} w-16`}
          />
          <input
            value={newSku.mediaType}
            onChange={(e) => setNewSku((prev) => ({ ...prev, mediaType: e.target.value }))}
            list="media-type-suggestions"
            placeholder="Media type"
            className={`${inputClass} w-32`}
          />
          <button
            onClick={addSku}
            className="px-3 py-1 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
          >
            Add
          </button>
          {config.configured && provider !== 'inhouse' && (
            <button
              onClick={() => setCatalogueOpen(true)}
              className="px-3 py-1 border border-white/10 text-white rounded text-xs font-medium hover:bg-white/5 transition-colors"
            >
              Browse Catalogue
            </button>
          )}
        </div>
        <div className="mt-2">
          <span className="text-xs text-gallery-gray mr-2">Size presets:</span>
          <div className="inline-flex flex-wrap gap-1">
            {PRESET_SIZES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  setNewSku((prev) => ({
                    ...prev,
                    widthCm: String(p.widthCm),
                    heightCm: String(p.heightCm),
                    widthIn: String(cmToInch(p.widthCm)),
                    heightIn: String(cmToInch(p.heightCm)),
                    description: prev.description || p.label,
                  }))
                }
                className="px-2 py-0.5 border border-white/10 rounded text-xs text-gallery-gray hover:text-white hover:bg-white/5 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <datalist id="media-type-suggestions">
          {MEDIA_TYPE_SUGGESTIONS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSaveSkus}
            disabled={saving}
            className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save SKUs'}
          </button>
          {config.configured && skus.length > 0 && provider !== 'inhouse' && (
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
