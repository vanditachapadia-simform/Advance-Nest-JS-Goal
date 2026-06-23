import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger, UseFilters } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { UsersService } from '../users/users.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userName: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // userId -> Set of socketIds (user can have multiple tabs open)
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private chatService: ChatService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.userId = payload.sub;
      client.userName = payload.email;

      // Register socket
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId).add(client.id);

      // Update online status and notify others
      await this.usersService.setOnlineStatus(client.userId, true);
      this.server.emit('user_online', { userId: client.userId });

      // Auto-join user's conversation rooms
      const conversations = await this.prisma.conversationParticipant.findMany({
        where: { userId: client.userId },
        select: { conversationId: true },
      });
      conversations.forEach(({ conversationId }) => {
        client.join(`conversation:${conversationId}`);
      });

      this.logger.log(`Client connected: ${client.id} (user: ${client.userId})`);
    } catch (err) {
      this.logger.error(`Unauthorized connection: ${err.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;

    const sockets = this.userSockets.get(client.userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        // All tabs closed — mark offline
        this.userSockets.delete(client.userId);
        await this.usersService.setOnlineStatus(client.userId, false);
        this.server.emit('user_offline', {
          userId: client.userId,
          lastSeen: new Date(),
        });
      }
    }

    this.logger.log(`Client disconnected: ${client.id} (user: ${client.userId})`);
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.join(room);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.leave(room);
    return { event: 'left', room };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const message = await this.chatService.createMessage(client.userId, {
      conversationId: data.conversationId,
      content: data.content,
    });

    const room = `conversation:${data.conversationId}`;

    // Notify sender with confirmed message
    client.emit('message_sent', message);

    // Notify all other participants in the room
    client.to(room).emit('message_received', message);

    // Notify about conversation update
    this.server.to(room).emit('conversation_updated', {
      conversationId: data.conversationId,
      lastMessage: message,
    });

    return message;
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.to(room).emit('typing', {
      userId: client.userId,
      conversationId: data.conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.to(room).emit('typing', {
      userId: client.userId,
      conversationId: data.conversationId,
      isTyping: false,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.chatService.markConversationAsRead(data.conversationId, client.userId);

    const room = `conversation:${data.conversationId}`;
    client.to(room).emit('message_read', {
      conversationId: data.conversationId,
      readBy: client.userId,
    });
  }

  @SubscribeMessage('add_reaction')
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string; conversationId: string },
  ) {
    const reaction = await this.chatService.addReaction(client.userId, data.messageId, data.emoji);

    const room = `conversation:${data.conversationId}`;
    // Emit to all in the room (including sender) so everyone sees the update
    this.server.to(room).emit('reaction_added', {
      messageId: data.messageId,
      conversationId: data.conversationId,
      reaction: { ...reaction, userId: client.userId },
    });

    return reaction;
  }

  @SubscribeMessage('remove_reaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string; conversationId: string },
  ) {
    await this.chatService.removeReaction(client.userId, data.messageId, data.emoji);

    const room = `conversation:${data.conversationId}`;
    this.server.to(room).emit('reaction_removed', {
      messageId: data.messageId,
      conversationId: data.conversationId,
      userId: client.userId,
      emoji: data.emoji,
    });
  }

  // Utility: emit to all sockets of a specific user
  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  private extractToken(client: Socket): string {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    const token = client.handshake.auth?.token;
    if (token) return token;
    throw new WsException('No token provided');
  }
}
