import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('service_configs')
export class ServiceConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  type!: string; // 'payment' | 'fulfillment'

  @Column({ type: 'varchar', unique: true })
  provider!: string;

  @Column({ name: 'display_name', type: 'varchar' })
  displayName!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'jsonb', default: [] })
  skus!: { sku: string; description: string; price?: string }[];

  @Column({ type: 'boolean', default: true })
  sandbox!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
