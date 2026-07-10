import { api } from '../../../shared/services/api';
import type { Project, Endpoint, MonitorResponse, MonitorStats } from '../types/monitor.types';

export const monitorService = {
    getStats: async (): Promise<MonitorStats> => {
        const res = await api.get('/stats');
        return res.data.data;
    },

    // Project APIs
    getProjects: async (): Promise<Project[]> => {
        const res = await api.get('/project');
        return res.data.data;
    },

    createProject: async (data: { name: string; description?: string }): Promise<Project> => {
        const res = await api.post('/project', data);
        return res.data.data;
    },

    deleteProject: async (id: string): Promise<any> => {
        const res = await api.delete(`/project/${id}`);
        return res.data;
    },

    // Endpoint APIs
    getEndpoints: async (projectId: string): Promise<Endpoint[]> => {
        const res = await api.get(`/endpoint/project/${projectId}`);
        return res.data.data;
    },

    createEndpoint: async (data: {
        name: string;
        url: string;
        interval: number;
        projectId: string;
    }): Promise<Endpoint> => {
        const res = await api.post('/endpoint', data);
        return res.data.data;
    },

    deleteEndpoint: async (id: string): Promise<any> => {
        const res = await api.delete(`/endpoint/${id}`);
        return res.data;
    },

    getResponses: async (endpointId: string): Promise<MonitorResponse[]> => {
        const res = await api.get(`/endpoint/${endpointId}/responses`);
        return res.data.data;
    },

    getEndpointDetails: async (id: string): Promise<Endpoint> => {
        const res = await api.get(`/endpoint/${id}`);
        return res.data.data;
    }
};
