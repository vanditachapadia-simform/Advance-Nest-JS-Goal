import api from './axios';
import type { User, ApiResponse } from '../types';

export const usersApi = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const res = await api.get('/users');
    return res.data;
  },

  search: async (query: string): Promise<ApiResponse<User[]>> => {
    const res = await api.get('/users/search', { params: { q: query } });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
};
