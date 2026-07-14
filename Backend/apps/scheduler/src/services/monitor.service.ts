import { ScheduleJobInput } from "../types/job.types.js";
import { jobQueue } from '../lib/queue.js';
import { prisma } from 'db';

export const addScheduledJob = async (data: ScheduleJobInput) => {
    const repeatOpts = getRepeatOpts(data);
    const maxRetries = parseInt(process.env.MAX_RETRIES || '5', 10);
    
    // Add job to BullMQ queue
    // For repeatable jobs, flag them as isRecurring so the worker dynamically logs each execution run.
    return await jobQueue.add(
        data.type,
        { payload: data.payload, isRecurring: true, userId: data.userId },
        {
            jobId: data.payload?.endpointId ? `${data.type}_${data.payload.endpointId}` : undefined,
            repeat: repeatOpts,
            attempts: maxRetries + 1,
            backoff: {
                type: 'exponential',
                delay: 5000
            }
        }
    );
}

const getRepeatOpts = (data: ScheduleJobInput) => {
    let repeatOpts: any = {};
    if (data.schedule === 'daily') {
        repeatOpts = { pattern: '0 0 * * *' };
    } else if (data.schedule === 'hourly') {
        repeatOpts = { pattern: '0 * * * *' };
    } else if (data.schedule === 'every-x-minutes') {
        if (data.minutes === undefined || data.minutes <= 0) {
            throw new Error("Minutes value must be greater than 0 for 'every-x-minutes' schedule.");
        }
        repeatOpts = { every: data.minutes * 60 * 1000 };
    } else if (data.schedule === 'cron') {
        if (!data.cronPattern) {
            throw new Error("Cron pattern is required for 'cron' schedule.");
        }
        repeatOpts = { pattern: data.cronPattern };
    } else {
        throw new Error("Invalid schedule option. Must be 'daily', 'hourly', 'every-x-minutes', or 'cron'.");
    }
    return repeatOpts;
}

export const getScheduledJobs = async () => {
    return await jobQueue.getRepeatableJobs();
}

export const removeScheduledJob = async (key: string) => {
    return await jobQueue.removeRepeatableByKey(key);
}

export const syncDatabaseMonitorsWithQueue = async () => {
    const monitors = await prisma.monitor.findMany({
        include: {
            endpoint: {
                include: {
                    project: { select: { userId: true } }
                }
            }
        }
    });

    const repeatableJobs = await jobQueue.getRepeatableJobs();
    const repeatableKeys = new Set(repeatableJobs.map(job => job.key));

    for (const monitor of monitors) {
        if (!monitor.repeatJobKey || !repeatableKeys.has(monitor.repeatJobKey)) {
            try {
                const scheduledJob = await addScheduledJob({
                    type: 'ping_endpoint',
                    payload: { endpointId: monitor.endpointId, monitorId: monitor.id },
                    schedule: 'every-x-minutes',
                    minutes: monitor.interval,
                    userId: monitor.endpoint.project.userId
                });

                if (scheduledJob && scheduledJob.repeatJobKey) {
                    await prisma.monitor.update({
                        where: { id: monitor.id },
                        data: { repeatJobKey: scheduledJob.repeatJobKey }
                    });
                }
            } catch (err) {
                console.error(`Failed to synchronize monitor ${monitor.id}:`, err);
            }
        }
    }
};

import * as monitorRepo from '../repositories/monitor.repository.js';
import * as endpointRepo from '../repositories/endpoint.repository.js';
import { AppError } from '../lib/appError.js';

export const createMonitor = async (userId: string, data: { endpointId: string; interval: number }) => {
    const endpoint = await endpointRepo.findEndpointById(data.endpointId);
    if (!endpoint) throw new AppError(404, 'Endpoint not found');
    if (endpoint.project.userId !== userId) throw new AppError(403, 'Forbidden');

    const monitor = await monitorRepo.createMonitor(data);

    const scheduledJob = await addScheduledJob({
        type: 'ping_endpoint',
        payload: { endpointId: endpoint.id, monitorId: monitor.id },
        schedule: 'every-x-minutes',
        minutes: data.interval,
        userId
    });

    let repeatKey: string | null = null;
    if (scheduledJob && scheduledJob.repeatJobKey) {
        repeatKey = scheduledJob.repeatJobKey;
        await monitorRepo.updateMonitorRepeatKey(monitor.id, repeatKey);
    }

    return { ...monitor, repeatJobKey: repeatKey };
};

export const deleteMonitor = async (userId: string, monitorId: string) => {
    const monitor = await monitorRepo.findMonitorById(monitorId);
    if (!monitor) throw new AppError(404, 'Monitor not found');
    if (monitor.endpoint.project.userId !== userId) throw new AppError(403, 'Forbidden');

    if (monitor.repeatJobKey) {
        await removeScheduledJob(monitor.repeatJobKey);
    }

    await monitorRepo.deleteMonitor(monitorId);
};