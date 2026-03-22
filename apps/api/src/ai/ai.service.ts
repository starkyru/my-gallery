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
                text: `You are writing for a photography gallery. Write like a real person, not a copywriter. Use simple, everyday words. Respond with a JSON object containing two fields:

1. "title" — A short title (2-6 words). Be creative and varied — avoid generic patterns like "Noun in/on/at Place". Try different styles: a feeling, a question, a single word, a fragment, something unexpected or playful. Each title should feel distinct.

2. "description" — 2-3 sentences about what you see and what makes it interesting. Write naturally, as if telling a friend about the photo. No flowery language, no art jargon. Keep it under 60 words. Do not start with "This photograph" or "This image".

${image.title || image.description ? `The current title is "${image.title || ''}"${image.description ? ` and the current description is "${image.description}"` : ''}. Use these as a starting point — improve them while keeping any relevant details.` : ''}

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
