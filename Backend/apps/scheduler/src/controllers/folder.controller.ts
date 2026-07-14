import { Request, Response } from 'express';
import { createFolderSchema } from '../types/validation.types.js';
import * as folderService from '../services/folder.service.js';

export const createFolder = async (req: Request, res: Response) => {
    const data = createFolderSchema.parse(req.body);
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await folderService.createFolder(req.userId, data);
    res.status(201).json({ success: true, data: result });
};

export const getProjectFolders = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const folders = await folderService.getProjectFolders(req.userId, req.params.projectId as string);
    res.status(200).json({ success: true, data: folders });
};

export const updateFolder = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const name = req.body.name;
    const parentId = req.body.parentId;

    const result = await folderService.updateFolder(req.userId, req.params.id as string, { name, parentId });
    res.status(200).json({ success: true, data: result });
};

export const deleteFolder = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await folderService.deleteFolder(req.userId, req.params.id as string);
    res.status(200).json({ success: true, message: 'Folder deleted successfully' });
};
