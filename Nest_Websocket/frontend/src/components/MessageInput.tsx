import { useState, useRef, useCallback } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import { Send, EmojiEmotions } from '@mui/icons-material';
import { socketService } from '../socket/socket.service';
import EmojiPicker from './EmojiPicker';

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ conversationId, onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textFieldRef = useRef<HTMLInputElement | null>(null);

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

  const handleEmojiButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    setEmojiAnchorEl(e.currentTarget);
  };

  /**
   * Insert the selected emoji at the current cursor position in the text field,
   * or append to the end if the cursor position is unavailable.
   */
  const handleEmojiSelect = useCallback((emoji: string) => {
    const input = textFieldRef.current;
    if (input) {
      const start = input.selectionStart ?? content.length;
      const end = input.selectionEnd ?? content.length;
      const next = content.slice(0, start) + emoji + content.slice(end);
      setContent(next);
      // Restore cursor position after the inserted emoji on next tick
      requestAnimationFrame(() => {
        const pos = start + emoji.length;
        input.setSelectionRange(pos, pos);
        input.focus();
      });
    } else {
      setContent((prev) => prev + emoji);
    }
  }, [content]);

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
      <EmojiPicker
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={() => setEmojiAnchorEl(null)}
        onEmojiSelect={handleEmojiSelect}
      />

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
        inputRef={textFieldRef}
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
              <IconButton
                size="small"
                onClick={handleEmojiButtonClick}
                disabled={disabled}
                sx={{ color: '#999', p: 0.25 }}
                aria-label="Open emoji picker"
              >
                <EmojiEmotions />
              </IconButton>
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
