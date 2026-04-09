import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
import exifReader from 'exif-reader';
import { ImageEntity } from './image.entity';
import { ImagePrintOptionEntity } from './image-print-option.entity';
import { ImageTagEntity } from '../tags/image-tag.entity';
import { ImageMediaTypeEntity } from '../media-types/image-media-type.entity';
import { ImagePaintTypeEntity } from '../paint-types/image-paint-type.entity';

interface UpdateImageData {
  title?: string;
  description?: string;
  price?: number;
  artistId?: number;
  category?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  printEnabled?: boolean;
  printLimit?: number | null;
  isArchived?: boolean;
  allowDownloadOriginal?: boolean;
  projectId?: number | null;
  adminNote?: string | null;
  shotDate?: string | null;
  place?: string | null;
  printOptions?: { sku: string; description: string; price: number }[];
  tagIds?: number[];
  mediaTypeIds?: number[];
  paintTypeIds?: number[];
}

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'tiff', 'heif'];
const SHARP_PIXEL_LIMIT = 100_000_000; // 100 megapixels — guards against decompression bombs

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
    @InjectRepository(ImageMediaTypeEntity)
    private readonly imageMediaTypeRepo: Repository<ImageMediaTypeEntity>,
    @InjectRepository(ImagePaintTypeEntity)
    private readonly imagePaintTypeRepo: Repository<ImagePaintTypeEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  private safePath(relativePath: string): string {
    const resolved = path.resolve(this.uploadDir, relativePath);
    if (!resolved.startsWith(path.resolve(this.uploadDir) + path.sep)) {
      throw new BadRequestException('Invalid file path');
    }
    return resolved;
  }

  private extractExifDate(metadata: sharp.Metadata): string | null {
    if (!metadata.exif) return null;
    try {
      const exif = exifReader(metadata.exif);
      const dateValue = exif?.Photo?.DateTimeOriginal ?? exif?.Photo?.DateTimeDigitized;
      if (!dateValue) return null;
      const d = dateValue instanceof Date ? dateValue : new Date(String(dateValue));
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }

  private mapRelations(image: ImageEntity, stripAdmin = true) {
    const tags = (image.imageTags ?? []).map((it) => ({
      id: it.tag.id,
      name: it.tag.name,
      slug: it.tag.slug,
    }));
    const mediaTypes = (image.imageMediaTypes ?? []).map((imt) => ({
      id: imt.mediaType.id,
      name: imt.mediaType.name,
      slug: imt.mediaType.slug,
    }));
    const paintTypes = (image.imagePaintTypes ?? []).map((ipt) => ({
      id: ipt.paintType.id,
      name: ipt.paintType.name,
      slug: ipt.paintType.slug,
    }));
    const { imageTags, imageMediaTypes, imagePaintTypes, adminNote, originalFileName, ...rest } =
      image as ImageEntity & {
        imageTags?: unknown;
        imageMediaTypes?: unknown;
        imagePaintTypes?: unknown;
      };
    void imageTags;
    void imageMediaTypes;
    void imagePaintTypes;
    if (stripAdmin) {
      void adminNote;
      void originalFileName;
      return { ...rest, tags, mediaTypes, paintTypes };
    }
    return { ...rest, adminNote, originalFileName, tags, mediaTypes, paintTypes };
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
    mediaTypes?: string[];
    paintTypes?: string[];
    search?: string[][];
    condition?: 'AND' | 'OR';
  }) {
    const qb = this.repo
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.artist', 'artist')
      .leftJoinAndSelect('image.printOptions', 'printOptions')
      .leftJoinAndSelect('image.project', 'project')
      .leftJoinAndSelect('image.imageTags', 'imageTags')
      .leftJoinAndSelect('imageTags.tag', 'tag')
      .leftJoinAndSelect('image.imageMediaTypes', 'imageMediaTypes')
      .leftJoinAndSelect('imageMediaTypes.mediaType', 'mediaType')
      .leftJoinAndSelect('image.imagePaintTypes', 'imagePaintTypes')
      .leftJoinAndSelect('imagePaintTypes.paintType', 'paintType')
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
    const hasTagFilter = query?.tags && query.tags.length > 0;
    const hasSearch = !!query?.search;
    const useOr = query?.condition === 'OR';

    // Build keyword search — each group is OR (synonyms), groups are ANDed (concepts)
    // e.g. [["dog","puppy"],["hat","cap"]] => (dog OR puppy) AND (hat OR cap)
    const searchGroups = hasSearch ? query.search! : [];
    const buildSearchSql = (groups: string[][], params: Record<string, unknown>) => {
      const groupClauses = groups.map((synonyms, gi) => {
        const synClauses = synonyms.map((word, si) => {
          const key = `sw${gi}_${si}`;
          params[key] = `\\m${word}\\M`;
          return `(image.ai_description ~* :${key} OR image.title ~* :${key} OR image.description ~* :${key})`;
        });
        return `(${synClauses.join(' OR ')})`;
      });
      return groupClauses.join(' AND ');
    };

    if (hasTagFilter && hasSearch) {
      const tagSql =
        'image.id IN (SELECT it.image_id FROM image_tags it INNER JOIN tags t ON t.id = it.tag_id WHERE t.slug IN (:...tagSlugs))';
      const params: Record<string, unknown> = { tagSlugs: query.tags };
      const searchSql = buildSearchSql(searchGroups, params);
      const joiner = useOr ? 'OR' : 'AND';
      qb.andWhere(`(${tagSql} ${joiner} (${searchSql}))`, params);
    } else if (hasTagFilter) {
      qb.andWhere(
        'image.id IN (SELECT it.image_id FROM image_tags it INNER JOIN tags t ON t.id = it.tag_id WHERE t.slug IN (:...tagSlugs))',
        { tagSlugs: query.tags },
      );
    } else if (hasSearch) {
      const params: Record<string, unknown> = {};
      const searchSql = buildSearchSql(searchGroups, params);
      qb.andWhere(searchSql, params);
    }

    if (query?.mediaTypes && query.mediaTypes.length > 0) {
      qb.andWhere(
        'image.id IN (SELECT imt.image_id FROM image_media_types imt INNER JOIN media_types mt ON mt.id = imt.media_type_id WHERE mt.slug IN (:...mediaTypeSlugs))',
        { mediaTypeSlugs: query.mediaTypes },
      );
    }
    if (query?.paintTypes && query.paintTypes.length > 0) {
      qb.andWhere(
        'image.id IN (SELECT ipt.image_id FROM image_paint_types ipt INNER JOIN paint_types pt ON pt.id = ipt.paint_type_id WHERE pt.slug IN (:...paintTypeSlugs))',
        { paintTypeSlugs: query.paintTypes },
      );
    }

    const images = await qb.getMany();
    return images.map((img) => this.mapRelations(img));
  }

  async findAllAdmin() {
    const images = await this.repo
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.artist', 'artist')
      .leftJoinAndSelect('image.printOptions', 'printOptions')
      .leftJoinAndSelect('image.project', 'project')
      .leftJoinAndSelect('image.imageTags', 'imageTags')
      .leftJoinAndSelect('imageTags.tag', 'tag')
      .leftJoinAndSelect('image.imageMediaTypes', 'imageMediaTypes')
      .leftJoinAndSelect('imageMediaTypes.mediaType', 'mediaType')
      .leftJoinAndSelect('image.imagePaintTypes', 'imagePaintTypes')
      .leftJoinAndSelect('imagePaintTypes.paintType', 'paintType')
      .orderBy('image.sortOrder', 'ASC')
      .addOrderBy('image.createdAt', 'DESC')
      .getMany();
    return images.map((img) => this.mapRelations(img, false));
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
      case 'setArtist': {
        const artistId = value ? Number(value) : null;
        if (artistId === null || isNaN(artistId)) {
          throw new BadRequestException('Invalid artist ID');
        }
        await this.repo
          .createQueryBuilder()
          .update()
          .set({ artistId, projectId: null })
          .whereInIds(ids)
          .execute();
        break;
      }
    }
  }

  async findOne(id: number) {
    const image = await this.repo.findOne({
      where: { id },
      relations: [
        'artist',
        'printOptions',
        'imageTags',
        'imageTags.tag',
        'imageMediaTypes',
        'imageMediaTypes.mediaType',
        'imagePaintTypes',
        'imagePaintTypes.paintType',
      ],
    });
    if (!image) throw new NotFoundException('Image not found');
    return this.mapRelations(image, false);
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
        'image.shotDate',
        'image.place',
        'image.allowDownloadOriginal',
        'image.isArchived',
        'image.createdAt',
        'image.updatedAt',
      ])
      .leftJoinAndSelect('image.artist', 'artist')
      .leftJoinAndSelect('image.printOptions', 'printOptions')
      .leftJoinAndSelect('image.imageTags', 'imageTags')
      .leftJoinAndSelect('imageTags.tag', 'tag')
      .leftJoinAndSelect('image.imageMediaTypes', 'imageMediaTypes')
      .leftJoinAndSelect('imageMediaTypes.mediaType', 'mediaType')
      .leftJoinAndSelect('image.imagePaintTypes', 'imagePaintTypes')
      .leftJoinAndSelect('imagePaintTypes.paintType', 'paintType')
      .where('image.id = :id', { id })
      .getOne();
    if (!image) throw new NotFoundException('Image not found');
    return this.mapRelations(image);
  }

  private async validateAndProcessFile(file: Express.Multer.File): Promise<{
    processBuffer: Buffer;
    metadata: sharp.Metadata;
  }> {
    if (!file?.buffer) {
      throw new BadRequestException('File buffer is missing — check Multer storage config');
    }
    const metadata = await sharp(file.buffer, { limitInputPixels: SHARP_PIXEL_LIMIT }).metadata();
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, TIFF, and HEIC images are allowed');
    }

    let processBuffer = file.buffer;
    if (metadata.format === 'heif') {
      const tmpHeic = path.join(this.uploadDir, `tmp-${crypto.randomUUID()}.heic`);
      const tmpJpeg = path.join(this.uploadDir, `tmp-${crypto.randomUUID()}.jpg`);
      try {
        await fs.writeFile(tmpHeic, file.buffer);
        await execFileAsync('heif-convert', ['-q', '100', tmpHeic, tmpJpeg]);
        processBuffer = await fs.readFile(tmpJpeg);
      } finally {
        await Promise.all([fs.unlink(tmpHeic).catch(() => {}), fs.unlink(tmpJpeg).catch(() => {})]);
      }
    }

    return { processBuffer, metadata };
  }

  private async writeImageVariants(
    processBuffer: Buffer,
    originalPath: string,
    thumbnailPath: string,
    mediumPath: string,
    watermarkPath: string,
  ) {
    const dirs = ['originals', 'thumbnails', 'medium', 'watermarked'].map((d) =>
      path.join(this.uploadDir, d),
    );
    await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));

    const safeOriginal = this.safePath(originalPath);
    const safeThumbnail = this.safePath(thumbnailPath);
    const safeMedium = this.safePath(mediumPath);
    const safeWatermark = this.safePath(watermarkPath);

    await fs.writeFile(safeOriginal, processBuffer);

    await Promise.all([
      sharp(processBuffer, { limitInputPixels: SHARP_PIXEL_LIMIT })
        .resize(400)
        .withMetadata()
        .jpeg({ quality: 80 })
        .toFile(safeThumbnail),
      sharp(processBuffer, { limitInputPixels: SHARP_PIXEL_LIMIT })
        .resize(1200)
        .withMetadata()
        .jpeg({ quality: 85 })
        .toFile(safeMedium),
      this.createWatermarked(processBuffer, safeWatermark),
    ]);
  }

  async upload(file: Express.Multer.File, data: Partial<ImageEntity>) {
    this.logger.log(
      `Upload started: ${file?.originalname}, size=${file?.size}, hasBuffer=${!!file?.buffer}`,
    );
    const { processBuffer, metadata } = await this.validateAndProcessFile(file);

    const storeFormat = metadata.format === 'heif' ? 'jpeg' : metadata.format!;
    const originalId = crypto.randomUUID();
    const previewId = crypto.randomUUID();
    const ext = '.' + (storeFormat === 'jpeg' ? 'jpg' : storeFormat);

    const filePath = `originals/${originalId}${ext}`;
    const thumbnailPath = `thumbnails/${previewId}.jpg`;
    const mediumPath = `medium/${previewId}.jpg`;
    const watermarkPath = `watermarked/${previewId}.jpg`;

    await this.writeImageVariants(
      processBuffer,
      filePath,
      thumbnailPath,
      mediumPath,
      watermarkPath,
    );

    const exifDate = this.extractExifDate(metadata);
    const image = this.repo.create({
      ...data,
      filePath,
      thumbnailPath,
      watermarkPath,
      width: metadata.width || 0,
      height: metadata.height || 0,
      shotDate: exifDate,
      originalFileName: file.originalname || null,
    });

    try {
      return await this.repo.save(image);
    } catch (err) {
      this.logger.error(`Failed to save image: ${err}`);
      throw err;
    }
  }

  async reupload(id: number, file: Express.Multer.File) {
    const existing = await this.findOne(id);
    this.logger.log(`Reupload started for image ${id}: ${file?.originalname}, size=${file?.size}`);

    const { processBuffer, metadata } = await this.validateAndProcessFile(file);

    const mediumPath = existing.watermarkPath.replace('watermarked/', 'medium/');
    await this.writeImageVariants(
      processBuffer,
      existing.filePath,
      existing.thumbnailPath,
      mediumPath,
      existing.watermarkPath,
    );

    await this.repo.update(id, {
      width: metadata.width || 0,
      height: metadata.height || 0,
    });

    return this.findOne(id);
  }

  private async createWatermarked(buffer: Buffer, outputPath: string) {
    const targetWidth = 1200;
    const meta = await sharp(buffer, { limitInputPixels: SHARP_PIXEL_LIMIT }).metadata();
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

    await sharp(buffer, { limitInputPixels: SHARP_PIXEL_LIMIT })
      .resize(targetWidth)
      .composite([
        { input: svg, gravity: 'west' },
        { input: svg, gravity: 'east' },
      ])
      .withMetadata()
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }

  async update(id: number, data: UpdateImageData) {
    const existing = await this.findOne(id);
    const { printOptions, tagIds, mediaTypeIds, paintTypeIds, ...imageData } = data;
    // If artist changes, clear projectId (project belongs to old artist)
    if (imageData.artistId !== undefined && imageData.artistId !== existing.artistId) {
      imageData.projectId = null;
    }
    if (Object.keys(imageData).length > 0) {
      await this.repo.update(id, imageData);
    }
    if (printOptions !== undefined) {
      await this.printOptionRepo.delete({ imageId: id });
      if (printOptions.length > 0) {
        const entities = printOptions.map((opt) =>
          this.printOptionRepo.create({ ...opt, imageId: id }),
        );
        await this.printOptionRepo.save(entities);
      }
    }
    if (tagIds !== undefined) {
      await this.imageTagRepo.delete({ imageId: id });
      if (tagIds.length > 0) {
        const entities = tagIds.map((tagId) => this.imageTagRepo.create({ imageId: id, tagId }));
        await this.imageTagRepo.save(entities);
      }
    }
    if (mediaTypeIds !== undefined) {
      await this.imageMediaTypeRepo.delete({ imageId: id });
      if (mediaTypeIds.length > 0) {
        const entities = mediaTypeIds.map((mediaTypeId) =>
          this.imageMediaTypeRepo.create({ imageId: id, mediaTypeId }),
        );
        await this.imageMediaTypeRepo.save(entities);
      }
    }
    if (paintTypeIds !== undefined) {
      await this.imagePaintTypeRepo.delete({ imageId: id });
      if (paintTypeIds.length > 0) {
        const entities = paintTypeIds.map((paintTypeId) =>
          this.imagePaintTypeRepo.create({ imageId: id, paintTypeId }),
        );
        await this.imagePaintTypeRepo.save(entities);
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
    const mediumPath = image.watermarkPath.replace('watermarked/', 'medium/');
    const paths = [image.filePath, image.thumbnailPath, image.watermarkPath, mediumPath].map((p) =>
      this.safePath(p),
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
