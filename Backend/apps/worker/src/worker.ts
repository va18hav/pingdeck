import { Worker, ConnectionOptions } from 'bullmq';
import { executeJob } from "./services/execution.service.js";
import { prisma } from 'db';
import { randomUUID } from 'crypto';
import { logger, register, jobsProcessedTotal, jobExecutionDurationSeconds } from 'shared';
import { createServer } from 'http';

const workerId = randomUUID();

export const startWorker = async () => {
    const getRedisConnection = (): ConnectionOptions => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            try {
                const parsed = new URL(redisUrl);
                return {
                    host: parsed.hostname,
                    port: parsed.port ? parseInt(parsed.port, 10) : 6379,
                    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
                    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
                    tls: parsed.protocol === 'rediss:' ? {} : undefined
                };
            } catch (err) {
                // Fallback in case of parsing issue
            }
        }

        return {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        };
    };

    const connection = getRedisConnection();
    const concurrency = process.env.WORKER_CONCURRENCY ? parseInt(process.env.WORKER_CONCURRENCY, 10) : 5;

    logger.info(`Worker:${workerId} starting...`);

    // Start a lightweight HTTP server to expose worker metrics
    const metricsServer = createServer(async (req, res) => {
        if (req.url === '/metrics') {
            try {
                res.writeHead(200, { 'Content-Type': register.contentType });
                res.end(await register.metrics());
            } catch (err) {
                res.writeHead(500);
                res.end(String(err));
            }
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    metricsServer.listen(3001, () => {
        logger.info('Worker metrics server running on port 3001');
    });

    const worker = new Worker('jobs-queue', async (bullJob) => {
        const { payload, userId } = bullJob.data;
        const currentAttempt = bullJob.attemptsMade + 1;

        logger.info({ bullJobId: bullJob.id, jobType: bullJob.name, attempt: currentAttempt }, `Worker:${workerId} running job`);

        const start = Date.now();

        // Build execution context matching the executeJob signature
        const jobContext = {
            id: bullJob.id ?? randomUUID(),
            type: bullJob.name,
            payload,
            userId
        };

        try {
            // Execute the check/notification
            const result = await executeJob(jobContext);

            const duration = (Date.now() - start) / 1000;
            jobExecutionDurationSeconds.observe({ type: bullJob.name }, duration);
            jobsProcessedTotal.inc({ type: bullJob.name, status: 'completed' });

            logger.info({ bullJobId: bullJob.id, duration }, `Job completed successfully by worker:${workerId}`);
            
            return result;
        } catch (err) {
            const duration = (Date.now() - start) / 1000;
            jobExecutionDurationSeconds.observe({ type: bullJob.name }, duration);
            jobsProcessedTotal.inc({ type: bullJob.name, status: 'failed' });

            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error({ bullJobId: bullJob.id, err: errorMessage }, `Job execution failed`);

            // Rethrow so BullMQ triggers native retry cycles in Redis
            throw err;
        }
    }, {
        connection,
        concurrency
    });

    logger.info(`Worker:${workerId} started listening for jobs via BullMQ (concurrency: ${concurrency})`);

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}. Shutting down worker:${workerId} gracefully...`);
        metricsServer.close();
        await worker.close();
        await prisma.$disconnect();
        logger.info(`Worker:${workerId} shut down completed.`);
        process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
};