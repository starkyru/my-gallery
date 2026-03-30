import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ImageEntity } from './image.entity';

@Entity('image_print_options')
export class ImagePrintOptionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'image_id' })
  imageId!: number;

  @ManyToOne(() => ImageEntity, (image) => image.printOptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image!: ImageEntity;

  @Column({ type: 'varchar' })
  sku!: string;

  @Column({ type: 'varchar' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'width_cm', type: 'decimal', precision: 6, scale: 1, default: 0 })
  widthCm!: number;

  @Column({ name: 'height_cm', type: 'decimal', precision: 6, scale: 1, default: 0 })
  heightCm!: number;

  @Column({ name: 'fulfillment_provider', type: 'varchar', nullable: true })
  fulfillmentProvider!: string | null;
}
