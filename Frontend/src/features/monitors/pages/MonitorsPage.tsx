import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitorService } from '../services/monitorService';
import { Plus, Trash2, Globe, Clock, ShieldAlert, X, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';

export const MonitorsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal Form State
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [interval, setInterval] = useState(5);

    // Fetch user projects
    const { data: projects, isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: monitorService.getProjects,
        onSuccess: (data) => {
            if (data.length > 0 && !selectedProjectId) {
                setSelectedProjectId(data[0].id);
            }
        }
    });

    // Fetch endpoints under selected project
    const { data: endpoints, isLoading: endpointsLoading } = useQuery({
        queryKey: ['endpoints', selectedProjectId],
        queryFn: () => monitorService.getEndpoints(selectedProjectId),
        enabled: !!selectedProjectId
    });

    // Mutate to create endpoint
    const createEndpointMutation = useMutation({
        mutationFn: monitorService.createEndpoint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['endpoints', selectedProjectId] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Endpoint monitor registered successfully!');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to create endpoint monitor';
            toast.error(msg);
        }
    });

    // Mutate to delete endpoint
    const deleteEndpointMutation = useMutation({
        mutationFn: monitorService.deleteEndpoint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['endpoints', selectedProjectId] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Endpoint monitor cancelled successfully');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to delete endpoint';
            toast.error(msg);
        }
    });

    const resetForm = () => {
        setName('');
        setUrl('');
        setInterval(5);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !url || !interval || !selectedProjectId) {
            toast.error('All fields are required');
            return;
        }

        createEndpointMutation.mutate({
            name,
            url,
            interval,
            projectId: selectedProjectId
        });
    };

    if (projectsLoading) {
        return <SkeletonLoader />;
    }

    if (projects && projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
    }

    return (
        <div className="space-y-10 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">API Monitors</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure periodic check runs for targeted web URLs
                    </p>
                </div>
                {selectedProjectId && (
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center space-x-2 shadow-sm shadow-blue-100 cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Add Endpoint</span>
                    </button>
                )}
            </div>

            {/* Project Selection Dropdown */}
            <div className="flex items-center space-x-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <FolderOpen size={20} className="text-slate-400" />
                <div className="w-64">
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                        {projects && projects.length > 0 ? (
                            projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))
                        ) : (
                            <option value="">-- No Projects Created --</option>
                        )}
                    </select>
                </div>
                {!selectedProjectId && (
                    <p className="text-sm text-slate-500 font-medium animate-pulse">
                        ⚠️ Please create a project from the Dashboard page first.
                    </p>
                )}
            </div>

            {/* List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">Configured Endpoints</h2>
                    <p className="text-slate-500 text-xs">Monitored ping endpoints in this project workspace</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50/20">
                                <th className="py-4 px-6">Endpoint</th>
                                <th className="py-4 px-6">Method</th>
                                <th className="py-4 px-6">Interval Frequency</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {endpointsLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        Loading endpoints list...
                                    </td>
                                </tr>
                            ) : endpoints && endpoints.length > 0 ? (
                                endpoints.map((endpoint) => (
                                    <tr key={endpoint.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="py-4 px-6 flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Globe size={16} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 truncate max-w-sm" title={endpoint.url}>
                                                    {endpoint.name}
                                                </div>
                                                <div className="text-slate-400 text-xs mt-0.5 font-mono max-w-xs truncate" title={endpoint.url}>
                                                    {endpoint.url}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-slate-500">
                                            {endpoint.method}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-slate-600">
                                            Every {endpoint.interval} min
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                endpoint.status === 'UP'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : endpoint.status === 'DOWN'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {endpoint.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to cancel this monitor check?')) {
                                                        deleteEndpointMutation.mutate(endpoint.id);
                                                    }
                                                }}
                                                className="p-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-all duration-150 cursor-pointer shadow-sm"
                                                title="Delete Monitor"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-mono text-xs">
                                        No endpoint health checks scheduled under this project.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-8 shadow-xl space-y-6 relative">
                        {/* Close button */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Schedule Endpoint Monitor</h3>
                            <p className="text-slate-400 text-xs mt-1">Configure check intervals for database pings</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Monitor Name */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                    Monitor Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Auth Service Ping"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                />
                            </div>

                            {/* URL Target */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                    Target URL
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://my-api.com/health"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                />
                            </div>

                            {/* Interval input */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                    Ping Interval (Minutes)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={interval}
                                    onChange={(e) => setInterval(parseInt(e.target.value, 10))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={createEndpointMutation.isPending}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-4 shadow-sm"
                            >
                                {createEndpointMutation.isPending ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <Clock size={18} />
                                        <span>Schedule Monitor</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
