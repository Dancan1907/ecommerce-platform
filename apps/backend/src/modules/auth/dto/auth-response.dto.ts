/**
 * Auth Response DTO
 * Defines the structure of authentication responses
 *
 * This DTO standardizes the response format for login and token refresh
 * operations, ensuring consistent client-side handling.
 */

import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '123', description: 'User ID' })
  id!: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email!: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  lastName!: string;

  @ApiProperty({ example: 'USER', description: 'User role' })
  role!: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'JWT refresh token' })
  refreshToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
