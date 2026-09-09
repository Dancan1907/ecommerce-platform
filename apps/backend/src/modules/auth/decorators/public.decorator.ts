/**
 * Public Decorator
 *
 * Marks a route as public (no authentication required).
 * - Attaches metadata key `isPublic` with value `true`
 * - JwtAuthGuard can read this metadata and skip authentication
 *
 * Usage:
 * @Public()
 * @Post('auth/login')
 * login(@Body() loginDto: LoginDto) { ... }
 *
 * @Public()
 * @Post('auth/register')
 * register(@Body() registerDto: RegisterDto) { ... }
 */

import { SetMetadata } from '@nestjs/common';

// ✅ Metadata key used to mark routes as public
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Apply this decorator to routes that should bypass authentication.
 * Example: login, register, or any endpoint accessible without a token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
