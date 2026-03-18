import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ProtectedGalleryEntity } from './protected-gallery.entity';
import { ProtectedGalleryImageEntity } from './protected-gallery-image.entity';
import { ImageEntity } from '../images/image.entity';

@Injectable()
export class ProtectedGalleriesService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(ProtectedGalleryEntity)
    private readonly galleryRepo: Repository<ProtectedGalleryEntity>,
    @InjectRepository(ProtectedGalleryImageEntity)
    private readonly joinRepo: Repository<ProtectedGalleryImageEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  private getSigningKey(): string {
    return (
      this.configService.get<string>('DOWNLOAD_SIGNING_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'dev-secret-change-me'
    );
  }

  private stripHash(gallery: ProtectedGalleryEntity) {
    return {
      id: gallery.id,
      name: gallery.name,
      slug: gallery.slug,
      isActive: gallery.isActive,
      createdAt: gallery.createdAt,
    };
  }

  async findAllAdmin() {
    const qb = this.galleryRepo
      .createQueryBuilder('gallery')
      .leftJoin(ProtectedGalleryImageEntity, 'pgi', 'pgi.protected_gallery_id = gallery.id')
      .addSelect('COUNT(pgi.id)', 'imageCount')
      .groupBy('gallery.id')
      .orderBy('gallery.createdAt', 'DESC');

    const result = await qb.getRawAndEntities();

    return result.entities.map((g, i) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      isActive: g.isActive,
      imageCount: Number(result.raw[i].imageCount) || 0,
      createdAt: g.createdAt,
    }));
  }

  async create(name: string, slug: string, password: string) {
    const existing = await this.galleryRepo.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Slug already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    const gallery = this.galleryRepo.create({ name, slug, passwordHash });
    const saved = await this.galleryRepo.save(gallery);
    return this.stripHash(saved);
  }

  async update(
    id: number,
    data: { name?: string; slug?: string; password?: string; isActive?: boolean },
  ) {
    const gallery = await this.galleryRepo.findOne({ where: { id } });
    if (!gallery) throw new NotFoundException('Gallery not found');

    if (data.slug && data.slug !== gallery.slug) {
      const existing = await this.galleryRepo.findOne({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Slug already in use');
    }

    const updateData: Partial<ProtectedGalleryEntity> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await this.galleryRepo.update(id, updateData);
    const updated = await this.galleryRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Gallery not found');
    return this.stripHash(updated);
  }

  async remove(id: number, deleteImages?: boolean) {
    const gallery = await this.galleryRepo.findOne({ where: { id } });
    if (!gallery) throw new NotFoundException('Gallery not found');

    const joinRows = await this.joinRepo.find({ where: { protectedGalleryId: id } });
    const imageIds = joinRows.map((r) => r.imageId);

    if (deleteImages && imageIds.length > 0) {
      const images = await this.imageRepo.find({ where: { id: In(imageIds) } });
      for (const image of images) {
        const paths = [image.filePath, image.thumbnailPath, image.watermarkPath].map((p) =>
          path.join(this.uploadDir, p),
        );
        await Promise.all(paths.map((p) => fs.unlink(p).catch(() => {})));
      }
      await this.imageRepo.delete(imageIds);
    } else if (imageIds.length > 0) {
      await this.imageRepo
        .createQueryBuilder()
        .update()
        .set({ isArchived: true })
        .whereInIds(imageIds)
        .execute();
    }

    await this.galleryRepo.delete(id);
  }

  async getGalleryImages(galleryId: number) {
    const gallery = await this.galleryRepo.findOne({ where: { id: galleryId } });
    if (!gallery) throw new NotFoundException('Gallery not found');

    const joinRows = await this.joinRepo.find({
      where: { protectedGalleryId: galleryId },
      order: { sortOrder: 'ASC' },
    });

    if (joinRows.length === 0) return [];

    const imageIds = joinRows.map((r) => r.imageId);
    const images = await this.imageRepo.find({
      where: { id: In(imageIds) },
      relations: ['artist'],
    });

    const imageMap = new Map(images.map((img) => [img.id, img]));
    return joinRows.map((r) => imageMap.get(r.imageId)).filter((img): img is ImageEntity => !!img);
  }

  async addImages(galleryId: number, imageIds: number[]) {
    const gallery = await this.galleryRepo.findOne({ where: { id: galleryId } });
    if (!gallery) throw new NotFoundException('Gallery not found');

    const maxOrder = await this.joinRepo
      .createQueryBuilder('pgi')
      .select('MAX(pgi.sortOrder)', 'max')
      .where('pgi.protectedGalleryId = :galleryId', { galleryId })
      .getRawOne();

    let nextOrder = (maxOrder?.max ?? -1) + 1;

    const rows = imageIds.map((imageId) => {
      const row = this.joinRepo.create({
        protectedGalleryId: galleryId,
        imageId,
        sortOrder: nextOrder++,
      });
      return row;
    });

    await this.joinRepo
      .createQueryBuilder()
      .insert()
      .into(ProtectedGalleryImageEntity)
      .values(rows)
      .orIgnore()
      .execute();
  }

  async removeImage(galleryId: number, imageId: number) {
    await this.joinRepo.delete({ protectedGalleryId: galleryId, imageId });
  }

  async authenticate(slug: string, password: string): Promise<string> {
    const gallery = await this.galleryRepo.findOne({ where: { slug } });
    if (!gallery || !gallery.isActive) {
      throw new UnauthorizedException('Invalid gallery or password');
    }

    const valid = await bcrypt.compare(password, gallery.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid gallery or password');
    }

    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const data = `gallery:${slug}:${expires}`;
    const signature = crypto.createHmac('sha256', this.getSigningKey()).update(data).digest('hex');

    return `${expires}.${signature}`;
  }

  verifyAccessToken(slug: string, token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [expiresStr, signature] = parts;
    const expires = parseInt(expiresStr);
    if (isNaN(expires) || Date.now() > expires) return false;

    const data = `gallery:${slug}:${expires}`;
    const expected = crypto.createHmac('sha256', this.getSigningKey()).update(data).digest('hex');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }

  async findBySlugPublic(slug: string, token: string) {
    if (!this.verifyAccessToken(slug, token)) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const gallery = await this.galleryRepo.findOne({ where: { slug, isActive: true } });
    if (!gallery) throw new NotFoundException('Gallery not found');

    const images = await this.getGalleryImages(gallery.id);

    const safeImages = images.map(({ filePath: _filePath, ...rest }) => rest);

    return {
      name: gallery.name,
      slug: gallery.slug,
      images: safeImages,
    };
  }

  async getOriginalPathForImage(
    slug: string,
    imageId: number,
    token: string,
  ): Promise<{ name: string; filePath: string }> {
    if (!this.verifyAccessToken(slug, token)) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const gallery = await this.galleryRepo.findOne({ where: { slug, isActive: true } });
    if (!gallery) throw new NotFoundException('Gallery not found');

    const joinRow = await this.joinRepo.findOne({
      where: { protectedGalleryId: gallery.id, imageId },
    });
    if (!joinRow) throw new NotFoundException('Image not in this gallery');

    const image = await this.imageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Image not found');
    if (!image.allowDownloadOriginal) {
      throw new UnauthorizedException('Download not allowed for this image');
    }

    return {
      name: `${image.title || image.id}${path.extname(image.filePath)}`,
      filePath: path.join(this.uploadDir, image.filePath),
    };
  }

  async getOriginalPaths(
    slug: string,
    token: string,
  ): Promise<{ name: string; filePath: string }[]> {
    if (!this.verifyAccessToken(slug, token)) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const gallery = await this.galleryRepo.findOne({ where: { slug, isActive: true } });
    if (!gallery) throw new NotFoundException('Gallery not found');

    const images = await this.getGalleryImages(gallery.id);

    return images.map((img) => ({
      name: `${img.title || img.id}${path.extname(img.filePath)}`,
      filePath: path.join(this.uploadDir, img.filePath),
    }));
  }
}
