/**
 * Environment Setup
 *
 * Runs BEFORE any module is imported by Jest.
 * Forces NODE_ENV=test so ConfigModule loads .env.test.
 */

process.env.NODE_ENV = 'test';
