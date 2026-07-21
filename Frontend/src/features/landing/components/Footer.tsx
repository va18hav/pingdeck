import React from 'react';


export const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200/60 py-10 px-6 lg:px-12 select-none">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-2 font-mono font-bold text-slate-700">
                    <img src="/logo.png" alt="PingDeck" className="w-6 h-6 object-contain select-none" />
                    <span>PingDeck</span>
                </div>

                <div className="text-slate-400 font-mono">
                    Distributed Uptime Monitoring & API Testing Platform
                </div>

                <div className="text-slate-400 font-mono">
                    &copy; 2026 PingDeck. All rights reserved.
                </div>
            </div>
        </footer>
    );
};
