import React from 'react';
import type { MonitorResponse } from '../types/monitor.types';

interface UptimeStatsProps {
    responses?: MonitorResponse[];
}

export const UptimeStats: React.FC<UptimeStatsProps> = ({ responses }) => {
    const totalRuns = responses?.length ?? 0;
    const successfulRuns = responses?.filter((r) => r.status === 'UP').length ?? 0;
    const failedRuns = totalRuns - successfulRuns;
    const uptimeRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;
    
    const validLatencies = responses?.filter((r) => r.responseTime !== null).map((r) => r.responseTime!) ?? [];
    const avgLatency = validLatencies.length > 0 
        ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) 
        : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    UPTIME HEALTH
                </span>
                <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold text-slate-900">{uptimeRate}%</span>
                    <span className="text-slate-400 text-xs font-medium">rate</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    AVG LATENCY
                </span>
                <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold text-slate-900">{avgLatency}ms</span>
                    <span className="text-slate-400 text-xs font-medium">response</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    TOTAL RUNS
                </span>
                <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold text-slate-900">{totalRuns}</span>
                    <span className="text-slate-400 text-xs font-medium">checks</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    ALERTS DISPATCHED
                </span>
                <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold text-rose-600">{failedRuns}</span>
                    <span className="text-slate-400 text-xs font-medium">failures</span>
                </div>
            </div>
        </div>
    );
};
