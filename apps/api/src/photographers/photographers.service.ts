import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotographerEntity } from './photographer.entity';

@Injectable()
export class PhotographersService {
  constructor(
    @InjectRepository(PhotographerEntity)
    private readonly repo: Repository<PhotographerEntity>,
  ) {}

  async findAll() {
    return this.repo.find({
      order: { name: 'ASC' },
      select: ['id', 'name', 'bio', 'avatarUrl', 'loginEnabled', 'createdAt'],
    });
  }

  async findOne(id: number) {
    const photographer = await this.repo.findOne({
      where: { id },
      select: ['id', 'name', 'bio', 'avatarUrl', 'loginEnabled', 'createdAt'],
    });
    if (!photographer) throw new NotFoundException('Photographer not found');
    return photographer;
  }

  create(data: Partial<PhotographerEntity>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<PhotographerEntity>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
