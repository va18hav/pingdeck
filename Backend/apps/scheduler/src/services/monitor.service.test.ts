import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { addScheduledJob, syncDatabaseMonitorsWithQueue } from './monitor.service.js';
import { jobQueue } from '../lib/queue.js';
import { prisma } from 'db';

// 1. Module mocks for queues and databases
jest.mock('../lib/queue', () => ({
    jobQueue: {
        add: jest.fn(),
        getRepeatableJobs: jest.fn()
    }
}));

jest.mock('db', () => ({
    prisma: {
        endpoint: {
            findMany: jest.fn(),
            update: jest.fn()
        },
        monitor: {
            findMany: jest.fn(),
            update: jest.fn()
        }
    }
}));

describe('Scheduler Job Service - Queue Scheduling & Sync', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addScheduledJob()', () => {
        it('should correctly configure repeatable parameters and include a unique jobId based on endpoint ID', async () => {
            // Arrange
            const mockInput = {
                type: 'ping_endpoint',
                payload: { endpointId: 'endpoint-abc' },
                schedule: 'every-x-minutes' as const,
                minutes: 10,
                userId: 'user-789'
            };

            (jobQueue.add as any).mockResolvedValue({
                id: 'job-111',
                repeatJobKey: 'repeat:ping_endpoint_endpoint-abc:every-10-mins'
            });

            // Act
            const result = await addScheduledJob(mockInput);

            // Assert: Job enqueued with correct name and data payload
            expect(jobQueue.add).toHaveBeenCalledWith(
                'ping_endpoint',
                { payload: { endpointId: 'endpoint-abc' }, isRecurring: true, userId: 'user-789' },
                expect.objectContaining({
                    jobId: 'ping_endpoint_endpoint-abc', // Unique jobId verified
                    repeat: { every: 10 * 60 * 1000 },  // Conversion to ms verified
                    attempts: 6,
                    backoff: {
                        type: 'exponential',
                        delay: 5000
                    }
                })
            );

            expect(result).toEqual(expect.objectContaining({
                repeatJobKey: 'repeat:ping_endpoint_endpoint-abc:every-10-mins'
            }));
        });

        it('should fail with error if schedule configuration lacks required variables', async () => {
            // Arrange: Invalid every-x-minutes configuration
            const mockInput = {
                type: 'ping_endpoint',
                payload: { endpointId: 'endpoint-abc' },
                schedule: 'every-x-minutes' as const,
                minutes: 0, // Invalid minutes value
                userId: 'user-789'
            };

            // Act & Assert
            await expect(addScheduledJob(mockInput)).rejects.toThrow(
                "Minutes value must be greater than 0 for 'every-x-minutes' schedule."
            );
            expect(jobQueue.add).not.toHaveBeenCalled();
        });
    });

    describe('syncDatabaseMonitorsWithQueue()', () => {
        it('should detect missing repeatable checks in Redis and automatically schedule them', async () => {
            // Arrange: DB contains a monitor, but Redis queue is empty
            const mockMonitor = {
                id: 'monitor-abc',
                endpointId: 'endpoint-abc',
                interval: 2,
                status: 'PENDING',
                repeatJobKey: 'repeat:key-stale-or-empty',
                endpoint: {
                    project: {
                        userId: 'user-789'
                    }
                }
            };

            (prisma.monitor.findMany as any).mockResolvedValue([mockMonitor]);
            (jobQueue.getRepeatableJobs as any).mockResolvedValue([]); // Redis repeatable jobs list is empty

            (jobQueue.add as any).mockResolvedValue({
                repeatJobKey: 'repeat:key-new-generated-uuid'
            });

            // Act
            await syncDatabaseMonitorsWithQueue();

            // Assert: Job rescheduled with unique jobId
            expect(jobQueue.add).toHaveBeenCalledWith(
                'ping_endpoint',
                { payload: { endpointId: 'endpoint-abc' }, isRecurring: true, userId: 'user-789' },
                expect.objectContaining({
                    jobId: 'ping_endpoint_endpoint-abc',
                    repeat: { every: 2 * 60 * 1000 }
                })
            );

            // Assert: Rescheduled key updated in database
            expect(prisma.monitor.update).toHaveBeenCalledWith({
                where: { id: 'monitor-abc' },
                data: { repeatJobKey: 'repeat:key-new-generated-uuid' }
            });
        });

        it('should skip synchronization if the monitor configuration is already registered in Redis repeatable jobs list', async () => {
            // Arrange: Database keys match active keys in Redis repeatable logs
            const mockMonitor = {
                id: 'monitor-abc',
                endpointId: 'endpoint-abc',
                interval: 2,
                status: 'PENDING',
                repeatJobKey: 'repeat:active-key-123',
                endpoint: {
                    project: {
                        userId: 'user-789'
                    }
                }
            };

            (prisma.monitor.findMany as any).mockResolvedValue([mockMonitor]);
            
            // Redis already contains the matching repeatable key
            (jobQueue.getRepeatableJobs as any).mockResolvedValue([
                { key: 'repeat:active-key-123' }
            ]);

            // Act
            await syncDatabaseMonitorsWithQueue();

            // Assert: Verify sync execution skipped
            expect(jobQueue.add).not.toHaveBeenCalled();
            expect(prisma.monitor.update).not.toHaveBeenCalled();
        });
    });
});
