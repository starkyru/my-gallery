import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtistEntity } from './artist.entity';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(ArtistEntity)
    private readonly repo: Repository<ArtistEntity>,
  ) {}

  async findAll() {
    return this.repo.find({
      order: { name: 'ASC' },
      select: ['id', 'name', 'bio', 'avatarUrl', 'loginEnabled', 'isActive', 'createdAt'],
    });
  }

  async findAllActive() {
    return this.repo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'bio', 'avatarUrl', 'loginEnabled', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: number) {
    const artist = await this.repo.findOne({
      where: { id },
      select: ['id', 'name', 'bio', 'avatarUrl', 'loginEnabled', 'isActive', 'createdAt'],
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  create(data: Partial<ArtistEntity>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<ArtistEntity>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
