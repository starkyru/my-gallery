import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ArtistEntity } from '../artists/artist.entity';

@Entity('projects')
@Unique(['artistId', 'slug'])
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  slug!: string;

  @Column({ name: 'artist_id' })
  artistId!: number;

  @ManyToOne(() => ArtistEntity, (a) => a.projects)
  @JoinColumn({ name: 'artist_id' })
  artist!: ArtistEntity;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
