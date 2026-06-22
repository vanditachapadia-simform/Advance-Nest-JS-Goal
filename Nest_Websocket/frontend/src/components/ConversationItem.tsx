import {
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Box,
} from '@mui/material';
import { formatConversationTime, getInitials, getOtherParticipant } from '../utils/helpers';
import UserStatus from './UserStatus';
import type { Conversation } from '../types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}

export default function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: ConversationItemProps) {
  const other = getOtherParticipant(conversation, currentUserId);
  const lastMessage = conversation.messages?.[0];
  const unread = conversation.unreadCount ?? 0;

  if (!other) return null;

  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        px: 2,
        py: 1.5,
        '&.Mui-selected': {
          bgcolor: '#F0F0F0',
          '&:hover': { bgcolor: '#E8E8E8' },
        },
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <ListItemAvatar>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: other.isOnline ? '#25D366' : 'transparent',
                border: '2px solid #fff',
              }}
            />
          }
        >
          <Avatar
            src={other.avatar || undefined}
            alt={other.name}
            sx={{ width: 50, height: 50 }}
          >
            {getInitials(other.name)}
          </Avatar>
        </Badge>
      </ListItemAvatar>

      <ListItemText
        sx={{ ml: 1, overflow: 'hidden' }}
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="body1"
              fontWeight={unread > 0 ? 700 : 400}
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
            >
              {other.name}
            </Typography>
            {lastMessage && (
              <Typography variant="caption" color={unread > 0 ? 'primary.main' : 'text.secondary'} fontWeight={unread > 0 ? 700 : 400} sx={{ ml: 1, flexShrink: 0 }}>
                {formatConversationTime(lastMessage.createdAt)}
              </Typography>
            )}
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontWeight: unread > 0 ? 600 : 400,
              }}
            >
              {lastMessage
                ? lastMessage.senderId === currentUserId
                  ? `You: ${lastMessage.content}`
                  : lastMessage.content
                : 'No messages yet'}
            </Typography>
            {unread > 0 && (
              <Badge
                badgeContent={unread}
                color="primary"
                sx={{ ml: 1, flexShrink: 0, '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
              />
            )}
          </Box>
        }
      />
    </ListItemButton>
  );
}
