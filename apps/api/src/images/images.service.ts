import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { ImageEntity } from './image.entity';
import { ImagePrintOptionEntity } from './image-print-option.entity';
import { ImageTagEntity } from '../tags/image-tag.entity';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'tiff'];

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(ImageEntity)
    private readonly repo: Repository<ImageEntity>,
    @InjectRepository(ImagePrintOptionEntity)
    private readonly printOptionRepo: Repository<ImagePrintOptionEntity>,
    @InjectRepository(ImageTagEntity)
    private readonly imageTagRepo: Repository<ImageTagEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  private mapTags(image: ImageEntity, stripAdmin = true) {
    const tags = (image.imageTags ?? []).map((it) => ({
      id: it.tag.id,
      name: it.tag.name,
      slug: it.tag.slug,
    }));
    const { imageTags, adminNote, ...rest } = image as ImageEntity & { imageTags?: unknown };
    void imageTags;
    if (stripAdmin) {
      void adminNote;
      return { ...rest, tags };
    }
    return { ...rest, adminNote, tags };
  }

  private getSigningKey(): string {
    return (
      this.configService.get<string>('DOWNLOAD_SIGNING_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'dev-secret-change-me'
    );
  }

  async findAll(query?: {
    category?: string;
    featured?: boolean;
    artistId?: number;
    projectId?: number;
    tags?: string[];
    search?: string;
  }) {
    const qb = this.repo
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.artist', 'artist')
      .leftJoinAndSelect('image.printOptions', 'printOptions')
      .leftJoinAndSelect('image.project', 'project')
      .leftJoinAndSelect('image.imageTags', 'imageTags')
      .leftJoinAndSelect('imageTags.tag', 'tag')
      .andWhere('image.isArchived = false')
      .andWhere('artist.isActive = true')
      .andWhere('image.id NOT IN (SELECT pgi.image_id FROM protected_gallery_images pgi)')
      .orderBy('image.sortOrder', 'ASC')
      .addOrderBy('image.createdAt', 'DESC');

    if (query?.category) {
      qb.andWhere('image.category = :category', { category: query.category });
    }
    if (query?.featured !== undefined) {
      qb.andWhere('image.isFeatured = :featured', { featured: query.featured });
    }
    if (query?.artistId !== undefined) {
      qb.andWhere('image.artistId = :artistId', { artistId: query.artistId });
    }
    if (query?.projectId !== undefined) {
      qb.andWhere('image.projectId = :projectId', { projectId: query.projectId });
    }
    if (query?.tags && query.tags.length > 0) {
      qb.andWhere(
        'image.id IN (SELECT it.image_id FROM image_tags it INNER JOIN tags t ON t.id = it.tag_id WHERE t.slug IN (:...tagSlugs))',
        { tagSlugs: query.tags },
      );
    }
    if (query?.search) {
      qb.andWhere(
        '(image.aiDescription ILIKE :search OR image.title ILIKE :search OR image.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const images = await qb.getMany();
    return images.map((img) => this.mapTags(img));
  }

  async findAllAdmin() {
    const images = await this.repo
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.artist', 'artist')
      .leftJoinAndSelect('image.printOptions', 'printOptions')
      .leftJoinAndSelect('image.project', 'project')
      .leftJoinAndSelect('image.imageTags', 'imageTags')
      .leftJoinAndSelect('imageTags.tag', 'tag')
      .orderBy('image.sortOrder', 'ASC')
      .addOrderBy('image.createdAt', 'DESC')
      .getMany();
    return images.map((img) => this.mapTags(img, false));
  }

  async bulkAction(ids: number[], action: string, value?: string) {
    if (ids.length === 0) return;
    switch (action) {
      case 'archive':
        await this.repo
          .createQueryBuilder()
          .update()
          .set({ isArchived: true })
          .whereInIds(ids)
          .execute();
        break;
      case 'unarchive':
        await this.repo
          .createQueryBuilder()
          .update()
          .set({ isArchived: false })
          .whereInIds(ids)
          .execute();
        break;
      case 'setCategory':
        if (value) {
          await this.repo
            .createQueryBuilder()
            .update()
            .set({ category: value })
            .whereInIds(ids)
            .execute();
        }
        break;
      case 'setProject': {
        const projectId = value ? Number(value) : null;
        if (projectId !== null && isNaN(projectId)) {
          throw new BadRequestException('Invalid project ID');
        }
        await this.repo.createQueryBuilder().update().set({ projectId }).whereInIds(ids).execute();
        break;
      }
    }
  }

  async findOne(id: number) {
    const image = await this.repo.findOne({
      where: { id },
      relations: ['artist', 'printOptions', 'imageTags', 'imageTags.tag'],
    });
    if (!image) throw new NotFoundException('Image not found');
    return this.mapTags(image, false);
  }

  async findOnePublic(id: number) {
    const image = await this.repo
      .createQueryBuilder('image')
      .select([
        'image.id',
        'image.title',
        'image.description',
        'image.price',
        'image.artistId',
        'image.thumbnailPath',
        'image.watermarkPath',
        'image.width',
        'image.height',
        'image.category',
        'image.isFeatured',
        'image.sortOrder',
        'image.blurHash',
        'image.printEnabled',
        'image.printLimit',
        'image.printsSold',
        'image.projectId',
        'image.allowDownloadOriginal',
        'image.isArchived',
        'image.createdAt',
      ])
      .leftJoinAndSelect('image.artist', 'artist')
      .leftJoinAndSelect('image.printOptions', 'printOptions')
      .leftJoinAndSelect('image.imageTags', 'imageTags')
      .leftJoinAndSelect('imageTags.tag', 'tag')
      .where('image.id = :id', { id })
      .getOne();
    if (!image) throw new NotFoundException('Image not found');
    return this.mapTags(image);
  }

  async upload(file: Express.Multer.File, data: Partial<ImageEntity>) {
    this.logger.log(
      `Upload started: ${file?.originalname}, size=${file?.size}, hasBuffer=${!!file?.buffer}`,
    );
    if (!file?.buffer) {
      throw new BadRequestException('File buffer is missing — check Multer storage config');
    }
    // Validate actual image content using sharp
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and TIFF images are allowed');
    }

    const originalId = crypto.randomUUID();
    const previewId = crypto.randomUUID();
    const ext = '.' + (metadata.format === 'jpeg' ? 'jpg' : metadata.format);

    const dirs = ['originals', 'thumbnails', 'medium', 'watermarked'].map((d) =>
      path.join(this.uploadDir, d),
    );
    await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));

    const originalPath = path.join(this.uploadDir, 'originals', `${originalId}${ext}`);
    const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${previewId}.webp`);
    const mediumPath = path.join(this.uploadDir, 'medium', `${previewId}.webp`);
    const watermarkPath = path.join(this.uploadDir, 'watermarked', `${previewId}.webp`);

    await fs.writeFile(originalPath, file.buffer);

    await Promise.all([
      sharp(file.buffer).resize(400).webp({ quality: 80 }).toFile(thumbnailPath),
      sharp(file.buffer).resize(1200).webp({ quality: 85 }).toFile(mediumPath),
      this.createWatermarked(file.buffer, watermarkPath),
    ]);

    const image = this.repo.create({
      ...data,
      filePath: `originals/${originalId}${ext}`,
      thumbnailPath: `thumbnails/${previewId}.webp`,
      watermarkPath: `watermarked/${previewId}.webp`,
      width: metadata.width || 0,
      height: metadata.height || 0,
    });

    try {
      return await this.repo.save(image);
    } catch (err) {
      this.logger.error(`Failed to save image: ${err}`);
      throw err;
    }
  }

  private async createWatermarked(buffer: Buffer, outputPath: string) {
    const targetWidth = 1200;
    const meta = await sharp(buffer).metadata();
    const origWidth = meta.width || targetWidth;
    const origHeight = meta.height || targetWidth;
    const resizedHeight = Math.round((origHeight / origWidth) * targetWidth);

    const fontSize = Math.max(16, Math.round(targetWidth * 0.03));
    const svgWidth = fontSize * 2;
    const svgHeight = resizedHeight;
    const cx = svgWidth / 2;
    const cy = svgHeight / 2;
    const svg = Buffer.from(
      `<svg width="${svgWidth}" height="${svgHeight}">
        <text x="${cx}" y="${cy}" font-family="sans-serif" font-size="${fontSize}"
          fill="white" fill-opacity="0.25" text-anchor="middle" dominant-baseline="middle"
          transform="rotate(-90, ${cx}, ${cy})">
          gallery.ilia.to
        </text>
      </svg>`,
    );

    await sharp(buffer)
      .resize(targetWidth)
      .composite([
        { input: svg, gravity: 'west' },
        { input: svg, gravity: 'east' },
      ])
      .webp({ quality: 85 })
      .toFile(outputPath);
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.findOne(id);
    const { printOptions, tagIds, ...imageData } = data;
    // If artist changes, clear projectId (project belongs to old artist)
    if (imageData.artistId !== undefined && imageData.artistId !== existing.artistId) {
      imageData.projectId = null;
    }
    if (Object.keys(imageData).length > 0) {
      await this.repo.update(id, imageData);
    }
    if (printOptions !== undefined) {
      await this.printOptionRepo.delete({ imageId: id });
      const opts = printOptions as { sku: string; description: string; price: number }[];
      if (opts.length > 0) {
        const entities = opts.map((opt) => this.printOptionRepo.create({ ...opt, imageId: id }));
        await this.printOptionRepo.save(entities);
      }
    }
    if (tagIds !== undefined) {
      await this.imageTagRepo.delete({ imageId: id });
      const ids = tagIds as number[];
      if (ids.length > 0) {
        const entities = ids.map((tagId) => this.imageTagRepo.create({ imageId: id, tagId }));
        await this.imageTagRepo.save(entities);
      }
    }
    return this.findOne(id);
  }

  async updateAiDescription(id: number, aiDescription: string) {
    await this.repo.update(id, { aiDescription });
  }

  async updateSortOrder(updates: { id: number; sortOrder: number }[]) {
    await Promise.all(updates.map((u) => this.repo.update(u.id, { sortOrder: u.sortOrder })));
  }

  async remove(id: number) {
    const image = await this.findOne(id);
    const paths = [image.filePath, image.thumbnailPath, image.watermarkPath].map((p) =>
      path.join(this.uploadDir, p),
    );
    await Promise.all(paths.map((p) => fs.unlink(p).catch(() => {})));
    await this.repo.delete(id);
  }

  async incrementPrintsSold(imageId: number, printLimit: number | null): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder()
      .update()
      .set({ printsSold: () => 'prints_sold + 1' })
      .where('id = :id', { id: imageId });

    if (printLimit !== null) {
      qb.andWhere('prints_sold < :limit', { limit: printLimit });
    }

    const result = await qb.execute();
    return (result.affected ?? 0) > 0;
  }

  generateDownloadUrl(imageId: number): string {
    const secret = this.getSigningKey();
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const data = `${imageId}:${expires}`;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    const publicUrl = this.configService.get('PUBLIC_URL', 'http://localhost:4000');
    return `${publicUrl}/api/images/${imageId}/download?expires=${expires}&sig=${signature}`;
  }

  verifyDownloadSignature(imageId: number, expires: string, signature: string): boolean {
    if (Date.now() > parseInt(expires)) return false;
    const secret = this.getSigningKey();
    const data = `${imageId}:${expires}`;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }
}
