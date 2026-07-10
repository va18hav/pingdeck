import { createResponse } from "../repositories/response.repository.js";
import { prisma } from 'db';
import { jobQueue } from "../lib/queue.js";
import { logger } from 'shared';

interface ExecutionJob {
    id: string;
    type: string;
    payload: any;
    userId?: string;
}

export const executeJob = async (job: ExecutionJob) => {
    logger.info({ jobId: job.id, type: job.type }, `Executing job`);

    const payload = job.payload as any;

    if (job.type === 'ping_endpoint') {
        const endpointId = payload?.endpointId;
        if (!endpointId) {
            throw new Error("Missing 'endpointId' in job payload for ping_endpoint");
        }

        // Fetch endpoint config and associated user email details
        const endpoint = await prisma.endpoint.findUnique({
            where: { id: endpointId },
            include: {
                project: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!endpoint) {
            logger.warn({ jobId: job.id, endpointId }, `Endpoint not found in database. Skipping execution.`);
            return;
        }

        const url = endpoint.url;
        const start = Date.now();
        let statusCode: number | null = null;
        let responseTime: number | null = null;
        let status: 'UP' | 'DOWN' = 'DOWN';
        let errorMsg: string | null = null;

        try {
            // Setup a 10-second abort timeout for the health check request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(url, {
                method: endpoint.method,
                signal: controller.signal,
                headers: {
                    'User-Agent': 'API-Monitoring-Worker/1.0'
                }
            });

            clearTimeout(timeoutId);
            statusCode = res.status;
            responseTime = Date.now() - start;

            if (res.ok) {
                status = 'UP';
            } else {
                status = 'DOWN';
                errorMsg = `HTTP Error Status: ${res.status}`;
            }
        } catch (err) {
            responseTime = Date.now() - start;
            status = 'DOWN';
            errorMsg = err instanceof Error ? err.message : String(err);
        }

        // Save health check results to PostgreSQL
        await createResponse({
            endpointId: endpoint.id,
            statusCode,
            responseTime,
            status,
            error: errorMsg
        });

        // Update endpoint status in PostgreSQL
        await prisma.endpoint.update({
            where: { id: endpoint.id },
            data: { status }
        });

        logger.info({ jobId: job.id, endpointId, url, status, statusCode, responseTime }, `Health check complete`);

        // If the endpoint check failed, enqueue a send_email alert job
        if (status === 'DOWN') {
            const emailTo = endpoint.project.user?.email || 'alert@example.com';
            const userId = endpoint.project.userId;

            // Queue a send_email job
            await jobQueue.add('send_email', {
                to: emailTo,
                subject: `⚠️ Alert: Monitor DOWN - ${url}`,
                body: `Your registered endpoint ${url} is DOWN.\n\nStatus Code: ${statusCode || 'N/A'}\nResponse Time: ${responseTime}ms\nError: ${errorMsg || 'None'}`,
                userId
            });

            logger.info({ jobId: job.id, url, emailTo }, `Triggered email alert job`);
        }
    } else if (job.type === 'send_email') {
        const { to, subject, body } = payload || {};
        logger.info({ to, subject, body }, `[SIMULATED EMAIL DISPATCH] Sending alert email to client...`);
        // Simulate a small network delay for SMTP
        await new Promise((resolve) => setTimeout(resolve, 500));
        logger.info({ to }, `[SIMULATED EMAIL DISPATCH] Email sent successfully.`);
    } else {
        // Fallback simulation for general jobs
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
}