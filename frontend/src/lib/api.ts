import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jh_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jh_token');
        localStorage.removeItem('jh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ── Resume ────────────────────────────────────────────────────────────────────
export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },
  getProfile: () => api.get('/resume/profile'),
  updateSkills: (skills: object) => api.put('/resume/skills', skills),
  delete: () => api.delete('/resume'),
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsApi = {
  search: (params?: { queries?: string[]; location?: string }) =>
    api.post('/jobs/search', params, { timeout: 300000 }),
  list: (params?: Record<string, string | number>) =>
    api.get('/jobs', { params }),
  stats: () => api.get('/jobs/stats'),
  get: (id: string) => api.get(`/jobs/${id}`),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/jobs/${id}/status`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  generate: (filters?: Record<string, unknown>) =>
    api.post('/reports/generate', filters),
  list: (params?: Record<string, string | number>) =>
    api.get('/reports', { params }),
  download: (id: string) =>
    api.get(`/reports/${id}/download`, { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/reports/${id}`),
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data: Record<string, unknown>) => api.put('/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/profile/password', data),
};

export default api;
