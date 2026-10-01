/**
 * Application Entry Point
 * Bootstraps the NestJS application with Swagger API documentation
 *
 * Swagger UI will be available at: /api/docs
 * API endpoint: /api/v1
 * Health check: GET /api/v1/health
 *
 * Configuration is env-driven so the same build runs in dev, CI, and
 * production without code changes:
 *  - ALLOWED_ORIGINS: comma-separated list of frontend origins (CORS)
 *  - PUBLIC_API_URL:  the public URL of this API (Swagger server entry)
 *  - PORT:            listen port (Render assigns this dynamically)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // ─────────────────────────────────────────────
  // Static file serving (product/category images)
  // ─────────────────────────────────────────────
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ─────────────────────────────────────────────
  // Global validation
  // ─────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // ─────────────────────────────────────────────
  // API prefix
  // ─────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─────────────────────────────────────────────
  // Swagger
  // ─────────────────────────────────────────────
  const publicApiUrl = process.env.PUBLIC_API_URL;
  const isProd = process.env.NODE_ENV === 'production';

  const swaggerConfig = new DocumentBuilder()
    .setTitle('The Racing Shop API')
    .setDescription('The Racing Shop — Backend API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token'
    );

  // In production, use PUBLIC_API_URL if set. Otherwise fall back to
  // localhost for local dev. This makes the Swagger "Try it out"
  // buttons hit the right host in both environments.
  if (isProd && publicApiUrl) {
    swaggerConfig.addServer(publicApiUrl, 'Production');
  } else {
    swaggerConfig.addServer(`http://localhost:${process.env.PORT ?? 3000}`, 'Development');
  }

  const document = SwaggerModule.createDocument(app, swaggerConfig.build());
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // ─────────────────────────────────────────────
  // CORS — env-driven allowlist
  // ─────────────────────────────────────────────
  // ALLOWED_ORIGINS is a comma-separated list, e.g.:
  //   dev:  "http://localhost:3000,http://localhost:3001"
  //   prod: "https://the-racing-shop.vercel.app"
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ─────────────────────────────────────────────
  // Listen
  // ─────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const envLabel = process.env.NODE_ENV ?? 'development';
  console.log(`🚀 Application is running on port ${port} (${envLabel})`);
  console.log(`📚 Swagger API docs: /api/docs`);
  console.log(`🖼 Static uploads served at: /uploads/`);
}

bootstrap();
