import * as crypto from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';
import { ImagesService } from '../images/images.service';
import { OrderStatus, OrderItemType, ShippingAddress } from '@gallery/shared';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly itemRepo: Repository<OrderItemEntity>,
    private readonly imagesService: ImagesService,
    private readonly shippingService: ShippingService,
  ) {}

  async create(
    customerEmail: string,
    items: { imageId: number; type: OrderItemType; printSku?: string }[],
    shippingAddress?: ShippingAddress,
    shippingInfo?: {
      shippingRateId?: string;
      shippingCost?: number;
      shippingCarrier?: string;
      shippingService?: string;
    },
  ) {
    const orderItems: Partial<OrderItemEntity>[] = [];
    let total = 0;

    for (const item of items) {
      const image = await this.imagesService.findOne(item.imageId);

      if (item.type === OrderItemType.Print) {
        if (!image.printEnabled) {
          throw new BadRequestException(`Prints not available for "${image.title}"`);
        }
        if (!item.printSku) {
          throw new BadRequestException('Print SKU is required for print items');
        }
        const printOption = image.printOptions?.find((o) => o.sku === item.printSku);
        if (!printOption) {
          throw new BadRequestException(
            `Print option ${item.printSku} not found for "${image.title}"`,
          );
        }
        if (image.perOptionLimits) {
          if (printOption.printLimit !== null && printOption.soldCount >= printOption.printLimit) {
            throw new BadRequestException(
              `Print option "${printOption.description}" sold out for "${image.title}"`,
            );
          }
        } else if (image.printLimit !== null && image.printsSold >= image.printLimit) {
          throw new BadRequestException(`Print edition sold out for "${image.title}"`);
        }

        orderItems.push(
          this.itemRepo.create({
            imageId: image.id,
            price: printOption.price,
            type: OrderItemType.Print,
            printSku: item.printSku,
          }),
        );
        total += Number(printOption.price);
      } else if (item.type === OrderItemType.PhysicalOriginal) {
        if (!image.originalAvailable) {
          throw new BadRequestException(`Physical original not available for "${image.title}"`);
        }
        orderItems.push(
          this.itemRepo.create({
            imageId: image.id,
            price: image.price,
            type: OrderItemType.PhysicalOriginal,
          }),
        );
        total += Number(image.price);
      } else {
        if (!image.allowDownloadOriginal) {
          throw new BadRequestException(`Digital original not available for "${image.title}"`);
        }
        orderItems.push(
          this.itemRepo.create({
            imageId: image.id,
            price: image.price,
            type: OrderItemType.Original,
          }),
        );
        total += Number(image.price);
      }
    }

    const needsShipping = items.some(
      (i) => i.type === OrderItemType.Print || i.type === OrderItemType.PhysicalOriginal,
    );
    if (needsShipping && !shippingAddress) {
      throw new BadRequestException('Shipping address required for physical items');
    }

    // Verify shipping rate server-side (never trust client-provided cost)
    let shippingCost = 0;
    let verifiedCarrier: string | null = null;
    let verifiedService: string | null = null;
    let verifiedRateId: string | null = null;

    const hasPhysicalOriginals = items.some((i) => i.type === OrderItemType.PhysicalOriginal);
    if (hasPhysicalOriginals && shippingInfo?.shippingRateId) {
      const verifiedRate = this.shippingService.getVerifiedRate(shippingInfo.shippingRateId);
      if (!verifiedRate) {
        throw new BadRequestException(
          'Shipping rate has expired. Please recalculate shipping rates.',
        );
      }
      shippingCost = verifiedRate.rate;
      verifiedCarrier = verifiedRate.carrier;
      verifiedService = verifiedRate.service;
      verifiedRateId = verifiedRate.rateId;
    } else if (hasPhysicalOriginals) {
      throw new BadRequestException(
        'Shipping rate selection is required for physical original items',
      );
    }

    total += shippingCost;

    const order = this.orderRepo.create({
      customerEmail,
      total,
      status: OrderStatus.Pending,
      accessToken: crypto.randomUUID(),
      items: orderItems as OrderItemEntity[],
      ...(shippingAddress && {
        shippingName: shippingAddress.name,
        shippingAddress1: shippingAddress.address1,
        shippingAddress2: shippingAddress.address2 || null,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingPostalCode: shippingAddress.postalCode,
        shippingCountry: shippingAddress.country,
      }),
      ...(shippingCost > 0 && {
        shippingCost,
        shippingCarrier: verifiedCarrier,
        shippingService: verifiedService,
        shippingRateId: verifiedRateId,
      }),
    });

    return this.orderRepo.save(order);
  }

  findAll(status?: OrderStatus) {
    const where = status ? { status } : {};
    return this.orderRepo.find({
      where,
      relations: ['items', 'items.image'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.image'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findOneSecure(id: number, token?: string, isAdmin?: boolean) {
    const order = await this.findOne(id);
    if (!isAdmin && order.accessToken !== token) {
      throw new ForbiddenException('Invalid or missing order access token');
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus, paymentId?: string, paymentMethod?: string) {
    const order = await this.findOne(id);
    order.status = status;
    if (paymentId) order.paymentId = paymentId;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    return this.orderRepo.save(order);
  }

  async updateItemFulfillment(
    itemId: number,
    fulfillmentOrderId: string,
    fulfillmentProvider: string,
  ) {
    await this.itemRepo.update(itemId, { fulfillmentOrderId, fulfillmentProvider });
  }

  async getDownloadLinks(orderId: number, token?: string, isAdmin?: boolean) {
    const order = await this.findOneSecure(orderId, token, isAdmin);
    if (order.status !== OrderStatus.Paid && order.status !== OrderStatus.Completed) {
      throw new NotFoundException('Order not paid');
    }

    return order.items.map((item) => {
      if (item.type === OrderItemType.Print) {
        return {
          imageId: item.imageId,
          title: item.image?.title,
          type: OrderItemType.Print,
          printSku: item.printSku,
          fulfillmentOrderId: item.fulfillmentOrderId,
          fulfillmentProvider: item.fulfillmentProvider,
          status: item.fulfillmentOrderId ? 'Print order submitted' : 'Processing',
        };
      }
      if (item.type === OrderItemType.PhysicalOriginal) {
        return {
          imageId: item.imageId,
          title: item.image?.title,
          type: OrderItemType.PhysicalOriginal,
          status: 'Artwork will be shipped',
        };
      }
      return {
        imageId: item.imageId,
        title: item.image?.title,
        type: OrderItemType.Original,
        downloadUrl: this.imagesService.generateDownloadUrl(item.imageId),
      };
    });
  }

  async getStats() {
    const totalImages = await this.imagesService.findAll();
    const orders = await this.orderRepo.find();
    const paidOrders = orders.filter(
      (o) => o.status === OrderStatus.Paid || o.status === OrderStatus.Completed,
    );
    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      totalImages: totalImages.length,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      revenue,
    };
  }
}
