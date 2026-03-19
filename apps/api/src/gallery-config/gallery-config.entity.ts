import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { GalleryConfig } from '@gallery/shared';

@Entity('gallery_config')
export class GalleryConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'jsonb', default: '{}' })
  settings!: GalleryConfig;
}
