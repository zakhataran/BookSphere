import { Box } from '@mui/material';
import Header from '../../components/Header';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/home')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Box>
        <Header />
        <Outlet />
      </Box>
    </>
  );
}
