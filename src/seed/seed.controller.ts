import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Seed (Datos de Prueba)')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Ejecutar carga de datos masiva (Reinicia la BD)' })
  @ApiResponse({ status: 200, description: 'Datos cargados correctamente' })
  executeSeed() {
    return this.seedService.runSeed();
  }
}
