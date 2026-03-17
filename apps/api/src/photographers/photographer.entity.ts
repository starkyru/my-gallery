import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ImageEntity } from '../images/image.entity';

@Entity('photographers')
export class PhotographerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @OneToMany(() => ImageEntity, (image) => image.photographer)
  images!: ImageEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
