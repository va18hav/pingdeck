import { createResponse } from "../repositories/response.repository.js";
import * as endpointRepo from "../repositories/endpoint.repository.js";
import { jobQueue } from "../lib/queue.js";
import { logger } from 'shared';

interface ExecutionJob {
    id: string;
    type: string;
    payload: any;
    userId?: string;
}

const handlePingEndpointJob = async (job: ExecutionJob) => {
    const endpointId = job.payload?.endpointId;
    if (!endpointId) {
        throw new Error("Missing 'endpointId' in job payload for ping_endpoint");
    }

    const endpoint = await endpointRepo.getEndpointForPing(endpointId);

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

    await createResponse({
        endpointId: endpoint.id,
        statusCode,
        responseTime,
        status,
        error: errorMsg
    });

    await endpointRepo.updateEndpointStatus(endpoint.id, status);

    logger.info({ jobId: job.id, endpointId, url, status, statusCode, responseTime }, `Health check complete`);

    if (status === 'DOWN') {
        const emailTo = endpoint.project.user?.email || 'alert@example.com';
        const userId = endpoint.project.userId;

        await jobQueue.add('send_email', {
            to: emailTo,
            subject: `⚠️ Alert: Monitor DOWN - ${url}`,
            body: `Your registered endpoint ${url} is DOWN.\n\nStatus Code: ${statusCode || 'N/A'}\nResponse Time: ${responseTime}ms\nError: ${errorMsg || 'None'}`,
            userId
        });

        logger.info({ jobId: job.id, url, emailTo }, `Triggered email alert job`);
    }
};

const handleSendEmailJob = async (job: ExecutionJob) => {
    const { to, subject, body } = job.payload || {};
    logger.info({ to, subject, body }, `[SIMULATED EMAIL DISPATCH] Sending alert email to client...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    logger.info({ to }, `[SIMULATED EMAIL DISPATCH] Email sent successfully.`);
};

export const executeJob = async (job: ExecutionJob) => {
    logger.info({ jobId: job.id, type: job.type }, `Executing job`);

    if (job.type === 'ping_endpoint') {
        await handlePingEndpointJob(job);
    } else if (job.type === 'send_email') {
        await handleSendEmailJob(job);
    } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
};