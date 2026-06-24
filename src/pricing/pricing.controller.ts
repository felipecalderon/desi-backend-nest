import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { OfferService } from './offer.service';
import { UpdatePriceDto } from './dto/update-price.dto';
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto';
import { UpdateSpecialOfferDto } from './dto/update-special-offer.dto';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { PricingListQueryDto } from './dto/pricing-list.query.dto';
import { SpecialOfferListQueryDto } from './dto/special-offer-list.query.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { getRequiredActiveStoreID } from '../common/tenant/store-scope.util';

@ApiTags('Precios de productos')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly offerService: OfferService,
  ) {}

  @Post('update')
  @ApiOperation({ summary: 'Actualizar precio y registrar historial' })
  updatePrice(
    @Body() updatePriceDto: UpdatePriceDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    updatePriceDto.storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.pricingService.updatePrice(updatePriceDto);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Obtener historial de precios completo o filtrado',
  })
  @ApiQuery({
    name: 'storeProductID',
    required: false,
    description: 'Filtra el historial por producto de tienda',
  })
  @ApiQuery({
    name: 'storeID',
    required: false,
    description: 'Filtra el historial por tienda',
  })
  @ApiQuery({
    name: 'variationID',
    required: false,
    description: 'Filtra el historial por variación',
  })
  getPriceHistory(
    @Query() query: PricingListQueryDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    query.storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.pricingService.getPriceHistoryList(query);
  }

  @Get('offers')
  @ApiOperation({
    summary: 'Listar todas las ofertas especiales o filtrar por producto',
  })
  @ApiQuery({
    name: 'storeProductID',
    required: false,
    description: 'Filtra las ofertas por producto de tienda',
  })
  getOffers(
    @Query() query: SpecialOfferListQueryDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.offerService.getSpecialOffers(query.storeProductID, storeID);
  }

  @Post('offers')
  @ApiOperation({ summary: 'Crear una oferta especial' })
  createOffer(
    @Body() createSpecialOfferDto: CreateSpecialOfferDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.offerService.createSpecialOffer(
      createSpecialOfferDto,
      storeID,
    );
  }

  @Post('offers/:id')
  @ApiOperation({ summary: 'Actualizar una oferta especial' })
  updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialOfferDto: UpdateSpecialOfferDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.offerService.updateSpecialOffer(
      id,
      updateSpecialOfferDto,
      storeID,
    );
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calcular precio final con motor de precios y contexto opcional',
  })
  @ApiBody({ type: CalculatePriceDto })
  calculate(
    @Body() input: CalculatePriceDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.pricingService.calculatePrice(input, storeID);
  }

  @Get('price-check/:storeProductID')
  @ApiOperation({
    summary: 'Calcular precio final rápido con cantidad 1 e historial activo',
  })
  checkPrice(
    @Param('storeProductID', ParseUUIDPipe) storeProductID: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.pricingService.calculatePrice(
      { storeProductID, quantity: 1 },
      storeID,
    );
  }
}
