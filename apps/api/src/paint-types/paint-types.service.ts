import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaintTypeEntity } from './paint-type.entity';
import { ImagePaintTypeEntity } from './image-paint-type.entity';

@Injectable()
export class PaintTypesService {
  constructor(
    @InjectRepository(PaintTypeEntity)
    private readonly repo: Repository<PaintTypeEntity>,
    @InjectRepository(ImagePaintTypeEntity)
    private readonly imagePaintTypeRepo: Repository<ImagePaintTypeEntity>,
  ) {}

  async findAll() {
    const items = await this.repo
      .createQueryBuilder('paintType')
      .leftJoin(ImagePaintTypeEntity, 'ipt', 'ipt.paint_type_id = paintType.id')
      .addSelect('COUNT(ipt.id)', 'imageCount')
      .groupBy('paintType.id')
      .orderBy('paintType.sortOrder', 'ASC')
      .getRawAndEntities();

    return items.entities.map((item, i) => ({
      ...item,
      imageCount: Number(items.raw[i].imageCount) || 0,
    }));
  }

  async create(name: string, slug: string) {
    const maxOrder = await this.repo
      .createQueryBuilder('paintType')
      .select('MAX(paintType.sortOrder)', 'max')
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? -1) + 1;
    return this.repo.save(this.repo.create({ name, slug, sortOrder }));
  }

  async update(id: number, data: { name?: string; slug?: string; sortOrder?: number }) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Paint type not found');
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
    if (!item) throw new NotFoundException('Paint type not found');
    const imageCount = await this.imagePaintTypeRepo.count({ where: { paintTypeId: id } });
    if (imageCount > 0) {
      throw new BadRequestException('Cannot delete paint type with existing images');
    }
    await this.repo.delete(id);
  }

  async findOrCreateByName(name: string): Promise<PaintTypeEntity> {
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
