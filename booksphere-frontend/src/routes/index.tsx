import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = useAuthStore.getState().isAuthenticated;

      if (!isAuthenticated) {
        throw redirect({ to: '/auth/login' });
      } else {
        throw redirect({ 
          to: '/home',
          search: {
            recentPage: 0,
            readingPage: 0,
            searchQuery: '',
            categoryId: 'all',
            sort: 'newest'
          }
        });
      }
    }
  }
});