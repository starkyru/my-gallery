'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';

export default function CheckoutPage() {
  const { items, total, clear } = useCartStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (items.length === 0) router.push('/cart');
  }, [items.length, router]);

  if (items.length === 0) return null;

  async function handlePayPal() {
    setLoading(true);
    setError('');
    try {
      const order = await api.orders.create({
        customerEmail: email,
        imageIds: items.map((i) => i.imageId),
      });
      const { paypalOrderId } = await api.payments.paypal(order.id);
      const result = await api.payments.capturePaypal(order.id, paypalOrderId);
      if (result.status === 'COMPLETED') {
        clear();
        router.push(`/orders/${order.id}/success`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBtcPay() {
    setLoading(true);
    setError('');
    try {
      const order = await api.orders.create({
        customerEmail: email,
        imageIds: items.map((i) => i.imageId),
      });
      const { checkoutLink } = await api.payments.btcpay(order.id);
      window.location.href = checkoutLink;
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
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
        />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="space-y-3">
        <button
          onClick={handlePayPal}
          disabled={!email || loading}
          className="w-full px-6 py-3 bg-[#0070ba] text-white font-medium rounded-lg hover:bg-[#005ea6] transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay with PayPal / Card'}
        </button>
        <button
          onClick={handleBtcPay}
          disabled={!email || loading}
          className="w-full px-6 py-3 bg-[#f7931a] text-white font-medium rounded-lg hover:bg-[#e8850f] transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay with Bitcoin'}
        </button>
      </div>
    </div>
  );
}
