/**
 * Products API Layer
 *
 * Thin functions over the axios client for product/category operations.
 */

import { api } from './api';
import type { Category, Product, PaginatedProducts, ProductQuery } from '@/types/product';

/**
 * Build query string from a ProductQuery object.
 */
function buildQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const str = params.toString();
  return str ? `?${str}` : '';
}

// ============================================
// PRODUCTS
// ============================================

/**
 * Fetch a paginated list of products with optional filters.
 */
export async function fetchProducts(query: ProductQuery = {}): Promise<PaginatedProducts> {
  const response = await api.get<PaginatedProducts>(`/products${buildQueryString(query)}`);
  return response.data;
}

/**
 * Fetch a single product by ID.
 */
export async function fetchProductById(id: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

/**
 * Fetch a single product by slug.
 */
export async function fetchProductBySlug(slug: string): Promise<Product> {
  const response = await api.get<Product>(`/products/slug/${slug}`);
  return response.data;
}

// ============================================
// CATEGORIES
// ============================================

/**
 * Fetch all root categories.
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories');
  return response.data;
}

/**
 * Fetch the category tree (hierarchical).
 */
export async function fetchCategoryTree(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories/tree');
  return response.data;
}

/**
 * Fetch a single category by slug.
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category> {
  const response = await api.get<Category>(`/categories/slug/${slug}`);
  return response.data;
}
