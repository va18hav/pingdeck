import { api } from '../../../shared/services/api';
import type { Endpoint, MonitorResponse } from '../types/monitor.types';

export const monitorService = {
    getEndpointDetails: async (id: string): Promise<Endpoint> => {
        const res = await api.get<{ data: Endpoint }>(`/endpoint/${id}`);
        return res.data.data;
    },

    getResponses: async (endpointId: string): Promise<MonitorResponse[]> => {
        const res = await api.get<{ data: MonitorResponse[] }>(`/endpoint/${endpointId}/responses`);
        return res.data.data;
    },

    createMonitor: async (data: { endpointId: string; interval: number }): Promise<any> => {
        const res = await api.post('/monitor', data);
        return res.data;
    },

    deleteMonitor: async (id: string): Promise<void> => {
        await api.delete(`/monitor/${id}`);
    }
};
