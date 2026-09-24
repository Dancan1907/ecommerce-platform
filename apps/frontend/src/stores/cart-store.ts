/**
 * Cart Store (Zustand)
 *
 * Client-side cache of the user's cart.
 * The backend is the source of truth; this store mirrors its state
 * so the header badge and cart page can render instantly.
 */

import { create } from 'zustand';
import { api, extractErrorMessage } from '@/lib/api';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  stockQuantity: number;
  isActive: boolean;
  images?: { id: string; url: string }[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateItem: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  clearError: () => void;
}

const EMPTY_CART: Cart = { id: '', items: [], subtotal: 0, itemCount: 0 };

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/cart');
      set({ cart: response.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err) });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/cart/items', { productId, quantity });
      set({ cart: response.data, isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  updateItem: async (productId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/cart/items/${productId}`, { quantity });
      set({ cart: response.data, isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  removeItem: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/cart/items/${productId}`);
      set({ cart: response.data, isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.delete('/cart');
      set({ cart: { ...EMPTY_CART }, isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err) });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
