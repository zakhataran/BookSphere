import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Box, CssBaseline } from '@mui/material';
import '../api/config';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <CssBaseline />
      
      <Box
        sx={{
          backgroundColor: '#F6F4F1',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        <Outlet />
      </Box>
    </>
  );
}