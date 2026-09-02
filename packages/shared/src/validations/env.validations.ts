/**
 * Environment variable validation using Joi
 * This ensures all required environment variables are present and valid
 * Prevents runtime errors due to missing configuration
 */

import * as Joi from 'joi';

/**
 * Joi schema for validating environment variables
 * Each variable is validated with specific rules:
 * - required(): Must be present
 * - default(): Provides a fallback value
 * - valid(): Only allows specific values
 * - min()/max(): Enforces length limits
 * - uri(): Validates URL format
 * - number(): Validates numeric values
 */
export const envValidationSchema = Joi.object({
  // ====================== NODE ENVIRONMENT ======================
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('Current environment mode'),
  
  // ====================== APPLICATION ======================
  PORT: Joi.number().default(3000).description('Port for the backend server'),
  API_PREFIX: Joi.string().default('/api/v1').description('API route prefix'),
  FRONTEND_URL: Joi.string().uri().required().description('Frontend application URL for CORS'),
  
  // ====================== DATABASE ======================
  DATABASE_URL: Joi.string().required().description('PostgreSQL connection string'),
  
  // ====================== JWT AUTHENTICATION ======================
  JWT_ACCESS_SECRET: Joi.string().min(32).required().description('Secret for JWT access tokens'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().description('Secret for JWT refresh tokens'),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m').description('Access token expiration (e.g., 15m, 1h)'),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d').description('Refresh token expiration (e.g., 7d, 30d)'),
  
  // ====================== EMAIL (Nodemailer) ======================
  SMTP_HOST: Joi.string().hostname().required().description('SMTP server hostname'),
  SMTP_PORT: Joi.number().default(587).description('SMTP server port'),
  SMTP_USER: Joi.string().required().description('SMTP username'),
  SMTP_PASS: Joi.string().required().description('SMTP password'),
  SMTP_FROM: Joi.string().email().required().description('Default sender email address'),
  
  // ====================== STRIPE PAYMENT ======================
  STRIPE_SECRET_KEY: Joi.string().required().description('Stripe secret API key'),
  STRIPE_WEBHOOK_SECRET: Joi.string().required().description('Stripe webhook signing secret'),
  
  // ====================== FILE UPLOADS ======================
  UPLOAD_DIR: Joi.string().default('./uploads').description('Directory for uploaded files'),
  MAX_FILE_SIZE: Joi.number().default(5 * 1024 * 1024).description('Maximum file size in bytes (5MB default)'),
  
  // ====================== CORS ======================
  ALLOWED_ORIGINS: Joi.string().default('*').description('Comma-separated list of allowed CORS origins'),
  
  // ====================== RATE LIMITING ======================
  RATE_LIMIT_TTL: Joi.number().default(60).description('Rate limit time window in seconds'),
  RATE_LIMIT_MAX: Joi.number().default(100).description('Maximum requests per window per IP'),
});

/**
 * Environment variable type inference
 * This creates a TypeScript type from the Joi schema
 */
export type EnvConfig = {
  NODE_ENV: 'development' | 'production' | 'test' | 'staging';
  PORT: number;
  API_PREFIX: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_EXPIRES: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_TTL: number;
  RATE_LIMIT_MAX: number;
};
