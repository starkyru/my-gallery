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
  Tag,
  ContactInquiry,
  WallBackground,
  FramePreset,
} from '@gallery/shared';

interface CatalogueProductSummary {
  name: string;
  slug: string;
  productSlug: string;
  global: boolean;
  sizes: string[];
  pricing: { source: string; value: string }[];
  manufacturingRegions: string[];
  image: string;
  imageRequired: boolean;
  loreSlug?: string;
}

interface CatalogueCategory {
  name: string;
  slug: string;
  fullSlug?: string;
  images?: string[];
  products: Record<string, CatalogueProductSummary>;
  subCategories: Record<string, CatalogueCategory>;
}

interface CatalogueProductDetail {
  name: string;
  availability: string;
  description: string[];
  features: string[];
  manufacturing: { regions: string[]; time: string; shipsTo: string[] };
  pricing: { source: string; value: string }[];
  variants: {
    columns: Record<
      string,
      { enableSorting: boolean; name: string; filterType: string; options?: string[] }
    >;
    rows: {
      sku: string;
      description: string;
      attributeDescription: string;
      productType: string;
      price: string;
      size?: string;
      orientation?: string;
    }[];
  };
  sizes: string[];
}

export type { CatalogueCategory, CatalogueProductDetail, CatalogueProductSummary };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const pendingRequests = new Map<string, Promise<unknown>>();
const CACHE_TTL = 30_000; // 30 seconds
const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() ?? 'GET';
  const isGet = method === 'GET';
  const cacheKey = isGet
    ? `${path}|${options?.headers ? JSON.stringify(options.headers) : ''}`
    : '';

  // Return cached data for GET requests
  if (isGet && cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    // Deduplicate in-flight requests
    const pending = pendingRequests.get(cacheKey);
    if (pending) return pending as Promise<T>;
  }

  // Mutations invalidate cached GET responses for the same resource
  if (!isGet) {
    const basePath = path.split('?')[0];
    for (const key of cache.keys()) {
      if (key.startsWith(basePath) || key.startsWith(basePath.replace(/\/[^/]+$/, ''))) {
        cache.delete(key);
      }
    }
  }

  const promise = (async () => {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...options,
      cache: 'no-store',
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
    const data = text ? JSON.parse(text) : null;

    if (isGet && cacheKey) {
      cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL });
    }

    return data as T;
  })();

  if (isGet && cacheKey) {
    pendingRequests.set(cacheKey, promise);
    promise.finally(() => pendingRequests.delete(cacheKey));
  }

  return promise;
}

async function uploadRequest<T>(
  path: string,
  formData: FormData,
  token: string,
  method: 'POST' | 'PUT' = 'POST',
): Promise<T> {
  // Invalidate cached GET responses for this resource
  const basePath = path.split('?')[0];
  for (const key of cache.keys()) {
    if (key.startsWith(basePath) || key.startsWith(basePath.replace(/\/[^/]+$/, ''))) {
      cache.delete(key);
    }
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
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
  contacts: {
    create: (data: { name: string; email: string; message: string }) =>
      request<ContactInquiry>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    list: (token: string) =>
      request<ContactInquiry[]>('/contacts', { headers: authHeaders(token) }),
    markRead: (id: number, token: string) =>
      request(`/contacts/${id}/read`, { method: 'PUT', headers: authHeaders(token) }),
    delete: (id: number, token: string) =>
      request(`/contacts/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
  },
  tags: {
    list: () => request<Tag[]>('/tags'),
    create: (data: { name: string; slug: string }, token: string) =>
      request<Tag>('/tags', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    update: (id: number, data: Partial<Tag>, token: string) =>
      request<Tag>(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    delete: (id: number, token: string) =>
      request(`/tags/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
  },
  images: {
    list: (params?: string) => request<GalleryImage[]>(`/images${params ? `?${params}` : ''}`),
    listAdmin: (token: string) =>
      request<GalleryImage[]>('/images/admin', { headers: authHeaders(token) }),
    get: (id: number) => request<GalleryImage>(`/images/${id}`),
    getAdmin: (id: number, token: string) =>
      request<GalleryImage>(`/images/admin/${id}`, { headers: authHeaders(token) }),
    upload: (formData: FormData, token: string) => uploadRequest('/images', formData, token),
    reupload: (id: number, formData: FormData, token: string) =>
      uploadRequest<GalleryImage>(`/images/${id}/reupload`, formData, token, 'PUT'),
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
    get: (idOrSlug: number | string) => request<Artist>(`/artists/${idOrSlug}`),
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
    status: (token: string) =>
      request<{ encryptionKeySet: boolean }>('/services/status', {
        headers: authHeaders(token),
      }),
    list: (token: string) => request<ServiceConfig[]>('/services', { headers: authHeaders(token) }),
    update: (
      provider: string,
      data: {
        enabled?: boolean;
        skus?: { sku: string; description: string; price?: string }[];
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
    getQuotes: (skus: string[], countryCode: string, currencyCode: string, token: string) =>
      request<{ sku: string; price: string; currency: string }[]>('/services/prodigi/quotes', {
        method: 'POST',
        body: JSON.stringify({ skus, countryCode, currencyCode }),
        headers: authHeaders(token),
      }),
    catalogueCategories: (token: string) =>
      request<Record<string, CatalogueCategory>>('/services/catalogue/categories', {
        headers: authHeaders(token),
      }),
    catalogueProduct: (slug: string, token: string) =>
      request<CatalogueProductDetail>(`/services/catalogue/products/${encodeURIComponent(slug)}`, {
        headers: authHeaders(token),
      }),
  },
  walls: {
    list: () => request<WallBackground[]>('/walls'),
    frames: () => request<FramePreset[]>('/walls/frames'),
    framesAll: (token: string) =>
      request<FramePreset[]>('/walls/frames/all', { headers: authHeaders(token) }),
    create: (formData: FormData, token: string) =>
      uploadRequest<WallBackground>('/walls', formData, token),
    update: (id: number, data: Record<string, unknown>, token: string) =>
      request<WallBackground>(`/walls/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      }),
    delete: (id: number, token: string) =>
      request(`/walls/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
    updateFrame: (id: number, data: Record<string, unknown>, token: string) =>
      request<FramePreset>(`/walls/frames/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      }),
  },
  chat: {
    send: (messages: { role: string; content: string }[]) =>
      request<{
        message: string;
        images: {
          id: number;
          title: string;
          thumbnailPath: string;
          watermarkPath: string;
          width: number;
          height: number;
          price: number;
          artist: { name: string; slug: string };
        }[];
        debug?: {
          search?: {
            category?: string;
            tags?: string[];
            keywords?: string[][];
            featured?: boolean;
          };
        };
      }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      }),
  },
  ai: {
    describe: (imageId: number, token: string, apply?: boolean) =>
      request<{ title: string; description: string }>(
        `/ai/describe/${imageId}${apply ? '?apply=true' : ''}`,
        {
          method: 'POST',
          headers: authHeaders(token),
        },
      ),
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
      request<
        { id: number; username: string; email: string; notifyOnOrder: boolean; createdAt: string }[]
      >('/auth/users', {
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
      data: { username?: string; email?: string; password?: string; notifyOnOrder?: boolean },
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
