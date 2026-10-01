/**
 * Root application controller
 *
 * Handles base routes:
 *   GET /api/v1          → greeting (existing)
 *   GET /api/v1/health   → health check (new)
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Root greeting' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check — verifies app and DB are reachable' })
  getHealth() {
    return this.appService.getHealth();
  }
}
