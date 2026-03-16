import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ImageCategory } from '@gallery/shared';
import { PhotographerEntity } from '../photographers/photographer.entity';
import { ImagePrintOptionEntity } from './image-print-option.entity';

@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'photographer_id' })
  photographerId!: number;

  @ManyToOne(() => PhotographerEntity, (p) => p.images)
  @JoinColumn({ name: 'photographer_id' })
  photographer!: PhotographerEntity;

  @Column({ name: 'file_path' })
  filePath!: string;

  @Column({ name: 'thumbnail_path' })
  thumbnailPath!: string;

  @Column({ name: 'watermark_path' })
  watermarkPath!: string;

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'enum', enum: ImageCategory, default: ImageCategory.Other })
  category!: ImageCategory;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ name: 'blur_hash', type: 'varchar', nullable: true })
  blurHash!: string | null;

  @Column({ name: 'print_enabled', default: false })
  printEnabled!: boolean;

  @Column({ name: 'print_limit', type: 'int', nullable: true })
  printLimit!: number | null;

  @Column({ name: 'prints_sold', type: 'int', default: 0 })
  printsSold!: number;

  @OneToMany(() => ImagePrintOptionEntity, (opt) => opt.image, { cascade: true })
  printOptions!: ImagePrintOptionEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
