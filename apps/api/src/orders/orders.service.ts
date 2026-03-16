import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';
import { ImagesService } from '../images/images.service';
import { OrderStatus } from '@gallery/shared';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly itemRepo: Repository<OrderItemEntity>,
    private readonly imagesService: ImagesService,
  ) {}

  async create(customerEmail: string, imageIds: number[]) {
    const images = await Promise.all(imageIds.map((id) => this.imagesService.findOne(id)));
    const total = images.reduce((sum, img) => sum + Number(img.price), 0);

    const order = this.orderRepo.create({
      customerEmail,
      total,
      status: OrderStatus.Pending,
      items: images.map((img) => this.itemRepo.create({ imageId: img.id, price: img.price })),
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

  async getDownloadLinks(orderId: number) {
    const order = await this.findOne(orderId);
    if (order.status !== OrderStatus.Paid && order.status !== OrderStatus.Completed) {
      throw new NotFoundException('Order not paid');
    }
    return order.items.map((item) => ({
      imageId: item.imageId,
      title: item.image?.title,
      downloadUrl: this.imagesService.generateDownloadUrl(item.imageId),
    }));
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
