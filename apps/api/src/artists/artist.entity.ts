import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ImageEntity } from '../images/image.entity';
import { ProjectEntity } from '../projects/project.entity';

@Entity('artists')
export class ArtistEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'portrait_path', type: 'varchar', nullable: true })
  portraitPath!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'login_enabled', type: 'boolean', default: false })
  loginEnabled!: boolean;

  @Column({ name: 'instagram_url', type: 'varchar', nullable: true })
  instagramUrl!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => ImageEntity, (image) => image.artist)
  images!: ImageEntity[];

  @OneToMany(() => ProjectEntity, (p) => p.artist)
  projects!: ProjectEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
