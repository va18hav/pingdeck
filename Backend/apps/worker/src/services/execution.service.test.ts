import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { executeJob } from './execution.service.js';
import { createResponse } from '../repositories/response.repository.js';
import * as endpointRepo from '../repositories/endpoint.repository.js';
import { jobQueue } from '../lib/queue.js';

jest.mock('../repositories/endpoint.repository.js', () => ({
    getEndpointForPing: jest.fn(),
    updateEndpointStatus: jest.fn()
}));

jest.mock('../repositories/response.repository.js', () => ({
    createResponse: jest.fn()
}));

jest.mock('../lib/queue.js', () => ({
    jobQueue: {
        add: jest.fn()
    }
}));

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Worker Execution Service - Uptime Health Checks', () => {
    const mockJob = {
        id: 'job-123',
        type: 'ping_endpoint',
        payload: { endpointId: 'endpoint-456' },
        userId: 'user-789'
    };

    const mockEndpointDbRecord = {
        id: 'endpoint-456',
        name: 'Production Auth API',
        url: 'https://auth.company.com/health',
        method: 'GET',
        interval: 5,
        status: 'PENDING',
        projectId: 'project-abc',
        repeatJobKey: 'repeat-key-xyz',
        createdAt: new Date(),
        updatedAt: new Date(),
        project: {
            userId: 'user-789',
            user: {
                id: 'user-789',
                email: 'dev-ops@company.com',
                password: 'hashed-password',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockReset();
    });

    it('should complete check successfully, update status to UP, and log response', async () => {
        (endpointRepo.getEndpointForPing as any).mockResolvedValue(mockEndpointDbRecord);
        
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers(),
        } as Response);

        await executeJob(mockJob);

        expect(endpointRepo.getEndpointForPing).toHaveBeenCalledWith('endpoint-456');

        expect(mockFetch).toHaveBeenCalledWith('https://auth.company.com/health', {
            method: 'GET',
            signal: expect.any(AbortSignal),
            headers: {
                'User-Agent': 'API-Monitoring-Worker/1.0'
            }
        });

        expect(createResponse).toHaveBeenCalledWith({
            endpointId: 'endpoint-456',
            statusCode: 200,
            responseTime: expect.any(Number),
            status: 'UP',
            error: null
        });

        expect(endpointRepo.updateEndpointStatus).toHaveBeenCalledWith('endpoint-456', 'UP');
        expect(jobQueue.add).not.toHaveBeenCalled();
    });

    it('should log status as DOWN and enqueue email alert job if target returns HTTP error status', async () => {
        (endpointRepo.getEndpointForPing as any).mockResolvedValue(mockEndpointDbRecord);
        
        mockFetch.mockResolvedValue({
            ok: false,
            status: 503,
            headers: new Headers(),
        } as Response);

        await executeJob(mockJob);

        expect(createResponse).toHaveBeenCalledWith({
            endpointId: 'endpoint-456',
            statusCode: 503,
            responseTime: expect.any(Number),
            status: 'DOWN',
            error: 'HTTP Error Status: 503'
        });

        expect(endpointRepo.updateEndpointStatus).toHaveBeenCalledWith('endpoint-456', 'DOWN');

        expect(jobQueue.add).toHaveBeenCalledWith('send_email', {
            to: 'dev-ops@company.com',
            subject: '⚠️ Alert: Monitor DOWN - https://auth.company.com/health',
            body: expect.stringContaining('Status Code: 503'),
            userId: 'user-789'
        });
    });

    it('should mark status as DOWN and enqueue email alert on request network timeout', async () => {
        (endpointRepo.getEndpointForPing as any).mockResolvedValue(mockEndpointDbRecord);
        mockFetch.mockRejectedValue(new DOMException('The user aborted a request.', 'AbortError'));

        await executeJob(mockJob);

        expect(createResponse).toHaveBeenCalledWith({
            endpointId: 'endpoint-456',
            statusCode: null,
            responseTime: expect.any(Number),
            status: 'DOWN',
            error: 'The user aborted a request.'
        });

        expect(endpointRepo.updateEndpointStatus).toHaveBeenCalledWith('endpoint-456', 'DOWN');

        expect(jobQueue.add).toHaveBeenCalledWith('send_email', {
            to: 'dev-ops@company.com',
            subject: '⚠️ Alert: Monitor DOWN - https://auth.company.com/health',
            body: expect.stringContaining('Error: The user aborted a request.'),
            userId: 'user-789'
        });
    });

    it('should skip check gracefully if endpoint configuration is not found in database', async () => {
        (endpointRepo.getEndpointForPing as any).mockResolvedValue(null);

        await executeJob(mockJob);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(createResponse).not.toHaveBeenCalled();
        expect(endpointRepo.updateEndpointStatus).not.toHaveBeenCalled();
        expect(jobQueue.add).not.toHaveBeenCalled();
    });
});
