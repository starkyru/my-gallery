import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { ImageEntity } from '../images/image.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
  ) {}

  async findAll(artistId?: number) {
    const qb = this.repo
      .createQueryBuilder('project')
      .leftJoin(ImageEntity, 'img', 'img.project_id = project.id')
      .addSelect('COUNT(img.id)', 'imageCount')
      .groupBy('project.id')
      .orderBy('project.sortOrder', 'ASC');

    if (artistId !== undefined) {
      qb.andWhere('project.artistId = :artistId', { artistId });
    }

    const result = await qb.getRawAndEntities();

    return result.entities.map((proj, i) => ({
      ...proj,
      imageCount: Number(result.raw[i].imageCount) || 0,
    }));
  }

  async create(artistId: number, name: string, slug: string) {
    const maxOrder = await this.repo
      .createQueryBuilder('project')
      .select('MAX(project.sortOrder)', 'max')
      .where('project.artistId = :artistId', { artistId })
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? -1) + 1;
    return this.repo.save(this.repo.create({ artistId, name, slug, sortOrder }));
  }

  async update(id: number, data: Partial<ProjectEntity>) {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    const imageCount = await this.imageRepo.count({ where: { projectId: id } });
    if (imageCount > 0) {
      throw new BadRequestException('Cannot delete project with existing images');
    }
    await this.repo.delete(id);
  }
}
