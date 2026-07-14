import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis.js';

/**
 * Strict limiter for authentication routes (login, register).
 * Prevents brute-force and account spam attacks.
 * Key: IP address
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args as [string, ...string[]]) as any,
        prefix: 'rl:auth:'
    })
});

/**
 * Medium limiter for the one-time test ping endpoint.
 * Prevents queue flooding from a single developer.
 * Key: authenticated userId (fairer than IP for shared office networks)
 */
export const testPingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: {
        success: false,
        message: 'Too many test pings. Please slow down — limit is 30 per minute.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip || 'anonymous',
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args as [string, ...string[]]) as any,
        prefix: 'rl:test:'
    })
});

/**
 * General loose safety-net limiter for all other API routes.
 * Catches runaway scripts or buggy frontends.
 * Key: IP address
 */
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 150,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args as [string, ...string[]]) as any,
        prefix: 'rl:general:'
    })
});
