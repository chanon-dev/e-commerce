import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  async getLiveness() {
    return this.healthService.getLiveness();
  }
}
