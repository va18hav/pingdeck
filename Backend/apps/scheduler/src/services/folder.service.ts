import * as folderRepo from '../repositories/folder.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import { AppError } from '../lib/appError.js';

export const createFolder = async (userId: string, data: { name: string; projectId: string; parentId?: string | null }) => {
    const project = await projectRepo.findProjectById(data.projectId);
    if (!project) throw new AppError(404, 'Project not found');
    if (project.userId !== userId) throw new AppError(403, 'Forbidden');

    if (data.parentId) {
        const parent = await folderRepo.findFolderById(data.parentId);
        if (!parent || parent.projectId !== data.projectId) throw new AppError(400, 'Invalid parent folder');
    }

    return await folderRepo.createFolder(data);
};

export const getProjectFolders = async (userId: string, projectId: string) => {
    const project = await projectRepo.findProjectById(projectId);
    if (!project) throw new AppError(404, 'Project not found');
    if (project.userId !== userId) throw new AppError(403, 'Forbidden');

    return await folderRepo.getFoldersByProject(projectId);
};

export const updateFolder = async (userId: string, folderId: string, data: { name?: string; parentId?: string | null }) => {
    const folder = await folderRepo.findFolderById(folderId);
    if (!folder) throw new AppError(404, 'Folder not found');
    if (folder.project.userId !== userId) throw new AppError(403, 'Forbidden');

    if (data.parentId) {
        const parent = await folderRepo.findFolderById(data.parentId);
        if (!parent || parent.projectId !== folder.projectId) throw new AppError(400, 'Invalid parent folder');
    }

    return await folderRepo.updateFolder(folderId, data);
};

export const deleteFolder = async (userId: string, folderId: string) => {
    const folder = await folderRepo.findFolderById(folderId);
    if (!folder) throw new AppError(404, 'Folder not found');
    if (folder.project.userId !== userId) throw new AppError(403, 'Forbidden');

    await folderRepo.deleteFolder(folderId);
};
