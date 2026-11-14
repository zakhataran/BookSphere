import { useAuthStore } from '../store/authStore';
import { refreshToken as apiRefreshToken } from './generated/sdk.gen';

let refreshPromise: Promise<string | null> | null = null;

export function handleTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performTokenRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function performTokenRefresh(): Promise<string | null> {
  const currentRefreshToken = useAuthStore.getState().refreshToken;

  if (!currentRefreshToken) {
    useAuthStore.getState().logout();
    return null;
  }

  try {
    const response = await apiRefreshToken({
      body: {
        refresh_token: currentRefreshToken,
      },
    });

    if (response.error || !response.data) {
      throw new Error('Refresh failed');
    }

    const newToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;

    if (!newToken || !newRefreshToken) {
      throw new Error('Tokens missing');
    }

    useAuthStore.getState().login(newToken, newRefreshToken);

    return newToken;
  } catch (error) {
    console.error('Refresh token failed:', error);
    useAuthStore.getState().logout();
    return null;
  }
}