import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ChatService, ChatResponse } from './chat.service';
import { ChatDto } from './chat.dto';
import { ChatThrottleGuard } from './chat-throttle.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(ChatThrottleGuard)
  async chat(@Body() dto: ChatDto): Promise<ChatResponse> {
    return this.chatService.chat(dto.messages);
  }
}
