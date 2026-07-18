import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { useAuthStore } from '../../../store/authStore';

export const useLogin = () => {
    const { setUser, setLoading } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            // Update Zustand store
            setUser(data.data);
            setLoading(false);

            // Populate the React Query session cache with the authenticated user data
            queryClient.setQueryData(['session'], { success: true, data: data.data });

            toast.success('Welcome to PingDeck!');
            navigate('/dashboard');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Invalid credentials';
            toast.error(message);
        }
    });
};

export const useRegister = () => {
    const { setUser, setLoading } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.register,
        onSuccess: (data) => {
            // Update Zustand store
            setUser(data.data);
            setLoading(false);

            // Populate the React Query session cache with the registered user data
            queryClient.setQueryData(['session'], { success: true, data: data.data });

            toast.success('Registration successful! Welcome to PingDeck.');
            navigate('/dashboard');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Registration failed';
            toast.error(message);
        }
    });
};

export const useLogout = () => {
    const { logout, setLoading } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            // Reset Zustand store
            logout();
            setLoading(true);

            // Evict session query cache data
            queryClient.removeQueries({ queryKey: ['session'] });

            toast.success('Logged out successfully');
            navigate('/login');
        },
        onError: () => {
            toast.error('Logout failed');
        }
    });
};

export const useVerifySession = () => {
    const { isLoading, setUser, setLoading } = useAuthStore();

    const query = useQuery({
        queryKey: ['session'],
        queryFn: authService.getMe,
        enabled: isLoading,
        retry: false
    });

    useEffect(() => {
        if (query.isSuccess && query.data) {
            setUser(query.data.data);
            setLoading(false);
        } else if (query.isError) {
            setUser(null);
            setLoading(false);
        }
    }, [query.isSuccess, query.isError, query.data, setUser, setLoading]);

    return query;
};

export const useSendOtp = () => {
    return useMutation({
        mutationFn: authService.sendOtp,
        onSuccess: (data) => {
            toast.success(data.message || 'Verification code sent to your email!');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to send verification code';
            toast.error(message);
        }
    });
};

export const useVerifyOtp = () => {
    const { setUser } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ code, purpose }: { code: string; purpose?: string }) => authService.verifyOtp(code, purpose),
        onSuccess: (data, variables) => {
            if (variables.purpose === 'update-password') {
                toast.success('Identity verified. You can now update your password.');
            } else {
                setUser(data.data);
                queryClient.setQueryData(['session'], { success: true, data: data.data });
                toast.success('Email verified successfully! Welcome.');
                navigate('/dashboard');
            }
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Verification failed';
            toast.error(message);
        }
    });
};

export const useGoogleLogin = () => {
    const { setUser, setLoading } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.googleLogin,
        onSuccess: (data) => {
            setUser(data.data);
            setLoading(false);
            queryClient.setQueryData(['session'], { success: true, data: data.data });
            toast.success('Welcome to PingDeck!');
            navigate('/dashboard');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Google login failed';
            toast.error(message);
        }
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: authService.forgotPassword,
        onSuccess: (data) => {
            toast.success(data.message || 'Reset code sent to your email!');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to send reset code';
            toast.error(message);
        }
    });
};

export const useVerifyResetOtp = () => {
    return useMutation({
        mutationFn: ({ email, code }: { email: string; code: string }) => authService.verifyResetOtp(email, code),
        onSuccess: (data) => {
            toast.success(data.message || 'Verification successful! You can now reset your password.');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Code verification failed';
            toast.error(message);
        }
    });
};

export const useResetPassword = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: ({ email, newPassword }: { email: string; newPassword: string }) => authService.resetPassword(email, newPassword),
        onSuccess: (data) => {
            toast.success(data.message || 'Password reset successfully! Please log in.');
            navigate('/login');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to reset password';
            toast.error(message);
        }
    });
};

export const useUpdatePassword = () => {
    return useMutation({
        mutationFn: authService.updatePassword,
        onSuccess: (data) => {
            toast.success(data.message || 'Password updated successfully!');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to update password';
            toast.error(message);
        }
    });
};
