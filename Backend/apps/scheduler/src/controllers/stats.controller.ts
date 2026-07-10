import { Request, Response } from 'express';
import { prisma } from 'db';

export const getMonitorStats = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        
        const totalProjects = await prisma.project.count({
            where: { userId }
        });

        const totalEndpoints = await prisma.endpoint.count({
            where: { project: { userId } }
        });
        
        const totalChecks = await prisma.response.count({
            where: { endpoint: { project: { userId } } }
        });
        
        const failedChecks = await prisma.response.count({
            where: {
                status: 'DOWN',
                endpoint: { project: { userId } }
            }
        });

        const uptimePercentage = totalChecks > 0 
            ? Math.round(((totalChecks - failedChecks) / totalChecks) * 100) 
            : 100;

        res.status(200).json({
            success: true,
            data: {
                totalProjects,
                totalEndpoints,
                uptimePercentage,
                totalAlerts: failedChecks
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, message });
    }
};
