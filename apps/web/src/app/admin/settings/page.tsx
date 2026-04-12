'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import { ServiceCard } from '@/components/service-card';
import type { ServiceConfig, ShipFromAddress } from '@gallery/shared';

export default function SettingsPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [encryptionKeySet, setEncryptionKeySet] = useState(true);

  const [galleryName, setGalleryName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [savingGallery, setSavingGallery] = useState(false);
  const [shipFrom, setShipFrom] = useState<ShipFromAddress>({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
  });
  const [savingShipFrom, setSavingShipFrom] = useState(false);

  const loadConfigs = useCallback(async () => {
    if (!token) return;
    const data = await api.services.list(token);
    setConfigs(data);
  }, [token]);

  useEffect(() => {
    if (token) {
      loadConfigs();
      api.services
        .status(token)
        .then((s) => setEncryptionKeySet(s.encryptionKeySet))
        .catch(() => {});
      api.galleryConfig
        .get()
        .then((c) => {
          setGalleryName(c.galleryName || 'Gallery');
          setSubtitle(c.subtitle || '');
          setSiteUrl(c.siteUrl || '');
          setAboutText(c.aboutText || '');
          if (c.shipFromAddress) {
            setShipFrom((prev) => ({ ...prev, ...c.shipFromAddress }));
          }
        })
        .catch(() => {});
    }
  }, [token, loadConfigs]);

  async function handleSaveGallerySettings() {
    if (!token) return;
    setSavingGallery(true);
    try {
      await api.galleryConfig.update({ galleryName, subtitle, siteUrl, aboutText }, token);
      notify.success('Gallery settings saved');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to save gallery settings');
    } finally {
      setSavingGallery(false);
    }
  }

  async function handleSaveShipFrom() {
    if (!token) return;
    setSavingShipFrom(true);
    try {
      await api.galleryConfig.update({ shipFromAddress: shipFrom }, token);
      notify.success('Ship-from address saved');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to save ship-from address');
    } finally {
      setSavingShipFrom(false);
    }
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

  const paymentConfigs = configs.filter((c) => c.type === 'payment');
  const fulfillmentConfigs = configs.filter((c) => c.type === 'fulfillment');

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Settings</h1>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-4">Gallery Settings</h2>
        <div className="p-4 border border-white/10 rounded-lg space-y-3">
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Gallery Name</label>
            <input
              value={galleryName}
              onChange={(e) => setGalleryName(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Subtitle</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Fine Art Photography"
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Site URL</label>
            <input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="e.g. https://gallery.example.com"
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">About Page Text</label>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Tell visitors about your gallery..."
              rows={4}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <button
            onClick={handleSaveGallerySettings}
            disabled={savingGallery}
            className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {savingGallery ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-4">Ship From Address</h2>
        <div className="p-4 border border-white/10 rounded-lg space-y-3">
          <p className="text-xs text-gallery-gray mb-2">
            Used to calculate shipping rates for physical original artwork sales.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gallery-gray mb-1">Name</label>
              <input
                value={shipFrom.name}
                onChange={(e) => setShipFrom({ ...shipFrom, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-gallery-gray mb-1">Company (optional)</label>
              <input
                value={shipFrom.company ?? ''}
                onChange={(e) => setShipFrom({ ...shipFrom, company: e.target.value })}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Street Address</label>
            <input
              value={shipFrom.street1}
              onChange={(e) => setShipFrom({ ...shipFrom, street1: e.target.value })}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">
              Street Address 2 (optional)
            </label>
            <input
              value={shipFrom.street2 ?? ''}
              onChange={(e) => setShipFrom({ ...shipFrom, street2: e.target.value })}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gallery-gray mb-1">City</label>
              <input
                value={shipFrom.city}
                onChange={(e) => setShipFrom({ ...shipFrom, city: e.target.value })}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-gallery-gray mb-1">State</label>
              <input
                value={shipFrom.state}
                onChange={(e) => setShipFrom({ ...shipFrom, state: e.target.value })}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-gallery-gray mb-1">ZIP Code</label>
              <input
                value={shipFrom.zip}
                onChange={(e) => setShipFrom({ ...shipFrom, zip: e.target.value })}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-gallery-gray mb-1">Country</label>
              <input
                value={shipFrom.country}
                onChange={(e) => setShipFrom({ ...shipFrom, country: e.target.value })}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Phone (optional)</label>
            <input
              value={shipFrom.phone ?? ''}
              onChange={(e) => setShipFrom({ ...shipFrom, phone: e.target.value })}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent"
            />
          </div>
          <button
            onClick={handleSaveShipFrom}
            disabled={savingShipFrom}
            className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {savingShipFrom ? 'Saving...' : 'Save'}
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
              disabled={!encryptionKeySet}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">Print Fulfillment</h2>
        <div className="space-y-3">
          {fulfillmentConfigs.map((config) => (
            <ServiceCard
              key={config.provider}
              config={config}
              expanded={expanded === config.provider}
              onToggle={() => setExpanded(expanded === config.provider ? null : config.provider)}
              onEnableChange={(enabled) => handleToggle(config.provider, enabled)}
              disabled={!encryptionKeySet}
              configUrl={`/admin/settings/${config.provider}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
