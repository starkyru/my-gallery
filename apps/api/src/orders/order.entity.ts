import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { OrderStatus, PaymentMethod } from '@gallery/shared';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'customer_email' })
  customerEmail!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod!: PaymentMethod | null;

  @Column({ name: 'payment_id', nullable: true })
  paymentId!: string | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  items!: OrderItemEntity[];

  @Column({ name: 'shipping_name', nullable: true })
  shippingName!: string | null;

  @Column({ name: 'shipping_address1', nullable: true })
  shippingAddress1!: string | null;

  @Column({ name: 'shipping_address2', nullable: true })
  shippingAddress2!: string | null;

  @Column({ name: 'shipping_city', nullable: true })
  shippingCity!: string | null;

  @Column({ name: 'shipping_state', nullable: true })
  shippingState!: string | null;

  @Column({ name: 'shipping_postal_code', nullable: true })
  shippingPostalCode!: string | null;

  @Column({ name: 'shipping_country', nullable: true })
  shippingCountry!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
