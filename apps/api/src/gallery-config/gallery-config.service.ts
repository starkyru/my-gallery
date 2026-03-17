import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryConfigEntity } from './gallery-config.entity';

const DEFAULT_SETTINGS = { galleryName: 'Gallery' };

@Injectable()
export class GalleryConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(GalleryConfigEntity)
    private readonly repo: Repository<GalleryConfigEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(this.repo.create({ settings: DEFAULT_SETTINGS }));
    }
  }

  async get(): Promise<Record<string, unknown>> {
    const row = await this.repo.findOne({ where: {} });
    return row?.settings ?? DEFAULT_SETTINGS;
  }

  async update(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    let row = await this.repo.findOne({ where: {} });
    if (!row) {
      row = this.repo.create({ settings: DEFAULT_SETTINGS });
    }
    row.settings = { ...row.settings, ...data };
    await this.repo.save(row);
    return row.settings;
  }
}
