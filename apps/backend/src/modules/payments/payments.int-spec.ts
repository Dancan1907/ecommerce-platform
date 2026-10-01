/**
 * Payments (Stripe) Integration Tests
 *
 * Full HTTP + DB tests for Stripe payment flows.
 * The StripeService is overridden with a mock so no real Stripe API calls happen.
 */

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  createTestUser,
  createTestAdmin,
  createTestCategory,
  createTestProduct,
  loginAndGetToken,
  authHeader,
  request,
  getPrisma,
} from '../../test/helpers';
import { AppModule } from '../../app.module';
import { StripeService } from './stripe.service';
import { ValidationPipe } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '@prisma/client';

describe('Payments - Stripe (Integration)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let sellerId: string;
  let productId: string;

  // Mock StripeService
  const mockStripeService = {
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
    createRefund: jest.fn(),
    constructWebhookEvent: jest.fn(),
  };

  const shippingAddress = '123 Test Street, Nairobi, Kenya';

  beforeAll(async () => {
    // Build the app but override StripeService
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StripeService)
      .useValue(mockStripeService)
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Clean DB
    const prisma = getPrisma(app);
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Set up admin + user + product
    const { user: admin, password: adminPw } = await createTestAdmin(app);
    sellerId = admin.id;
    adminToken = await loginAndGetToken(app, admin.email, adminPw);

    const { user, password } = await createTestUser(app, {
      email: `pay-user-${Date.now()}@test.com`,
    });
    userToken = await loginAndGetToken(app, user.email, password);

    const category = await createTestCategory(app, { name: `Cat-${Date.now()}` });
    const product = await createTestProduct(app, sellerId, category.id, {
      name: 'Payment Test Product',
      sku: `PAY-SKU-${Date.now()}`,
      price: 1000,
      stockQuantity: 10,
    });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Helper: creates an order for the user (empty cart after)
   */
  async function createOrderForUser(): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set(authHeader(userToken))
      .send({ productId, quantity: 2 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(authHeader(userToken))
      .send({ shippingAddress })
      .expect(201);

    return response.body.id;
  }

  // ============ CREATE INTENT ============

  describe('POST /api/v1/payments/create-intent', () => {
    it('should create a payment intent and save it to the order', async () => {
      const orderId = await createOrderForUser();

      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
        amount: 1750, // ~2250 KES * 0.0077 ≈ 17.33 USD = 1733 cents (with rounding)
        currency: 'usd',
        status: 'requires_payment_method',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set(authHeader(userToken))
        .send({ orderId })
        .expect(201);

      expect(response.body.paymentIntentId).toBe('pi_test_123');
      expect(response.body.clientSecret).toBe('pi_test_123_secret_abc');

      // Verify order updated
      const prisma = getPrisma(app);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order!.paymentId).toBe('pi_test_123');
      expect(order!.paymentMethod).toBe(PaymentMethod.STRIPE);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set(authHeader(userToken))
        .send({ orderId: '11111111-1111-4111-8111-111111111111' })
        .expect(404);
    });

    it("should return 403 when paying for another user's order", async () => {
      const orderId = await createOrderForUser();

      const { user: user2, password: pw2 } = await createTestUser(app, {
        email: `other-${Date.now()}@test.com`,
      });
      const token2 = await loginAndGetToken(app, user2.email, pw2);

      await request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set(authHeader(token2))
        .send({ orderId })
        .expect(403);
    });

    it('should return 400 for a PAID order', async () => {
      const orderId = await createOrderForUser();

      // Manually advance to PAID
      const prisma = getPrisma(app);
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set(authHeader(userToken))
        .send({ orderId })
        .expect(400);
    });

    it('should return 400 if order already has a payment intent', async () => {
      const orderId = await createOrderForUser();

      const prisma = getPrisma(app);
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentId: 'pi_existing' },
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set(authHeader(userToken))
        .send({ orderId })
        .expect(400);
    });
  });

  // ============ WEBHOOK ============

  describe('POST /api/v1/payments/webhook', () => {
    it('should mark order PAID on payment_intent.succeeded', async () => {
      const orderId = await createOrderForUser();

      // Save paymentId on the order first (as if intent was created)
      const prisma = getPrisma(app);
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentId: 'pi_test_123', paymentMethod: PaymentMethod.STRIPE },
      });

      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: { orderId },
          },
        },
      });

      // Note: Our webhook uses @Req() with raw body; passing JSON works for tests
      // since our mock bypasses actual signature verification.
      await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', 'test_sig')
        .send({ type: 'payment_intent.succeeded' })
        .expect(200);

      // Verify order was marked PAID
      const updated = await prisma.order.findUnique({ where: { id: orderId } });
      expect(updated!.status).toBe(OrderStatus.PAID);
      expect(updated!.paidAt).not.toBeNull();
    });

    it('should return 400 for invalid signature', async () => {
      mockStripeService.constructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', 'bad_sig')
        .send({})
        .expect(400);
    });
  });

  // ============ REFUND ============

  describe('POST /api/v1/payments/refund', () => {
    it('should allow admin to refund a PAID order', async () => {
      const orderId = await createOrderForUser();

      const prisma = getPrisma(app);
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paymentId: 'pi_test_123',
          paymentMethod: PaymentMethod.STRIPE,
          paidAt: new Date(),
        },
      });

      mockStripeService.createRefund.mockResolvedValue({
        id: 're_test',
        amount: 1750,
        currency: 'usd',
        status: 'succeeded',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/refund')
        .set(authHeader(adminToken))
        .send({ orderId })
        .expect(201);

      expect(response.body.refundId).toBe('re_test');
      expect(mockStripeService.createRefund).toHaveBeenCalledWith('pi_test_123', undefined);

      // Verify order cancelled
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order!.status).toBe(OrderStatus.CANCELLED);
    });

    it('should return 403 for regular user', async () => {
      const orderId = await createOrderForUser();

      await request(app.getHttpServer())
        .post('/api/v1/payments/refund')
        .set(authHeader(userToken))
        .send({ orderId })
        .expect(403);
    });

    it('should return 400 for a PENDING order', async () => {
      const orderId = await createOrderForUser();

      await request(app.getHttpServer())
        .post('/api/v1/payments/refund')
        .set(authHeader(adminToken))
        .send({ orderId })
        .expect(400);
    });
  });
});
