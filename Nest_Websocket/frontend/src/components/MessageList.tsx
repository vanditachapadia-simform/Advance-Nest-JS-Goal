import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUserIds: Set<string>;
}

export default function MessageList({ messages, currentUserId, typingUserIds }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUserIds.size]);

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        py: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c4c9c4' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        bgcolor: '#ECE5DD',
      }}
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === currentUserId}
        />
      ))}

      {typingUserIds.size > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <TypingIndicator />
        </Box>
      )}

      <div ref={bottomRef} />
    </Box>
  );
}
