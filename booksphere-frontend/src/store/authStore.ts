import { create } from 'zustand';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  let initialToken = null;
  let initialRefreshToken = null;

  if (typeof window !== 'undefined') {
    initialToken = localStorage.getItem('bookSphere_token');
    initialRefreshToken = localStorage.getItem('bookSphere_refreshToken');
  }

  return {
    token: initialToken,
    refreshToken: initialRefreshToken,
    isAuthenticated: Boolean(initialToken),

    login: (token: string, refreshToken: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bookSphere_token', token);
        localStorage.setItem('bookSphere_refreshToken', refreshToken);
      }
      set({ token, refreshToken, isAuthenticated: true });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bookSphere_token');
        localStorage.removeItem('bookSphere_refreshToken');
      }
      set({ token: null, refreshToken: null, isAuthenticated: false });
    },
  };
});
