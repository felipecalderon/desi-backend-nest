import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { UpdatePriceDto } from './dto/update-price.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update price and record history' })
  updatePrice(@Body() updatePriceDto: UpdatePriceDto) {
    return this.pricingService.updatePrice(updatePriceDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get price history for a store product' })
  getPriceHistory(
    @Query('storeID') storeID: string,
    @Query('variationID') variationID: string,
  ) {
    return this.pricingService.getPriceHistory(storeID, variationID);
  }
}
