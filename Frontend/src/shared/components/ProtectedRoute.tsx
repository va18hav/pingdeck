import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useVerifySession } from '../../features/auth/hooks/useAuth';


export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const location = useLocation();

    // Trigger session validation query (syncs with the store inside the hook)
    useVerifySession();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
                <img src="/logo.png" alt="PingDeck" className="w-16 h-16 object-contain animate-pulse select-none" />
                <div className="text-slate-500 font-mono text-sm font-semibold tracking-widest animate-pulse">
                    VERIFYING PINGDECK SECURE ROUTE...
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Force email verification if authenticated but not verified
    if (!user?.isVerified && location.pathname !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }

    // Redirect verified users trying to access verify page back to dashboard
    if (user?.isVerified && location.pathname === '/verify-email') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

