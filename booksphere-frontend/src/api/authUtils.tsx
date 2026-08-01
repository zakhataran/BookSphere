import { useAuthStore } from '../store/authStore'; // Укажите правильный путь к вашему Zustand
import { refreshToken as apiRefreshToken } from './generated/sdk.gen'; // Путь к сгенерированному API

export async function handleTokenRefresh() {
  const currentRefreshToken = useAuthStore.getState().refreshToken;

  if (!currentRefreshToken) {
    useAuthStore.getState().logout();
    window.location.href = '/auth/login';
    return null;
  }

  try {
    const response = await apiRefreshToken({
      body: {
        refresh_token: currentRefreshToken
      }
    });

    if (response.error) throw new Error("Refresh failed");

    if (response.error || !response.data) {
      throw new Error("Refresh failed");
    }

    const newToken = response.data.access_token; 
    const newRefreshToken = response.data.refresh_token;

    if (!newToken || !newRefreshToken) {
      throw new Error("Tokens are missing in the response");
    }

    useAuthStore.getState().login(newToken, newRefreshToken);
    return newToken;

  } catch (error) {
    useAuthStore.getState().logout();
    window.location.href = '/auth/login';
    return null;
  }
}