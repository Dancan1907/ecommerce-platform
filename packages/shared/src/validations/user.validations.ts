import { z } from 'zod';

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const LoginUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatar: z.string().url().optional(),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
export type LoginUserDto = z.infer<typeof LoginUserSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
