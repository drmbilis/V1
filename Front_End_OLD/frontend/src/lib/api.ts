import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
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
    api.get(`/campaigns/${id}/metrics?range=${range}`),
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
