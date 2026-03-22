import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImagesService } from '../images/images.service';

const AiResponseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  async describeImage(imageId: number) {
    const image = await this.imagesService.findOne(imageId);
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const mediumPath = image.watermarkPath.replace('watermarked/', 'medium/');
    const filePath = path.join(uploadDir, mediumPath);

    const imageBuffer = await fs.readFile(filePath);
    const base64 = imageBuffer.toString('base64');

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/webp', data: base64 },
              },
              {
                type: 'text',
                text: `You are writing for a fine art photography gallery listing. Respond with a JSON object containing two fields:

1. "title" — A short, evocative title for this photograph (2-6 words). Creative, poetic, gallery-appropriate. No quotes around the title text.

2. "description" — A compelling description that would appeal to art collectors and photography enthusiasts. Include observations about the mood, atmosphere, composition, and what makes this image striking. Keep it under 150 words. Refined, gallery-appropriate tone. Do not start with "This photograph".

Respond ONLY with valid JSON, no markdown formatting.`,
              },
            ],
          },
        ],
      });
    } catch (err: unknown) {
      if (err instanceof Anthropic.APIError) {
        const body = err.error as { error?: { message?: string } } | undefined;
        const msg = body?.error?.message || err.message;
        throw new InternalServerErrorException(msg);
      }
      throw new InternalServerErrorException('AI service unavailable');
    }

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new BadRequestException('AI returned invalid JSON');
    }
    const result = AiResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new BadRequestException(
        `AI response missing fields: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`,
      );
    }
    return result.data;
  }
}
