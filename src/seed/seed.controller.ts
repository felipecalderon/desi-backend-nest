import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Seed (Datos de Prueba)')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  @ApiOperation({ summary: 'Ejecutar carga de datos masiva (Reinicia la BD)' })
  @ApiResponse({ status: 200, description: 'Datos cargados correctamente' })
  executeSeed() {
    return this.seedService.runSeed();
  }
}
