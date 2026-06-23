import { useState } from 'react';
import { Box, Popover, Typography, Tab, Tabs } from '@mui/material';

interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

interface EmojiCategory {
  label: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',
      '😇', '😉', '😊', '🙂', '🙃', '😋', '😌', '😍',
      '🥰', '😘', '😗', '😙', '😚', '🤩', '🥳', '😎',
      '🤓', '🧐', '😏', '😒', '😞', '😔', '😟', '😕',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲',
      '🙏', '🤝', '💪', '🦾', '👊', '✊', '🤛', '🤜',
      '🫶', '❤️', '🫂', '💅', '🖕', '☝️', '👆', '👇',
    ],
  },
  {
    label: 'Objects',
    emojis: [
      '💡', '🔥', '⭐', '🌟', '💯', '✅', '❌', '❓',
      '❗', '💬', '💭', '📢', '🔔', '🎉', '🎊', '🎁',
      '🏆', '🥇', '🎯', '🚀', '⚡', '🌈', '💎', '🔑',
      '📱', '💻', '⌨️', '🖥️', '📷', '🎵', '🎶', '🎮',
    ],
  },
  {
    label: 'Nature',
    emojis: [
      '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🍀', '🌿',
      '🍃', '🍂', '🍁', '🌾', '🌵', '🌴', '🌲', '🌳',
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦋',
    ],
  },
];

export default function EmojiPicker({ anchorEl, open, onClose, onEmojiSelect }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      disableRestoreFocus
      PaperProps={{
        sx: {
          width: 300,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Category tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          borderBottom: '1px solid #e0e0e0',
          '& .MuiTab-root': { minHeight: 36, fontSize: '0.7rem', px: 0.5, py: 0.5 },
        }}
      >
        {EMOJI_CATEGORIES.map((cat) => (
          <Tab key={cat.label} label={cat.label} />
        ))}
      </Tabs>

      {/* Emoji grid */}
      <Box
        sx={{
          maxHeight: 210,
          overflowY: 'auto',
          p: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 0.25,
        }}
      >
        {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
          <Box
            key={emoji}
            component="button"
            onClick={() => handleEmojiClick(emoji)}
            aria-label={emoji}
            sx={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderRadius: 1,
              p: 0.5,
              fontSize: '1.35rem',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s',
              '&:hover': { bgcolor: '#f0f0f0' },
              '&:active': { bgcolor: '#e0e0e0' },
            }}
          >
            <Typography component="span" sx={{ fontSize: '1.35rem', lineHeight: 1 }}>
              {emoji}
            </Typography>
          </Box>
        ))}
      </Box>
    </Popover>
  );
}
