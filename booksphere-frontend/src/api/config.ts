import { client } from './generated/client.gen';
import { useAuthStore } from '../store/authStore';
import { handleTokenRefresh } from './authUtils'; // 🔥 Импортируем вашу функцию!

client.setConfig({
  baseUrl: 'http://localhost:8081',
});

// 1. Прикрепляем токен ко всем запросам
client.interceptors.request.use((request) => {
  const token = useAuthStore.getState().token;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

// 2. Ловим 401 ошибку
client.interceptors.response.use(async (response, request) => {
  if (response.status === 401) {
    // Если 401 произошла при логине или при самом обновлении токена — ничего не делаем
    if (request.url.includes('/login') || request.url.includes('/refresh-token')) {
      return response;
    }

    // 🔥 Вызываем вашу готовую функцию из authUtils!
    const newToken = await handleTokenRefresh();

    if (newToken) {
      // Если токен успешно обновился, повторяем оригинальный запрос
      request.headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(request); 
    }
  }

  return response;
});