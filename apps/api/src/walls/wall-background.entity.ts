import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('wall_backgrounds')
export class WallBackgroundEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ name: 'image_path', type: 'varchar' })
  imagePath!: string;

  @Column({ name: 'thumbnail_path', type: 'varchar' })
  thumbnailPath!: string;

  @Column({ name: 'wall_width_cm', type: 'decimal', precision: 6, scale: 1, nullable: true })
  wallWidthCm!: number | null;

  @Column({ name: 'wall_height_cm', type: 'decimal', precision: 6, scale: 1, nullable: true })
  wallHeightCm!: number | null;

  @Column({ name: 'anchor_x', type: 'decimal', precision: 5, scale: 4, default: 0.5 })
  anchorX!: number;

  @Column({ name: 'anchor_y', type: 'decimal', precision: 5, scale: 4, default: 0.5 })
  anchorY!: number;

  @Column({ name: 'image_width', type: 'int' })
  imageWidth!: number;

  @Column({ name: 'image_height', type: 'int' })
  imageHeight!: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
