import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';

export const Route = createFileRoute('/')({
  // 1. Проверяем авторизацию ДО загрузки страницы
  beforeLoad: () => {
    // Делаем проверку только в браузере (защита от багов SSR)
    if (typeof window !== 'undefined') {
      // Достаем состояние напрямую, без хука
      const isAuthenticated = useAuthStore.getState().isAuthenticated;

      debugger;

      if (!isAuthenticated) {
        // throw redirect - это фишка TanStack, она мгновенно прерывает загрузку
        throw redirect({ to: '/auth/login' });
      }
    }
  },
  component: IndexPage,
});

function IndexPage() {
  const logout = useAuthStore((state) => state.logout);

  // 2. Нам больше не нужны useEffect, navigate и проверки if (!isAuthenticated)!
  // Если код дошел до этой функции, мы на 1000% уверены, что пользователь авторизован.

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
