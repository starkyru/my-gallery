'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import type { ContactInquiry } from '@gallery/shared';

export default function AdminContactsPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.contacts.list(token);
      setInquiries(data);
    } catch {
      /* handled */
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleMarkRead(id: number) {
    if (!token) return;
    await api.contacts.markRead(id, token);
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this inquiry?')) return;
    try {
      await api.contacts.delete(id, token);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  const unread = inquiries.filter((i) => !i.read).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <h1 className="font-serif text-3xl">Contact Inquiries</h1>
        {unread > 0 && (
          <span className="px-2 py-0.5 bg-gallery-accent/20 text-gallery-accent rounded-full text-xs">
            {unread} unread
          </span>
        )}
      </div>

      <div className="space-y-3">
        {inquiries.map((inq) => (
          <div
            key={inq.id}
            className={`border rounded-lg transition-colors ${
              inq.read ? 'border-white/5' : 'border-gallery-accent/30'
            }`}
          >
            <button
              onClick={() => {
                setExpandedId(expandedId === inq.id ? null : inq.id);
                if (!inq.read) handleMarkRead(inq.id);
              }}
              className="w-full text-left p-4 flex items-center gap-4"
            >
              {!inq.read && (
                <span className="w-2 h-2 rounded-full bg-gallery-accent flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{inq.name}</span>
                  <span className="text-gallery-gray text-sm">&lt;{inq.email}&gt;</span>
                </div>
                {expandedId !== inq.id && (
                  <p className="text-gallery-gray text-sm truncate mt-0.5">{inq.message}</p>
                )}
              </div>
              <span className="text-gallery-gray text-xs flex-shrink-0">
                {new Date(inq.createdAt).toLocaleDateString()}
              </span>
            </button>

            {expandedId === inq.id && (
              <div className="px-4 pb-4">
                <p className="text-sm whitespace-pre-line leading-relaxed border-t border-white/5 pt-3">
                  {inq.message}
                </p>
                <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
                  <a
                    href={`mailto:${encodeURIComponent(inq.email)}?subject=${encodeURIComponent('Re: Your inquiry')}`}
                    className="text-gallery-accent text-xs hover:text-gallery-accent-light"
                  >
                    Reply via email
                  </a>
                  <button
                    onClick={() => handleDelete(inq.id)}
                    className="text-red-400 text-xs hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {inquiries.length === 0 && (
          <p className="text-center text-gallery-gray py-12">No contact inquiries yet.</p>
        )}
      </div>
    </div>
  );
}
