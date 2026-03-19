import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryConfigEntity } from './gallery-config.entity';
import type { UpdateGalleryConfigDto } from './update-gallery-config.dto';
import type { GalleryConfig } from '@gallery/shared';

const DEFAULT_SETTINGS: GalleryConfig = { galleryName: 'Gallery', subtitle: '', siteUrl: '' };

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

  async get(): Promise<GalleryConfig> {
    const row = await this.repo.findOne({ where: {} });
    return { ...DEFAULT_SETTINGS, ...row?.settings };
  }

  async update(data: UpdateGalleryConfigDto): Promise<GalleryConfig> {
    let row = await this.repo.findOne({ where: {} });
    if (!row) {
      row = this.repo.create({ settings: DEFAULT_SETTINGS });
    }
    row.settings = { ...row.settings, ...data };
    await this.repo.save(row);
    return row.settings;
  }
}
