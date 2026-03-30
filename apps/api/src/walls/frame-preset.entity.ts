import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('frame_presets')
export class FramePresetEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ name: 'border_color', type: 'varchar', default: '#000000' })
  borderColor!: string;

  @Column({ name: 'border_width_mm', type: 'decimal', precision: 5, scale: 1, default: 0 })
  borderWidthMm!: number;

  @Column({ name: 'mat_color', type: 'varchar', default: '#ffffff' })
  matColor!: string;

  @Column({ name: 'mat_width_mm', type: 'decimal', precision: 5, scale: 1, default: 0 })
  matWidthMm!: number;

  @Column({ name: 'shadow_enabled', type: 'boolean', default: true })
  shadowEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
