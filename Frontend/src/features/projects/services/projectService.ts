import { api } from '../../../shared/services/api';
import type { Project, Endpoint, TestEndpointResponse } from '../types/project.types';

export const projectService = {
    getProjects: async (): Promise<Project[]> => {
        const res = await api.get<{ data: Project[] }>('/project');
        return res.data.data;
    },

    createProject: async (data: { name: string; description?: string }): Promise<Project> => {
        const res = await api.post<{ data: Project }>('/project', data);
        return res.data.data;
    },

    deleteProject: async (id: string): Promise<void> => {
        await api.delete(`/project/${id}`);
    },

    getEndpoints: async (projectId: string): Promise<Endpoint[]> => {
        const res = await api.get<{ data: Endpoint[] }>(`/endpoint/project/${projectId}`);
        return res.data.data;
    },

    createEndpoint: async (data: {
        name: string;
        url: string;
        interval?: number;
        projectId: string;
        folderId?: string | null;
        method?: string;
        headers?: Record<string, string> | null;
        body?: string | null;
        queryParams?: Record<string, string> | null;
        auth?: any | null;
    }): Promise<Endpoint> => {
        const res = await api.post<{ data: Endpoint }>('/endpoint', data);
        return res.data.data;
    },

    deleteEndpoint: async (id: string): Promise<void> => {
        await api.delete(`/endpoint/${id}`);
    },

    updateEndpoint: async (id: string, data: {
        name?: string;
        url?: string;
        method?: string;
        headers?: Record<string, string> | null;
        body?: string | null;
        queryParams?: Record<string, string> | null;
        auth?: any | null;
        folderId?: string | null;
    }): Promise<Endpoint> => {
        const res = await api.put<{ data: Endpoint }>(`/endpoint/${id}`, data);
        return res.data.data;
    },

    testEndpoint: async (id: string): Promise<TestEndpointResponse> => {
        const res = await api.post<{ data: TestEndpointResponse }>(`/endpoint/${id}/test`);
        return res.data.data;
    },

    getProjectCookies: async (projectId: string): Promise<any[]> => {
        const res = await api.get<{ data: any[] }>(`/project/${projectId}/cookies`);
        return res.data.data;
    },

    deleteProjectCookie: async (projectId: string, name?: string): Promise<void> => {
        await api.delete(`/project/${projectId}/cookies`, {
            params: name ? { name } : undefined
        });
    }
};
