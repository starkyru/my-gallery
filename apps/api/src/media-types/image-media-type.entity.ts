import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { MediaTypeEntity } from './media-type.entity';
import { ImageEntity } from '../images/image.entity';

@Entity('image_media_types')
@Unique(['imageId', 'mediaTypeId'])
export class ImageMediaTypeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'image_id' })
  imageId!: number;

  @ManyToOne(() => ImageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image!: ImageEntity;

  @Column({ name: 'media_type_id' })
  mediaTypeId!: number;

  @ManyToOne(() => MediaTypeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_type_id' })
  mediaType!: MediaTypeEntity;
}
