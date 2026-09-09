/**
 * JWT Strategy for Authentication
 *
 * This strategy validates JWT tokens and extracts user information.
 * It's used by Passport to authenticate requests based on JWT tokens
 * present in the Authorization header.
 *
 * How it works:
 * 1. Extract token from Authorization header (Bearer token)
 * 2. Validate token signature using JWT secret
 * 3. Extract payload (user id, email, role)
 * 4. Attach user object to request
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

// Define the shape of the JWT payload for type safety
interface JwtPayload {
  sub: string; // Subject (user ID)
  email: string; // User email
}

@Injectable()
// JwtStrategy integrates with Passport to handle JWT authentication
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    // Configure the JWT strategy
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Do not ignore expiration — expired tokens should be rejected
      ignoreExpiration: false,

      // Secret key used to verify token signature (from environment config)
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Validate the JWT payload after signature verification
   * This method runs automatically once the token is decoded.
   * It should return a user object that will be attached to req.user.
   */
  async validate(payload: JwtPayload) {
    // Look up the user in the database using Prisma
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // If user does not exist, reject the request
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // If user account is deactivated, reject the request
    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Return the user object — NestJS attaches this to req.user
    return user;
  }
}
