import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Chat } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useChatStore } from '../store/chat.store';
import { useUserStore } from '../store/user.store';
import { chatApi } from '../api/chat.api';
import { usersApi } from '../api/users.api';

export default function ChatLayout() {
  const { conversations, activeConversationId, setConversations, setActiveConversation } = useChatStore();
  const { setUsers } = useUserStore();
  const [showChat, setShowChat] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Load conversations on mount
  useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatApi.getConversations();
      setConversations(res.data);
      return res.data;
    },
    staleTime: 30_000,
  });

  // Load all users for online status tracking
  useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      setUsers(res.data);
      return res.data;
    },
    staleTime: 60_000,
  });

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setActiveConversation(null);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar — always visible on desktop, hidden on mobile when chat is open */}
      <Box
        sx={{
          display: { xs: showChat ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <ConversationList onSelect={handleSelectConversation} />
      </Box>

      {/* Chat area */}
      <Box
        sx={{
          flex: 1,
          display: { xs: showChat ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
          />
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#F8F9FA',
              gap: 2,
            }}
          >
            <Chat sx={{ fontSize: 80, color: '#ccc' }} />
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start chatting
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Choose from your existing conversations or start a new one
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
