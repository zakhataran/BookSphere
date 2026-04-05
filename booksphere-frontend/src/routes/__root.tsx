import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Box, Container } from '@mui/material';
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          pt: { xs: '64px' },
          '@media (min-width:1400px)': {
            pt: 0,
          },
          flexGrow: 1,
          pb: 4,
          mt: '25px',
          maxWidth: '1400px',
          display: 'block',
          justifyContent: 'initial',
          alignItems: 'initial',
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
