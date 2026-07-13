import { Request, Response } from 'express';
import { createProjectSchema } from '../types/validation.types.js';
import * as projectService from '../services/project.service.js';

export const createProject = async (req: Request, res: Response) => {
    const data = createProjectSchema.parse(req.body);
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const project = await projectService.createProject(req.userId, data);
    res.status(201).json({ success: true, data: project });
};

export const getUserProjects = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const projects = await projectService.getUserProjects(req.userId);
    res.status(200).json({ success: true, data: projects });
};

export const deleteProject = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await projectService.deleteProject(req.userId, req.params.id as string);
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
};
