import * as statsRepo from '../repositories/stats.repository.js';

export const getMonitorStats = async (userId: string) => {
    const [
        totalProjects,
        totalEndpoints,
        totalChecks,
        failedChecks,
        recentEndpoints
    ] = await Promise.all([
        statsRepo.countProjectsByUser(userId),
        statsRepo.countEndpointsByUser(userId),
        statsRepo.countResponsesByUser(userId),
        statsRepo.countFailedResponsesByUser(userId),
        statsRepo.getRecentEndpointsByUser(userId, 5)
    ]);

    const uptimePercentage = totalChecks > 0 
        ? Math.round(((totalChecks - failedChecks) / totalChecks) * 100) 
        : 100;

    return {
        totalProjects,
        totalEndpoints,
        uptimePercentage,
        totalAlerts: failedChecks,
        recentEndpoints
    };
};
