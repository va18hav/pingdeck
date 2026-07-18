import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStats } from '../hooks/useDashboard';
import { StatsCards } from '../components/StatsCards';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';
import { ShieldCheck, Globe } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: stats, isLoading } = useGetStats();

    if (isLoading) {
        return <SkeletonLoader />;
    }

    const recentEndpoints = stats?.recentEndpoints || [];

    return (
        <div className="space-y-10 w-full animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Status Overview</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Real-time status tracking and latency stats across user projects
                </p>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Recent Endpoints List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">Recent Uptime Targets</h2>
                    <p className="text-slate-500 text-xs">The 5 most recently active monitors across all your workspaces</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50/20">
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Monitor Name</th>
                                <th className="py-4 px-6">Workspace</th>
                                <th className="py-4 px-6">Target URL</th>
                                <th className="py-4 px-6">Method</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {recentEndpoints.length > 0 ? (
                                recentEndpoints.map((endpoint) => (
                                    <tr key={endpoint.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="flex items-center space-x-2">
                                                <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                                                    endpoint.status === 'UP'
                                                        ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                                                        : endpoint.status === 'DOWN'
                                                        ? 'bg-rose-500 shadow-sm shadow-rose-200'
                                                        : 'bg-slate-400'
                                                }`} />
                                                <span className="text-xs font-semibold text-slate-600 font-mono">
                                                    {endpoint.status}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-900 flex items-center space-x-2 mt-1.5">
                                            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Globe size={12} />
                                            </div>
                                            <span className="truncate max-w-[150px]">{endpoint.name}</span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                                            {endpoint.project?.name || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 font-mono text-xs max-w-xs truncate" title={endpoint.url}>
                                            {endpoint.url}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-slate-500">
                                            {endpoint.method}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => navigate(`/monitors/${endpoint.id}`)}
                                                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm"
                                            >
                                                Analysis
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                                        No endpoints scheduled yet. Go to Projects to add endpoint monitor targets.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dashboard Welcome Block */}
            {(!stats?.totalEndpoints || stats.totalEndpoints === 0) && (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={28} className="stroke-[2.5]" />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-lg font-bold text-slate-900">Welcome to PingDeck</h3>
                        <p className="text-sm text-slate-500 max-w-2xl">
                            This dashboard provides a consolidated view of your active environments and monitored target systems. Use the Projects tab in the sidebar navigation to create project groups, register target endpoint checks, and adjust monitoring ping intervals.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
