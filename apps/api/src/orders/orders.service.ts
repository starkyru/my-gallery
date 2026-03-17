import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';
import { ImagesService } from '../images/images.service';
import { OrderStatus, OrderItemType, ShippingAddress } from '@gallery/shared';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly itemRepo: Repository<OrderItemEntity>,
    private readonly imagesService: ImagesService,
  ) {}

  async create(
    customerEmail: string,
    items: { imageId: number; type: OrderItemType; printSku?: string }[],
    shippingAddress?: ShippingAddress,
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
        if (image.printLimit !== null && image.printsSold >= image.printLimit) {
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
      } else {
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

    const hasPrintItems = items.some((i) => i.type === OrderItemType.Print);
    if (hasPrintItems && !shippingAddress) {
      throw new BadRequestException('Shipping address required for print orders');
    }

    const order = this.orderRepo.create({
      customerEmail,
      total,
      status: OrderStatus.Pending,
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

  async updateStatus(id: number, status: OrderStatus, paymentId?: string, paymentMethod?: string) {
    const order = await this.findOne(id);
    order.status = status;
    if (paymentId) order.paymentId = paymentId;
    if (paymentMethod) order.paymentMethod = paymentMethod as any;
    return this.orderRepo.save(order);
  }

  async updateItemFulfillment(
    itemId: number,
    fulfillmentOrderId: string,
    fulfillmentProvider: string,
  ) {
    await this.itemRepo.update(itemId, { fulfillmentOrderId, fulfillmentProvider });
  }

  async getDownloadLinks(orderId: number) {
    const order = await this.findOne(orderId);
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
