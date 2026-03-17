import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ProtectedGalleryEntity } from './protected-gallery.entity';
import { ImageEntity } from '../images/image.entity';

@Entity('protected_gallery_images')
@Unique(['protectedGalleryId', 'imageId'])
export class ProtectedGalleryImageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'protected_gallery_id' })
  protectedGalleryId!: number;

  @ManyToOne(() => ProtectedGalleryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'protected_gallery_id' })
  protectedGallery!: ProtectedGalleryEntity;

  @Column({ name: 'image_id' })
  imageId!: number;

  @ManyToOne(() => ImageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image!: ImageEntity;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
