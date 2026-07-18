import { api } from '../../../shared/services/api';
import type { AuthResponse, VerifySessionResponse } from '../types/auth.types';

export const authService = {
    login: async (credentials: Record<string, string>): Promise<AuthResponse> => {
        const res = await api.post<AuthResponse>('/auth/login', credentials);
        return res.data;
    },

    register: async (credentials: Record<string, string>): Promise<AuthResponse> => {
        const res = await api.post<AuthResponse>('/auth/register', credentials);
        return res.data;
    },

    logout: async (): Promise<{ success: boolean; message: string }> => {
        const res = await api.post<{ success: boolean; message: string }>('/auth/logout');
        return res.data;
    },

    getMe: async (): Promise<VerifySessionResponse> => {
        const res = await api.get<VerifySessionResponse>('/auth/me');
        return res.data;
    },

    sendOtp: async (): Promise<{ success: boolean; message: string }> => {
        const res = await api.post<{ success: boolean; message: string }>('/auth/send-otp');
        return res.data;
    },

    verifyOtp: async (code: string, purpose?: string): Promise<AuthResponse> => {
        const res = await api.post<AuthResponse>('/auth/verify-otp', { code, purpose });
        return res.data;
    },

    googleLogin: async (credential: string): Promise<AuthResponse> => {
        const res = await api.post<AuthResponse>('/auth/google', { credential });
        return res.data;
    },

    forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
        const res = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
        return res.data;
    },

    verifyResetOtp: async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
        const res = await api.post<{ success: boolean; message: string }>('/auth/verify-reset-otp', { email, code });
        return res.data;
    },

    resetPassword: async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        const res = await api.post<{ success: boolean; message: string }>('/auth/reset-password', { email, newPassword });
        return res.data;
    },

    updatePassword: async (newPassword: string): Promise<{ success: boolean; message: string }> => {
        const res = await api.post<{ success: boolean; message: string }>('/auth/update-password', { newPassword });
        return res.data;
    }
};
