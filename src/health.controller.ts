import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verificar que la API está disponible' })
  @ApiResponse({
    status: 200,
    description: 'La API está disponible.',
    schema: {
      example: {
        status: 'ok',
      },
    },
  })
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
