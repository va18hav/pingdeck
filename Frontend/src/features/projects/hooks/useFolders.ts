import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { folderService } from '../services/folderService';
import { toast } from 'sonner';

export const useGetProjectFolders = (projectId: string) => {
    return useQuery({
        queryKey: ['folders', projectId],
        queryFn: () => folderService.getProjectFolders(projectId),
        enabled: !!projectId
    });
};

export const useCreateFolder = (projectId: string, onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: folderService.createFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
            toast.success('Folder created successfully!');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to create folder';
            toast.error(message);
        }
    });
};

export const useUpdateFolder = (projectId: string, onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; parentId?: string | null } }) =>
            folderService.updateFolder(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
            toast.success('Folder updated successfully');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to update folder';
            toast.error(message);
        }
    });
};

export const useDeleteFolder = (projectId: string, onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: folderService.deleteFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
            queryClient.invalidateQueries({ queryKey: ['endpoints', projectId] });
            toast.success('Folder deleted successfully');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to delete folder';
            toast.error(message);
        }
    });
};
