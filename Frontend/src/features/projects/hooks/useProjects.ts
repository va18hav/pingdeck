import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { toast } from 'sonner';
import type { Endpoint } from '../types/project.types';

export const useGetProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects
    });
};

export const useCreateProject = (onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectService.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Project created successfully!');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to create project';
            toast.error(message);
        }
    });
};

export const useDeleteProject = (onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectService.deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Project deleted successfully');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to delete project';
            toast.error(message);
        }
    });
};

export const useGetProjectEndpoints = (projectId: string) => {
    return useQuery({
        queryKey: ['endpoints', projectId],
        queryFn: () => projectService.getEndpoints(projectId),
        enabled: !!projectId,
        refetchInterval: 10000 // Poll endpoints status every 10 seconds
    });
};

export const useCreateEndpoint = (projectId: string, onSuccessCb?: (data: Endpoint) => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectService.createEndpoint,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['endpoints', projectId] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Endpoint monitor registered successfully!');
            if (onSuccessCb) onSuccessCb(data);
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to register endpoint';
            toast.error(message);
        }
    });
};

export const useDeleteEndpoint = (projectId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectService.deleteEndpoint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['endpoints', projectId] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Endpoint monitor cancelled successfully');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to delete endpoint monitor';
            toast.error(message);
        }
    });
};

export const useTestEndpoint = () => {
    return useMutation({
        mutationFn: projectService.testEndpoint,
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to execute test check';
            toast.error(message);
        }
    });
};

export const useUpdateEndpoint = (projectId: string, onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => projectService.updateEndpoint(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['endpoints', projectId] });
            toast.success('Endpoint updated successfully!');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to update endpoint';
            toast.error(message);
        }
    });
};

export const useGetProjectCookies = (projectId: string) => {
    return useQuery({
        queryKey: ['cookies', projectId],
        queryFn: () => projectService.getProjectCookies(projectId),
        enabled: !!projectId
    });
};

export const useDeleteProjectCookie = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name?: string) => projectService.deleteProjectCookie(projectId, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cookies', projectId] });
            toast.success('Cookies updated successfully');
        }
    });
};

export const useGetLastOpenedEndpoint = (projectId: string) => {
    return useQuery({
        queryKey: ['last-opened', projectId],
        queryFn: () => projectService.getLastOpenedEndpoint(projectId),
        enabled: !!projectId,
        staleTime: 0 // Fetch fresh state every time
    });
};

export const useSetLastOpenedEndpoint = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (endpointId: string) => projectService.setLastOpenedEndpoint(projectId, endpointId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['last-opened', projectId] });
        }
    });
};
