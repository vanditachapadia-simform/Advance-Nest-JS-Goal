import { io, Socket } from 'socket.io-client';
import type { Message, TypingEvent } from '../types';

type EventCallback<T = any> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('join_chat', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_chat', { conversationId });
  }

  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('send_message', { conversationId, content });
  }

  startTyping(conversationId: string): void {
    this.socket?.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit('typing_stop', { conversationId });
  }

  markAsRead(conversationId: string): void {
    this.socket?.emit('mark_read', { conversationId });
  }

  onMessageReceived(cb: EventCallback<Message>): () => void {
    this.socket?.on('message_received', cb);
    return () => this.socket?.off('message_received', cb);
  }

  onMessageSent(cb: EventCallback<Message>): () => void {
    this.socket?.on('message_sent', cb);
    return () => this.socket?.off('message_sent', cb);
  }

  onTyping(cb: EventCallback<TypingEvent>): () => void {
    this.socket?.on('typing', cb);
    return () => this.socket?.off('typing', cb);
  }

  onUserOnline(cb: EventCallback<{ userId: string }>): () => void {
    this.socket?.on('user_online', cb);
    return () => this.socket?.off('user_online', cb);
  }

  onUserOffline(cb: EventCallback<{ userId: string; lastSeen: string }>): () => void {
    this.socket?.on('user_offline', cb);
    return () => this.socket?.off('user_offline', cb);
  }

  onMessageRead(cb: EventCallback<{ conversationId: string; readBy: string }>): () => void {
    this.socket?.on('message_read', cb);
    return () => this.socket?.off('message_read', cb);
  }

  onConversationUpdated(cb: EventCallback<any>): () => void {
    this.socket?.on('conversation_updated', cb);
    return () => this.socket?.off('conversation_updated', cb);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
