import { client } from './client.gen';
import { useAuthStore } from '../store/authStore';

client.setConfig({
    baseUrl: 'http://localhost:8081',
});

client.interceptors.request.use((request, options) =>{
    if (options.url?.includes('/login') || options.url?.includes('/registration')) {
        return request;
    }

    const token = useAuthStore.getState().token;
    if(token) {
        request.headers.set('Authorication', `Bearer${token}`);
    }

    return request;
})