import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Plus, Terminal, FolderPlus } from 'lucide-react';
import { useGetProjects, useGetProjectEndpoints, useGetLastOpenedEndpoint, useSetLastOpenedEndpoint } from '../hooks/useProjects';
import { useGetProjectFolders } from '../hooks/useFolders';
import { CreateEndpointModal } from '../components/CreateEndpointModal';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { RequestPanel } from '../components/RequestPanel';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';
import type { Endpoint } from '../types/project.types';
import type { Folder } from '../types/folder.types';

// Helper to choose the first file in the first folder, or first flat file
const getFallbackEndpointId = (endpoints: Endpoint[], folders: Folder[]): string | null => {
    if (!endpoints || endpoints.length === 0) return null;
    
    if (folders && folders.length > 0) {
        for (const folder of folders) {
            const folderEndpoints = endpoints.filter(e => e.folderId === folder.id);
            if (folderEndpoints.length > 0) {
                return folderEndpoints[0].id;
            }
        }
    }
    
    return endpoints[0].id;
};

export const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedEndpointId = searchParams.get('endpointId');
    const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

    // Fetch projects to find the metadata of the current active project
    const { data: projects, isLoading: projectsLoading } = useGetProjects();
    const project = projects?.find((p) => p.id === id);

    // Fetch endpoints under this project
    const { data: endpoints, isLoading: endpointsLoading } = useGetProjectEndpoints(id!);

    // Fetch folders to calculate correct first-file fallback order
    const { data: folders = [], isLoading: foldersLoading } = useGetProjectFolders(id!);

    // Query for last-opened endpoint stored in Redis
    const { data: lastOpenedId, isLoading: lastOpenedLoading } = useGetLastOpenedEndpoint(id!);
    const setLastOpenedMutation = useSetLastOpenedEndpoint(id!);

    // Update last-opened request whenever selection changes
    useEffect(() => {
        if (id && selectedEndpointId) {
            setLastOpenedMutation.mutate(selectedEndpointId);
        }
    }, [id, selectedEndpointId]);

    // Perform redirect to last opened / first fallback request
    useEffect(() => {
        if (!selectedEndpointId && endpoints && endpoints.length > 0 && !lastOpenedLoading) {
            const hasLastOpened = lastOpenedId && endpoints.some(e => e.id === lastOpenedId);
            if (hasLastOpened) {
                setSearchParams({ endpointId: lastOpenedId }, { replace: true });
            } else {
                const fallbackId = getFallbackEndpointId(endpoints, folders);
                if (fallbackId) {
                    setSearchParams({ endpointId: fallbackId }, { replace: true });
                }
            }
        }
    }, [selectedEndpointId, endpoints, lastOpenedId, lastOpenedLoading, folders, setSearchParams]);

    if (projectsLoading || endpointsLoading || foldersLoading || lastOpenedLoading || !project) {
        return <SkeletonLoader />;
    }

    // If an endpoint is selected, show the configuration workspace panel
    if (selectedEndpointId) {
        const activeEndpoint = endpoints?.find(e => e.id === selectedEndpointId);
        
        return (
            <div className="-mt-6 h-[calc(100vh-50px)] flex flex-col overflow-hidden space-y-3 py-2 w-full">
                <div className="flex items-center space-x-3 text-slate-400 text-xs font-semibold shrink-0">
                    <span>Projects</span>
                    <span>/</span>
                    <span className="text-slate-500 font-bold">{project.name}</span>
                    <span>/</span>
                    <span className="text-slate-800 font-extrabold">{activeEndpoint?.name || 'Loading request...'}</span>
                </div>
                
                {activeEndpoint ? (
                    <RequestPanel endpoint={activeEndpoint} projectId={id!} />
                ) : (
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                        <SkeletonLoader />
                    </div>
                )}
            </div>
        );
    }

    // Empty state fallback when no endpoints are registered in this project
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed animate-fade-in max-w-4xl mx-auto my-12 text-center space-y-6">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <Terminal size={40} className="text-blue-600 stroke-[1.5]" />
            </div>

            <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-slate-800">Empty Workspace</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                    Create a new request in this project to start executing APIs, inspecting responses, and registering uptime schedules.
                </p>
            </div>

            <div className="flex items-center space-x-3 mt-2">
                <button
                    onClick={() => setIsFolderModalOpen(true)}
                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition-all duration-150 flex items-center space-x-2 cursor-pointer"
                >
                    <FolderPlus size={16} />
                    <span>Create Folder</span>
                </button>

                <button
                    onClick={() => setIsEndpointModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all duration-150 flex items-center space-x-2 cursor-pointer"
                >
                    <Plus size={16} />
                    <span>Create Request</span>
                </button>
            </div>

            {/* Create Endpoint Modal */}
            <CreateEndpointModal
                isOpen={isEndpointModalOpen}
                onClose={() => setIsEndpointModalOpen(false)}
                projectId={id!}
            />

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                projectId={id!}
                parentId={null}
            />
        </div>
    );
};
