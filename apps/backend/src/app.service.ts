/**
 * Root application service
 * Contains business logic for base routes
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello E-Commerce API!';
  }
}
