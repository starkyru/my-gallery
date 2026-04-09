import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PaintTypeEntity } from './paint-type.entity';
import { ImageEntity } from '../images/image.entity';

@Entity('image_paint_types')
@Unique(['imageId', 'paintTypeId'])
export class ImagePaintTypeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'image_id' })
  imageId!: number;

  @ManyToOne(() => ImageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image!: ImageEntity;

  @Column({ name: 'paint_type_id' })
  paintTypeId!: number;

  @ManyToOne(() => PaintTypeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paint_type_id' })
  paintType!: PaintTypeEntity;
}
