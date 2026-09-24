/**
 * Auth Store (Zustand)
 *
 * Holds the current user's authentication state.
 * Persists tokens via the API client's tokenStorage.
 */

import { create } from 'zustand';
import { api, tokenStorage, extractErrorMessage } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SELLER' | 'USER';
  isEmailVerified: boolean;
  avatar?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  /**
   * Login with email + password.
   * Stores tokens and fetches the user profile on success.
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      tokenStorage.set(accessToken, refreshToken);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: extractErrorMessage(err),
      });
      return false;
    }
  },

  /**
   * Register a new user account.
   */
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', data);
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: extractErrorMessage(err),
      });
      return false;
    }
  },

  /**
   * Logout — invalidates refresh token on server and clears client state.
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore — we still want to clear local state
    }
    tokenStorage.clear();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Fetch the current user's profile (used after a page refresh).
   */
  fetchProfile: async () => {
    if (!tokenStorage.getAccess()) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/profile');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      tokenStorage.clear();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
