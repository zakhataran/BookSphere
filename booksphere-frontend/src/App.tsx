import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const router = getRouter();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      <RouterProvider router={router} />
      <Toaster position="bottom-left" richColors />
    </QueryClientProvider>
  );
}
