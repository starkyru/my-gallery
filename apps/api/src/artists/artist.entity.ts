import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ImageEntity } from '../images/image.entity';

@Entity('artists')
export class ArtistEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'login_enabled', type: 'boolean', default: false })
  loginEnabled!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => ImageEntity, (image) => image.artist)
  images!: ImageEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
