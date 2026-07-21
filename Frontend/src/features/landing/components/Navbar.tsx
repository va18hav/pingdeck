import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../store/authStore';

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuthStore();
    const hasHint = localStorage.getItem('pingdeck_session_active') === 'true';
    const showDash = isAuthenticated || (isLoading && hasHint);

    return (
        <nav className="fixed top-0 inset-x-0 z-50 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center px-6 lg:px-12">
            <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center space-x-2 font-bold font-mono text-slate-900 hover:text-blue-600 transition-colors duration-150 cursor-pointer"
                >
                    <img src="/logo.png" alt="PingDeck" className="w-7 h-7 object-contain select-none" />
                    <span>PingDeck</span>
                </button>

                <div className="flex items-center gap-2">
                    {isLoading && !hasHint ? (
                        <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                    ) : showDash ? (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer"
                        >
                            Dashboard
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors duration-150 cursor-pointer"
                            >
                                Sign in
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer"
                            >
                                Get started
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
