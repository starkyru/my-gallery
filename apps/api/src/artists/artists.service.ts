import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  'bio',
  'avatarUrl',
  'portraitPath',
  'instagramUrl',
  'loginEnabled',
  'isActive',
  'createdAt',
];

@Injectable()
export class ArtistsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(ArtistEntity)
    private readonly repo: Repository<ArtistEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
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

  create(data: Partial<ArtistEntity>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<ArtistEntity>) {
    await this.findOne(id);
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
