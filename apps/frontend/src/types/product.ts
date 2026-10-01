/**
 * Product and Category Types
 *
 * Mirrors backend response shapes for type safety across the frontend.
 */

export interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  isMain: boolean;
  displayOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: Category | null;
}

export interface ProductSeller {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  stockQuantity: number;
  sku: string;
  isActive: boolean;
  categoryId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  seller?: ProductSeller;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductQuery {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sellerId?: string;
  sortBy?: 'createdAt' | 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
