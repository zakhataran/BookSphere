import { client } from './generated/client.gen';
import { useAuthStore } from '../store/authStore';
import { handleTokenRefresh } from './authUtils';

client.setConfig({
  baseUrl: 'http://localhost:8081',
});

client.interceptors.request.use((request) => {
  const token = useAuthStore.getState().token;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

client.interceptors.response.use(async (response, request) => {
  if (response.status === 401) {
    if (request.url.includes('/login') || request.url.includes('/refresh-token')) {
      return response;
    }

    const newToken = await handleTokenRefresh();

    if (newToken) {
      request.headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(request); 
    }
  }

  return response;
});