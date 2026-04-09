import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaTypeEntity } from './media-type.entity';
import { ImageMediaTypeEntity } from './image-media-type.entity';

@Injectable()
export class MediaTypesService {
  constructor(
    @InjectRepository(MediaTypeEntity)
    private readonly repo: Repository<MediaTypeEntity>,
    @InjectRepository(ImageMediaTypeEntity)
    private readonly imageMediaTypeRepo: Repository<ImageMediaTypeEntity>,
  ) {}

  async findAll() {
    const items = await this.repo
      .createQueryBuilder('mediaType')
      .leftJoin(ImageMediaTypeEntity, 'imt', 'imt.media_type_id = mediaType.id')
      .addSelect('COUNT(imt.id)', 'imageCount')
      .groupBy('mediaType.id')
      .orderBy('mediaType.sortOrder', 'ASC')
      .getRawAndEntities();

    return items.entities.map((item, i) => ({
      ...item,
      imageCount: Number(items.raw[i].imageCount) || 0,
    }));
  }

  async create(name: string, slug: string) {
    const maxOrder = await this.repo
      .createQueryBuilder('mediaType')
      .select('MAX(mediaType.sortOrder)', 'max')
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? -1) + 1;
    return this.repo.save(this.repo.create({ name, slug, sortOrder }));
  }

  async update(id: number, data: { name?: string; slug?: string; sortOrder?: number }) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Media type not found');
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
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Media type not found');
    const imageCount = await this.imageMediaTypeRepo.count({ where: { mediaTypeId: id } });
    if (imageCount > 0) {
      throw new BadRequestException('Cannot delete media type with existing images');
    }
    await this.repo.delete(id);
  }

  async findOrCreateByName(name: string): Promise<MediaTypeEntity> {
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
