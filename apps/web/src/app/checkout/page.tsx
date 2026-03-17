'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';
import type { EnabledPayment } from '@gallery/shared';

const inputClass =
  'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

const PROVIDER_STYLES: Record<string, { bg: string; hover: string; label: string }> = {
  paypal: { bg: 'bg-[#0070ba]', hover: 'hover:bg-[#005ea6]', label: 'Pay with PayPal / Card' },
  btcpay: { bg: 'bg-[#f7931a]', hover: 'hover:bg-[#e8850f]', label: 'Pay with Bitcoin' },
};

export default function CheckoutPage() {
  const { items, total, clear, hasPrintItems } = useCartStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enabledPayments, setEnabledPayments] = useState<EnabledPayment[]>([]);
  const needsShipping = hasPrintItems();

  const [shipping, setShipping] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    if (items.length === 0) router.push('/cart');
    api.services
      .enabledPayments()
      .then(setEnabledPayments)
      .catch(() => {});
  }, [items.length, router]);

  if (items.length === 0) return null;

  const shippingValid =
    !needsShipping ||
    (shipping.name &&
      shipping.address1 &&
      shipping.city &&
      shipping.state &&
      shipping.postalCode &&
      shipping.country);

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
    };
  }

  async function handlePayment(provider: string) {
    setLoading(true);
    setError('');
    try {
      const order = await api.orders.create(buildOrderData());
      const result = await api.payments.create(order.id, provider);

      if (provider === 'paypal') {
        // PayPal requires capture
        const captureResult = await api.payments.capture(order.id, provider, {
          paypalOrderId: result.paymentId,
        });
        if (captureResult.status === 'COMPLETED') {
          clear();
          router.push(`/orders/${order.id}/success`);
        }
      } else if (result.checkoutLink) {
        // BTCPay and similar: redirect to external checkout
        window.location.href = result.checkoutLink;
      } else {
        clear();
        router.push(`/orders/${order.id}/success`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 pt-28 pb-24">
      <h1 className="font-serif text-4xl mb-8">Checkout</h1>

      <div className="mb-8 p-4 border border-white/10 rounded-lg">
        <p className="text-gallery-gray mb-1">{items.length} item(s)</p>
        <p className="text-2xl font-serif">${total()}</p>
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
