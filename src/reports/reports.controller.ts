import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { IncomeStatementQueryDto } from './dto/income-statement-query.dto';
import { IncomeStatementDto } from './dto/income-statement.dto';

@Controller('reports')
@ApiTags('Reportes')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('income-statement')
  @ApiOperation({
    summary: 'Estado de resultados mensual',
    description:
      'Devuelve la serie mensual del año consultado con ingresos por ventas y purchase orders pagadas, egresos por gastos y neto acumulado.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Año calendario a consultar. Default: año actual.',
    example: 2026,
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'ID de la tienda para filtrar el estado de resultados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de resultados mensual.',
    type: IncomeStatementDto,
  })
  async incomeStatement(@Query() query: IncomeStatementQueryDto) {
    return this.reportsService.getIncomeStatement(query);
  }
}
