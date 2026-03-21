import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from './tag.entity';
import { ImageTagEntity } from './image-tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly repo: Repository<TagEntity>,
    @InjectRepository(ImageTagEntity)
    private readonly imageTagRepo: Repository<ImageTagEntity>,
  ) {}

  async findAll() {
    const tags = await this.repo
      .createQueryBuilder('tag')
      .leftJoin(ImageTagEntity, 'it', 'it.tag_id = tag.id')
      .addSelect('COUNT(it.id)', 'imageCount')
      .groupBy('tag.id')
      .orderBy('tag.sortOrder', 'ASC')
      .getRawAndEntities();

    return tags.entities.map((tag, i) => ({
      ...tag,
      imageCount: Number(tags.raw[i].imageCount) || 0,
    }));
  }

  async create(name: string, slug: string) {
    const maxOrder = await this.repo
      .createQueryBuilder('tag')
      .select('MAX(tag.sortOrder)', 'max')
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? -1) + 1;
    return this.repo.save(this.repo.create({ name, slug, sortOrder }));
  }

  async update(id: number, data: { name?: string; slug?: string; sortOrder?: number }) {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (Object.keys(updateData).length > 0) {
      await this.repo.update(id, updateData);
    }
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    const imageCount = await this.imageTagRepo.count({ where: { tagId: id } });
    if (imageCount > 0) {
      throw new BadRequestException('Cannot delete tag with existing images');
    }
    await this.repo.delete(id);
  }

  async findOrCreateByName(name: string): Promise<TagEntity> {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const existing = await this.repo.findOne({ where: { slug } });
    if (existing) return existing;
    return this.create(name, slug);
  }
}
