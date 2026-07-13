import * as projectRepo from '../repositories/project.repository.js';
import { AppError } from '../lib/appError.js';

export const createProject = async (userId: string, data: { name: string; description?: string | null }) => {
    return await projectRepo.createProject({
        name: data.name,
        description: data.description ?? undefined,
        userId
    });
};

export const getUserProjects = async (userId: string) => {
    return await projectRepo.findProjectsByUser(userId);
};

export const deleteProject = async (userId: string, projectId: string) => {
    const project = await projectRepo.findProjectById(projectId);
    if (!project) throw new AppError(404, 'Project not found');
    if (project.userId !== userId) throw new AppError(403, 'Forbidden');

    await projectRepo.deleteProject(projectId);
};
