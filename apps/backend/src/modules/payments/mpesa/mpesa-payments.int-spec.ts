/**
 * Payments (M-Pesa) Integration Tests
 *
 * Full HTTP + DB tests for M-Pesa STK Push flows.
 * The MpesaService (Daraja wrapper) is overridden with a mock — no real HTTP calls.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
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
} from '../../../test/helpers';
import { AppModule } from '../../../app.module';
import { MpesaService } from './mpesa.service';
import { OrderStatus, PaymentMethod } from '@prisma/client';

describe('Payments - M-Pesa (Integration)', () => {
  let app: INestApplication;
  let userToken: string;
  let sellerId: string;
  let productId: string;

  // Mock Daraja wrapper
  const mockMpesaService = {
    initiateStkPush: jest.fn(),
  };

  const shippingAddress = '123 Test Street, Nairobi, Kenya';
  const testPhone = '254708374149';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MpesaService)
      .useValue(mockMpesaService)
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

    // Create admin/seller + user + product
    const { user: admin } = await createTestAdmin(app);
    sellerId = admin.id;

    const { user, password } = await createTestUser(app, {
      email: `mpesa-user-${Date.now()}@test.com`,
    });
    userToken = await loginAndGetToken(app, user.email, password);

    const category = await createTestCategory(app, { name: `Cat-${Date.now()}` });
    const product = await createTestProduct(app, sellerId, category.id, {
      name: 'M-Pesa Test Product',
      sku: `MPESA-SKU-${Date.now()}`,
      price: 1000,
      stockQuantity: 10,
    });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Helper: create a PENDING order for the user
   */
  async function createOrderForUser(): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set(authHeader(userToken))
      .send({ productId, quantity: 1 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(authHeader(userToken))
      .send({ shippingAddress })
      .expect(201);

    return response.body.id;
  }

  // ============ STK PUSH ============

  describe('POST /api/v1/payments/mpesa/stkpush', () => {
    it('should initiate an STK Push and save CheckoutRequestID', async () => {
      const orderId = await createOrderForUser();

      mockMpesaService.initiateStkPush.mockResolvedValue({
        MerchantRequestID: 'merchant-123',
        CheckoutRequestID: 'ws_CO_test_123',
        ResponseCode: '0',
        ResponseDescription: 'Success',
        CustomerMessage: 'Success. Request accepted for processing',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/stkpush')
        .set(authHeader(userToken))
        .send({ orderId, phoneNumber: testPhone })
        .expect(201);

      expect(response.body.checkoutRequestId).toBe('ws_CO_test_123');
      expect(response.body.responseCode).toBe('0');

      // Verify order was updated
      const prisma = getPrisma(app);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order!.paymentId).toBe('ws_CO_test_123');
      expect(order!.paymentMethod).toBe(PaymentMethod.MPESA);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/stkpush')
        .set(authHeader(userToken))
        .send({ orderId: '11111111-1111-4111-8111-111111111111', phoneNumber: testPhone })
        .expect(404);
    });

    it('should return 403 for non-owner', async () => {
      const orderId = await createOrderForUser();

      const { user: user2, password: pw2 } = await createTestUser(app, {
        email: `other-${Date.now()}@test.com`,
      });
      const token2 = await loginAndGetToken(app, user2.email, pw2);

      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/stkpush')
        .set(authHeader(token2))
        .send({ orderId, phoneNumber: testPhone })
        .expect(403);
    });

    it('should return 400 for non-PENDING order', async () => {
      const orderId = await createOrderForUser();

      // Advance to PAID
      const prisma = getPrisma(app);
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/stkpush')
        .set(authHeader(userToken))
        .send({ orderId, phoneNumber: testPhone })
        .expect(400);
    });

    it('should return 400 for invalid phone format', async () => {
      const orderId = await createOrderForUser();

      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/stkpush')
        .set(authHeader(userToken))
        .send({ orderId, phoneNumber: '12345' })
        .expect(400);
    });
  });

  // ============ CALLBACK ============

  describe('POST /api/v1/payments/mpesa/callback', () => {
    let orderId: string;

    beforeEach(async () => {
      orderId = await createOrderForUser();

      // Simulate that STK Push was initiated — save CheckoutRequestID
      const prisma = getPrisma(app);
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId: 'ws_CO_test_123',
          paymentMethod: PaymentMethod.MPESA,
        },
      });
    });

    it('should mark order PAID on success callback', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'merchant-123',
              CheckoutRequestID: 'ws_CO_test_123',
              ResultCode: 0,
              ResultDesc: 'Success',
              CallbackMetadata: {
                Item: [
                  { Name: 'MpesaReceiptNumber', Value: 'RECEIPT123' },
                  { Name: 'Amount', Value: 1000 },
                  { Name: 'PhoneNumber', Value: 254708374149 },
                ],
              },
            },
          },
        })
        .expect(200);

      expect(response.body).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });

      // Verify order is PAID
      const prisma = getPrisma(app);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order!.status).toBe(OrderStatus.PAID);
      expect(order!.paidAt).not.toBeNull();
    });

    it('should leave order PENDING on failure callback', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'merchant-123',
              CheckoutRequestID: 'ws_CO_test_123',
              ResultCode: 1032,
              ResultDesc: 'Request cancelled by user',
            },
          },
        })
        .expect(200);

      const prisma = getPrisma(app);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order!.status).toBe(OrderStatus.PENDING);
    });

    it('should be idempotent if order is already PAID', async () => {
      const prisma = getPrisma(app);
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'merchant-123',
              CheckoutRequestID: 'ws_CO_test_123',
              ResultCode: 0,
              ResultDesc: 'Success',
            },
          },
        })
        .expect(200);

      // Order should remain PAID (not throw)
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order!.status).toBe(OrderStatus.PAID);
    });

    it('should return 200 for malformed payload', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/callback')
        .send({})
        .expect(200);
    });

    it('should return 200 when order not found for CheckoutRequestID', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'merchant-999',
              CheckoutRequestID: 'ws_CO_nonexistent',
              ResultCode: 0,
              ResultDesc: 'Success',
            },
          },
        })
        .expect(200);
    });

    it('should extract receipt metadata on success', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/mpesa/callback')
        .send({
          Body: {
            stkCallback: {
              MerchantRequestID: 'merchant-123',
              CheckoutRequestID: 'ws_CO_test_123',
              ResultCode: 0,
              ResultDesc: 'Success',
              CallbackMetadata: {
                Item: [
                  { Name: 'MpesaReceiptNumber', Value: 'XYZ_RECEIPT' },
                  { Name: 'Amount', Value: 1000 },
                  { Name: 'PhoneNumber', Value: 254708374149 },
                ],
              },
            },
          },
        })
        .expect(200);

      // Verify order marked PAID (metadata extraction didn't crash)
      const prisma = getPrisma(app);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order!.status).toBe(OrderStatus.PAID);
    });
  });
});
