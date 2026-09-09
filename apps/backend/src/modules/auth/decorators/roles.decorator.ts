/**
 * Roles Decorator
 *
 * This decorator is used to specify which roles are allowed to access
 * a route. It works together with the RolesGuard.
 *
 * Usage:
 * @Roles('ADMIN')
 * @Delete('users/:id')
 * deleteUser(@Param('id') id: string) { ... }
 *
 * @Roles('ADMIN', 'SELLER')
 * @Post('products')
 * createProduct(@Body() data: CreateProductDto) { ... }
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

// Key used to store role metadata
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Attach required roles to a route.
 * RolesGuard will read this metadata and enforce RBAC.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Key used to store public metadata
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Mark a route as public (no authentication required).
 * JwtAuthGuard will check this metadata and skip validation.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
