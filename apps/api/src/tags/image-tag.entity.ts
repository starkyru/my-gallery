import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TagEntity } from './tag.entity';
import { ImageEntity } from '../images/image.entity';

@Entity('image_tags')
@Unique(['imageId', 'tagId'])
export class ImageTagEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'image_id' })
  imageId!: number;

  @ManyToOne(() => ImageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image!: ImageEntity;

  @Column({ name: 'tag_id' })
  tagId!: number;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: TagEntity;
}
