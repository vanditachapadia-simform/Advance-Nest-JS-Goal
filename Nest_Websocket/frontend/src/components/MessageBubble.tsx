import { useState, useMemo, useCallback } from 'react';
import { Box, Typography, Popover } from '@mui/material';
import { AddReaction, DoneAll, Done } from '@mui/icons-material';
import { formatMessageTime } from '../utils/helpers';
import { socketService } from '../socket/socket.service';
import type { Message, MessageReaction } from '../types';

/** The 6 quick-reaction emojis shown in the hover picker. */
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  conversationId: string;
}

/**
 * Groups an array of reactions into a map of { emoji -> count, userIds }.
 * Used to render reaction pills and determine if the current user already reacted.
 */
function groupReactions(reactions: MessageReaction[]): Map<string, { count: number; userIds: Set<string> }> {
  const map = new Map<string, { count: number; userIds: Set<string> }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) ?? { count: 0, userIds: new Set<string>() };
    entry.count += 1;
    entry.userIds.add(r.userId);
    map.set(r.emoji, entry);
  }
  return map;
}

export default function MessageBubble({
  message,
  isOwn,
  currentUserId,
  conversationId,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [reactionAnchorEl, setReactionAnchorEl] = useState<HTMLElement | null>(null);

  const reactions = message.reactions ?? [];
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);

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

  const handleQuickReactionClick = useCallback(
    (emoji: string) => {
      const entry = grouped.get(emoji);
      const alreadyReacted = entry?.userIds.has(currentUserId) ?? false;

      if (alreadyReacted) {
        socketService.removeReaction(conversationId, message.id, emoji);
      } else {
        socketService.addReaction(conversationId, message.id, emoji);
      }
      setReactionAnchorEl(null);
    },
    [grouped, currentUserId, conversationId, message.id],
  );

  const handleReactionPillClick = useCallback(
    (emoji: string) => {
      const entry = grouped.get(emoji);
      const alreadyReacted = entry?.userIds.has(currentUserId) ?? false;

      if (alreadyReacted) {
        socketService.removeReaction(conversationId, message.id, emoji);
      } else {
        socketService.addReaction(conversationId, message.id, emoji);
      }
    },
    [grouped, currentUserId, conversationId, message.id],
  );

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: grouped.size > 0 ? 1.5 : 0.5,
        px: 2,
        position: 'relative',
      }}
    >
      {/* Reaction trigger button — shown on hover, positioned outside the bubble */}
      {hovered && (
        <Box
          sx={{
            position: 'absolute',
            bottom: grouped.size > 0 ? 28 : 4,
            ...(isOwn ? { left: 16 } : { right: 16 }),
            zIndex: 1,
          }}
        >
          <Box
            component="button"
            onClick={(e: React.MouseEvent<HTMLElement>) => setReactionAnchorEl(e.currentTarget)}
            aria-label="Add reaction"
            sx={{
              border: '1px solid #e0e0e0',
              bgcolor: '#fff',
              borderRadius: '50%',
              width: 28,
              height: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              p: 0,
              transition: 'background 0.1s',
              '&:hover': { bgcolor: '#f5f5f5' },
            }}
          >
            <AddReaction sx={{ fontSize: 16, color: '#666' }} />
          </Box>
        </Box>
      )}

      {/* Quick-reaction popover */}
      <Popover
        open={Boolean(reactionAnchorEl)}
        anchorEl={reactionAnchorEl}
        onClose={() => setReactionAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: isOwn ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: isOwn ? 'right' : 'left' }}
        disableRestoreFocus
        PaperProps={{
          sx: {
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            p: 0.5,
          },
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5, p: 0.25 }}>
          {QUICK_REACTIONS.map((emoji) => {
            const alreadyReacted = grouped.get(emoji)?.userIds.has(currentUserId) ?? false;
            return (
              <Box
                key={emoji}
                component="button"
                onClick={() => handleQuickReactionClick(emoji)}
                aria-label={`React with ${emoji}`}
                sx={{
                  border: alreadyReacted ? '2px solid #1976d2' : '2px solid transparent',
                  bgcolor: alreadyReacted ? '#e3f2fd' : 'transparent',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  transition: 'transform 0.1s, background 0.1s',
                  '&:hover': { transform: 'scale(1.25)', bgcolor: '#f0f0f0' },
                }}
              >
                {emoji}
              </Box>
            );
          })}
        </Box>
      </Popover>

      {/* Message bubble + reaction pills stacked vertically */}
      <Box sx={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {/* Bubble */}
        <Box
          sx={{
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

        {/* Reaction pills — rendered below the bubble */}
        {grouped.size > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              mt: 0.5,
              // Overlap slightly with the bubble for a native-chat feel
              position: 'relative',
              zIndex: 0,
            }}
          >
            {Array.from(grouped.entries()).map(([emoji, { count, userIds }]) => {
              const alreadyReacted = userIds.has(currentUserId);
              return (
                <Box
                  key={emoji}
                  component="button"
                  onClick={() => handleReactionPillClick(emoji)}
                  aria-label={`${emoji} ${count} reaction${count > 1 ? 's' : ''}${alreadyReacted ? ', click to remove' : ', click to add'}`}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.4,
                    border: alreadyReacted ? '1.5px solid #1976d2' : '1.5px solid #d0d0d0',
                    bgcolor: alreadyReacted ? '#e3f2fd' : '#fff',
                    borderRadius: 10,
                    px: 0.75,
                    py: 0.25,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    lineHeight: 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
                    transition: 'background 0.1s, border-color 0.1s',
                    '&:hover': { bgcolor: alreadyReacted ? '#bbdefb' : '#f5f5f5' },
                  }}
                >
                  <span style={{ fontSize: '0.95rem' }}>{emoji}</span>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: alreadyReacted ? 700 : 400,
                      color: alreadyReacted ? '#1565c0' : '#555',
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
