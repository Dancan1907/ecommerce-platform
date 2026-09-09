/**
 * JWT Authentication Guard
 *
 * This guard protects routes that require authentication.
 * It uses the JWT strategy to validate the token and extract the user.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req) { return req.user; }
 *
 * How it works:
 * 1. Extracts token from Authorization header
 * 2. Validates token signature and expiration
 * 3. Retrieves user from database
 * 4. Attaches user to request object
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Customize the authentication result
   *
   * This method is called after the JWT strategy validates the token.
   * We can add additional logic here if needed.
   */
  handleRequest(err: any, user: any) {
    // If there's an error or no user, throw unauthorized
    if (err || !user) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    // User is authenticated and attached to request
    return user;
  }
}
