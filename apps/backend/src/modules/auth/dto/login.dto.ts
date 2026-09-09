/**
 * Login DTO (Data Transfer Object)
 * Used for validating login requests
 *
 * This DTO ensures that the request body contains valid email and password
 * before the authentication service processes it.
 */

import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;
}
