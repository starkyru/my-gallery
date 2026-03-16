const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
    throw new Error(error.message || 'API error');
  }

  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  images: {
    list: (params?: string) => request<any[]>(`/images${params ? `?${params}` : ''}`),
    get: (id: number) => request<any>(`/images/${id}`),
    upload: (formData: FormData, token: string) =>
      fetch(`${API_URL}/api/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then((r) => r.json()),
    update: (id: number, data: any, token: string) =>
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
  },
  photographers: {
    list: () => request<any[]>('/photographers'),
    get: (id: number) => request<any>(`/photographers/${id}`),
    create: (data: any, token: string) =>
      request('/photographers', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    update: (id: number, data: any, token: string) =>
      request(`/photographers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }),
    delete: (id: number, token: string) =>
      request(`/photographers/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
  },
  orders: {
    create: (data: { customerEmail: string; imageIds: number[] }) =>
      request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: (token: string, status?: string) =>
      request<any[]>(`/orders${status ? `?status=${status}` : ''}`, {
        headers: authHeaders(token),
      }),
    get: (id: number) => request<any>(`/orders/${id}`),
    stats: (token: string) => request<any>('/orders/stats', { headers: authHeaders(token) }),
    downloads: (id: number) => request<any[]>(`/orders/${id}/downloads`),
  },
  payments: {
    btcpay: (orderId: number) =>
      request<any>(`/payments/orders/${orderId}/btcpay`, { method: 'POST' }),
    paypal: (orderId: number) =>
      request<any>(`/payments/orders/${orderId}/paypal`, { method: 'POST' }),
    capturePaypal: (orderId: number, paypalOrderId: string) =>
      request<any>(`/payments/orders/${orderId}/paypal/capture`, {
        method: 'POST',
        body: JSON.stringify({ paypalOrderId }),
      }),
  },
  ai: {
    describe: (imageId: number, token: string) =>
      request<{ description: string }>(`/ai/describe/${imageId}`, {
        method: 'POST',
        headers: authHeaders(token),
      }),
  },
  auth: {
    login: (username: string, password: string) =>
      request<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
};
