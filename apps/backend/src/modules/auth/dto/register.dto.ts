/**
 * Register DTO (Data Transfer Object)
 * Used for validating user registration requests
 *
 * This DTO validates all required fields for creating a new user account.
 * All validation rules are applied before the user is created in the database.
 */

import { IsEmail, IsString, MinLength, IsOptional, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message: 'Password must contain uppercase, number, and special character',
  })
  password!: string;

  @ApiProperty({
    example: 'USER',
    description: 'User role (optional)',
    enum: ['USER', 'ADMIN', 'SELLER'],
  })
  @IsOptional()
  @IsIn(['USER', 'ADMIN', 'SELLER'], { message: 'Role must be USER, ADMIN, or SELLER' })
  role?: string;
}
