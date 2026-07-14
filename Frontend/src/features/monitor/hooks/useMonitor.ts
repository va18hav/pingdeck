import { useQuery } from '@tanstack/react-query';
import { monitorService } from '../services/monitorService';

export const useGetEndpoint = (id: string) => {
    return useQuery({
        queryKey: ['endpoint', id],
        queryFn: () => monitorService.getEndpointDetails(id),
        enabled: !!id
    });
};

export const useGetResponses = (id: string) => {
    return useQuery({
        queryKey: ['responses', id],
        queryFn: () => monitorService.getResponses(id),
        enabled: !!id,
        refetchInterval: 10000 // Poll responses every 10 seconds
    });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCreateMonitor = (projectId: string, onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: monitorService.createMonitor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['endpoints', projectId] });
            toast.success('Live monitor activated successfully!');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to activate monitor';
            toast.error(message);
        }
    });
};

export const useDeleteMonitor = (projectId: string, onSuccessCb?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: monitorService.deleteMonitor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['endpoints', projectId] });
            toast.success('Live monitor stopped successfully');
            if (onSuccessCb) onSuccessCb();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to stop monitor';
            toast.error(message);
        }
    });
};
