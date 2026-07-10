import { Queue } from 'bullmq';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const jobQueue = new Queue('jobs-queue', {
    connection: {
        host: redisHost,
        port: redisPort
    }
});
