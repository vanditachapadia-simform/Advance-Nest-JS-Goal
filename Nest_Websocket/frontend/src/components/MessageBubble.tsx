import { Box, Typography } from '@mui/material';
import { DoneAll, Done } from '@mui/icons-material';
import { formatMessageTime } from '../utils/helpers';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const statusIcon = () => {
    if (!isOwn) return null;
    if (message.status === 'READ') {
      return <DoneAll sx={{ fontSize: 14, color: '#53bdeb' }} />;
    }
    if (message.status === 'DELIVERED') {
      return <DoneAll sx={{ fontSize: 14, color: '#999' }} />;
    }
    return <Done sx={{ fontSize: 14, color: '#999' }} />;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 0.5,
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '65%',
          px: 1.5,
          py: 0.75,
          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          bgcolor: isOwn ? '#DCF8C6' : '#fff',
          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
          position: 'relative',
        }}
      >
        <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
          {message.content}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 0.25,
            mt: 0.25,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {formatMessageTime(message.createdAt)}
          </Typography>
          {statusIcon()}
        </Box>
      </Box>
    </Box>
  );
}
