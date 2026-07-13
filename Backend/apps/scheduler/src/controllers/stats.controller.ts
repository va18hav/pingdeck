import { Request, Response } from 'express';
import * as statsService from '../services/stats.service.js';

export const getMonitorStats = async (req: Request, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    
    const stats = await statsService.getMonitorStats(req.userId);
    
    res.status(200).json({
        success: true,
        data: stats
    });
};
