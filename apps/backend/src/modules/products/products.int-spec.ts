/**
 * Products Integration Tests
 *
 * Full HTTP + DB tests for the products module.
 */

import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  cleanDatabase,
  createTestUser,
  createTestAdmin,
  createTestCategory,
  createTestProduct,
  loginAndGetToken,
  authHeader,
  request,
  getPrisma,
} from '../../test/helpers';

describe('Products (Integration)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let sellerId: string;
  let categoryId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    // Create admin
    const { user: admin, password: adminPw } = await createTestAdmin(app);
    adminToken = await loginAndGetToken(app, admin.email, adminPw);
    sellerId = admin.id;

    // Create regular user
    const { user, password: userPw } = await createTestUser(app, {
      email: `user-${Date.now()}@test.com`,
    });
    userToken = await loginAndGetToken(app, user.email, userPw);

    // Create a category for products
    const category = await createTestCategory(app, { name: `Cat-${Date.now()}` });
    categoryId = category.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ============ CREATE ============

  describe('POST /api/v1/products', () => {
    it('should allow admin to create a product', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set(authHeader(adminToken))
        .send({
          name: 'Test Headphones',
          description: 'A test product for integration',
          price: 45999,
          stockQuantity: 25,
          sku: 'TEST-HP-001',
          categoryId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Headphones',
        sku: 'TEST-HP-001',
        price: '45999',
        stockQuantity: 25,
      });
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('id');
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set(authHeader(userToken))
        .send({
          name: 'Unauthorized Product',
          description: 'Should fail for regular user',
          price: 1000,
          stockQuantity: 1,
          sku: 'NOPE-001',
          categoryId,
        })
        .expect(403);
    });

    it('should return 409 for duplicate SKU', async () => {
      await createTestProduct(app, sellerId, categoryId, { sku: 'DUP-SKU' });

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set(authHeader(adminToken))
        .send({
          name: 'Another Product',
          description: 'Different name, same SKU',
          price: 500,
          stockQuantity: 1,
          sku: 'DUP-SKU',
          categoryId,
        })
        .expect(409);
    });

    it('should return 404 for non-existent category', async () => {
      // Use a valid UUID v4 format that doesn't exist in the DB
      const nonExistentCategoryId = '11111111-1111-4111-8111-111111111111';

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set(authHeader(adminToken))
        .send({
          name: 'Orphan Product',
          description: 'No matching category',
          price: 500,
          stockQuantity: 1,
          sku: 'ORPHAN-001',
          categoryId: nonExistentCategoryId,
        })
        .expect(404);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set(authHeader(adminToken))
        .send({ name: 'Incomplete' })
        .expect(400);
    });
  });

  // ============ LIST + FILTERS ============

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      await createTestProduct(app, sellerId, categoryId, {
        name: 'Product A',
        sku: 'PROD-A',
        price: 1000,
      });
      await createTestProduct(app, sellerId, categoryId, {
        name: 'Product B',
        sku: 'PROD-B',
        price: 5000,
      });
      await createTestProduct(app, sellerId, categoryId, {
        name: 'Product C',
        sku: 'PROD-C',
        price: 10000,
      });
    });

    it('should return paginated products (public)', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/products').expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.data.length).toBe(3);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products?categoryId=${categoryId}`)
        .expect(200);

      expect(response.body.data.length).toBe(3);
    });

    it('should filter by price range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?minPrice=2000&maxPrice=8000')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Product B');
    });

    it('should search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?search=Product A')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toBe('Product A');
    });
  });

  // ============ GET BY ID / SLUG ============

  describe('GET /api/v1/products/:id', () => {
    it('should return product by ID (public)', async () => {
      const product = await createTestProduct(app, sellerId, categoryId);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${product.id}`)
        .expect(200);

      expect(response.body.id).toBe(product.id);
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/v1/products/slug/:slug', () => {
    it('should return product by slug', async () => {
      const product = await createTestProduct(app, sellerId, categoryId, {
        name: 'Unique Slug Test',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/slug/${product.slug}`)
        .expect(200);

      expect(response.body.name).toBe('Unique Slug Test');
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer()).get('/api/v1/products/slug/nonexistent-slug').expect(404);
    });
  });

  // ============ UPDATE ============

  describe('PUT /api/v1/products/:id', () => {
    it('should allow admin to update a product', async () => {
      const product = await createTestProduct(app, sellerId, categoryId);

      const response = await request(app.getHttpServer())
        .put(`/api/v1/products/${product.id}`)
        .set(authHeader(adminToken))
        .send({ price: 99999 })
        .expect(200);

      expect(response.body.price).toBe('99999');
    });

    it('should return 403 for regular user', async () => {
      const product = await createTestProduct(app, sellerId, categoryId);

      await request(app.getHttpServer())
        .put(`/api/v1/products/${product.id}`)
        .set(authHeader(userToken))
        .send({ price: 99999 })
        .expect(403);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .send({ price: 100 })
        .expect(404);
    });
  });

  // ============ DELETE ============

  describe('DELETE /api/v1/products/:id', () => {
    it('should allow admin to delete a product', async () => {
      const product = await createTestProduct(app, sellerId, categoryId);

      await request(app.getHttpServer())
        .delete(`/api/v1/products/${product.id}`)
        .set(authHeader(adminToken))
        .expect(200);

      const prisma = getPrisma(app);
      const found = await prisma.product.findUnique({ where: { id: product.id } });
      expect(found).toBeNull();
    });

    it('should return 403 for regular user', async () => {
      const product = await createTestProduct(app, sellerId, categoryId);

      await request(app.getHttpServer())
        .delete(`/api/v1/products/${product.id}`)
        .set(authHeader(userToken))
        .expect(403);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });
  });
});
