import { Injectable, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { ImageEntity } from '../images/image.entity';
import { ImageCategory } from '@gallery/shared';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      const seeds = Object.values(ImageCategory).map((slug, i) => {
        const name = slug.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        return this.repo.create({ name, slug, sortOrder: i });
      });
      await this.repo.save(seeds);
    }
  }

  async findAll() {
    const categories = await this.repo
      .createQueryBuilder('cat')
      .leftJoin(ImageEntity, 'img', 'img.category = cat.slug')
      .addSelect('COUNT(img.id)', 'imageCount')
      .groupBy('cat.id')
      .orderBy('cat.name', 'ASC')
      .getRawAndEntities();

    return categories.entities.map((cat, i) => ({
      ...cat,
      imageCount: Number(categories.raw[i].imageCount) || 0,
    }));
  }

  async create(name: string, slug: string) {
    const maxOrder = await this.repo
      .createQueryBuilder('cat')
      .select('MAX(cat.sortOrder)', 'max')
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? -1) + 1;
    return this.repo.save(this.repo.create({ name, slug, sortOrder }));
  }

  async update(id: number, data: Partial<CategoryEntity>) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const imageCount = await this.imageRepo.count({ where: { category: cat.slug } });
    if (imageCount > 0) {
      throw new BadRequestException('Cannot delete category with existing images');
    }
    await this.repo.delete(id);
  }
}
