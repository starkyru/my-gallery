'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { CatalogueCategory, CatalogueProductDetail } from '@/lib/api';

interface CatalogueBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelectSkus: (skus: { sku: string; description: string; price?: string }[]) => void;
  token: string;
}

export function CatalogueBrowser({ open, onClose, onSelectSkus, token }: CatalogueBrowserProps) {
  const [categories, setCategories] = useState<Record<string, CatalogueCategory> | null>(null);
  const [product, setProduct] = useState<CatalogueProductDetail | null>(null);
  const [productName, setProductName] = useState('');
  const [selectedSkus, setSelectedSkus] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    if (categories) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.services.catalogueCategories(token);
      setCategories(data);
    } catch {
      setError('Failed to load catalogue');
    } finally {
      setLoading(false);
    }
  }, [categories, token]);

  useEffect(() => {
    if (open) loadCategories();
  }, [open, loadCategories]);

  async function openProduct(slug: string, name: string) {
    setLoading(true);
    setError('');
    setProduct(null);
    setProductName(name);
    setSelectedSkus(new Set());
    try {
      const data = await api.services.catalogueProduct(slug, token);
      setProduct(data);
    } catch {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  function toggleSku(index: number) {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleAddSelected() {
    if (!product) return;
    const selected = product.variants.rows
      .filter((_, i) => selectedSkus.has(i))
      .map((r) => ({ sku: r.sku, description: r.description }));
    onSelectSkus(selected);
    setProduct(null);
    setSelectedSkus(new Set());
    onClose();
  }

  function handleBack() {
    setProduct(null);
    setProductName('');
    setSelectedSkus(new Set());
    setError('');
  }

  if (!open) return null;

  function renderCategories(cats: Record<string, CatalogueCategory>) {
    return Object.values(cats).map((cat) => (
      <div key={cat.slug} className="mb-4">
        <h3 className="text-sm font-medium text-gallery-gray mb-2">{cat.name}</h3>
        <div className="space-y-1">
          {Object.values(cat.products).map((p) => (
            <button
              key={p.productSlug}
              onClick={() => openProduct(p.productSlug, p.name)}
              className="w-full text-left px-3 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm text-white">{p.name}</span>
              {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                <span className="ml-2 text-xs text-gallery-gray">{p.sizes.join(', ')}</span>
              )}
            </button>
          ))}
        </div>
        {Object.keys(cat.subCategories).length > 0 && (
          <div className="ml-4 mt-2">{renderCategories(cat.subCategories)}</div>
        )}
      </div>
    ));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gallery-black border border-white/10 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-serif text-lg">{product ? productName : 'Prodigi Catalogue'}</h2>
          <div className="flex items-center gap-2">
            {product && (
              <button
                onClick={handleBack}
                className="text-sm text-gallery-gray hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gallery-gray hover:text-white transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-gallery-gray">Loading...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {!loading && !error && !product && categories && renderCategories(categories)}

          {!loading && !error && product && (
            <div>
              {product.description.length > 0 && (
                <p className="text-xs text-gallery-gray mb-1">{product.description[0]}</p>
              )}
              {Array.isArray(product.manufacturing?.shipsTo) &&
                product.manufacturing.shipsTo.length > 0 && (
                  <p className="text-xs text-gallery-gray mb-3">
                    Ships to: {product.manufacturing.shipsTo.join(', ')}
                  </p>
                )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gallery-gray border-b border-white/10">
                    <th className="pb-2 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          product.variants.rows.length > 0 &&
                          selectedSkus.size === product.variants.rows.length
                        }
                        onChange={() => {
                          if (selectedSkus.size === product.variants.rows.length) {
                            setSelectedSkus(new Set());
                          } else {
                            setSelectedSkus(new Set(product.variants.rows.map((_, i) => i)));
                          }
                        }}
                        className="accent-gallery-accent"
                      />
                    </th>
                    <th className="pb-2 pr-2">SKU</th>
                    <th className="pb-2 pr-2">Description</th>
                    <th className="pb-2 pr-2">Size</th>
                    <th className="pb-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.rows.map((row, i) => (
                    <tr
                      key={row.sku}
                      onClick={() => toggleSku(i)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                    >
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedSkus.has(i)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSku(i);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-gallery-accent"
                        />
                      </td>
                      <td className="py-2 pr-2 font-mono text-xs text-gallery-gray">{row.sku}</td>
                      <td className="py-2 pr-2">{row.description}</td>
                      <td className="py-2 pr-2 text-xs text-gallery-gray">
                        {(typeof row.size === 'object' && row.size !== null
                          ? (row.size as unknown as { value: string }).value
                          : row.size) || '-'}
                      </td>
                      <td className="py-2 text-xs">
                        {(typeof row.price === 'object' && row.price !== null
                          ? (row.price as unknown as { value: string }).value
                          : row.price) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {product && selectedSkus.size > 0 && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleAddSelected}
              className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors"
            >
              Add Selected ({selectedSkus.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
