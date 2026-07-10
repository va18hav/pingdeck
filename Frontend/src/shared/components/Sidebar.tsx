import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, LogOut, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';
import { toast } from 'sonner';

export const Sidebar: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            logout();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (err) {
            toast.error('Logout failed');
        }
    };

    const linkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
                ? 'bg-white border border-slate-200 text-blue-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;

    return (
        <aside className="w-70 bg-slate-50 border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shrink-0">
            {/* Header / Brand */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3 text-blue-600 font-bold text-lg font-mono">
                    <ShieldAlert size={26} className="stroke-[2.5]" />
                    <span>API GUARD</span>
                </div>
                <div className="text-slate-400 text-xs mt-1 uppercase font-semibold tracking-wider font-mono">
                    Distributed Uptime
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 p-4 space-y-2">
                <NavLink to="/dashboard" className={linkClasses}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/monitors" className={linkClasses}>
                    <Activity size={20} />
                    <span>Endpoints</span>
                </NavLink>
            </nav>

            {/* User details & logout */}
            <div className="p-4 border-t border-slate-200 bg-slate-100/50">
                <div className="px-4 py-2 mb-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Account
                    </div>
                    <div className="text-sm font-semibold text-slate-700 truncate" title={user?.email}>
                        {user?.email}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};
