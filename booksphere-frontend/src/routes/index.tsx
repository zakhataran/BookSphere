import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Autherization status: ', isAuthenticated);

    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Secret page</h1>
      <p>If you see this, so you are logged in</p>

      <button onClick={logout} style={{ padding: '8px', marginTop: '10px', cursor: 'pointer' }}>
        Log out
      </button>
    </div>
  );
}
