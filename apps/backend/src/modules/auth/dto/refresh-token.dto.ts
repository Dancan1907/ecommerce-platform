/**
 * Refresh Token DTO
 * Used for validating refresh token requests
 *
 * This DTO is used when a client needs to obtain a new access token
 * using a valid refresh token.
 */

import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  @IsString({ message: 'Refresh token must be a string' })
  @MinLength(20, { message: 'Refresh token is too short' })
  refreshToken!: string;
}
