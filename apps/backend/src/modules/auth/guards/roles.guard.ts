/**
 * Roles Guard
 *
 * This guard checks if the authenticated user has the required role(s)
 * to access a specific route.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('ADMIN')
 * @Delete('users/:id')
 * deleteUser(@Param('id') id: string) { ... }
 *
 * How it works:
 * 1. Extracts user from request (set by JwtAuthGuard)
 * 2. Checks if user has one of the required roles
 * 3. If not, throws ForbiddenException
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// RolesGuard enforces role-based access control (RBAC)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // ✅ Get required roles from metadata set by @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // ✅ If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // ✅ Extract user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: { role: UserRole } | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // ✅ Check if user has one of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Requires one of roles: ${requiredRoles.join(', ')}`
      );
    }

    return true; // ✅ Allow access
  }
}
