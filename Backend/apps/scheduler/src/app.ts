import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import endpointRoutes from './routes/endpoint.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { logger, register } from 'shared';
import { randomUUID } from 'crypto';

dotenv.config()

const app = express()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}))

app.use(express.json())
app.use(cookieParser())

// Request tracking middleware
app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.id = requestId;
    res.setHeader('x-request-id', requestId);

    // Scoped request logger
    req.log = logger.child({ requestId });
    req.log.info({ method: req.method, url: req.url }, 'HTTP Request Started');

    res.on('finish', () => {
        req.log?.info({ statusCode: res.statusCode }, 'HTTP Request Finished');
    });

    next();
});

// Metrics scrape endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(errorMsg);
        res.status(500).end(errorMsg);
    }
});

app.use('/auth', authRoutes)
app.use('/project', projectRoutes)
app.use('/endpoint', endpointRoutes)
app.use('/stats', statsRoutes)

export default app
