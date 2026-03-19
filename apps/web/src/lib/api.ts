import type {
  ServiceConfig,
  EnabledPayment,
  FulfillmentSku,
  GalleryImage,
  GalleryConfig,
  Category,
  Project,
  ProtectedGallery,
  ProtectedGalleryPublic,
  Order,
  Artist,
} from '@gallery/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

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

  return res.json();
}

async function uploadRequest<T>(path: string, formData: FormData, token: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const err = new Error(error.message || 'Upload failed') as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  galleryConfig: {
    get: () => request<GalleryConfig>('/gallery-config'),
    update: (data: Partial<GalleryConfig>, token: string) =>
      request<GalleryConfig>('/gallery-config', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
  },
  categories: {
    list: () => request<Category[]>('/categories'),
    create: (data: { name: string; slug: string }, token: string) =>
      request<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    update: (id: number, data: Partial<Category>, token: string) =>
      request<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    delete: (id: number, token: string) =>
      request(`/categories/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
  },
  projects: {
    list: (artistId?: number) =>
      request<Project[]>(`/projects${artistId !== undefined ? `?artistId=${artistId}` : ''}`),
    create: (data: { artistId: number; name: string; slug: string }, token: string) =>
      request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    update: (id: number, data: Partial<Project>, token: string) =>
      request<Project>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    delete: (id: number, token: string) =>
      request(`/projects/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
  },
  images: {
    list: (params?: string) => request<GalleryImage[]>(`/images${params ? `?${params}` : ''}`),
    listAdmin: (token: string) =>
      request<GalleryImage[]>('/images/admin', { headers: authHeaders(token) }),
    get: (id: number) => request<GalleryImage>(`/images/${id}`),
    getAdmin: (id: number, token: string) =>
      request<GalleryImage>(`/images/admin/${id}`, { headers: authHeaders(token) }),
    upload: (formData: FormData, token: string) => uploadRequest('/images', formData, token),
    update: (id: number, data: Record<string, unknown>, token: string) =>
      request(`/images/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    delete: (id: number, token: string) =>
      request(`/images/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
    updateSort: (updates: { id: number; sortOrder: number }[], token: string) =>
      request('/images/sort/order', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: authHeaders(token),
      }),
    bulkAction: (data: { ids: number[]; action: string; value?: string }, token: string) =>
      request('/images/bulk-action', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
  },
  artists: {
    list: () => request<Artist[]>('/artists'),
    get: (id: number) => request<Artist>(`/artists/${id}`),
    create: (data: Record<string, unknown>, token: string) =>
      request('/artists', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    update: (id: number, data: Record<string, unknown>, token: string) =>
      request(`/artists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    delete: (id: number, token: string) =>
      request(`/artists/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
    uploadPortrait: (id: number, formData: FormData, token: string) =>
      uploadRequest<{ portraitPath: string }>(`/artists/${id}/portrait`, formData, token),
  },
  orders: {
    create: (data: {
      customerEmail: string;
      items: { imageId: number; type: string; printSku?: string }[];
      shippingAddress?: {
        name: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
    }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: (token: string, status?: string) =>
      request<Order[]>(`/orders${status ? `?status=${status}` : ''}`, {
        headers: authHeaders(token),
      }),
    get: (id: number, accessToken?: string) =>
      request<Order>(`/orders/${id}${accessToken ? `?token=${accessToken}` : ''}`),
    stats: (token: string) =>
      request<{ totalImages: number; totalOrders: number; paidOrders: number; revenue: number }>(
        '/orders/stats',
        { headers: authHeaders(token) },
      ),
    downloads: (id: number, accessToken?: string) =>
      request<
        {
          imageId: number;
          title?: string;
          type: string;
          downloadUrl?: string;
          printSku?: string;
          status?: string;
        }[]
      >(`/orders/${id}/downloads${accessToken ? `?token=${accessToken}` : ''}`),
  },
  payments: {
    create: (orderId: number, provider: string) =>
      request<{ paymentId: string; checkoutLink?: string }>(
        `/payments/orders/${orderId}/${provider}`,
        { method: 'POST' },
      ),
    capture: (orderId: number, provider: string, data: Record<string, unknown>) =>
      request<{ status: string }>(`/payments/orders/${orderId}/${provider}/capture`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  services: {
    list: (token: string) => request<ServiceConfig[]>('/services', { headers: authHeaders(token) }),
    update: (
      provider: string,
      data: {
        enabled?: boolean;
        skus?: { sku: string; description: string }[];
        sandbox?: boolean;
      },
      token: string,
    ) =>
      request<ServiceConfig>(`/services/${provider}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    enabledPayments: () => request<EnabledPayment[]>('/services/payment/enabled'),
    fulfillmentSkus: () => request<FulfillmentSku[]>('/services/fulfillment/skus'),
  },
  ai: {
    describe: (imageId: number, token: string) =>
      request<{ description: string }>(`/ai/describe/${imageId}`, {
        method: 'POST',
        headers: authHeaders(token),
      }),
  },
  protectedGalleries: {
    listAdmin: (token: string) =>
      request<ProtectedGallery[]>('/protected-galleries/admin', {
        headers: authHeaders(token),
      }),
    create: (data: { name: string; slug: string; password: string }, token: string) =>
      request<ProtectedGallery>('/protected-galleries', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    update: (
      id: number,
      data: { name?: string; slug?: string; password?: string; isActive?: boolean },
      token: string,
    ) =>
      request<ProtectedGallery>(`/protected-galleries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    delete: (id: number, deleteImages?: boolean, token?: string) =>
      request(`/protected-galleries/${id}${deleteImages ? '?deleteImages=true' : ''}`, {
        method: 'DELETE',
        headers: authHeaders(token!),
      }),
    getImages: (id: number, token: string) =>
      request<GalleryImage[]>(`/protected-galleries/${id}/images`, {
        headers: authHeaders(token),
      }),
    addImages: (id: number, imageIds: number[], token: string) =>
      request(`/protected-galleries/${id}/images`, {
        method: 'POST',
        body: JSON.stringify({ imageIds }),
        headers: authHeaders(token),
      }),
    removeImage: (id: number, imageId: number, token: string) =>
      request(`/protected-galleries/${id}/images/${imageId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      }),
    authenticate: (slug: string, password: string) =>
      request<{ accessToken: string }>(`/protected-galleries/${slug}/auth`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    getPublic: (slug: string, accessToken: string) =>
      request<ProtectedGalleryPublic>(
        `/protected-galleries/${slug}?token=${encodeURIComponent(accessToken)}`,
      ),
    downloadUrl: (slug: string, accessToken: string) =>
      `${API_URL}/api/protected-galleries/${slug}/download?token=${encodeURIComponent(accessToken)}`,
    imageDownloadUrl: (slug: string, imageId: number, accessToken: string) =>
      `${API_URL}/api/protected-galleries/${slug}/images/${imageId}/download?token=${encodeURIComponent(accessToken)}`,
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
    setArtistPassword: (token: string, artistId: number, password: string) =>
      request(`/auth/artists/${artistId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
        headers: authHeaders(token),
      }),
    toggleArtistLogin: (token: string, artistId: number, loginEnabled: boolean) =>
      request(`/auth/artists/${artistId}/login`, {
        method: 'PUT',
        body: JSON.stringify({ loginEnabled }),
        headers: authHeaders(token),
      }),
    changePassword: (token: string, currentPassword: string, newPassword: string) =>
      request('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: authHeaders(token),
      }),
    listUsers: (token: string) =>
      request<{ id: number; username: string; email: string; createdAt: string }[]>('/auth/users', {
        headers: authHeaders(token),
      }),
    createUser: (token: string, username: string, email: string, password: string) =>
      request('/auth/users', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
        headers: authHeaders(token),
      }),
    updateUser: (
      token: string,
      userId: number,
      data: { username?: string; email?: string; password?: string },
    ) =>
      request(`/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    deleteUser: (token: string, userId: number) =>
      request(`/auth/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      }),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      }),
  },
};
