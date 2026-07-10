import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { monitorService } from '../services/monitorService';
import { Folder, Activity, ShieldAlert, Heart, Plus, Trash2, ArrowUpRight, FolderOpen, X } from 'lucide-react';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    
    // Form state
    const [projName, setProjName] = useState('');
    const [projDesc, setProjDesc] = useState('');

    // Fetch stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: monitorService.getStats,
        refetchInterval: 10000
    });

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
        enabled: !!selectedProjectId,
        refetchInterval: 10000
    });

    // Project mutation
    const createProjectMutation = useMutation({
        mutationFn: monitorService.createProject,
        onSuccess: (newProj) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            setSelectedProjectId(newProj.id);
            setIsProjectModalOpen(false);
            setProjName('');
            setProjDesc('');
            toast.success('Project created successfully!');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to create project';
            toast.error(msg);
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: monitorService.deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            setSelectedProjectId('');
            toast.success('Project deleted successfully');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to delete project';
            toast.error(msg);
        }
    });

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projName) {
            toast.error('Project name is required');
            return;
        }
        createProjectMutation.mutate({ name: projName, description: projDesc });
    };

    if (statsLoading || projectsLoading) {
        return <SkeletonLoader />;
    }

    // Auto-select first project if none selected but projects exist
    if (projects && projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
    }

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

    const activeProject = projects?.find((p) => p.id === selectedProjectId);

    return (
        <div className="space-y-10 w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Status Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Real-time status tracking and latency stats across user projects
                    </p>
                </div>
                <button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center space-x-2 shadow-sm shadow-blue-100 cursor-pointer"
                >
                    <Plus size={18} />
                    <span>New Project</span>
                </button>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            {/* Project Selection Dropdown */}
            <div className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-4 flex-1">
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
                </div>

                {activeProject && (
                    <button
                        onClick={() => {
                            if (confirm('Delete this project and all its monitored endpoints?')) {
                                deleteProjectMutation.mutate(activeProject.id);
                            }
                        }}
                        className="px-3.5 py-2 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-150 cursor-pointer shadow-sm"
                        title="Delete active project"
                    >
                        <Trash2 size={14} />
                        <span>Delete Project</span>
                    </button>
                )}
            </div>

            {/* Endpoints table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Project Endpoints</h2>
                        <p className="text-slate-500 text-xs">
                            {activeProject ? `Monitors running under "${activeProject.name}"` : 'Select a project to view endpoint targets'}
                        </p>
                    </div>
                    {selectedProjectId && (
                        <button
                            onClick={() => navigate('/monitors')}
                            className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-150 cursor-pointer shadow-sm"
                        >
                            <span>Manage Endpoints</span>
                            <ArrowUpRight size={14} />
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50/20">
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6">Endpoint Name</th>
                                <th className="py-4 px-6">Target URL</th>
                                <th className="py-4 px-6">Method</th>
                                <th className="py-4 px-6">Interval</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {endpointsLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        Loading endpoint monitors...
                                    </td>
                                </tr>
                            ) : endpoints && endpoints.length > 0 ? (
                                endpoints.map((endpoint) => (
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
                                        <td className="py-4 px-6 font-bold text-slate-900">
                                            {endpoint.name}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 font-mono text-xs max-w-xs truncate">
                                            {endpoint.url}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-slate-500">
                                            {endpoint.method}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 text-xs font-mono">
                                            Every {endpoint.interval} min
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
                                        {selectedProjectId
                                            ? 'No endpoints registered under this project. Add an endpoint check to start.'
                                            : 'Please select or create a project to view endpoint checks.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Project Modal */}
            {isProjectModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-8 shadow-xl space-y-6 relative">
                        <button
                            onClick={() => setIsProjectModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Create New Project</h3>
                            <p className="text-slate-400 text-xs mt-1">Group your microservice health checkers together</p>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Production APIs"
                                    value={projName}
                                    onChange={(e) => setProjName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                    Description
                                </label>
                                <textarea
                                    placeholder="Brief details about the project"
                                    value={projDesc}
                                    onChange={(e) => setProjDesc(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 h-24"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={createProjectMutation.isPending}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
                            >
                                {createProjectMutation.isPending ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <span>Create Project</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
