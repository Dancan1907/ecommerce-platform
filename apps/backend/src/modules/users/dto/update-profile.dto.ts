/**
 * UpdateProfileDto
 *
 * Validates data for updating user profile.
 */
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Jane', description: 'First name' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(50, { message: 'First name too long' })
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name too long' })
  lastName?: string;

  @ApiProperty({ example: 'https://...', description: 'Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
