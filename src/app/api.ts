// ─── API Base URL ──────────────────────────────────────────────────────────────
// In dev: Vite proxy forwards /api → http://localhost:3001 (see vite.config.ts)
// In production APK build: change this to your actual server IP/domain
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('pv_token');
export const setToken = (t: string) => localStorage.setItem('pv_token', t);
export const clearToken = () => localStorage.removeItem('pv_token');

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid response from server: ${text.slice(0, 100)}`);
  }

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ success: boolean; role: string; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    name: string; email: string; phone?: string;
    studentId?: string; password: string; role?: string;
  }) =>
    request<{ success: boolean; role: string; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ success: boolean; user: any }>('/auth/me'),
};

// ─── Parcels API ───────────────────────────────────────────────────────────────
export const parcelsApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>('/parcels'),

  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/parcels/${id}`),

  create: (data: { studentId: string; description: string; deliveryService: string; trackingId?: string }) =>
    request<{ success: boolean; data: any }>('/parcels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  assignLocker: (parcelId: string, lockerId: string) =>
    request<{ success: boolean; otp: string; data: any }>(`/parcels/${parcelId}/assign-locker`, {
      method: 'PATCH',
      body: JSON.stringify({ lockerId }),
    }),

  collect: (parcelId: string, otp: string) =>
    request<{ success: boolean; data: any }>(`/parcels/${parcelId}/collect`, {
      method: 'PATCH',
      body: JSON.stringify({ otp }),
    }),

  release: (parcelId: string) =>
    request<{ success: boolean; data: any }>(`/parcels/${parcelId}/release`, {
      method: 'PATCH',
    }),

  delete: (parcelId: string) =>
    request<{ success: boolean }>(`/parcels/${parcelId}`, { method: 'DELETE' }),
};

// ─── Lockers API ───────────────────────────────────────────────────────────────
export const lockersApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>('/lockers'),

  available: (size?: string) =>
    request<{ success: boolean; data: any[] }>(`/lockers/available${size ? `?size=${size}` : ''}`),

  stats: () =>
    request<{ success: boolean; data: any }>('/lockers/stats/summary'),
};

// ─── Students API ──────────────────────────────────────────────────────────────
export const studentsApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>('/students'),

  search: (q: string) =>
    request<{ success: boolean; data: any[] }>(`/students/search?q=${encodeURIComponent(q)}`),

  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/students/${id}`),

  parcels: (id: string) =>
    request<{ success: boolean; data: any[] }>(`/students/${id}/parcels`),
};

// ─── Notifications API ─────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>('/notifications'),

  unreadCount: () =>
    request<{ success: boolean; count: number }>('/notifications/unread-count'),

  markRead: (id: string) =>
    request<{ success: boolean; data: any }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),
};

// ─── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  adminStats: () =>
    request<{ success: boolean; data: any }>('/dashboard/stats'),

  studentStats: () =>
    request<{ success: boolean; data: any }>('/dashboard/student-stats'),
};

// ─── Health check ──────────────────────────────────────────────────────────────
export const healthCheck = () =>
  request<{ status: string; service: string }>('/health');
