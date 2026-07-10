import { Request, Response } from 'express';
import * as endpointRepo from '../repositories/endpoint.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as jobService from '../services/job.service.js';
import { prisma } from 'db';

export const createEndpoint = async (req: Request, res: Response) => {
    try {
        const { name, url, interval, projectId } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (!name || !url || !interval || !projectId) {
            res.status(400).json({ success: false, message: 'Name, URL, Interval, and Project ID are required' });
            return;
        }

        const project = await projectRepo.findProjectById(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        // 1. Create Endpoint database record
        const endpoint = await endpointRepo.createEndpoint({
            name,
            url,
            interval: parseInt(interval, 10),
            projectId
        });

        // 2. Schedule repeatable check in BullMQ via jobService
        const scheduledJob = await jobService.addScheduledJob({
            type: 'ping_endpoint',
            payload: { endpointId: endpoint.id },
            schedule: 'every-x-minutes',
            minutes: parseInt(interval, 10),
            userId
        });

        // 3. Store the repeatable job key on the endpoint record for cancellation
        let repeatKey: string | null = null;
        if (scheduledJob && scheduledJob.repeatJobKey) {
            repeatKey = scheduledJob.repeatJobKey;
            await endpointRepo.updateEndpointRepeatKey(endpoint.id, repeatKey);
        }

        res.status(201).json({ 
            success: true, 
            data: { 
                ...endpoint, 
                repeatJobKey: repeatKey 
            } 
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};

export const getProjectEndpoints = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const project = await projectRepo.findProjectById(projectId as string);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        const endpoints = await endpointRepo.findEndpointsByProject(projectId as string);
        res.status(200).json({ success: true, data: endpoints });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};

export const deleteEndpoint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const endpoint = await endpointRepo.findEndpointById(id as string);
        if (!endpoint) {
            res.status(404).json({ success: false, message: 'Endpoint not found' });
            return;
        }

        if (endpoint.project.userId !== userId) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        // 1. Remove repeatable schedule from BullMQ queue if it exists
        if (endpoint.repeatJobKey) {
            await jobService.removeScheduledJob(endpoint.repeatJobKey);
        }

        // 2. Delete Endpoint record from database
        await endpointRepo.deleteEndpoint(id as string);
        res.status(200).json({ success: true, message: 'Endpoint deleted successfully' });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};

export const getEndpointResponses = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const endpoint = await endpointRepo.findEndpointById(id as string);
        if (!endpoint) {
            res.status(404).json({ success: false, message: 'Endpoint not found' });
            return;
        }

        if (endpoint.project.userId !== userId) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        const responses = await prisma.response.findMany({
            where: { endpointId: id as string },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.status(200).json({ success: true, data: responses });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};

export const getEndpointDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const endpoint = await endpointRepo.findEndpointById(id as string);
        if (!endpoint) {
            res.status(404).json({ success: false, message: 'Endpoint not found' });
            return;
        }

        if (endpoint.project.userId !== userId) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        res.status(200).json({ success: true, data: endpoint });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message });
    }
};
