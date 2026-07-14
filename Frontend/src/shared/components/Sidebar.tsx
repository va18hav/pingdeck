import React, { useState } from 'react';
import { NavLink, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Folder as FolderIcon, 
    LogOut, 
    Activity, 
    ChevronRight, 
    ChevronDown, 
    Plus, 
    FolderPlus, 
    Trash2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../features/auth/hooks/useAuth';
import { useGetProjects } from '../../features/projects/hooks/useProjects';
import { useGetProjectFolders, useDeleteFolder } from '../../features/projects/hooks/useFolders';
import { useGetProjectEndpoints, useDeleteEndpoint } from '../../features/projects/hooks/useProjects';
import { CreateFolderModal } from '../../features/projects/components/CreateFolderModal';
import { CreateEndpointModal } from '../../features/projects/components/CreateEndpointModal';
import type { Folder } from '../../features/projects/types/folder.types';
import type { Endpoint } from '../../features/projects/types/project.types';

export const Sidebar: React.FC = () => {
    const { user } = useAuthStore();
    const logoutMutation = useLogout();
    const navigate = useNavigate();
    const { id: projectId } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedEndpointId = searchParams.get('endpointId');

    const isProjectView = !!projectId && window.location.pathname.startsWith('/projects/');

    // Modals state
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
    const [activeParentFolderId, setActiveParentFolderId] = useState<string | null>(null);

    // Queries
    const { data: projects } = useGetProjects();
    const activeProject = projects?.find(p => p.id === projectId);

    const { data: folders = [] } = useGetProjectFolders(projectId || '');
    const { data: endpoints = [] } = useGetProjectEndpoints(projectId || '');

    // Mutations
    const deleteFolderMutation = useDeleteFolder(projectId || '');
    const deleteEndpointMutation = useDeleteEndpoint(projectId || '');

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    const handleSelectEndpoint = (endpointId: string) => {
        setSearchParams({ endpointId });
    };

    const openCreateFolder = (parentId: string | null = null) => {
        setActiveParentFolderId(parentId);
        setIsFolderModalOpen(true);
    };

    const openCreateEndpoint = (folderId: string | null = null) => {
        setActiveParentFolderId(folderId);
        setIsEndpointModalOpen(true);
    };

    const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this folder and all its contents?')) {
            deleteFolderMutation.mutate(id);
        }
    };

    const handleDeleteEndpoint = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to cancel and delete this monitor?')) {
            deleteEndpointMutation.mutate(id);
            if (selectedEndpointId === id) {
                searchParams.delete('endpointId');
                setSearchParams(searchParams);
            }
        }
    };

    const linkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isActive
                ? 'bg-blue-50/80 text-blue-600 shadow-sm shadow-blue-50/50'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;

    return (
        <aside className="w-76 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none shadow-sm">
            {/* Header / Brand */}
            <div className="p-5 border-b border-slate-100">
                <div 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center space-x-2.5 text-blue-600 font-extrabold text-xl font-mono cursor-pointer hover:opacity-85 transition-opacity"
                >
                    <Activity size={24} className="stroke-[2.5]" />
                    <span>PingLoop</span>
                </div>
            </div>

            {/* Navigation links & Dynamic Tree */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div className="space-y-1.5">
                    <NavLink to="/dashboard" className={linkClasses}>
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/projects" className={linkClasses}>
                        <FolderIcon size={18} />
                        <span>Projects</span>
                    </NavLink>
                </div>

                {isProjectView && activeProject && (
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono truncate max-w-[170px]" title={activeProject.name}>
                                {activeProject.name}
                            </span>
                            <div className="flex items-center space-x-1">
                                <button 
                                    onClick={() => openCreateFolder(null)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    title="Add Folder"
                                >
                                    <FolderPlus size={14} />
                                </button>
                                <button 
                                    onClick={() => openCreateEndpoint(null)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    title="Add Request"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Explorer Tree Panel */}
                        <div className="space-y-1 px-1">
                            <ExplorerTree 
                                folders={folders}
                                endpoints={endpoints}
                                parentId={null}
                                depth={0}
                                selectedEndpointId={selectedEndpointId}
                                onSelectEndpoint={handleSelectEndpoint}
                                onAddSubfolder={openCreateFolder}
                                onAddEndpoint={openCreateEndpoint}
                                onDeleteFolder={handleDeleteFolder}
                                onDeleteEndpoint={handleDeleteEndpoint}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* User details & logout */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="px-3 py-2 mb-3 bg-white border border-slate-100 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Account
                    </div>
                    <div className="text-xs font-bold text-slate-700 truncate mt-0.5" title={user?.email}>
                        {user?.email}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>

            {/* Folder Modal */}
            {projectId && (
                <CreateFolderModal 
                    isOpen={isFolderModalOpen}
                    onClose={() => setIsFolderModalOpen(false)}
                    projectId={projectId}
                    parentId={activeParentFolderId}
                />
            )}

            {/* Endpoint Modal */}
            {projectId && (
                <CreateEndpointModal 
                    isOpen={isEndpointModalOpen}
                    onClose={() => setIsEndpointModalOpen(false)}
                    projectId={projectId}
                    folderId={activeParentFolderId}
                />
            )}
        </aside>
    );
};

// Tree Helper Component
interface ExplorerTreeProps {
    folders: Folder[];
    endpoints: Endpoint[];
    parentId: string | null;
    depth: number;
    selectedEndpointId: string | null;
    onSelectEndpoint: (id: string) => void;
    onAddSubfolder: (id: string) => void;
    onAddEndpoint: (id: string) => void;
    onDeleteFolder: (id: string, e: React.MouseEvent) => void;
    onDeleteEndpoint: (id: string, e: React.MouseEvent) => void;
}

const ExplorerTree: React.FC<ExplorerTreeProps> = ({
    folders,
    endpoints,
    parentId,
    depth,
    selectedEndpointId,
    onSelectEndpoint,
    onAddSubfolder,
    onAddEndpoint,
    onDeleteFolder,
    onDeleteEndpoint
}) => {
    const currentFolders = folders.filter(f => f.parentId === parentId);
    const currentEndpoints = endpoints.filter(e => e.folderId === parentId);

    if (currentFolders.length === 0 && currentEndpoints.length === 0) {
        if (depth > 0) return <div className="text-[11px] text-slate-400/70 italic select-none pl-6 py-1">Empty Folder</div>;
        return <div className="text-xs text-slate-400 italic select-none text-center py-6">No monitors scheduled</div>;
    }

    return (
        <div className="space-y-0.5">
            {currentFolders.map(folder => (
                <FolderNode 
                    key={folder.id}
                    folder={folder}
                    folders={folders}
                    endpoints={endpoints}
                    depth={depth}
                    selectedEndpointId={selectedEndpointId}
                    onSelectEndpoint={onSelectEndpoint}
                    onAddSubfolder={onAddSubfolder}
                    onAddEndpoint={onAddEndpoint}
                    onDeleteFolder={onDeleteFolder}
                    onDeleteEndpoint={onDeleteEndpoint}
                />
            ))}

            {currentEndpoints.map(endpoint => {
                const methodColors: Record<string, string> = {
                    GET: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
                    POST: 'text-amber-600 bg-amber-50 border border-amber-100',
                    PUT: 'text-blue-600 bg-blue-50 border border-blue-100',
                    PATCH: 'text-purple-600 bg-purple-50 border border-purple-100',
                    DELETE: 'text-rose-600 bg-rose-50 border border-rose-100'
                };
                
                const isSelected = selectedEndpointId === endpoint.id;
                
                return (
                    <div
                        key={endpoint.id}
                        onClick={() => onSelectEndpoint(endpoint.id)}
                        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
                        className={`group flex items-center justify-between pr-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                            isSelected 
                                ? 'bg-slate-100/80 text-slate-900 border-l-[3px] border-blue-600 rounded-l-none'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <div className="flex items-center space-x-2 truncate">
                            <span className={`text-[9px] font-extrabold px-1 py-0.5 rounded uppercase ${methodColors[endpoint.method] || 'text-slate-500 bg-slate-50'}`}>
                                {endpoint.method}
                            </span>
                            <span className="truncate">{endpoint.name}</span>
                        </div>
                        <button 
                            onClick={(e) => onDeleteEndpoint(endpoint.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all cursor-pointer shrink-0"
                            title="Delete monitor"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

// Folder Node Node component
interface FolderNodeProps {
    folder: Folder;
    folders: Folder[];
    endpoints: Endpoint[];
    depth: number;
    selectedEndpointId: string | null;
    onSelectEndpoint: (id: string) => void;
    onAddSubfolder: (id: string) => void;
    onAddEndpoint: (id: string) => void;
    onDeleteFolder: (id: string, e: React.MouseEvent) => void;
    onDeleteEndpoint: (id: string, e: React.MouseEvent) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
    folder,
    folders,
    endpoints,
    depth,
    selectedEndpointId,
    onSelectEndpoint,
    onAddSubfolder,
    onAddEndpoint,
    onDeleteFolder,
    onDeleteEndpoint
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-0.5 animate-fade-in">
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{ paddingLeft: `${(depth * 12) + 4}px` }}
                className="group flex items-center justify-between pr-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-all duration-150"
            >
                <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-slate-400 shrink-0">
                        {isOpen ? <ChevronDown size={14} className="animate-spin-once" /> : <ChevronRight size={14} />}
                    </span>
                    <FolderIcon size={14} className="text-blue-500/80 shrink-0 fill-blue-50" />
                    <span className="truncate">{folder.name}</span>
                </div>
                <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddSubfolder(folder.id); }}
                        className="p-0.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                        title="New Folder"
                    >
                        <FolderPlus size={11} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddEndpoint(folder.id); }}
                        className="p-0.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                        title="New Request"
                    >
                        <Plus size={11} />
                    </button>
                    <button 
                        onClick={(e) => onDeleteFolder(folder.id, e)}
                        className="p-0.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Delete Folder"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="relative border-l border-slate-100 ml-3.5 pl-0.5">
                    <ExplorerTree 
                        folders={folders}
                        endpoints={endpoints}
                        parentId={folder.id}
                        depth={depth + 1}
                        selectedEndpointId={selectedEndpointId}
                        onSelectEndpoint={onSelectEndpoint}
                        onAddSubfolder={onAddSubfolder}
                        onAddEndpoint={onAddEndpoint}
                        onDeleteFolder={onDeleteFolder}
                        onDeleteEndpoint={onDeleteEndpoint}
                    />
                </div>
            )}
        </div>
    );
};
