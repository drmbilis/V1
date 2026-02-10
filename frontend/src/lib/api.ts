// frontend/src/lib/api.ts
import axios, { AxiosError } from 'axios';

/**
 * ✅ PROD: NEXT_PUBLIC_API_URL=https://api.qreative.com.tr
 * baseURL => https://api.qreative.com.tr/api/v1
 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  // Cookie tabanlı session kullanıyorsan işe yarar; bearer token ile de sorun çıkarmaz.
  withCredentials: true,
});

// ---- Token helpers (projede farklı key olasılıklarını da yakala) ----
const TOKEN_KEYS = ['token', 'access_token', 'accessToken'];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  for (const k of TOKEN_KEYS) {
    const v = window.localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

function clearToken() {
  if (typeof window === 'undefined') return;
  for (const k of TOKEN_KEYS) window.localStorage.removeItem(k);
}

// ---- Request interceptor - add auth token ----
api.interceptors.request.use(
  (config) => {
    // SSR guard
    if (typeof window !== 'undefined') {
      const token = getToken();
      if (token) {
        config.headers = config.headers ?? {};
        // Axios v1 headers normalize
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor - handle 401 cleanly (stop infinite loading) ----
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;

    if (status === 401 && typeof window !== 'undefined') {
      // Token yok/expired -> temizle ve login'e git
      clearToken();

      // Loop olmasın diye zaten /login'deysek tekrar yönlendirme yapma
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ---- API methods ----
export const authAPI = {
  getOAuthUrl: () => api.get('/auth/google/start'),
  getMe: () => api.get('/auth/me'),
};

export const customersAPI = {
  list: () => api.get('/customers'),
  select: (customerId: string) => api.post('/customers/select', { customerId }),
  refresh: () => api.post('/customers/refresh'),
};

export const campaignsAPI = {
  list: (params?: any) => api.get('/campaigns', { params }),
  get: (id: string) => api.get(`/campaigns/${id}`),
  getMetrics: (id: string, range = 30) =>
    api.get(`/campaigns/${id}/metrics`, { params: { range } }),
};

export const jobsAPI = {
  sync: (customerId: string, type?: string) =>
    api.post('/jobs/sync', { customerId, type }),
  getSyncStatus: (customerId: string) =>
    api.get('/jobs/sync/status', { params: { customerId } }),
};

export const recommendationsAPI = {
  generate: (data: any) => api.post('/recommendations/generate', data),
  list: (params?: any) => api.get('/recommendations', { params }),
  get: (id: string) => api.get(`/recommendations/${id}`),
  approve: (id: string) => api.post(`/recommendations/${id}/approve`),
  reject: (id: string) => api.post(`/recommendations/${id}/reject`),
  analyze: (campaignId: string) =>
    api.post('/recommendations/analyze', { campaignId }),
};

export const applyAPI = {
  dryRun: (id: string) => api.post(`/apply/recommendations/${id}/dry-run`),
  apply: (id: string, confirmDryRun: boolean) =>
    api.post(`/apply/recommendations/${id}`, { confirmDryRun }),
  getRuns: (params?: any) => api.get('/apply/runs', { params }),
  getAudit: (params?: any) => api.get('/apply/audit', { params }),
};

export default api;
