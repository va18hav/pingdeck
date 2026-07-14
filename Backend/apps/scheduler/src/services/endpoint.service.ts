import * as endpointRepo from '../repositories/endpoint.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import { AppError } from '../lib/appError.js';

export const createEndpoint = async (userId: string, data: { 
    name: string; 
    url: string; 
    projectId: string;
    folderId?: string | null;
    method?: string;
    headers?: Record<string, string> | null;
    body?: string | null;
    queryParams?: Record<string, string> | null;
    auth?: any | null;
}) => {
    const project = await projectRepo.findProjectById(data.projectId);
    if (!project) throw new AppError(404, 'Project not found');
    if (project.userId !== userId) throw new AppError(403, 'Forbidden');

    const endpoint = await endpointRepo.createEndpoint(data);

    return endpoint;
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

import { jobQueue, queueEvents } from '../lib/queue.js';

export const testEndpoint = async (userId: string, endpointId: string) => {
    const endpoint = await endpointRepo.findEndpointById(endpointId);
    if (!endpoint) throw new AppError(404, 'Endpoint not found');
    if (endpoint.project.userId !== userId) throw new AppError(403, 'Forbidden');

    const job = await jobQueue.add('ping_endpoint', { 
        payload: { endpointId, isTest: true },
        userId
    }, {
        removeOnComplete: true,
        removeOnFail: true,
    });

    try {
        const result = await job.waitUntilFinished(queueEvents);
        return result;
    } catch (err) {
        throw new AppError(500, `Failed to execute test ping: ${err instanceof Error ? err.message : String(err)}`);
    }
};

export const updateEndpoint = async (userId: string, endpointId: string, data: {
    name?: string;
    url?: string;
    method?: string;
    folderId?: string | null;
    headers?: Record<string, string> | null;
    body?: string | null;
    queryParams?: Record<string, string> | null;
    auth?: any | null;
}) => {
    const endpoint = await endpointRepo.findEndpointById(endpointId);
    if (!endpoint) throw new AppError(404, 'Endpoint not found');
    if (endpoint.project.userId !== userId) throw new AppError(403, 'Forbidden');

    return await endpointRepo.updateEndpoint(endpointId, data);
};
