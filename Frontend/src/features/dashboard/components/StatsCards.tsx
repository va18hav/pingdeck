import React from 'react';
import { Folder, Activity, Heart, ShieldAlert } from 'lucide-react';
import type { MonitorStats } from '../types/dashboard.types';

interface StatsCardsProps {
    stats?: MonitorStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
    const cards = [
        {
            title: 'TOTAL PROJECTS',
            value: stats?.totalProjects ?? 0,
            description: 'Grouped environments',
            icon: Folder,
            color: 'text-blue-600',
            bg: 'bg-blue-50/50'
        },
        {
            title: 'ACTIVE ENDPOINTS',
            value: stats?.totalEndpoints ?? 0,
            description: 'Uptime targets monitored',
            icon: Activity,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50/50'
        },
        {
            title: 'UPTIME AVERAGE',
            value: `${stats?.uptimePercentage ?? 100}%`,
            description: 'Global system health',
            icon: Heart,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50/50'
        },
        {
            title: 'ALERTS DISPATCHED',
            value: stats?.totalAlerts ?? 0,
            description: 'Failure notification logs',
            icon: ShieldAlert,
            color: 'text-rose-600',
            bg: 'bg-rose-50/50'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all duration-200">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                {card.title}
                            </span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg} ${card.color}`}>
                                <Icon size={16} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="text-2xl font-extrabold text-slate-900">{card.value}</div>
                            <div className="text-slate-400 text-xs mt-1">{card.description}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
