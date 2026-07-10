import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { monitorService } from '../services/monitorService';
import { ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';

export const MonitorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Fetch endpoint metadata details
    const { data: endpoint, isLoading: endpointLoading } = useQuery({
        queryKey: ['endpoint', id],
        queryFn: () => monitorService.getEndpointDetails(id!),
        enabled: !!id
    });

    // Fetch response logs for this specific endpoint
    const { data: responses, isLoading: responsesLoading } = useQuery({
        queryKey: ['responses', id],
        queryFn: () => monitorService.getResponses(id!),
        enabled: !!id,
        refetchInterval: 10000 // Poll responses every 10s
    });

    if (endpointLoading || responsesLoading || !endpoint) {
        return <SkeletonLoader />;
    }

    // Calculations
    const totalRuns = responses?.length ?? 0;
    const successfulRuns = responses?.filter((r) => r.status === 'UP').length ?? 0;
    const failedRuns = totalRuns - successfulRuns;
    const uptimeRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;
    
    const validLatencies = responses?.filter((r) => r.responseTime !== null).map((r) => r.responseTime!) ?? [];
    const avgLatency = validLatencies.length > 0 
        ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) 
        : 0;

    // Latency Chart Data (Latest 20 responses, reversed for chronologic order left-to-right)
    const chartData = [...(responses ?? [])].slice(0, 20).reverse();
    const maxLatency = validLatencies.length > 0 ? Math.max(...validLatencies) : 200;

    // SVG Line chart layout parameters
    const chartWidth = 800;
    const chartHeight = 160; // slightly reduced height
    const paddingX = 0; // zero horizontal padding for edge-to-edge line plotting
    const paddingY = 8; // minimal vertical padding to ensure marker dots do not clip at top/bottom edges

    const points = chartData.map((data, idx) => {
        const x = paddingX + (idx / Math.max(chartData.length - 1, 1)) * (chartWidth - paddingX * 2);
        const latencyVal = data.responseTime ?? 0;
        const y = chartHeight - paddingY - (maxLatency > 0 ? (latencyVal / maxLatency) : 0) * (chartHeight - paddingY * 2);
        return { x, y, data };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0 
        ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
        : '';

    return (
        <div className="space-y-10 w-full">
            {/* Header / Back Link */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-extrabold text-slate-900 truncate max-w-lg" title={endpoint.url}>
                            {endpoint.name}
                        </h1>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            endpoint.status === 'UP'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : endpoint.status === 'DOWN'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                            {endpoint.status}
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 font-mono">Target URL: {endpoint.url}</p>
                </div>
            </div>

            {/* Quick Metrics Bento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            {/* Custom SVG Latency Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 pb-2">
                    <h3 className="text-sm font-bold text-slate-900">Latency History (ms)</h3>
                    <p className="text-slate-400 text-xs">Response time trends for the latest 20 checks (newer to the right)</p>
                </div>

                <div className="w-full h-52 flex items-center justify-center bg-slate-50/20 relative overflow-hidden border-t border-slate-100">
                    {chartData.length > 0 ? (
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="latency-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid Guidelines */}
                            <line x1={0} y1={paddingY} x2={chartWidth} y2={paddingY} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1={0} y1={(chartHeight - paddingY * 2) / 2 + paddingY} x2={chartWidth} y2={(chartHeight - paddingY * 2) / 2 + paddingY} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />

                            {/* Area gradient under line */}
                            {areaPath && (
                                <path d={areaPath} fill="url(#latency-area-gradient)" />
                            )}

                            {/* Connecting Line */}
                            {linePath && (
                                <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            )}

                            {/* Circles representing points */}
                            {points.map((p) => (
                                <g key={p.data.id} className="group cursor-pointer">
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="6"
                                        className={`transition-all duration-150 group-hover:r-8 stroke-white stroke-2 ${
                                            p.data.status === 'UP' ? 'fill-emerald-500' : 'fill-rose-500'
                                        }`}
                                    />
                                    {/* Built-in tooltip */}
                                    <title>
                                        {`Latency: ${p.data.responseTime ?? 'N/A'}ms\nStatus: ${p.data.status}\nTime: ${new Date(p.data.createdAt).toLocaleTimeString()}`}
                                    </title>
                                </g>
                            ))}
                        </svg>
                    ) : (
                        <div className="text-slate-400 font-mono text-xs">
                            Waiting for check responses to build latency chart...
                        </div>
                    )}
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">Historical Check Logs</h2>
                    <p className="text-slate-500 text-xs">Chronological trace logs of all health status checks</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50/20">
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Response Time</th>
                                <th className="py-4 px-6">Status Code</th>
                                <th className="py-4 px-6">Log Message / Error</th>
                                <th className="py-4 px-6">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {responses && responses.length > 0 ? (
                                responses.map((res) => (
                                    <tr key={res.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="flex items-center space-x-2">
                                                {res.status === 'UP' ? (
                                                    <ShieldCheck size={16} className="text-emerald-500" />
                                                ) : (
                                                    <ShieldAlert size={16} className="text-rose-500" />
                                                )}
                                                <span className={`text-xs font-semibold ${
                                                    res.status === 'UP' ? 'text-emerald-700' : 'text-rose-700'
                                                }`}>
                                                    {res.status}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-700 text-xs">
                                            {res.responseTime ? `${res.responseTime}ms` : 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-600 text-xs">
                                            {res.statusCode || 'Timeout/Error'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 font-mono text-xs max-w-sm truncate" title={res.error || 'Check completed successfully'}>
                                            {res.error || 'Check completed successfully'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 text-xs">
                                            {new Date(res.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-mono text-xs">
                                        No response history logged yet for this monitor check.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
