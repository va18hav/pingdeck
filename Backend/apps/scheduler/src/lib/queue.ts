import { Queue, QueueEvents, ConnectionOptions } from 'bullmq';

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

export const jobQueue = new Queue('jobs-queue', { connection });
export const queueEvents = new QueueEvents('jobs-queue', { connection });
