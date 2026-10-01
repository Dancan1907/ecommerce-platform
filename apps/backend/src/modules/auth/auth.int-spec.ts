/**
 * Auth Integration Tests
 *
 * Full HTTP + DB tests for the auth module.
 * Boots the real NestJS app, uses the real test database.
 */

import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  cleanDatabase,
  createTestUser,
  loginAndGetToken,
  authHeader,
  request,
} from '../../test/helpers';
import { getPrisma } from '../../test/helpers';

describe('Auth (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // ============ REGISTER ============

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201 with user data (no password)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
      });
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).toHaveProperty('id');

      // Verify in DB
      const prisma = getPrisma(app);
      const user = await prisma.user.findUnique({
        where: { email: 'newuser@test.com' },
      });
      expect(user).not.toBeNull();
      expect(user!.passwordHash).not.toBe('Password123!'); // should be hashed
    });

    it('should return 409 when email already exists', async () => {
      await createTestUser(app, { email: 'dup@test.com' });

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'dup@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(409);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'short@test.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  // ============ LOGIN ============

  describe('POST /api/v1/auth/login', () => {
    it('should login and return access + refresh tokens', async () => {
      const { password } = await createTestUser(app, { email: 'login@test.com' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'login@test.com', password })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('login@test.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for wrong password', async () => {
      await createTestUser(app, { email: 'wrong@test.com', password: 'Correct123!' });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@test.com', password: 'Wrong123!' })
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'Any123!' })
        .expect(401);
    });
  });

  // ============ PROFILE (PROTECTED) ============

  describe('GET /api/v1/auth/profile', () => {
    it('should return profile when authenticated', async () => {
      const { password } = await createTestUser(app, { email: 'profile@test.com' });
      const token = await loginAndGetToken(app, 'profile@test.com', password);

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set(authHeader(token))
        .expect(200);

      expect(response.body.email).toBe('profile@test.com');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
    });

    it('should return 401 when token is invalid', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  // ============ ADMIN ENDPOINT (ROLE PROTECTION) ============

  describe('GET /api/v1/auth/admin', () => {
    it('should return 200 for admin user', async () => {
      const { password } = await createTestUser(app, {
        email: 'admin@test.com',
        role: 'ADMIN',
      });
      const token = await loginAndGetToken(app, 'admin@test.com', password);

      await request(app.getHttpServer())
        .get('/api/v1/auth/admin')
        .set(authHeader(token))
        .expect(200);
    });

    it('should return 403 for regular user', async () => {
      const { password } = await createTestUser(app, {
        email: 'regular@test.com',
        role: 'USER',
      });
      const token = await loginAndGetToken(app, 'regular@test.com', password);

      await request(app.getHttpServer())
        .get('/api/v1/auth/admin')
        .set(authHeader(token))
        .expect(403);
    });
  });
});
