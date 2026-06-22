import { Box } from '@mui/material';

export default function TypingIndicator() {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        px: 1.5,
        py: 1,
        bgcolor: '#fff',
        borderRadius: '18px 18px 18px 4px',
        boxShadow: 1,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: '#999',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': {
              '0%, 60%, 100%': { transform: 'translateY(0)' },
              '30%': { transform: 'translateY(-6px)' },
            },
          }}
        />
      ))}
    </Box>
  );
}
