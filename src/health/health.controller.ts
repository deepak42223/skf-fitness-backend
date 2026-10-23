import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private startTime = Date.now();

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        database: 'connected',
        uptime: 3600,
        timestamp: '2024-01-15T10:30:00.000Z',
        environment: 'development'
      }
    }
  })
  @Get()
  async check() {
    let dbStatus = 'disconnected';
    try {
      await this.dataSource.query('SELECT 1');
      dbStatus = 'connected';
    } catch (error) {
      console.error('Health check database error:', error);
    }

    const status = dbStatus === 'connected' ? 'ok' : 'error';

    return {
      status,
      database: dbStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
