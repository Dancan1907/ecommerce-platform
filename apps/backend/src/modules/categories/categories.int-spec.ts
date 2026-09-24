/**
 * Categories Integration Tests
 *
 * Full HTTP + DB tests for the categories module.
 */

import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  cleanDatabase,
  createTestUser,
  createTestAdmin,
  createTestCategory,
  loginAndGetToken,
  authHeader,
  request,
  getPrisma,
} from '../../test/helpers';

describe('Categories (Integration)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    // Create fresh users for each test
    const { password: adminPw } = await createTestAdmin(app);
    adminToken = await loginAndGetToken(
      app,
      (await getPrisma(app).user.findFirst({ where: { role: 'ADMIN' } }))!.email,
      adminPw
    );

    const { password: userPw } = await createTestUser(app, {
      email: `user-${Date.now()}@test.com`,
    });
    userToken = await loginAndGetToken(
      app,
      (await getPrisma(app).user.findFirst({ where: { role: 'USER' } }))!.email,
      userPw
    );
  });

  afterAll(async () => {
    await app.close();
  });

  // ============ CREATE ============

  describe('POST /api/v1/categories', () => {
    it('should allow admin to create a category', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set(authHeader(adminToken))
        .send({ name: 'Electronics', description: 'Test category' })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Electronics',
        slug: 'electronics',
      });
      expect(response.body).toHaveProperty('id');
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set(authHeader(userToken))
        .send({ name: 'Forbidden', description: 'Should fail' })
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'No Auth', description: 'Should fail' })
        .expect(401);
    });

    it('should return 409 for duplicate name', async () => {
      await createTestCategory(app, { name: 'Duplicates' });

      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set(authHeader(adminToken))
        .send({ name: 'Duplicates', description: 'Should conflict' })
        .expect(409);
    });

    it('should return 400 for missing required field', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set(authHeader(adminToken))
        .send({ description: 'No name field' })
        .expect(400);
    });
  });

  // ============ LIST ============

  describe('GET /api/v1/categories', () => {
    it('should return all root categories (public)', async () => {
      await createTestCategory(app, { name: 'Category A' });
      await createTestCategory(app, { name: 'Category B' });

      const response = await request(app.getHttpServer()).get('/api/v1/categories').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should filter by parentId', async () => {
      const parent = await createTestCategory(app, { name: 'Parent' });
      await createTestCategory(app, {
        name: 'Child',
        slug: 'child-x',
        parentId: parent.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories?parentId=${parent.id}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Child');
    });
  });

  // ============ GET BY ID / SLUG ============

  describe('GET /api/v1/categories/:id', () => {
    it('should return category by ID (public)', async () => {
      const category = await createTestCategory(app, { name: 'Get By ID' });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories/${category.id}`)
        .expect(200);

      expect(response.body.name).toBe('Get By ID');
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/v1/categories/slug/:slug', () => {
    it('should return category by slug', async () => {
      await createTestCategory(app, { name: 'Slug Test', slug: 'slug-test' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/categories/slug/slug-test')
        .expect(200);

      expect(response.body.name).toBe('Slug Test');
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer()).get('/api/v1/categories/slug/nonexistent').expect(404);
    });
  });

  // ============ UPDATE ============

  describe('PUT /api/v1/categories/:id', () => {
    it('should allow admin to update a category', async () => {
      const category = await createTestCategory(app, { name: 'Original' });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/categories/${category.id}`)
        .set(authHeader(adminToken))
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    it('should return 403 for non-admin', async () => {
      const category = await createTestCategory(app, { name: 'Protected' });

      await request(app.getHttpServer())
        .put(`/api/v1/categories/${category.id}`)
        .set(authHeader(userToken))
        .send({ description: 'Should fail' })
        .expect(403);
    });

    it('should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .send({ description: 'Should fail' })
        .expect(404);
    });
  });

  // ============ DELETE ============

  describe('DELETE /api/v1/categories/:id', () => {
    it('should allow admin to delete a category', async () => {
      const category = await createTestCategory(app, { name: 'To Delete' });

      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${category.id}`)
        .set(authHeader(adminToken))
        .expect(200);

      // Verify deletion
      const prisma = getPrisma(app);
      const found = await prisma.category.findUnique({ where: { id: category.id } });
      expect(found).toBeNull();
    });

    it('should return 403 for non-admin', async () => {
      const category = await createTestCategory(app, { name: 'Protected' });

      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${category.id}`)
        .set(authHeader(userToken))
        .expect(403);
    });

    it('should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });
  });
});
