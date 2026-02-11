import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto';
import { VerifyPurchaseOrderDto } from './dto/verify-purchase-order.dto';
import { Store } from '../stores/entities/store.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { StoreProduct } from '../relations/storeproduct/entities/storeproduct.entity';

const TAX_RATE = 0.19;

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly dataSource: DataSource,
  ) {}

  private toMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private calculateTotals(items: PurchaseOrderItem[], discount: number) {
    const subtotal = this.toMoney(
      items.reduce((acc, item) => acc + Number(item.subtotal), 0),
    );
    const net = this.toMoney(Math.max(subtotal - discount, 0));
    const tax = this.toMoney(net * TAX_RATE);
    const total = this.toMoney(net + tax);

    return { subtotal, net, tax, total };
  }

  // direction: +1 aplica stock (central -> tienda), -1 revierte
  private async applyStockForOrder(
    manager: EntityManager,
    order: PurchaseOrder,
    direction: 1 | -1,
  ) {
    const sign = direction === 1 ? 1 : -1;

    for (const item of order.items) {
      const quantity = item.quantityRequested || 0;
      if (quantity <= 0) continue;

      const variation = await manager.findOne(ProductVariation, {
        where: { variationID: item.variationID },
        lock: { mode: 'pessimistic_write' },
      });

      if (!variation) {
        throw new NotFoundException(
          `Variación con ID ${item.variationID} no encontrada`,
        );
      }

      // mover stock en tienda
      const priceCost = Number(item.unitPrice);
      await this.upsertStoreStock(
        manager,
        order.storeID,
        item.variationID,
        priceCost,
        sign * quantity,
      );
    }
  }

  private async upsertStoreStock(
    manager: EntityManager,
    storeID: string,
    variationID: string,
    priceCost: number,
    delta: number,
  ) {
    let storeStock = await manager.findOne(StoreProduct, {
      where: { storeID, variationID },
      lock: { mode: 'pessimistic_write' },
    });

    if (!storeStock) {
      storeStock = manager.create(StoreProduct, {
        storeID,
        variationID,
        stock: 0,
        priceCost,
        priceList: 0, // default
      });
    }

    storeStock.priceCost = priceCost;
    storeStock.stock += delta;
    await manager.save(storeStock);
  }

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const discount = dto.discount ?? 0;
    const isThirdParty = dto.isThirdParty ?? false;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, {
        where: { storeID: dto.storeID },
      });
      if (!store) {
        throw new NotFoundException(
          `Tienda con ID ${dto.storeID} no encontrada`,
        );
      }

      const folio = randomBytes(3).toString('hex');
      const purchaseOrder = manager.create(PurchaseOrder, {
        storeID: dto.storeID,
        folio,
        isThirdParty,
        issueDate: new Date(),
        dueDate,
        dteNumber: dto.dteNumber ?? null,
        paymentStatus: 'Pendiente',
        subtotal: 0,
        discount,
        netTotal: 0,
        tax: 0,
        total: 0,
        totalProducts: 0,
      });

      const savedOrder = await manager.save(purchaseOrder);

      const itemsToSave: PurchaseOrderItem[] = [];
      for (const itemDto of dto.items) {
        const variation = await manager.findOne(ProductVariation, {
          where: { variationID: itemDto.variationID },
        });
        if (!variation) {
          throw new NotFoundException(
            `Variación con ID ${itemDto.variationID} no encontrada`,
          );
        }

        const subtotal = this.toMoney(itemDto.unitPrice * itemDto.quantity);
        const purchaseOrderItem = manager.create(PurchaseOrderItem, {
          purchaseOrderID: savedOrder.purchaseOrderID,
          variationID: itemDto.variationID,
          unitPrice: itemDto.unitPrice,
          subtotal,
          quantityRequested: itemDto.quantity,
          quantityReceived: 0,
        });
        itemsToSave.push(purchaseOrderItem);
      }

      await manager.save(itemsToSave);

      const totals = this.calculateTotals(itemsToSave, discount);
      savedOrder.subtotal = totals.subtotal;
      savedOrder.netTotal = totals.net;
      savedOrder.tax = totals.tax;
      savedOrder.total = totals.total;
      savedOrder.totalProducts = itemsToSave.reduce(
        (acc, item) => acc + item.quantityRequested,
        0,
      );

      await manager.save(savedOrder);
      return this.findOne(savedOrder.purchaseOrderID);
    });
  }

  findAll(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      relations: ['store', 'items', 'items.variation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { purchaseOrderID: id },
      relations: ['store', 'items', 'items.variation'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Orden de compra con ID ${id} no encontrada`);
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.dataSource.transaction(async (manager) => {
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { purchaseOrderID: id },
        relations: ['items'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Orden de compra con ID ${id} no encontrada`,
        );
      }

      if (dto.storeID) {
        const store = await manager.findOne(Store, {
          where: { storeID: dto.storeID },
        });
        if (!store) {
          throw new NotFoundException(
            `Tienda con ID ${dto.storeID} no encontrada`,
          );
        }
        purchaseOrder.storeID = dto.storeID;
      }

      if (dto.paymentStatus) {
        purchaseOrder.paymentStatus = dto.paymentStatus;
      }

      if (dto.dueDate) {
        purchaseOrder.dueDate = new Date(dto.dueDate);
      }

      if (dto.dteNumber !== undefined) {
        purchaseOrder.dteNumber = dto.dteNumber ?? null;
      }

      if (dto.isThirdParty !== undefined) {
        purchaseOrder.isThirdParty = dto.isThirdParty;
      }

      if (dto.discount !== undefined) {
        purchaseOrder.discount = dto.discount;
      }

      const totals = this.calculateTotals(
        purchaseOrder.items,
        purchaseOrder.discount,
      );
      purchaseOrder.subtotal = totals.subtotal;
      purchaseOrder.netTotal = totals.net;
      purchaseOrder.tax = totals.tax;
      purchaseOrder.total = totals.total;

      await manager.save(purchaseOrder);
      return this.findOne(id);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
  ): Promise<PurchaseOrder> {
    return this.dataSource.transaction(async (manager) => {
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { purchaseOrderID: id },
        relations: ['items'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Orden de compra con ID ${id} no encontrada`,
        );
      }

      const previousStatus = purchaseOrder.paymentStatus;
      const nextStatus = dto.status;

      // si no cambia el estado, no se toca stock
      if (previousStatus === nextStatus) {
        return this.findOne(id);
      }

      // Pasar a Pagado desde Pendiente o Anulado -> aplicar stock
      if (
        nextStatus === 'Pagado' &&
        (previousStatus === 'Pendiente' || previousStatus === 'Anulado')
      ) {
        await this.applyStockForOrder(manager, purchaseOrder, 1);
      }

      // Salir de Pagado hacia Pendiente o Anulado -> revertir stock
      if (
        previousStatus === 'Pagado' &&
        (nextStatus === 'Pendiente' || nextStatus === 'Anulado')
      ) {
        await this.applyStockForOrder(manager, purchaseOrder, -1);
      }

      purchaseOrder.paymentStatus = nextStatus;
      await manager.save(purchaseOrder);
      return this.findOne(id);
    });
  }

  async verify(
    id: string,
    dto: VerifyPurchaseOrderDto,
  ): Promise<{ summary: Record<string, number>; order: PurchaseOrder }> {
    return this.dataSource.transaction(async (manager) => {
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { purchaseOrderID: id },
        relations: ['items'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Orden de compra con ID ${id} no encontrada`,
        );
      }

      const itemsMap = new Map<string, PurchaseOrderItem>();
      for (const item of purchaseOrder.items) {
        itemsMap.set(item.variationID, item);
      }

      const scannedVariations = new Set<string>();
      const summary = {
        completos: 0,
        faltantes: 0,
        deMas: 0,
        noEsperados: 0,
      };

      for (const scan of dto.items) {
        scannedVariations.add(scan.variationID);

        const existing = itemsMap.get(scan.variationID);
        const received = scan.quantityReceived;
        const unitPrice = scan.unitPrice ?? existing?.unitPrice ?? 0;

        if (existing) {
          const diff = received - existing.quantityRequested;
          if (diff === 0) summary.completos += 1;
          if (diff > 0) summary.deMas += diff;
          if (diff < 0) summary.faltantes += Math.abs(diff);

          const previousReceived = existing.quantityReceived ?? 0;
          const delta = received - previousReceived;
          if (delta < 0) {
            throw new BadRequestException(
              'No se puede reducir la cantidad ya recibida en la verificación',
            );
          }

          existing.quantityReceived = received;
          if (received > existing.quantityRequested) {
            existing.quantityRequested = received;
          }
          existing.unitPrice = unitPrice;
          existing.subtotal = this.toMoney(
            existing.unitPrice * existing.quantityRequested,
          );
          await manager.save(existing);
        } else {
          summary.noEsperados += received;

          const newItem = manager.create(PurchaseOrderItem, {
            purchaseOrderID: purchaseOrder.purchaseOrderID,
            variationID: scan.variationID,
            unitPrice,
            quantityRequested: received,
            quantityReceived: received,
            subtotal: this.toMoney(unitPrice * received),
          });
          const saved = await manager.save(newItem);
          itemsMap.set(scan.variationID, saved);
        }
      }

      // Marcar faltantes de los no escaneados
      for (const item of itemsMap.values()) {
        if (!scannedVariations.has(item.variationID)) {
          const missing = item.quantityRequested - (item.quantityReceived ?? 0);
          if (missing > 0) {
            summary.faltantes += missing;
          }
        }
      }

      const items = Array.from(itemsMap.values());
      const totals = this.calculateTotals(items, purchaseOrder.discount);
      purchaseOrder.subtotal = totals.subtotal;
      purchaseOrder.netTotal = totals.net;
      purchaseOrder.tax = totals.tax;
      purchaseOrder.total = totals.total;
      purchaseOrder.totalProducts = items.reduce(
        (acc, item) => acc + item.quantityRequested,
        0,
      );

      await manager.save(purchaseOrder);

      const order = await this.findOne(id);
      return { summary, order };
    });
  }
}
