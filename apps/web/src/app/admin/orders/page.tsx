'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { OrderStatus } from '@gallery/shared';

export default function AdminOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    api.orders
      .list(token, filter || undefined)
      .then(setOrders)
      .catch(() => {});
  }, [token, filter]);

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Orders</h1>

      <div className="flex gap-2 mb-6">
        {['', ...Object.values(OrderStatus)].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filter === status
                ? 'border-gallery-accent text-gallery-accent'
                : 'border-white/10 text-gallery-gray hover:border-white/30'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gallery-gray">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-white/5">
                <td className="px-4 py-3">#{order.id}</td>
                <td className="px-4 py-3">{order.customerEmail}</td>
                <td className="px-4 py-3">
                  {order.items?.map((item: any, idx: number) => (
                    <span key={idx} className="block text-xs">
                      {item.image?.title || `#${item.imageId}`}{' '}
                      <span className="text-gallery-gray">
                        ({item.type === 'print' ? `print: ${item.printSku}` : 'digital'})
                      </span>
                      {item.prodigiOrderId && (
                        <span className="text-gallery-accent"> [{item.prodigiOrderId}]</span>
                      )}
                    </span>
                  )) ?? 0}
                </td>
                <td className="px-4 py-3">${order.total}</td>
                <td className="px-4 py-3 text-gallery-gray">{order.paymentMethod || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      order.status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : order.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-gallery-gray'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gallery-gray">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="text-center text-gallery-gray py-8">No orders found.</p>
        )}
      </div>
    </div>
  );
}
