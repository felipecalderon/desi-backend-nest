import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsFilterDto } from './dto/reports-filter.dto';
import { SalesReportDto } from './dto/sales-report.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('reports')
@ApiTags('Reportes')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({
    summary: 'Reporte de ventas',
    description:
      'Obtiene resumen de ventas agrupadas por tipo de pago y estado, resúmenes de periodo (hoy, ayer, mes) y listado de ventas dentro del rango. Fechas en ISO 8601.',
  })
  @ApiQuery({
    name: 'storeId',
    required: true,
    description: 'ID de la tienda para filtrar',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Fecha desde (inclusive) ISO 8601',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Fecha hasta (exclusive) ISO 8601',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página (paginación) - default 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tamaño de página - default 50',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte de ventas',
    type: SalesReportDto,
  })
  async salesReport(@Query() query: ReportsFilterDto) {
    return this.reportsService.getSalesReport(query);
  }
}
