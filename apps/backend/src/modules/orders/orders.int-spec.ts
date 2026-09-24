/**
 * Orders Integration Tests
 *
 * Full HTTP + DB tests for the orders module.
 * Tests the full checkout flow, status transitions, and stock management.
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

describe('Orders (Integration)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let sellerId: string;
  let categoryId: string;
  let productId: string;

  const shippingAddress = '123 Kenyatta Avenue, Nairobi, Kenya';

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    // Create admin (also acts as seller)
    const { user: admin, password: adminPw } = await createTestAdmin(app);
    sellerId = admin.id;
    adminToken = await loginAndGetToken(app, admin.email, adminPw);

    // Create regular user
    const { user, password } = await createTestUser(app, {
      email: `orders-user-${Date.now()}@test.com`,
    });
    userToken = await loginAndGetToken(app, user.email, password);

    // Create category + product
    const category = await createTestCategory(app, { name: `Cat-${Date.now()}` });
    categoryId = category.id;

    const product = await createTestProduct(app, sellerId, categoryId, {
      name: 'Order Test Product',
      sku: `ORD-SKU-${Date.now()}`,
      price: 1000,
      stockQuantity: 10,
    });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Helper: adds a product to user's cart via API
   */
  async function addToCart(token: string, productIdToAdd: string, quantity: number) {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set(authHeader(token))
      .send({ productId: productIdToAdd, quantity })
      .expect(201);
  }

  // ============ CREATE ORDER ============

  describe('POST /api/v1/orders', () => {
    it('should create an order from the cart', async () => {
      await addToCart(userToken, productId, 2);

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress, paymentMethod: 'STRIPE' })
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'PENDING',
        shippingAddress,
        paymentMethod: 'STRIPE',
      });
      expect(response.body.orderNumber).toMatch(/^ORD-\d{4}-\d{5}$/);
      expect(response.body.subtotal).toBe('2000'); // 1000 * 2
      expect(response.body.shippingCost).toBe('250');
      expect(response.body.total).toBe('2250');
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0]).toMatchObject({
        productName: 'Order Test Product',
        quantity: 2,
      });
    });

    it('should decrement product stock after order', async () => {
      await addToCart(userToken, productId, 3);

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress })
        .expect(201);

      const prisma = getPrisma(app);
      const product = await prisma.product.findUnique({ where: { id: productId } });
      expect(product!.stockQuantity).toBe(7); // 10 - 3
    });

    it('should clear the cart after order', async () => {
      await addToCart(userToken, productId, 2);

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.items).toEqual([]);
    });

    it('should return 400 for empty cart', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress })
        .expect(400);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ shippingAddress })
        .expect(401);
    });
  });

  // ============ LIST ORDERS ============

  describe('GET /api/v1/orders', () => {
    it("should return user's own orders only", async () => {
      // User creates an order
      await addToCart(userToken, productId, 1);
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress })
        .expect(201);

      // Another user should see empty list
      const { user: user2, password: pw2 } = await createTestUser(app, {
        email: `other-${Date.now()}@test.com`,
      });
      const token2 = await loginAndGetToken(app, user2.email, pw2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set(authHeader(token2))
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should return user's orders with pagination", async () => {
      await addToCart(userToken, productId, 1);
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
    });
  });

  // ============ GET BY ID ============

  describe('GET /api/v1/orders/:id', () => {
    let orderId: string;

    beforeEach(async () => {
      await addToCart(userToken, productId, 1);
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress });
      orderId = response.body.id;
    });

    it('should return order for its owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.id).toBe(orderId);
    });

    it('should return 403 for non-owner non-admin', async () => {
      const { user: user2, password: pw2 } = await createTestUser(app, {
        email: `third-${Date.now()}@test.com`,
      });
      const token2 = await loginAndGetToken(app, user2.email, pw2);

      await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set(authHeader(token2))
        .expect(403);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/11111111-1111-4111-8111-111111111111')
        .set(authHeader(userToken))
        .expect(404);
    });
  });

  // ============ ADMIN LIST ============

  describe('GET /api/v1/orders/admin/all', () => {
    it('should return all orders for admin', async () => {
      await addToCart(userToken, productId, 1);
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress });

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/admin/all')
        .set(authHeader(adminToken))
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/admin/all')
        .set(authHeader(userToken))
        .expect(403);
    });
  });

  // ============ UPDATE STATUS ============

  describe('PUT /api/v1/orders/:id/status', () => {
    let orderId: string;

    beforeEach(async () => {
      await addToCart(userToken, productId, 1);
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress });
      orderId = response.body.id;
    });

    it('should allow admin to transition PENDING → PAID', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set(authHeader(adminToken))
        .send({ status: 'PAID' })
        .expect(200);

      expect(response.body.status).toBe('PAID');
      expect(response.body.paidAt).not.toBeNull();
    });

    it('should reject invalid transition (PENDING → DELIVERED)', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set(authHeader(adminToken))
        .send({ status: 'DELIVERED' })
        .expect(400);
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set(authHeader(userToken))
        .send({ status: 'PAID' })
        .expect(403);
    });
  });

  // ============ CANCEL ORDER ============

  describe('POST /api/v1/orders/:id/cancel', () => {
    let orderId: string;

    beforeEach(async () => {
      await addToCart(userToken, productId, 2);
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set(authHeader(userToken))
        .send({ shippingAddress });
      orderId = response.body.id;
    });

    it('should cancel a PENDING order and restore stock', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');

      // Verify stock restored
      const prisma = getPrisma(app);
      const product = await prisma.product.findUnique({ where: { id: productId } });
      expect(product!.stockQuantity).toBe(10); // back to original
    });

    it('should return 400 when cancelling an already CANCELLED order', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader(userToken))
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader(userToken))
        .expect(400);
    });

    it('should return 400 when cancelling a SHIPPED order', async () => {
      // Advance status: PENDING → PAID → SHIPPED
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set(authHeader(adminToken))
        .send({ status: 'PAID' });

      await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set(authHeader(adminToken))
        .send({ status: 'SHIPPED' });

      await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader(userToken))
        .expect(400);
    });

    it('should return 403 for non-owner non-admin', async () => {
      const { user: user2, password: pw2 } = await createTestUser(app, {
        email: `nope-${Date.now()}@test.com`,
      });
      const token2 = await loginAndGetToken(app, user2.email, pw2);

      await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set(authHeader(token2))
        .expect(403);
    });
  });
});
