import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { IncomeStatementQueryDto } from './dto/income-statement-query.dto';
import {
  IncomeStatementDto,
  IncomeStatementMonthDto,
} from './dto/income-statement.dto';

type MonthlyAggregateRow = {
  month: string;
  total: string | number | null;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  private getYearBounds(year: number) {
    return {
      start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)),
    };
  }

  private getMonthLabels() {
    return [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
  }

  private toNumber(value: string | number | null | undefined) {
    return Number(value ?? 0);
  }

  private createMonthlySeries(year: number): IncomeStatementMonthDto[] {
    const monthLabels = this.getMonthLabels();
    return monthLabels.map((label, index) => ({
      month: index + 1,
      label,
      year,
      salesIncome: 0,
      purchaseOrdersIncome: 0,
      expenses: 0,
      net: 0,
    }));
  }

  private async aggregateMonthlyTotal<T>(
    repository: Repository<any>,
    alias: string,
    dateColumn: string,
    amountColumn: string,
    start: Date,
    end: Date,
    storeId?: string,
    extraWhere?: string,
  ) {
    const qb = repository
      .createQueryBuilder(alias)
      .select(`EXTRACT(MONTH FROM ${alias}.${dateColumn})`, 'month')
      .addSelect(`COALESCE(SUM(${alias}.${amountColumn}), 0)`, 'total')
      .where(
        `${alias}.${dateColumn} >= :start AND ${alias}.${dateColumn} < :end`,
        {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      );

    if (storeId) {
      qb.andWhere(`${alias}.storeID = :storeId`, { storeId });
    }

    if (extraWhere) {
      qb.andWhere(extraWhere);
    }

    const rows = (await qb
      .groupBy('month')
      .getRawMany()) as MonthlyAggregateRow[];
    return new Map<number, number>(
      rows.map((row) => [Number(row.month), this.toNumber(row.total)]),
    );
  }

  private buildTotals(series: IncomeStatementMonthDto[]) {
    return series.reduce(
      (acc, month) => ({
        salesIncome: acc.salesIncome + month.salesIncome,
        purchaseOrdersIncome:
          acc.purchaseOrdersIncome + month.purchaseOrdersIncome,
        expenses: acc.expenses + month.expenses,
        net: acc.net + month.net,
      }),
      {
        salesIncome: 0,
        purchaseOrdersIncome: 0,
        expenses: 0,
        net: 0,
      },
    );
  }

  async getIncomeStatement(
    filter: IncomeStatementQueryDto,
  ): Promise<IncomeStatementDto> {
    const year = filter.year ?? new Date().getFullYear();
    const { start, end } = this.getYearBounds(year);

    const [salesByMonth, purchaseOrdersByMonth, expensesByMonth] =
      await Promise.all([
        this.aggregateMonthlyTotal(
          this.saleRepository,
          'sale',
          'createdAt',
          'total',
          start,
          end,
          filter.storeId,
          "sale.status = 'Pagado'",
        ),
        this.aggregateMonthlyTotal(
          this.purchaseOrderRepository,
          'purchaseOrder',
          'issueDate',
          'total',
          start,
          end,
          filter.storeId,
          "purchaseOrder.paymentStatus = 'Pagado'",
        ),
        this.aggregateMonthlyTotal(
          this.expenseRepository,
          'expense',
          'deductibleDate',
          'amount',
          start,
          end,
          filter.storeId,
        ),
      ]);

    const months = this.createMonthlySeries(year).map((month) => {
      const salesIncome = salesByMonth.get(month.month) ?? 0;
      const purchaseOrdersIncome = purchaseOrdersByMonth.get(month.month) ?? 0;
      const expenses = expensesByMonth.get(month.month) ?? 0;
      const net = salesIncome + purchaseOrdersIncome - expenses;

      return {
        ...month,
        salesIncome,
        purchaseOrdersIncome,
        expenses,
        net,
      };
    });

    return {
      year,
      storeId: filter.storeId,
      months,
      totals: this.buildTotals(months),
    };
  }
}
