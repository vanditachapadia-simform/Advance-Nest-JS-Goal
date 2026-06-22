import { create } from 'zustand';
import type { User } from '../types';

interface UserState {
  users: User[];
  onlineUserIds: Set<string>;
  setUsers: (users: User[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string, lastSeen: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  onlineUserIds: new Set(),

  setUsers: (users) => {
    const onlineIds = new Set(users.filter((u) => u.isOnline).map((u) => u.id));
    set({ users, onlineUserIds: onlineIds });
  },

  setUserOnline: (userId) =>
    set((state) => {
      const updated = state.users.map((u) =>
        u.id === userId ? { ...u, isOnline: true } : u,
      );
      const onlineIds = new Set(state.onlineUserIds);
      onlineIds.add(userId);
      return { users: updated, onlineUserIds: onlineIds };
    }),

  setUserOffline: (userId, lastSeen) =>
    set((state) => {
      const updated = state.users.map((u) =>
        u.id === userId ? { ...u, isOnline: false, lastSeen } : u,
      );
      const onlineIds = new Set(state.onlineUserIds);
      onlineIds.delete(userId);
      return { users: updated, onlineUserIds: onlineIds };
    }),
}));
