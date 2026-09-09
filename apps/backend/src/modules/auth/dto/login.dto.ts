/**
 * Login DTO (Data Transfer Object)
 * Used for validating login requests
 *
 * This DTO ensures that the request body contains valid email and password
 * before the authentication service processes it.
 */

import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password (min 6 chars, at least one uppercase and one number)',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;
}
