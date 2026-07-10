import { Request, Response } from 'express';
import * as projectRepo from '../repositories/project.repository.js';

export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (!name) {
            res.status(400).json({ success: false, message: 'Project name is required' });
            return;
        }

        const project = await projectRepo.createProject({
            name,
            description,
            userId
        });

        res.status(201).json({ success: true, data: project });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};

export const getUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const projects = await projectRepo.findProjectsByUser(userId);
        res.status(200).json({ success: true, data: projects });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const project = await projectRepo.findProjectById(id as string);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        await projectRepo.deleteProject(id as string);
        res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};
