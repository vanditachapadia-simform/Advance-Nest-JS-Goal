import { useEffect, useCallback } from 'react';
import { Box, Avatar, Typography, IconButton, Divider, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserStatus from './UserStatus';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';
import { chatApi } from '../api/chat.api';
import { socketService } from '../socket/socket.service';
import { getOtherParticipant, getInitials } from '../utils/helpers';
import type { Conversation } from '../types';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export default function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, typingUsers, markConversationRead } = useChatStore();

  const other = getOtherParticipant(conversation, user?.id ?? '');
  const convMessages = messages[conversation.id] ?? [];
  const typingUserIds = typingUsers[conversation.id] ?? new Set<string>();

  const { isLoading } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: async () => {
      const res = await chatApi.getMessages(conversation.id);
      setMessages(conversation.id, res.data);
      return res.data;
    },
    staleTime: 0,
  });

  useEffect(() => {
    socketService.joinConversation(conversation.id);
    socketService.markAsRead(conversation.id);
    markConversationRead(conversation.id);

    return () => {
      socketService.leaveConversation(conversation.id);
    };
  }, [conversation.id]);

  const handleSend = useCallback(
    (content: string) => {
      socketService.sendMessage(conversation.id, content);
    },
    [conversation.id],
  );

  if (!other) return null;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#F0F0F0',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {onBack && (
          <IconButton onClick={onBack} size="small">
            <ArrowBack />
          </IconButton>
        )}
        <Avatar src={other.avatar || undefined} sx={{ width: 42, height: 42 }}>
          {getInitials(other.name)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>
            {other.name}
          </Typography>
          {typingUserIds.size > 0 ? (
            <Typography variant="caption" color="primary.main" fontStyle="italic">
              typing...
            </Typography>
          ) : (
            <UserStatus isOnline={other.isOnline} lastSeen={other.lastSeen} />
          )}
        </Box>
      </Box>

      {/* Messages */}
      {isLoading ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <MessageList
          messages={convMessages}
          currentUserId={user?.id ?? ''}
          typingUserIds={typingUserIds}
        />
      )}

      <Divider />

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        onSend={handleSend}
      />
    </Box>
  );
}
