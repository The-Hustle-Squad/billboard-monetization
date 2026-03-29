import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('root')
@Controller()
export class RootController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Service info' })
  root(): { service: string; message: string; docs: string } {
    return {
      service: 'vacantSlot',
      message: 'VacantSlot API',
      docs: '/docs',
    };
  }
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (MongoDB)' })
  async ready(): Promise<{ status: string; mongo: string }> {
    try {
      if (this.connection.readyState !== 1) {
        throw new ServiceUnavailableException({
          status: 'not_ready',
          mongo: 'disconnected',
        });
      }
      await this.connection.db?.admin().command({ ping: 1 });
      return { status: 'ok', mongo: 'connected' };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      throw new ServiceUnavailableException({
        status: 'not_ready',
        mongo: 'error',
      });
    }
  }
}
