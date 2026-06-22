import { Box, Typography } from '@mui/material';
import { formatLastSeen } from '../utils/helpers';

interface UserStatusProps {
  isOnline: boolean;
  lastSeen?: string;
  showText?: boolean;
}

export default function UserStatus({ isOnline, lastSeen, showText = true }: UserStatusProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: isOnline ? '#25D366' : '#ccc',
          flexShrink: 0,
        }}
      />
      {showText && (
        <Typography variant="caption" color={isOnline ? '#25D366' : 'text.secondary'}>
          {isOnline ? 'Online' : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
        </Typography>
      )}
    </Box>
  );
}
