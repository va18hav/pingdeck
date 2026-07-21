import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export const AppLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900 w-full overflow-hidden">
            {/* Mobile Header (visible only below lg screens) */}
            <header className="lg:hidden h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-20 w-full shrink-0 select-none shadow-sm">
                <div 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center space-x-2.5 text-blue-600 font-extrabold text-lg font-mono cursor-pointer"
                >
                    <img src="/logo.png" alt="PingDeck" className="w-7 h-7 object-contain select-none" />
                    <span>PingDeck</span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
                >
                    <Menu size={20} />
                </button>
            </header>

            {/* Sidebar navigation drawer */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main content scroll container */}
            <main className="flex-1 h-[calc(100vh-56px)] lg:h-screen overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 flex justify-center">
                <div className="w-full max-w-6xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
