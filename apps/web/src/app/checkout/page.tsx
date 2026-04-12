'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';
import type { EnabledPayment, ShippingRate } from '@gallery/shared';

const inputClass =
  'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

const PROVIDER_STYLES: Record<string, { bg: string; hover: string; label: string }> = {
  paypal: { bg: 'bg-[#0070ba]', hover: 'hover:bg-[#005ea6]', label: 'Pay with PayPal / Card' },
  btcpay: { bg: 'bg-[#f7931a]', hover: 'hover:bg-[#e8850f]', label: 'Pay with Bitcoin' },
  stripe: { bg: 'bg-[#635bff]', hover: 'hover:bg-[#4b45c6]', label: 'Pay with Card' },
};

export default function CheckoutPage() {
  const { items, total, clear, hasShippableItems, removeByImageId } = useCartStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enabledPayments, setEnabledPayments] = useState<EnabledPayment[]>([]);
  const needsShipping = hasShippableItems();
  const validatedRef = useRef<Set<number>>(new Set());

  const [shipping, setShipping] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Shipping rate state
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState('');
  const ratesFetchedForRef = useRef('');

  const hasPhysicalOriginals = items.some((i) => i.type === 'physical_original');

  const selectedRate = shippingRates.find((r) => r.rateId === selectedRateId);
  const shippingCost = selectedRate?.rate ?? 0;

  const shippingAddressFilled =
    shipping.name &&
    shipping.address1 &&
    shipping.city &&
    shipping.state &&
    shipping.postalCode &&
    shipping.country;

  const fetchShippingRates = useCallback(async () => {
    if (!hasPhysicalOriginals || !shippingAddressFilled) return;

    const addressKey = JSON.stringify(shipping);
    if (ratesFetchedForRef.current === addressKey) return;

    const physicalImageIds = items
      .filter((i) => i.type === 'physical_original')
      .map((i) => i.imageId);

    setRatesLoading(true);
    setRatesError('');
    setShippingRates([]);
    setSelectedRateId('');

    try {
      const rates = await api.shipping.getRates({
        imageIds: physicalImageIds,
        toAddress: {
          name: shipping.name,
          address1: shipping.address1,
          ...(shipping.address2 && { address2: shipping.address2 }),
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
        },
      });
      setShippingRates(rates);
      ratesFetchedForRef.current = addressKey;
      if (rates.length > 0) {
        setSelectedRateId(rates[0].rateId);
      }
    } catch (e: unknown) {
      setRatesError(e instanceof Error ? e.message : 'Failed to fetch shipping rates');
    } finally {
      setRatesLoading(false);
    }
  }, [hasPhysicalOriginals, shippingAddressFilled, shipping, items]);

  useEffect(() => {
    if (items.length === 0) router.push('/cart');
    api.services
      .enabledPayments()
      .then(setEnabledPayments)
      .catch(() => {});
  }, [items.length, router]);

  useEffect(() => {
    const imageIds = [...new Set(items.map((i) => i.imageId))];
    const toValidate = imageIds.filter((id) => !validatedRef.current.has(id));
    if (toValidate.length === 0) return;

    Promise.allSettled(
      toValidate.map((id) =>
        api.images.get(id).then(
          () => ({ id, valid: true }),
          () => ({ id, valid: false }),
        ),
      ),
    ).then((results) => {
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        if (r.value.valid) validatedRef.current.add(r.value.id);
        else removeByImageId(r.value.id);
      }
    });
  }, [items, removeByImageId]);

  // Reset rates when address changes
  useEffect(() => {
    const addressKey = JSON.stringify(shipping);
    if (ratesFetchedForRef.current && ratesFetchedForRef.current !== addressKey) {
      ratesFetchedForRef.current = '';
      setShippingRates([]);
      setSelectedRateId('');
    }
  }, [shipping]);

  if (items.length === 0) return null;

  const shippingValid =
    !needsShipping || (shippingAddressFilled && (!hasPhysicalOriginals || selectedRateId));

  const displayTotal = total() + shippingCost;

  function buildOrderData() {
    return {
      customerEmail: email,
      items: items.map((i) => ({
        imageId: i.imageId,
        type: i.type,
        ...(i.printSku && { printSku: i.printSku }),
      })),
      ...(needsShipping && {
        shippingAddress: {
          name: shipping.name,
          address1: shipping.address1,
          ...(shipping.address2 && { address2: shipping.address2 }),
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
        },
      }),
      ...(selectedRate && {
        shippingRateId: selectedRate.rateId,
        shippingCost: selectedRate.rate,
        shippingCarrier: selectedRate.carrier,
        shippingService: selectedRate.service,
      }),
    };
  }

  async function handlePayment(provider: string) {
    setLoading(true);
    setError('');
    try {
      const order = await api.orders.create(buildOrderData());
      const orderToken = order.accessToken;
      const result = await api.payments.create(order.id, provider);

      if (provider === 'paypal') {
        const captureResult = await api.payments.capture(order.id, provider, {
          paypalOrderId: result.paymentId,
        });
        if (captureResult.status === 'COMPLETED') {
          clear();
          router.push(`/orders/${order.id}/success?token=${orderToken}`);
        }
      } else if (result.checkoutLink) {
        window.location.href = result.checkoutLink;
      } else {
        clear();
        router.push(`/orders/${order.id}/success?token=${orderToken}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 pt-28 pb-24">
      <h1 className="font-serif text-4xl mb-8">Checkout</h1>

      <div className="mb-8 p-4 border border-white/10 rounded-lg">
        <p className="text-gallery-gray mb-1">{items.length} item(s)</p>
        <p className="text-2xl font-serif">
          ${displayTotal.toFixed(2)}
          {shippingCost > 0 && (
            <span className="text-sm text-gallery-gray ml-2">
              (incl. ${shippingCost.toFixed(2)} shipping)
            </span>
          )}
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gallery-gray mb-2">Email for delivery</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={inputClass}
        />
      </div>

      {needsShipping && (
        <div className="mb-6 space-y-4">
          <h2 className="font-serif text-xl">Shipping Address</h2>
          <input
            value={shipping.name}
            onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))}
            placeholder="Full name"
            className={inputClass}
          />
          <input
            value={shipping.address1}
            onChange={(e) => setShipping((s) => ({ ...s, address1: e.target.value }))}
            placeholder="Address line 1"
            className={inputClass}
          />
          <input
            value={shipping.address2}
            onChange={(e) => setShipping((s) => ({ ...s, address2: e.target.value }))}
            placeholder="Address line 2 (optional)"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              value={shipping.city}
              onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
              placeholder="City"
              className={inputClass}
            />
            <input
              value={shipping.state}
              onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
              placeholder="State / Province"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              value={shipping.postalCode}
              onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
              placeholder="Postal code"
              className={inputClass}
            />
            <input
              value={shipping.country}
              onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
              placeholder="Country code (e.g. US)"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Shipping rate selection for physical originals */}
      {hasPhysicalOriginals && shippingAddressFilled && (
        <div className="mb-6 space-y-3">
          <h2 className="font-serif text-xl">Shipping Method</h2>

          {!ratesFetchedForRef.current && !ratesLoading && (
            <button
              onClick={fetchShippingRates}
              className="w-full px-4 py-3 border border-gallery-accent text-gallery-accent rounded-lg hover:bg-gallery-accent hover:text-gallery-black transition-colors text-sm"
            >
              Calculate Shipping Rates
            </button>
          )}

          {ratesLoading && (
            <p className="text-gallery-gray text-sm py-3">Calculating shipping rates...</p>
          )}

          {ratesError && <p className="text-red-400 text-sm">{ratesError}</p>}

          {shippingRates.length > 0 && (
            <div className="space-y-2">
              {shippingRates.map((rate) => (
                <label
                  key={rate.rateId}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRateId === rate.rateId
                      ? 'border-gallery-accent bg-gallery-accent/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingRate"
                    value={rate.rateId}
                    checked={selectedRateId === rate.rateId}
                    onChange={() => setSelectedRateId(rate.rateId)}
                    className="accent-gallery-accent"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {rate.carrier} {rate.service}
                    </p>
                    {rate.deliveryDays && (
                      <p className="text-xs text-gallery-gray">
                        Est. {rate.deliveryDays} business day{rate.deliveryDays !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium">${rate.rate.toFixed(2)}</p>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="space-y-3">
        {enabledPayments.map((payment) => {
          const style = PROVIDER_STYLES[payment.provider] || {
            bg: 'bg-white/10',
            hover: 'hover:bg-white/20',
            label: `Pay with ${payment.displayName}`,
          };
          return (
            <button
              key={payment.provider}
              onClick={() => handlePayment(payment.provider)}
              disabled={!email || !shippingValid || loading}
              className={`w-full px-6 py-3 ${style.bg} text-white font-medium rounded-lg ${style.hover} transition-colors disabled:opacity-50`}
            >
              {loading ? 'Processing...' : style.label}
            </button>
          );
        })}
        {enabledPayments.length === 0 && (
          <p className="text-gallery-gray text-sm text-center py-4">
            No payment methods are currently available.
          </p>
        )}
      </div>
    </div>
  );
}
