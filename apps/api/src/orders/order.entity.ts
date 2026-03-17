import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { OrderStatus } from '@gallery/shared';
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

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod!: string | null;

  @Column({ name: 'payment_id', type: 'varchar', nullable: true })
  paymentId!: string | null;

  @Column({ name: 'access_token', type: 'varchar', unique: true })
  accessToken!: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  items!: OrderItemEntity[];

  @Column({ name: 'shipping_name', type: 'varchar', nullable: true })
  shippingName!: string | null;

  @Column({ name: 'shipping_address1', type: 'varchar', nullable: true })
  shippingAddress1!: string | null;

  @Column({ name: 'shipping_address2', type: 'varchar', nullable: true })
  shippingAddress2!: string | null;

  @Column({ name: 'shipping_city', type: 'varchar', nullable: true })
  shippingCity!: string | null;

  @Column({ name: 'shipping_state', type: 'varchar', nullable: true })
  shippingState!: string | null;

  @Column({ name: 'shipping_postal_code', type: 'varchar', nullable: true })
  shippingPostalCode!: string | null;

  @Column({ name: 'shipping_country', type: 'varchar', nullable: true })
  shippingCountry!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
