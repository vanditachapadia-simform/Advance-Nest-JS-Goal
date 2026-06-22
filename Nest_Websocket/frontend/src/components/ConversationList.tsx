import { useState } from 'react';
import {
  Box,
  List,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { Search, PersonAdd, ExitToApp } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import ConversationItem from './ConversationItem';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';
import { usersApi } from '../api/users.api';
import { chatApi } from '../api/chat.api';
import { getInitials } from '../utils/helpers';
import type { User } from '../types';

interface ConversationListProps {
  onSelect: (conversationId: string) => void;
}

export default function ConversationList({ onSelect }: ConversationListProps) {
  const { user, logout } = useAuthStore();
  const { conversations, activeConversationId, addOrUpdateConversation, setActiveConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', userSearch],
    queryFn: () => userSearch ? usersApi.search(userSearch) : usersApi.getAll(),
    enabled: newChatOpen,
  });

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const other = c.participants.find((p) => p.userId !== user?.id)?.user;
    return other?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleStartChat = async (targetUser: User) => {
    const res = await chatApi.createConversation(targetUser.id);
    addOrUpdateConversation(res.data);
    setActiveConversation(res.data.id);
    onSelect(res.data.id);
    setNewChatOpen(false);
    setUserSearch('');
  };

  return (
    <Box
      sx={{
        width: 350,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #e0e0e0',
        bgcolor: '#fff',
        height: '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={user?.avatar || undefined} sx={{ width: 38, height: 38 }}>
            {user ? getInitials(user.name) : '?'}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={700} color="#fff">
            ChatApp
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={() => setNewChatOpen(true)} sx={{ color: '#fff' }} title="New chat">
            <PersonAdd />
          </IconButton>
          <IconButton onClick={logout} sx={{ color: '#fff' }} title="Logout">
            <ExitToApp />
          </IconButton>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ px: 1.5, py: 1, bgcolor: '#F0F0F0' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search or start new chat"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#999' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: '#fff',
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      <Divider />

      {/* Conversations */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {filtered.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No conversations found' : 'No conversations yet. Start a new chat!'}
            </Typography>
          </Box>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversationId === conv.id}
              currentUserId={user?.id ?? ''}
              onClick={() => {
                setActiveConversation(conv.id);
                onSelect(conv.id);
              }}
            />
          ))
        )}
      </List>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onClose={() => setNewChatOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(usersData?.data ?? []).map((u) => (
                <ListItemButton key={u.id} onClick={() => handleStartChat(u)}>
                  <ListItemAvatar>
                    <Avatar src={u.avatar || undefined}>{getInitials(u.name)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={u.isOnline ? 'Online' : u.email}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
