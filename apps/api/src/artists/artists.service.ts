import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { ArtistEntity } from './artist.entity';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'tiff'];
const SELECT_FIELDS: (keyof ArtistEntity)[] = [
  'id',
  'name',
  'slug',
  'bio',
  'avatarUrl',
  'portraitPath',
  'instagramUrl',
  'loginEnabled',
  'isActive',
  'createdAt',
];

@Injectable()
export class ArtistsService implements OnModuleInit {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(ArtistEntity)
    private readonly repo: Repository<ArtistEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  async onModuleInit() {
    const artists = await this.repo
      .createQueryBuilder('a')
      .where('a.slug IS NULL OR a.slug = :empty', { empty: '' })
      .getMany();
    for (const artist of artists) {
      artist.slug = await this.uniqueSlug(this.generateSlug(artist.name || 'artist'));
      await this.repo.save(artist);
    }
  }

  async findAll() {
    return this.repo.find({
      order: { name: 'ASC' },
      select: SELECT_FIELDS,
    });
  }

  async findAllActive() {
    return this.repo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      select: SELECT_FIELDS,
    });
  }

  async findOne(id: number) {
    const artist = await this.repo.findOne({
      where: { id },
      select: SELECT_FIELDS,
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  async findBySlug(slug: string) {
    const artist = await this.repo.findOne({
      where: { slug },
      select: SELECT_FIELDS,
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  async findByIdOrSlug(idOrSlug: string) {
    const id = Number(idOrSlug);
    if (!isNaN(id)) return this.findOne(id);
    return this.findBySlug(idOrSlug);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async uniqueSlug(base: string, excludeId?: number): Promise<string> {
    let slug = base;
    let suffix = 1;
    while (true) {
      const existing = await this.repo.findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${++suffix}`;
    }
  }

  async create(data: Partial<ArtistEntity>) {
    const slug = await this.uniqueSlug(this.generateSlug(data.name || 'artist'));
    return this.repo.save(this.repo.create({ ...data, slug }));
  }

  async update(id: number, data: Partial<ArtistEntity>) {
    await this.findOne(id);
    if (data.name) {
      data.slug = await this.uniqueSlug(this.generateSlug(data.name), id);
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number, requesterArtistId?: number) {
    if (requesterArtistId !== undefined && requesterArtistId === id) {
      throw new BadRequestException('Cannot delete your own artist profile');
    }
    const count = await this.repo.count();
    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last artist');
    }
    const artist = await this.findOne(id);

    if (artist.portraitPath) {
      const originalPath = path.join(this.uploadDir, artist.portraitPath);
      const thumbnailPath = path.join(
        this.uploadDir,
        artist.portraitPath.replace('portraits/originals/', 'portraits/thumbnails/'),
      );
      await Promise.all([
        fs.unlink(originalPath).catch(() => {}),
        fs.unlink(thumbnailPath).catch(() => {}),
      ]);
    }

    await this.repo.delete(id);
  }

  async uploadPortrait(id: number, file: Express.Multer.File): Promise<ArtistEntity> {
    const artist = await this.findOne(id);

    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and TIFF images are allowed');
    }

    const uuid = crypto.randomUUID();
    const dirs = ['portraits/originals', 'portraits/thumbnails'].map((d) =>
      path.join(this.uploadDir, d),
    );
    await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));

    const originalPath = path.join(this.uploadDir, 'portraits/originals', `${uuid}.webp`);
    const thumbnailPath = path.join(this.uploadDir, 'portraits/thumbnails', `${uuid}.webp`);

    await Promise.all([
      sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside' })
        .webp({ quality: 85 })
        .toFile(originalPath),
      sharp(file.buffer)
        .resize(400, 400, { fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(thumbnailPath),
    ]);

    // Delete old portrait files if replacing
    if (artist.portraitPath) {
      const oldOriginal = path.join(this.uploadDir, artist.portraitPath);
      const oldThumbnail = path.join(
        this.uploadDir,
        artist.portraitPath.replace('portraits/originals/', 'portraits/thumbnails/'),
      );
      await Promise.all([
        fs.unlink(oldOriginal).catch(() => {}),
        fs.unlink(oldThumbnail).catch(() => {}),
      ]);
    }

    await this.repo.update(id, { portraitPath: `portraits/originals/${uuid}.webp` });
    return this.findOne(id);
  }
}
