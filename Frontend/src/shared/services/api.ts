import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403 && error.response?.data?.message === 'Email is not verified') {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                useAuthStore.getState().setUser({
                    ...currentUser,
                    isVerified: false
                });
            }
        }
        return Promise.reject(error);
    }
);
