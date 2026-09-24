/**
 * Axios API Client
 *
 * Configured axios instance that:
 *  - Points at the backend API (http://localhost:3000/api/v1)
 *  - Attaches the access token to every request
 *  - Auto-refreshes the token on 401 and retries the original request
 *  - Redirects to login on refresh failure
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * The axios instance used throughout the app.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// TOKEN STORAGE HELPERS
// ============================================
// We store tokens in localStorage for simplicity.
// Note: This means XSS exposure; for production, prefer HTTP-only cookies.

export const tokenStorage = {
  getAccess(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },
  getRefresh(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },
  set(access: string, refresh: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// ============================================
// REQUEST INTERCEPTOR — attach access token
// ============================================
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// RESPONSE INTERCEPTOR — auto-refresh on 401
// ============================================

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

/**
 * Attempt to refresh the access token using the stored refresh token.
 * On success, returns the new access token. On failure, returns null.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: refresh },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const { accessToken, refreshToken } = response.data;
    tokenStorage.set(accessToken, refreshToken);
    return accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only handle 401s and don't retry the refresh call itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;

      // Queue this request while a refresh is in progress
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) return reject(error);
            original.headers = original.headers ?? {};
            (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      // Flush the queue
      pendingQueue.forEach((cb) => cb(newToken));
      pendingQueue = [];

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Refresh failed — clear auth and redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// HELPER — extract error message from axios error
// ============================================
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.error === 'string') return data.error;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
