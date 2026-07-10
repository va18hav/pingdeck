import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 w-full overflow-hidden">
            {/* Sidebar navigation */}
            <Sidebar />

            {/* Main content scroll container */}
            <main className="flex-1 h-screen overflow-y-auto p-10 flex justify-center">
                <div className="w-full max-w-6xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
