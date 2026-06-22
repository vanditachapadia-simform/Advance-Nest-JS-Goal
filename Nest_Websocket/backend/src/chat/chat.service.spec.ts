import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Hello!',
  status: 'SENT',
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  sender: { id: 'user-1', name: 'Alice', avatar: null },
};

const mockConversation = {
  id: 'conv-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  participants: [
    { id: 'cp-1', conversationId: 'conv-1', userId: 'user-1', user: { id: 'user-1', name: 'Alice', avatar: null, isOnline: true, lastSeen: new Date() } },
    { id: 'cp-2', conversationId: 'conv-1', userId: 'user-2', user: { id: 'user-2', name: 'Bob', avatar: null, isOnline: false, lastSeen: new Date() } },
  ],
  messages: [mockMessage],
};

describe('ChatService', () => {
  let service: ChatService;

  const mockPrisma = {
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMessages', () => {
    it('should return messages for a valid participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'cp-1' });
      mockPrisma.message.findMany.mockResolvedValue([mockMessage]);

      const result = await service.getMessages('conv-1', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Hello!');
    });

    it('should throw ForbiddenException for non-participants', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.getMessages('conv-1', 'user-99')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'cp-1' });
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.conversation.update.mockResolvedValue({});

      const result = await service.createMessage('user-1', {
        conversationId: 'conv-1',
        content: 'Hello!',
      });

      expect(result.content).toBe('Hello!');
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage);
      mockPrisma.message.update.mockResolvedValue({ ...mockMessage, isRead: true, status: 'READ' });

      const result = await service.markAsRead('msg-1', 'user-2');
      expect(mockPrisma.message.update).toHaveBeenCalledTimes(1);
    });

    it('should skip update when sender marks own message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage);

      const result = await service.markAsRead('msg-1', 'user-1');
      expect(mockPrisma.message.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('unknown', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
