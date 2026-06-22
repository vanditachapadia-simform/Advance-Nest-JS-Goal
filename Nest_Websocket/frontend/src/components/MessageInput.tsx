import { useState, useRef, useCallback } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import { Send, EmojiEmotions } from '@mui/icons-material';
import { socketService } from '../socket/socket.service';

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ conversationId, onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.startTyping(conversationId);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketService.stopTyping(conversationId);
    }, 1500);
  }, [conversationId]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    // Stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.stopTyping(conversationId);
    }

    onSend(trimmed);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: '#F0F0F0',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          handleTyping();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message"
        variant="outlined"
        size="small"
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: '#fff',
            '& fieldset': { border: 'none' },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmojiEmotions sx={{ color: '#999', cursor: 'pointer' }} />
            </InputAdornment>
          ),
        }}
      />
      <IconButton
        onClick={handleSend}
        disabled={!content.trim() || disabled}
        sx={{
          bgcolor: 'primary.main',
          color: '#fff',
          width: 44,
          height: 44,
          '&:hover': { bgcolor: 'primary.dark' },
          '&:disabled': { bgcolor: '#ccc' },
        }}
      >
        <Send sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
}
