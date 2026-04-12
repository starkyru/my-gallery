import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ArtistEntity } from '../artists/artist.entity';
import { ProjectEntity } from '../projects/project.entity';
import { ImagePrintOptionEntity } from './image-print-option.entity';
import { ImageTagEntity } from '../tags/image-tag.entity';
import { ImageMediaTypeEntity } from '../media-types/image-media-type.entity';
import { ImagePaintTypeEntity } from '../paint-types/image-paint-type.entity';

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

  @Column({ name: 'artist_id' })
  artistId!: number;

  @ManyToOne(() => ArtistEntity, (a) => a.images)
  @JoinColumn({ name: 'artist_id' })
  artist!: ArtistEntity;

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

  @Column({ type: 'varchar', default: 'other' })
  category!: string;

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

  @Column({ name: 'per_option_limits', type: 'boolean', default: false })
  perOptionLimits!: boolean;

  @OneToMany(() => ImagePrintOptionEntity, (opt) => opt.image, { cascade: true })
  printOptions!: ImagePrintOptionEntity[];

  @Column({ name: 'project_id', type: 'int', nullable: true })
  projectId!: number | null;

  @ManyToOne(() => ProjectEntity, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity | null;

  @OneToMany(() => ImageTagEntity, (it) => it.image)
  imageTags!: ImageTagEntity[];

  @OneToMany(() => ImageMediaTypeEntity, (imt) => imt.image)
  imageMediaTypes!: ImageMediaTypeEntity[];

  @OneToMany(() => ImagePaintTypeEntity, (ipt) => ipt.image)
  imagePaintTypes!: ImagePaintTypeEntity[];

  @Column({ name: 'ai_description', type: 'text', nullable: true })
  aiDescription!: string | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote!: string | null;

  @Column({ name: 'shot_date', type: 'varchar', nullable: true })
  shotDate!: string | null;

  @Column({ type: 'varchar', nullable: true })
  place!: string | null;

  @Column({ name: 'original_file_name', type: 'varchar', nullable: true })
  originalFileName!: string | null;

  @Column({ name: 'size_width_cm', type: 'decimal', precision: 6, scale: 1, nullable: true })
  sizeWidthCm!: number | null;

  @Column({ name: 'size_height_cm', type: 'decimal', precision: 6, scale: 1, nullable: true })
  sizeHeightCm!: number | null;

  @Column({ name: 'allow_download_original', default: false })
  allowDownloadOriginal!: boolean;

  @Column({ name: 'original_available', default: false })
  originalAvailable!: boolean;

  @Column({ name: 'weight_grams', type: 'int', nullable: true })
  weightGrams!: number | null;

  @Column({ name: 'is_archived', default: false })
  isArchived!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
