import { create } from 'zustand';
import type { Conversation, Message, MessageReaction } from '../types';

interface TypingMap {
  [conversationId: string]: Set<string>;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: TypingMap;

  setConversations: (conversations: Conversation[]) => void;
  addOrUpdateConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  markConversationRead: (conversationId: string) => void;
  incrementUnread: (conversationId: string) => void;
  addReaction: (messageId: string, reaction: MessageReaction) => void;
  removeReaction: (messageId: string, userId: string, emoji: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},

  setConversations: (conversations) => set({ conversations }),

  addOrUpdateConversation: (conversation) => {
    const { conversations } = get();
    const idx = conversations.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      const updated = [...conversations];
      updated[idx] = conversation;
      set({ conversations: updated });
    } else {
      set({ conversations: [conversation, ...conversations] });
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  addMessage: (message) => {
    const { messages, conversations, activeConversationId } = get();
    const convId = message.conversationId;
    const existing = messages[convId] ?? [];

    // Avoid duplicates
    if (existing.some((m) => m.id === message.id)) return;

    set((state) => ({
      messages: { ...state.messages, [convId]: [...existing, message] },
    }));

    // Update last message and unread count in conversations list
    const convIdx = conversations.findIndex((c) => c.id === convId);
    if (convIdx >= 0) {
      const updated = [...conversations];
      const conv = { ...updated[convIdx] };
      conv.messages = [message];
      if (activeConversationId !== convId) {
        conv.unreadCount = (conv.unreadCount ?? 0) + 1;
      }
      updated.splice(convIdx, 1);
      set({ conversations: [conv, ...updated] });
    }
  },

  updateMessage: (messageId, updates) => {
    const { messages } = get();
    const updated = { ...messages };
    for (const convId of Object.keys(updated)) {
      const idx = updated[convId].findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        updated[convId] = [...updated[convId]];
        updated[convId][idx] = { ...updated[convId][idx], ...updates };
        break;
      }
    }
    set({ messages: updated });
  },

  setTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId]
        ? new Set(state.typingUsers[conversationId])
        : new Set<string>();

      if (isTyping) {
        current.add(userId);
      } else {
        current.delete(userId);
      }

      return {
        typingUsers: { ...state.typingUsers, [conversationId]: current },
      };
    });
  },

  markConversationRead: (conversationId) => {
    const { conversations } = get();
    const updated = conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c,
    );
    set({ conversations: updated });
  },

  incrementUnread: (conversationId) => {
    const { conversations } = get();
    const updated = conversations.map((c) =>
      c.id === conversationId
        ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1 }
        : c,
    );
    set({ conversations: updated });
  },

  addReaction: (messageId, reaction) => {
    const { messages } = get();
    const updated = { ...messages };
    for (const convId of Object.keys(updated)) {
      const idx = updated[convId].findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        const msg = updated[convId][idx];
        const existing = msg.reactions ?? [];
        // Avoid duplicate reaction from same user for same emoji
        if (existing.some((r) => r.userId === reaction.userId && r.emoji === reaction.emoji)) break;
        updated[convId] = [...updated[convId]];
        updated[convId][idx] = { ...msg, reactions: [...existing, reaction] };
        break;
      }
    }
    set({ messages: updated });
  },

  removeReaction: (messageId, userId, emoji) => {
    const { messages } = get();
    const updated = { ...messages };
    for (const convId of Object.keys(updated)) {
      const idx = updated[convId].findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        const msg = updated[convId][idx];
        const filtered = (msg.reactions ?? []).filter(
          (r) => !(r.userId === userId && r.emoji === emoji),
        );
        updated[convId] = [...updated[convId]];
        updated[convId][idx] = { ...msg, reactions: filtered };
        break;
      }
    }
    set({ messages: updated });
  },
}));
