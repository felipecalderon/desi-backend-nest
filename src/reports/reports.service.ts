import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { ReportsFilterDto } from './dto/reports-filter.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  private normalizeDates(from?: string, to?: string) {
    const now = new Date();
    // Default from: first day of current month at 00:00
    const defaultFrom = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    // Default to: start of next day (exclusive) to include current day fully
    const defaultTo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );

    const fromDate = from ? new Date(from) : defaultFrom;
    const toDate = to ? new Date(to) : defaultTo;

    return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }

  private async aggregateCountAndTotal(
    startIso: string,
    endIso: string,
    storeId?: string,
  ) {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .select('COUNT(sale.saleID)', 'count')
      .addSelect('COALESCE(SUM(sale.total),0)', 'total')
      .where('sale.createdAt >= :start AND sale.createdAt < :end', {
        start: startIso,
        end: endIso,
      });

    if (storeId) qb.andWhere('sale.storeID = :storeId', { storeId });

    const raw = await qb.getRawOne();
    return { count: Number(raw.count || 0), total: Number(raw.total || 0) };
  }

  async getSalesReport(filter: ReportsFilterDto) {
    const { storeId, page = 1, limit = 50 } = filter;
    const { from, to } = this.normalizeDates(filter.from, filter.to);

    // Aggregation by paymentType
    const paymentQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('sale.paymentType', 'key')
      .addSelect('COUNT(sale.saleID)', 'count')
      .addSelect('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :from AND sale.createdAt < :to', { from, to });

    // Aggregation by status
    const statusQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('sale.status', 'key')
      .addSelect('COUNT(sale.saleID)', 'count')
      .addSelect('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :from AND sale.createdAt < :to', { from, to });

    if (storeId) {
      paymentQuery.andWhere('sale.storeID = :storeId', { storeId });
      statusQuery.andWhere('sale.storeID = :storeId', { storeId });
    }

    const [paymentRaw, statusRaw] = await Promise.all([
      paymentQuery.groupBy('sale.paymentType').getRawMany(),
      statusQuery.groupBy('sale.status').getRawMany(),
    ]);

    const groupedByPaymentType = paymentRaw.map((r) => ({
      key: r.key,
      count: Number(r.count),
      total: Number(r.total),
    }));
    const groupedByStatus = statusRaw.map((r) => ({
      key: r.key,
      count: Number(r.count),
      total: Number(r.total),
    }));

    // Period summaries: today, yesterday, month (only counts and totals)
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      0,
      0,
      0,
      0,
    );
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const [todaySummary, yesterdaySummary, monthSummary] = await Promise.all([
      this.aggregateCountAndTotal(
        todayStart.toISOString(),
        tomorrowStart.toISOString(),
        storeId,
      ),
      this.aggregateCountAndTotal(
        yesterdayStart.toISOString(),
        todayStart.toISOString(),
        storeId,
      ),
      this.aggregateCountAndTotal(
        monthStart.toISOString(),
        tomorrowStart.toISOString(),
        storeId,
      ),
    ]);

    // Sales list with pagination
    const listQuery = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.store', 'store')
      .leftJoinAndSelect('sale.saleProducts', 'saleProducts')
      .where('sale.createdAt >= :from AND sale.createdAt < :to', { from, to });

    if (storeId) listQuery.andWhere('sale.storeID = :storeId', { storeId });

    const [sales, total] = await listQuery
      .orderBy('sale.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      groupedByPaymentType,
      groupedByStatus,
      periodSummary: {
        today: todaySummary,
        yesterday: yesterdaySummary,
        month: monthSummary,
      },
      sales,
      meta: { page, limit, total },
    };
  }
}
