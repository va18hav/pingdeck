import { Redis } from 'ioredis';

const getRedisClient = (): Redis => {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        return new Redis(redisUrl);
    }
    return new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
};

export const redis = getRedisClient();
