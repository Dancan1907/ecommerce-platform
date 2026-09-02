export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  USER = 'USER'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
