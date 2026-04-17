import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  const mockService = {
    getSalesReport: jest.fn().mockResolvedValue({ foo: 'bar' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should return data from service', async () => {
    expect(await controller.salesReport({} as any)).toEqual({ foo: 'bar' });
    expect(mockService.getSalesReport).toHaveBeenCalledWith({} as any);
  });
});
