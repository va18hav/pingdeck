import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cookie, X } from 'lucide-react';
import { 
    useGetEndpoint, 
    useGetResponses, 
    useGetMonitorAuthStatus, 
    useSyncMonitorSession,
    useUpdateMonitor,
    useDeleteMonitor
} from '../hooks/useMonitor';
import { UptimeStats } from '../components/UptimeStats';
import { LatencyChart } from '../components/LatencyChart';
import { CheckLogsTable } from '../components/CheckLogsTable';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';

export const MonitorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Fetch endpoint metadata and responses log using custom hooks
    const { data: endpoint, isLoading: endpointLoading } = useGetEndpoint(id!);
    const { data: responses, isLoading: responsesLoading } = useGetResponses(id!);

    const auth = endpoint?.auth as any;
    const isCookieAuth = auth && auth.type === 'cookie';
    const activeMonitor = endpoint?.monitors?.[0];

    // Fetch cookie auth status if this endpoint relies on cookie session checks
    const { data: authStatus, isLoading: authStatusLoading } = useGetMonitorAuthStatus(id!, !!endpoint && isCookieAuth);
    const syncSessionMutation = useSyncMonitorSession(id!);

    // Delete monitor mutation
    const deleteMonitorMutation = useDeleteMonitor(endpoint?.projectId || '', () => {
        navigate(`/projects/${endpoint?.projectId}`);
    });

    // Update interval modal controls
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [updateInterval, setUpdateInterval] = useState(5);

    useEffect(() => {
        if (activeMonitor) {
            setUpdateInterval(activeMonitor.interval);
        }
    }, [activeMonitor]);

    // Update monitor interval mutation
    const updateMonitorMutation = useUpdateMonitor(
        activeMonitor?.id || '', 
        endpoint?.id || '', 
        endpoint?.projectId || ''
    );

    if (endpointLoading || responsesLoading || (isCookieAuth && authStatusLoading) || !endpoint) {
        return <SkeletonLoader />;
    }

    return (
        <div className="space-y-6 w-full animate-fade-in pb-10">
            {/* Header / Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/projects/${endpoint.projectId}`)}
                        className="p-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-extrabold text-slate-900 truncate max-w-md" title={endpoint.url}>
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

                {/* Actions Grid */}
                {activeMonitor && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => syncSessionMutation.mutate()}
                            disabled={syncSessionMutation.isPending}
                            className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
                            title="Sync cookies from workspace to background monitor jar"
                        >
                            {syncSessionMutation.isPending ? (
                                <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <Cookie size={14} className="text-slate-500" />
                                    <span>Sync Cookies</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setIsUpdateModalOpen(true)}
                            className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                            Update Interval
                        </button>

                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to stop background uptime checks for this endpoint?')) {
                                    deleteMonitorMutation.mutate(activeMonitor.id);
                                }
                            }}
                            disabled={deleteMonitorMutation.isPending}
                            className="px-4 py-2 border border-rose-250 hover:border-rose-350 text-rose-600 hover:bg-rose-50/50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                            {deleteMonitorMutation.isPending ? 'Stopping...' : 'Stop Monitor'}
                        </button>
                    </div>
                )}
            </div>

            {/* Cookie Expiration Warning Banner */}
            {isCookieAuth && authStatus && (authStatus.status === 'expired' || authStatus.status === 'expiring') && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-sm">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-amber-800 flex items-center space-x-1.5">
                            <Cookie size={16} className="text-amber-600 stroke-[2.5]" />
                            <span>Monitor Session Cookies Expiring / Expired</span>
                        </h4>
                        <p className="text-amber-700 text-xs leading-relaxed max-w-2xl">
                            {authStatus.status === 'expired' 
                                ? 'The workspace session cookies copied to this monitor have expired. Scheduled background checks will likely return 401 Unauthorized errors.'
                                : `The session cookies in this monitor will expire in less than ${Math.ceil(authStatus.ttl / 60)} minutes. Sync workspace session cookies now to maintain uptime checks.`
                            }
                        </p>
                    </div>
                    
                    <button
                        onClick={() => syncSessionMutation.mutate()}
                        disabled={syncSessionMutation.isPending}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center space-x-1.5 shrink-0"
                    >
                        {syncSessionMutation.isPending ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>Sync Workspace Session</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Auto-Login Config Status widget card */}
            {isCookieAuth && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                            AUTO-LOGIN SELF-HEALING
                        </span>
                        <div className="flex items-center space-x-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${auth.loginConfig?.url ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                            <span className="text-sm font-bold text-slate-800">
                                {auth.loginConfig?.url ? 'Self-Healing Active' : 'Self-Healing Not Configured'}
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs leading-relaxed max-w-xl mt-1">
                            {auth.loginConfig?.url 
                                ? `Refreshes session cookies automatically using endpoint credentials configured for: ${auth.loginConfig.url}`
                                : 'No login credentials configured. Enable auto-login in the request Auth tab to handle cookie refreshes automatically without manual syncs.'
                            }
                        </p>
                    </div>
                    
                    {!auth.loginConfig?.url && (
                        <button
                            onClick={() => navigate(`/projects/${endpoint.projectId}?endpointId=${endpoint.id}`)}
                            className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 bg-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                            Configure Login
                        </button>
                    )}
                </div>
            )}

            {/* Quick Metrics Bento Card Grid */}
            <UptimeStats responses={responses} />

            {/* Sticky SVG Latency Line Chart */}
            <div className="sticky top-[-16px] sm:top-[-24px] md:top-[-32px] lg:top-[-40px] z-10 bg-slate-50/95 backdrop-blur-md pt-3 pb-4 border-b border-slate-200/40">
                <LatencyChart responses={responses} />
            </div>

            {/* Historical Check Logs Table */}
            <div className="mt-6">
                <CheckLogsTable responses={responses} />
            </div>

            {/* Update Interval Modal */}
            {isUpdateModalOpen && activeMonitor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5">
                            <h3 className="text-sm font-bold text-slate-900">Update Uptime Interval</h3>
                            <button
                                onClick={() => setIsUpdateModalOpen(false)}
                                className="p-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateMonitorMutation.mutate(updateInterval, {
                                    onSuccess: () => {
                                        setIsUpdateModalOpen(false);
                                    }
                                });
                            }}
                            className="p-5 space-y-4"
                        >
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                    Ping Interval
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={updateInterval}
                                        onChange={(e) => setUpdateInterval(parseInt(e.target.value) || 1)}
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                    <span className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs font-bold flex items-center">
                                        Minutes
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsUpdateModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMonitorMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                                >
                                    {updateMonitorMutation.isPending ? 'Saving...' : 'Save Interval'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
