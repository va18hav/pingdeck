import { Request, Response } from 'express';
import { createEndpointSchema, updateEndpointSchema } from '../types/validation.types.js';
import * as endpointService from '../services/endpoint.service.js';

export const createEndpoint = async (req: Request, res: Response) => {
    const data = createEndpointSchema.parse(req.body);
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await endpointService.createEndpoint(req.userId, data);
    res.status(201).json({ success: true, data: result });
};

export const getProjectEndpoints = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const endpoints = await endpointService.getProjectEndpoints(req.userId, req.params.projectId as string);
    res.status(200).json({ success: true, data: endpoints });
};

export const deleteEndpoint = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await endpointService.deleteEndpoint(req.userId, req.params.id as string);
    res.status(200).json({ success: true, message: 'Endpoint deleted successfully' });
};

export const getEndpointResponses = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const responses = await endpointService.getEndpointResponses(req.userId, req.params.id as string);
    res.status(200).json({ success: true, data: responses });
};

export const getEndpointDetails = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const endpoint = await endpointService.getEndpointDetails(req.userId, req.params.id as string);
    res.status(200).json({ success: true, data: endpoint });
};

export const testEndpoint = async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await endpointService.testEndpoint(req.userId, req.params.id as string);
    res.status(200).json({ success: true, data: result });
};

export const updateEndpoint = async (req: Request, res: Response) => {
    const data = updateEndpointSchema.parse(req.body);
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await endpointService.updateEndpoint(req.userId, req.params.id as string, data);
    res.status(200).json({ success: true, data: result });
};
