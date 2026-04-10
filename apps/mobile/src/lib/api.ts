import type {
  GalleryImage,
  GalleryConfig,
  Category,
  Artist,
  Project,
  Order,
  Tag,
  EnabledPayment,
} from '@gallery/shared';

// TODO: change this to your production API URL
const API_URL = 'https://gallery.ilia.to';

const isDev: boolean = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

if (!isDev && !API_URL.startsWith('https://')) {
  throw new Error('API_URL must use HTTPS in production builds');
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const err = new Error(error.message || 'API error') as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function uploadUrl(path: string): string {
  return `${API_URL}/uploads/${path}`;
}

export const api = {
  galleryConfig: {
    get: () => request<GalleryConfig>('/gallery-config'),
  },
  categories: {
    list: () => request<Category[]>('/categories'),
  },
  artists: {
    list: () => request<Artist[]>('/artists'),
    get: (idOrSlug: number | string) => request<Artist>(`/artists/${idOrSlug}`),
  },
  projects: {
    list: (artistId?: number) =>
      request<Project[]>(`/projects${artistId !== undefined ? `?artistId=${artistId}` : ''}`),
  },
  tags: {
    list: () => request<Tag[]>('/tags'),
  },
  images: {
    list: (params?: string) => request<GalleryImage[]>(`/images${params ? `?${params}` : ''}`),
    get: (id: number) => request<GalleryImage>(`/images/${id}`),
  },
  orders: {
    create: (data: {
      customerEmail: string;
      items: { imageId: number; type: string; printSku?: string }[];
    }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: (token: string, status?: string) =>
      request<Order[]>(`/orders${status ? `?status=${status}` : ''}`, {
        headers: authHeaders(token),
      }),
    get: (id: number, accessToken?: string) =>
      request<Order>(
        `/orders/${id}`,
        accessToken
          ? {
              headers: { 'x-order-token': accessToken },
            }
          : undefined,
      ),
  },
  payments: {
    create: (orderId: number, provider: string) =>
      request<{ paymentId: string; checkoutLink?: string }>(
        `/payments/orders/${orderId}/${provider}`,
        { method: 'POST' },
      ),
  },
  services: {
    enabledPayments: () => request<EnabledPayment[]>('/services/payment/enabled'),
  },
  auth: {
    login: (username: string, password: string) =>
      request<{
        accessToken: string;
        role: string;
        artistId?: number;
        mustChangePassword?: boolean;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
};
