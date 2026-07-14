import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { useGetProjects, useGetProjectEndpoints, useDeleteProject } from '../hooks/useProjects';
import { EndpointsTable } from '../components/EndpointsTable';
import { CreateEndpointModal } from '../components/CreateEndpointModal';
import { RequestPanel } from '../components/RequestPanel';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';

export const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedEndpointId = searchParams.get('endpointId');
    const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);

    // Fetch projects to find the metadata of the current active project
    const { data: projects, isLoading: projectsLoading } = useGetProjects();
    const project = projects?.find((p) => p.id === id);

    // Fetch endpoints under this project
    const { data: endpoints, isLoading: endpointsLoading } = useGetProjectEndpoints(id!);

    // Mutation to delete the active project
    const deleteProjectMutation = useDeleteProject(() => {
        navigate('/projects');
    });

    const handleDeleteProject = () => {
        if (confirm('Are you sure you want to delete this project and all of its monitored endpoints?')) {
            deleteProjectMutation.mutate(id!);
        }
    };

    if (projectsLoading || !project) {
        return <SkeletonLoader />;
    }

    // If an endpoint is selected, show the configuration workspace panel (built in Step 3)
    if (selectedEndpointId) {
        const activeEndpoint = endpoints?.find(e => e.id === selectedEndpointId);
        
        return (
            <div className="-mt-6 h-[calc(100vh-80px)] flex flex-col overflow-hidden space-y-3 py-2 w-full">
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

    return (
        <div className="space-y-10 w-full animate-fade-in">
            {/* Header / Back Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/projects')}
                        className="p-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{project.name}</h1>
                        {project.description && (
                            <p className="text-slate-500 text-sm mt-0.5 max-w-xl truncate" title={project.description}>
                                {project.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsEndpointModalOpen(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center space-x-2 shadow-sm shadow-blue-100 cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Add Endpoint</span>
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        disabled={deleteProjectMutation.isPending}
                        className="px-4 py-2.5 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-150 cursor-pointer shadow-sm"
                        title="Delete project workspace"
                    >
                        <Trash2 size={14} />
                        <span>Delete Workspace</span>
                    </button>
                </div>
            </div>

            {/* Endpoints Table component */}
            <EndpointsTable endpoints={endpoints} projectId={id!} isLoading={endpointsLoading} />

            {/* Create Endpoint Modal */}
            <CreateEndpointModal
                isOpen={isEndpointModalOpen}
                onClose={() => setIsEndpointModalOpen(false)}
                projectId={id!}
            />
        </div>
    );
};
