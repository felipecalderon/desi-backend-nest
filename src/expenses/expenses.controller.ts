import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { Expense } from './entities/expense.entity';
import { CustomMessage } from '../common/decorators/response-message';
import { ExpenseSummaryDto } from './dto/expense-summary.dto';
import { ExpenseSummaryQueryDto } from './dto/expense-summary-query.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { getRequiredActiveStoreID } from '../common/tenant/store-scope.util';

@ApiTags('Gestión de Gastos')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo gasto',
    description:
      'Crea un registro de gasto asociado a una tienda, incluyendo monto, fecha y tipo de gasto.',
  })
  @ApiResponse({
    status: 201,
    description: 'El gasto ha sido creado exitosamente.',
    type: Expense,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    createExpenseDto.storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  @CustomMessage('Lista de gastos obtenida exitosamente')
  @ApiOperation({
    summary: 'Consultar todos los gastos',
    description:
      'Obtiene una lista completa de todos los gastos registrados en el sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los gastos recuperada con éxito.',
    type: [Expense],
  })
  findAll(
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.expensesService.findAll(storeID);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen de gastos',
    description:
      'Devuelve el total general de gastos y el desglose acumulado por tipo de gasto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de gastos recuperado con éxito.',
    type: ExpenseSummaryDto,
  })
  async summary(
    @Query() query: ExpenseSummaryQueryDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ): Promise<ExpenseSummaryDto> {
    query.storeId = getRequiredActiveStoreID(user, activeStoreID);
    const summary: ExpenseSummaryDto =
      await this.expensesService.getSummary(query);
    return summary;
  }

  @Get(':id')
  @CustomMessage('Gasto encontrado exitosamente')
  @ApiOperation({
    summary: 'Consultar un gasto por su ID',
    description:
      'Recupera la información detallada de un gasto específico utilizando su identificador único.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del gasto (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Gasto encontrado y devuelto con éxito.',
    type: Expense,
  })
  @ApiResponse({
    status: 404,
    description: 'Gasto no encontrado en el sistema.',
  })
  findOne(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.expensesService.findOne(id, storeID);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar la información de un gasto',
    description:
      'Modifica los datos de un gasto existente identificado por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del gasto a actualizar (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'El gasto ha sido actualizado exitosamente.',
    type: Expense,
  })
  @ApiResponse({
    status: 404,
    description: 'Gasto no encontrado para actualizar.',
  })
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.expensesService.update(id, updateExpenseDto, storeID);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un registro de gasto',
    description:
      'Remueve permanentemente un gasto del sistema mediante su identificador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del gasto a eliminar (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'El gasto ha sido eliminado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Gasto no encontrado para eliminar.',
  })
  remove(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.expensesService.remove(id, storeID);
  }
}
