import { Request, Response } from 'express';
import * as monitorService from '../services/monitor.service.js';
import { createMonitorSchema } from '../types/validation.types.js';

export const createMonitor = async (req: Request, res: Response) => {
    const data = createMonitorSchema.parse(req.body);
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const monitor = await monitorService.createMonitor(req.userId, data);
    res.status(201).json({ success: true, data: monitor });
};

export const deleteMonitor = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || !req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await monitorService.deleteMonitor(req.userId, id as string);
    res.status(200).json({ success: true, message: 'Monitor deleted successfully' });
};
