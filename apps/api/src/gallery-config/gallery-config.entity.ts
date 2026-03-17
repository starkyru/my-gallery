import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('gallery_config')
export class GalleryConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'jsonb', default: '{}' })
  settings!: Record<string, unknown>;
}
