import { createFileRoute } from '@tanstack/react-router';
import { Box, Typography } from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

export const Route = createFileRoute('/home/chats/')({
  component: NoChatSelected,
});

function NoChatSelected() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.4,
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          border: '4px solid #6B7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <ForumOutlinedIcon sx={{ fontSize: 50, color: '#6B7280' }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#6B7280' }}>
        Чаты не выбраны
      </Typography>
    </Box>
  );
}
