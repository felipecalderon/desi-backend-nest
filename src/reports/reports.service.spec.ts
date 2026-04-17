import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const mockRepo = {
    createQueryBuilder: jest.fn().mockImplementation(() => {
      const builder: any = {
        _mode: null,
        select(arg: string) {
          if (arg.includes('paymentType')) this._mode = 'payment';
          else if (arg.includes('sale.status') || arg.includes('sale.status'))
            this._mode = 'status';
          else if (arg.includes('COUNT(')) this._mode = 'aggregate';
          else this._mode = 'list';
          return this;
        },
        addSelect() {
          return this;
        },
        where() {
          return this;
        },
        andWhere() {
          return this;
        },
        groupBy() {
          return this;
        },
        leftJoinAndSelect() {
          this._mode = 'list';
          return this;
        },
        orderBy() {
          return this;
        },
        skip() {
          return this;
        },
        take() {
          return this;
        },
        getRawMany: async function () {
          if (this._mode === 'payment')
            return [{ key: 'Efectivo', count: '2', total: '200.00' }];
          if (this._mode === 'status')
            return [{ key: 'Pagado', count: '1', total: '100.00' }];
          return [];
        },
        getRawOne: async function () {
          return { count: '3', total: '300.00' };
        },
        getManyAndCount: async function () {
          return [[], 0];
        },
      };
      return builder;
    }),
  };

  beforeEach(() => {
    service = new ReportsService(mockRepo as any);
  });

  it('should return report with grouped data and period summaries', async () => {
    const result = await service.getSalesReport({} as any);
    expect(result).toHaveProperty('groupedByPaymentType');
    expect(result.groupedByPaymentType[0].key).toBe('Efectivo');
    expect(result).toHaveProperty('groupedByStatus');
    expect(result.periodSummary).toHaveProperty('today');
    expect(result.periodSummary.today).toHaveProperty('count');
    expect(result.periodSummary.today).toHaveProperty('total');
  });
});
