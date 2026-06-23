import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

const MESSAGE_INCLUDE = {
  sender: {
    select: { id: true, name: true, avatar: true },
  },
  reactions: {
    include: {
      user: { select: { id: true, name: true } },
    },
  },
};

const CONVERSATION_INCLUDE = {
  participants: {
    include: {
      user: {
        select: { id: true, name: true, avatar: true, isOnline: true, lastSeen: true },
      },
    },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    include: MESSAGE_INCLUDE,
  },
};

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        ...CONVERSATION_INCLUDE,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: MESSAGE_INCLUDE,
        },
        _count: {
          select: {
            messages: {
              where: { isRead: false, senderId: { not: userId } },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => ({
      ...conv,
      unreadCount: conv._count.messages,
    }));
  }

  async getOrCreateConversation(userId: string, dto: CreateConversationDto) {
    const { participantId } = dto;

    // Check if conversation already exists between these two users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
      include: CONVERSATION_INCLUDE,
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: participantId }],
        },
      },
      include: CONVERSATION_INCLUDE,
    });
  }

  async getMessages(conversationId: string, userId: string, skip = 0, take = 50) {
    await this.assertParticipant(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return messages.reverse();
  }

  async createMessage(senderId: string, dto: CreateMessageDto) {
    const { conversationId, content } = dto;

    await this.assertParticipant(conversationId, senderId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: MESSAGE_INCLUDE,
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId === userId) return message; // sender can't mark own message

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true, status: 'READ' },
      include: MESSAGE_INCLUDE,
    });
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true, status: 'READ' },
    });
  }

  async addReaction(userId: string, messageId: string, emoji: string) {
    return this.prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });
  }

  async removeReaction(userId: string, messageId: string, emoji: string) {
    return this.prisma.messageReaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      throw new ForbiddenException('You are not part of this conversation');
    }
  }
}
