import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrderEntity } from './order.entity';
import { ImageEntity } from '../images/image.entity';
import { OrderItemType } from '@gallery/shared';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'order_id' })
  orderId!: number;

  @ManyToOne(() => OrderEntity, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'image_id' })
  imageId!: number;

  @ManyToOne(() => ImageEntity)
  @JoinColumn({ name: 'image_id' })
  image!: ImageEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'enum', enum: OrderItemType, default: OrderItemType.Original })
  type!: OrderItemType;

  @Column({ name: 'print_sku', type: 'varchar', nullable: true })
  printSku!: string | null;

  @Column({ name: 'prodigi_order_id', type: 'varchar', nullable: true })
  prodigiOrderId!: string | null;
}
