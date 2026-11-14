import { client } from './generated/client.gen';
import { useAuthStore } from '../store/authStore';
import { handleTokenRefresh } from './authUtils';

client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8081',
});

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(decodedJson);
    const expTime = decoded.exp * 1000;
    return Date.now() >= expTime - 10000; // запас 10 секунд
  } catch (error) {
    return true;
  }
}

client.interceptors.request.use(async (request) => {
  const url = new URL(request.url);

  if (
    url.pathname.endsWith('/auth/refresh-token') ||
    url.pathname.endsWith('/auth/login')
  ) {
    const headers = new Headers(request.headers);
    headers.delete('Authorization');

    return new Request(request, { headers });
  }

  let token = useAuthStore.getState().token;

  if (token && isTokenExpired(token)) {
    const newToken = await handleTokenRefresh();
    if (newToken) {
      token = newToken;
    }
  }

  if (token) {
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${token}`);

    return new Request(request, { headers });
  }

  return request;
});

client.interceptors.response.use(async (response, request) => {
  if (response.status !== 401) {
    return response;
  }

  const url = new URL(request.url);

  if (
    url.pathname.endsWith('/auth/login') ||
    url.pathname.endsWith('/auth/refresh-token')
  ) {
    return response;
  }

  const newToken = await handleTokenRefresh();

  if (newToken) {
    request.headers.set('Authorization', `Bearer ${newToken}`);
    return fetch(request); // Повторяем запрос с новым токеном
  }

  return response;
});