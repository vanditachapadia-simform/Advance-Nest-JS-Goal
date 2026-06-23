export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name'>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: Pick<User, 'id' | 'name' | 'avatar'>;
  reactions?: MessageReaction[];
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'isOnline' | 'lastSeen'>;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages: Message[];
  unreadCount?: number;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface TypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}
