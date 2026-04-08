'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Order } from '@gallery/shared';

interface DashboardStats {
  totalImages: number;
  totalOrders: number;
  paidOrders: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    api.orders
      .stats(token)
      .then(setStats)
      .catch(() => {});
    api.orders
      .list(token)
      .then((o) => setOrders(o.slice(0, 10)))
      .catch(() => {});
  }, [token]);

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Images', value: stats?.totalImages ?? '-' },
          { label: 'Total Orders', value: stats?.totalOrders ?? '-' },
          { label: 'Paid Orders', value: stats?.paidOrders ?? '-' },
          { label: 'Revenue', value: stats ? `$${stats.revenue}` : '-' },
        ].map((card) => (
          <div key={card.label} className="p-4 sm:p-6 border border-white/10 rounded-lg">
            <p className="text-gallery-gray text-sm mb-1">{card.label}</p>
            <p className="text-2xl font-serif">{card.value}</p>
          </div>
        ))}
      </div>

      <h2 className="font-serif text-xl mb-4">Recent Orders</h2>
      <div className="border border-white/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-gallery-gray">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-white/5">
                <td className="px-4 py-3">#{order.id}</td>
                <td className="px-4 py-3">{order.customerEmail}</td>
                <td className="px-4 py-3">${order.total}</td>
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
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gallery-gray">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
