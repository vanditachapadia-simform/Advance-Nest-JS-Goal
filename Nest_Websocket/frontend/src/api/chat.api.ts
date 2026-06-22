import api from './axios';
import type { Conversation, Message, ApiResponse } from '../types';

export const chatApi = {
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    const res = await api.get('/conversations');
    return res.data;
  },

  createConversation: async (participantId: string): Promise<ApiResponse<Conversation>> => {
    const res = await api.post('/conversations', { participantId });
    return res.data;
  },

  getMessages: async (
    conversationId: string,
    skip = 0,
    take = 50,
  ): Promise<ApiResponse<Message[]>> => {
    const res = await api.get(`/conversations/${conversationId}/messages`, {
      params: { skip, take },
    });
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
  ): Promise<ApiResponse<Message>> => {
    const res = await api.post('/messages', { conversationId, content });
    return res.data;
  },

  markAsRead: async (messageId: string): Promise<ApiResponse<Message>> => {
    const res = await api.patch(`/messages/${messageId}/read`);
    return res.data;
  },
};
