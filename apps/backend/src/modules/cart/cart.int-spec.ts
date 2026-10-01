/**
 * Cart Integration Tests
 *
 * Full HTTP + DB tests for the cart module.
 * Tests multi-step workflows: add → update → remove → clear.
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

describe('Cart (Integration)', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: string;
  let sellerId: string;
  let categoryId: string;
  let product1Id: string;
  let product2Id: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    // Create admin/seller
    const { user: admin } = await createTestAdmin(app);
    sellerId = admin.id;

    // Create regular user
    const { user, password } = await createTestUser(app, {
      email: `cart-user-${Date.now()}@test.com`,
    });
    userId = user.id;
    userToken = await loginAndGetToken(app, user.email, password);

    // Create category
    const category = await createTestCategory(app, { name: `Cat-${Date.now()}` });
    categoryId = category.id;

    // Create two products for cart testing
    const p1 = await createTestProduct(app, sellerId, categoryId, {
      name: 'Cart Product 1',
      sku: `CART-SKU-1-${Date.now()}`,
      price: 1000,
      stockQuantity: 10,
    });
    product1Id = p1.id;

    const p2 = await createTestProduct(app, sellerId, categoryId, {
      name: 'Cart Product 2',
      sku: `CART-SKU-2-${Date.now()}`,
      price: 2000,
      stockQuantity: 5,
    });
    product2Id = p2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ============ GET CART ============

  describe('GET /api/v1/cart', () => {
    it('should auto-create and return empty cart', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.itemCount).toBe(0);
      expect(response.body.subtotal).toBe(0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/cart').expect(401);
    });
  });

  // ============ ADD ITEM ============

  describe('POST /api/v1/cart/items', () => {
    it('should add an item to the cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 2 })
        .expect(201);

      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].quantity).toBe(2);
      expect(response.body.itemCount).toBe(2);
      expect(response.body.subtotal).toBe(2000);
    });

    it('should increment quantity when adding same product twice', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 2 })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 3 })
        .expect(201);

      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].quantity).toBe(5);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({
          productId: '11111111-1111-4111-8111-111111111111',
          quantity: 1,
        })
        .expect(404);
    });

    it('should return 400 when quantity exceeds stock', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product2Id, quantity: 999 })
        .expect(400);
    });
  });

  // ============ UPDATE ITEM ============

  describe('PUT /api/v1/cart/items/:productId', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 2 });
    });

    it('should update item quantity', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/cart/items/${product1Id}`)
        .set(authHeader(userToken))
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.items[0].quantity).toBe(5);
      expect(response.body.itemCount).toBe(5);
    });

    it('should return 400 when new quantity exceeds stock', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/cart/items/${product1Id}`)
        .set(authHeader(userToken))
        .send({ quantity: 999 })
        .expect(400);
    });

    it('should return 404 when item not in cart', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/cart/items/${product2Id}`)
        .set(authHeader(userToken))
        .send({ quantity: 1 })
        .expect(404);
    });
  });

  // ============ REMOVE ITEM ============

  describe('DELETE /api/v1/cart/items/:productId', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 2 });
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product2Id, quantity: 1 });
    });

    it('should remove one item, leave others', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${product1Id}`)
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].productId).toBe(product2Id);
    });

    it('should return 404 when item not in cart', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/cart/items/11111111-1111-4111-8111-111111111111')
        .set(authHeader(userToken))
        .expect(404);
    });
  });

  // ============ CLEAR CART ============

  describe('DELETE /api/v1/cart', () => {
    it('should clear all items', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 2 });
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product2Id, quantity: 1 });

      const response = await request(app.getHttpServer())
        .delete('/api/v1/cart')
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.itemCount).toBe(0);
    });
  });

  // ============ VALIDATE CART ============

  describe('POST /api/v1/cart/validate', () => {
    it('should return valid=true for cart with in-stock items', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 2 });

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/validate')
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.issues).toEqual([]);
    });

    it('should return valid=false for empty cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/validate')
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.issues).toContain('Cart is empty');
    });
  });

  // ============ USER ISOLATION ============

  describe('User Isolation', () => {
    it('should keep carts separate between users', async () => {
      // User 1 adds a product
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set(authHeader(userToken))
        .send({ productId: product1Id, quantity: 2 })
        .expect(201);

      // Create and login as User 2
      const { user: user2, password: pw2 } = await createTestUser(app, {
        email: `user2-${Date.now()}@test.com`,
      });
      const token2 = await loginAndGetToken(app, user2.email, pw2);

      // User 2's cart should be empty
      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(authHeader(token2))
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.itemCount).toBe(0);

      // Verify admin's cart still has items
      const prisma = getPrisma(app);
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      expect(userCart?.items.length).toBe(1);
    });
  });
});
