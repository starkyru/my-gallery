import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ImagesService } from '../images/images.service';
import { CategoriesService } from '../categories/categories.service';
import { TagsService } from '../tags/tags.service';

const ChatAiResponseSchema = z.object({
  message: z.string().min(1),
  search: z
    .object({
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
    })
    .optional(),
});

export interface ChatImage {
  id: number;
  title: string;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  price: number;
  artist: { name: string; slug: string };
}

export interface ChatResponse {
  message: string;
  images: ChatImage[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    private readonly categoriesService: CategoriesService,
    private readonly tagsService: TagsService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  async chat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<ChatResponse> {
    const [categories, tags] = await Promise.all([
      this.categoriesService.findAll(),
      this.tagsService.findAll(),
    ]);

    const categoryList = categories
      .map((c) => `- ${c.slug} (${c.name}, ${c.imageCount} images)`)
      .join('\n');
    const tagList = tags.map((t) => `- ${t.slug} (${t.name}, ${t.imageCount} images)`).join('\n');

    const systemPrompt = `You are a friendly gallery assistant helping visitors find photographs.

AVAILABLE CATEGORIES (use exact slug values):
${categoryList}

AVAILABLE TAGS (use exact slug values):
${tagList}

When the user describes what they are looking for, respond with a JSON object:
{
  "message": "A friendly 1-2 sentence response",
  "search": {
    "category": "optional category slug from above",
    "tags": ["optional", "tag", "slugs"],
    "featured": true
  }
}

If the user is just chatting or asking something unrelated to finding images, respond with only:
{ "message": "Your friendly response" }

Rules:
- Pick at most 1 category and up to 5 tags
- Only use slugs from the lists above
- Keep messages concise and helpful
- If the request is vague, ask a clarifying question (no search)
- Respond ONLY with valid JSON, no markdown formatting`;

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
    } catch (err: unknown) {
      if (err instanceof Anthropic.APIError) {
        const body = err.error as { error?: { message?: string } } | undefined;
        const msg = body?.error?.message || err.message;
        this.logger.error(`Anthropic API error: ${msg}`);
      }
      throw new InternalServerErrorException('AI service unavailable');
    }

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?\s*```$/g, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      this.logger.warn(`Chat AI returned invalid JSON: ${text}`);
      return {
        message: "I'm sorry, I had trouble understanding. Could you try rephrasing?",
        images: [],
      };
    }

    const result = ChatAiResponseSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.warn(`Chat AI response failed validation: ${result.error.message}`);
      return {
        message: "I'm sorry, I had trouble understanding. Could you try rephrasing?",
        images: [],
      };
    }

    const { message, search } = result.data;

    if (!search) {
      return { message, images: [] };
    }

    const validCategorySlugs = new Set(categories.map((c) => c.slug));
    const validTagSlugs = new Set(tags.map((t) => t.slug));

    const category =
      search.category && validCategorySlugs.has(search.category) ? search.category : undefined;
    const filteredTags = (search.tags ?? []).filter((t) => validTagSlugs.has(t));

    const allImages = await this.imagesService.findAll({
      category,
      tags: filteredTags.length > 0 ? filteredTags : undefined,
      featured: search.featured,
    });

    const images: ChatImage[] = allImages.slice(0, 3).map((img) => ({
      id: img.id,
      title: img.title ?? '',
      thumbnailPath: img.thumbnailPath,
      watermarkPath: img.watermarkPath,
      width: img.width,
      height: img.height,
      price: Number(img.price),
      artist: {
        name: img.artist?.name ?? '',
        slug: img.artist?.slug ?? '',
      },
    }));

    const finalMessage =
      images.length === 0
        ? `${message} Unfortunately, I couldn't find images matching that description. Try broadening your search or describing something different.`
        : message;

    return { message: finalMessage, images };
  }
}
