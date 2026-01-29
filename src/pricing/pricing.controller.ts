import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { UpdatePriceDto } from './dto/update-price.dto';
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto';
import { UpdateSpecialOfferDto } from './dto/update-special-offer.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Precios de productos')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('update')
  @ApiOperation({ summary: 'Actualizar precio y registrar historial' })
  updatePrice(@Body() updatePriceDto: UpdatePriceDto) {
    return this.pricingService.updatePrice(updatePriceDto);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Obtener historial de precios de un producto de tienda',
  })
  getPriceHistory(
    @Query('storeID') storeID: string,
    @Query('variationID') variationID: string,
  ) {
    return this.pricingService.getPriceHistory(storeID, variationID);
  }

  @Post('offers')
  @ApiOperation({ summary: 'Crear una oferta especial' })
  createOffer(@Body() createSpecialOfferDto: CreateSpecialOfferDto) {
    return this.pricingService.createSpecialOffer(createSpecialOfferDto);
  }

  @Post('offers/:id')
  @ApiOperation({ summary: 'Actualizar una oferta especial' })
  updateOffer(
    @Param('id') id: string,
    @Body() updateSpecialOfferDto: UpdateSpecialOfferDto,
  ) {
    return this.pricingService.updateSpecialOffer(id, updateSpecialOfferDto);
  }

  @Get('price-check/:storeProductID')
  @ApiOperation({ summary: 'Calcular precio final incluyendo ofertas activas' })
  checkPrice(@Param('storeProductID') storeProductID: string) {
    return this.pricingService.calculateFinalPrice(storeProductID);
  }
}
