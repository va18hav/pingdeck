import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

    useEffect(() => {
        const verifySession = async () => {
            try {
                // Fetch authenticated user info to verify session
                const res = await api.get('/auth/me'); // Wait, does /auth/me exist? Let's check scheduler routes or add it!
                setUser(res.data.data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        if (isLoading) {
            verifySession();
        }
    }, [isLoading, setUser, setLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
                <ShieldAlert size={48} className="text-blue-600 animate-bounce" />
                <div className="text-slate-500 font-mono text-sm font-semibold tracking-widest animate-pulse">
                    VERIFYING API GUARD SECURE ROUTE...
                </div>
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
