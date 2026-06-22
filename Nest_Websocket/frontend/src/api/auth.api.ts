import api from './axios';
import type { User, ApiResponse } from '../types';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<ApiResponse<AuthResult>> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginData): Promise<ApiResponse<AuthResult>> => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
};
