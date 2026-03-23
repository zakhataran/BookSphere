import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  let initialToken = null;
  if (typeof window !== 'undefined') {
    initialToken = localStorage.getItem('bookSphere_token');
  }

  return {
    token: initialToken,
    isAuthenticated: Boolean(initialToken),

    login: (token: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bookSphere_token', token);
      }
      set({ token, isAuthenticated: true });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bookSphere_token');
      }
      set({ token: null, isAuthenticated: false });
    },
  };
});
