import { api } from '../../../shared/services/api';
import type { Folder } from '../types/folder.types';

export const folderService = {
    getProjectFolders: async (projectId: string): Promise<Folder[]> => {
        const res = await api.get<{ data: Folder[] }>(`/folder/project/${projectId}`);
        return res.data.data;
    },
    createFolder: async (data: { name: string; projectId: string; parentId?: string | null }): Promise<Folder> => {
        const res = await api.post<{ data: Folder }>('/folder', data);
        return res.data.data;
    },
    updateFolder: async (id: string, data: { name?: string; parentId?: string | null }): Promise<Folder> => {
        const res = await api.put<{ data: Folder }>(`/folder/${id}`, data);
        return res.data.data;
    },
    deleteFolder: async (id: string): Promise<void> => {
        await api.delete(`/folder/${id}`);
    }
};
