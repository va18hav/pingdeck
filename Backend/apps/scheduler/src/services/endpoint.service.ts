import * as endpointRepo from '../repositories/endpoint.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as jobService from './job.service.js';
import { AppError } from '../lib/appError.js';

export const createEndpoint = async (userId: string, data: { name: string; url: string; interval: number; projectId: string }) => {
    const project = await projectRepo.findProjectById(data.projectId);
    if (!project) throw new AppError(404, 'Project not found');
    if (project.userId !== userId) throw new AppError(403, 'Forbidden');

    const endpoint = await endpointRepo.createEndpoint(data);

    const scheduledJob = await jobService.addScheduledJob({
        type: 'ping_endpoint',
        payload: { endpointId: endpoint.id },
        schedule: 'every-x-minutes',
        minutes: data.interval,
        userId
    });

    let repeatKey: string | null = null;
    if (scheduledJob && scheduledJob.repeatJobKey) {
        repeatKey = scheduledJob.repeatJobKey;
        await endpointRepo.updateEndpointRepeatKey(endpoint.id, repeatKey);
    }

    return { ...endpoint, repeatJobKey: repeatKey };
};

export const getProjectEndpoints = async (userId: string, projectId: string) => {
    const project = await projectRepo.findProjectById(projectId);
    if (!project) throw new AppError(404, 'Project not found');
    if (project.userId !== userId) throw new AppError(403, 'Forbidden');

    return await endpointRepo.findEndpointsByProject(projectId);
};

export const deleteEndpoint = async (userId: string, endpointId: string) => {
    const endpoint = await endpointRepo.findEndpointById(endpointId);
    if (!endpoint) throw new AppError(404, 'Endpoint not found');
    if (endpoint.project.userId !== userId) throw new AppError(403, 'Forbidden');

    if (endpoint.repeatJobKey) {
        await jobService.removeScheduledJob(endpoint.repeatJobKey);
    }

    await endpointRepo.deleteEndpoint(endpointId);
};

export const getEndpointResponses = async (userId: string, endpointId: string) => {
    const endpoint = await endpointRepo.findEndpointById(endpointId);
    if (!endpoint) throw new AppError(404, 'Endpoint not found');
    if (endpoint.project.userId !== userId) throw new AppError(403, 'Forbidden');

    return await endpointRepo.findEndpointResponses(endpointId, 50);
};

export const getEndpointDetails = async (userId: string, endpointId: string) => {
    const endpoint = await endpointRepo.findEndpointById(endpointId);
    if (!endpoint) throw new AppError(404, 'Endpoint not found');
    if (endpoint.project.userId !== userId) throw new AppError(403, 'Forbidden');

    return endpoint;
};
