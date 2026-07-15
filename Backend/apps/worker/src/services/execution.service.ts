import { createResponse } from "../repositories/response.repository.js";
import * as endpointRepo from "../repositories/endpoint.repository.js";
import * as monitorRepo from "../repositories/monitor.repository.js";
import { buildUrlWithParams, buildHeaders, parseResponseHeaders } from "../utils/http.utils.js";
import { jobQueue } from "../lib/queue.js";
import { logger } from 'shared';
import { redis } from "../lib/redis.js";
import { CookieJar } from "../utils/cookieJar.js";
import { applyAuth } from "../utils/auth.registry.js";
import { prisma } from 'db';
import { Agent } from 'undici';

interface ExecutionJob {
    id: string;
    type: string;
    payload: any;
    userId?: string;
}

const performAutoLogin = async (endpointId: string, loginConfig: any, cookieKey: string, cookieJar: CookieJar, sslVerification: boolean = true) => {
    logger.info({ endpointId }, `Auto-login triggered for monitored endpoint.`);
    try {
        const loginHeaders = buildHeaders(loginConfig.headers, null, loginConfig.body);
        const loginOptions: RequestInit = {
            method: loginConfig.method || 'POST',
            headers: loginHeaders,
        };
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(loginConfig.method || 'POST') && loginConfig.body) {
            loginOptions.body = loginConfig.body;
        }

        const loginStart = Date.now();
        
        let dispatcher = undefined;
        if (sslVerification === false) {
            dispatcher = new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            });
        }
        
        const loginRes = await fetch(loginConfig.url, { ...loginOptions, dispatcher } as any);
        const loginTime = Date.now() - loginStart;

        if (loginRes.ok) {
            const loginSetCookie = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : (loginRes.headers.get('set-cookie') || null);
            if (loginSetCookie) {
                cookieJar.setCookies(loginSetCookie, loginConfig.url);
                const serialized = JSON.stringify(cookieJar.toJSON());
                const earliestExpiry = cookieJar.getEarliestExpiry();
                if (earliestExpiry) {
                    const ttlMs = Math.max(earliestExpiry - Date.now(), 0);
                    const ttlSec = Math.max(Math.ceil(ttlMs / 1000), 60);
                    await redis.set(cookieKey, serialized, 'EX', ttlSec);
                } else {
                    await redis.set(cookieKey, serialized, 'EX', 24 * 60 * 60);
                }
                logger.info({ endpointId, loginTime }, "Auto-login successful, session cookies refreshed in Redis.");
                return true;
            } else {
                logger.warn({ endpointId }, "Auto-login response did not contain Set-Cookie header.");
            }
        } else {
            logger.error({ endpointId, status: loginRes.status }, "Auto-login failed with non-OK HTTP status.");
        }
    } catch (loginErr) {
        logger.error({ endpointId, err: loginErr }, "Auto-login execution encountered an error.");
    }
    return false;
};

const handlePingEndpointJob = async (job: ExecutionJob) => {
    const endpointId = job.payload?.endpointId;
    const monitorId = job.payload?.monitorId;

    if (!endpointId) {
        throw new Error("Missing 'endpointId' in job payload for ping_endpoint");
    }

    const endpoint = await endpointRepo.getEndpointForPing(endpointId);

    if (!endpoint) {
        logger.warn({ jobId: job.id, endpointId }, `Endpoint not found in database. Skipping execution.`);
        return;
    }

    const monitor = monitorId ? await prisma.monitor.findUnique({ where: { id: monitorId } }) : null;
    const interval = monitor?.interval || 5; // Default check interval in minutes

    // Resolve Redis Cookie Jar Key
    const isTest = !!job.payload?.isTest;
    const cookieKey = isTest
        ? `pingloop:session:user:${job.userId}:project:${endpoint.projectId}`
        : `pingloop:session:monitor:${endpoint.id}`;

    // Load Cookie Jar from Redis
    let initialCookies = [];
    try {
        const cachedCookies = await redis.get(cookieKey);
        if (cachedCookies) {
            initialCookies = JSON.parse(cachedCookies);
        }
    } catch (err) {
        logger.error({ jobId: job.id, err }, "Failed to load cookie jar from Redis");
    }
    const cookieJar = new CookieJar(initialCookies);

    // Get Auth configuration
    const auth = endpoint.auth as any;
    const hasAutoLogin = auth && 
        auth.type === 'cookie' && 
        auth.loginConfig && 
        typeof auth.loginConfig.url === 'string' && 
        auth.loginConfig.url.trim() !== '' && 
        typeof auth.loginConfig.body === 'string' && 
        auth.loginConfig.body.trim() !== '';

    let loginAttempted = false;

    // Pre-request check: if scheduled and cookie is expired/expiring, perform auto-login first
    if (!isTest && hasAutoLogin) {
        let ttl = -1;
        try {
            ttl = await redis.ttl(cookieKey);
        } catch (err) {
            logger.error({ jobId: job.id, err }, "Failed to get cookie TTL from Redis");
        }

        const threshold = interval * 60 * 2; // Threshold: double the check interval in seconds
        if (ttl < threshold) {
            logger.info({ endpointId: endpoint.id, ttl }, `Monitor session cookies are expired or expiring. Refreshing...`);
            loginAttempted = true;
            await performAutoLogin(endpoint.id, auth.loginConfig, cookieKey, cookieJar, endpoint.sslVerification !== false);
        }
    }

    const start = Date.now();
    let statusCode: number | null = null;
    let responseTime: number | null = null;
    let status: 'UP' | 'DOWN' = 'DOWN';
    let errorMsg: string | null = null;
    let responseBody: string | null = null;
    let responseHeaders: Record<string, string> | null = null;
    let sessionRefreshed = false;

    // Build URL & Headers (excluding auth)
    let url = buildUrlWithParams(endpoint.url, endpoint.queryParams);
    const headers = buildHeaders(endpoint.headers, null, endpoint.body);
    
    const requestOptions: RequestInit = {
        method: endpoint.method,
        headers
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(endpoint.method) && endpoint.body) {
        requestOptions.body = endpoint.body;
    }

    // Apply Modular Auth Handlers (Bearer, Basic, API Key etc.)
    const authOpts = { headers: requestOptions.headers as Record<string, string>, url };
    applyAuth(authOpts, endpoint.auth);
    url = authOpts.url; // Capture query param updates if any

    // Inject active Cookie Header from Cookie Jar
    const activeCookies = cookieJar.getCookieString(url);
    if (activeCookies) {
        (requestOptions.headers as Record<string, string>)['Cookie'] = activeCookies;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        requestOptions.signal = controller.signal;

        let dispatcher = undefined;
        if (endpoint.sslVerification === false) {
            dispatcher = new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            });
        }

        let res = await fetch(url, { ...requestOptions, dispatcher } as any);
        clearTimeout(timeoutId);
        
        statusCode = res.status;
        responseTime = Date.now() - start;
        responseHeaders = parseResponseHeaders(res.headers);

        // Check for 401 error and trigger lazy self-healing login
        if (statusCode === 401 && hasAutoLogin && !loginAttempted) {
            loginAttempted = true;
            logger.info({ endpointId: endpoint.id }, `API returned 401 Unauthorized. Triggering self-healing login retry...`);
            const loginSuccess = await performAutoLogin(endpoint.id, auth.loginConfig, cookieKey, cookieJar, endpoint.sslVerification !== false);
            if (loginSuccess) {
                sessionRefreshed = true;
                // Retry the original request with refreshed cookies
                const retryHeaders = { ...headers };
                const activeCookiesRetry = cookieJar.getCookieString(url);
                if (activeCookiesRetry) {
                    retryHeaders['Cookie'] = activeCookiesRetry;
                }
                
                const retryStart = Date.now();
                const retryRes = await fetch(url, { ...requestOptions, headers: retryHeaders, dispatcher } as any);
                res = retryRes;
                statusCode = retryRes.status;
                responseTime = Date.now() - retryStart;
                responseHeaders = parseResponseHeaders(retryRes.headers);
            }
        }

        if (res.ok) {
            status = 'UP';
        } else {
            status = 'DOWN';
            errorMsg = `HTTP Error Status: ${statusCode}`;
        }

        const rawBody = await res.text();
        if (rawBody.length > 51200) {
            responseBody = rawBody.substring(0, 51200) + "\n...[TRUNCATED: Exceeded 50KB limit]";
        } else {
            responseBody = rawBody;
        }

        // Intercept Set-Cookie headers and update Cookie Jar
        const setCookieHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get('set-cookie') || null);
        if (setCookieHeaders) {
            cookieJar.setCookies(setCookieHeaders, url);
            
            // Save updated cookies to Redis
            const serialized = JSON.stringify(cookieJar.toJSON());
            const earliestExpiry = cookieJar.getEarliestExpiry();
            
            if (earliestExpiry) {
                const ttlMs = Math.max(earliestExpiry - Date.now(), 0);
                const ttlSec = Math.max(Math.ceil(ttlMs / 1000), 60); // Minimum 60 seconds TTL
                await redis.set(cookieKey, serialized, 'EX', ttlSec);
            } else {
                // If there are no expiring cookies, keep session active for 24 hours by default
                await redis.set(cookieKey, serialized, 'EX', 24 * 60 * 60);
            }
        }

    } catch (err) {
        responseTime = Date.now() - start;
        status = 'DOWN';
        errorMsg = err instanceof Error ? err.message : String(err);
    }

    const resultObj = {
        statusCode,
        responseTime,
        status,
        responseBody,
        responseHeaders,
        error: errorMsg,
        cookiesRefreshed: sessionRefreshed
    };

    // Always log response in database (for both tests and scheduled monitors)
    await createResponse({
        endpointId: endpoint.id,
        monitorId: monitorId,
        ...resultObj
    });

    if (!job.payload?.isTest) {
        if (monitorId) {
            await monitorRepo.updateMonitorStatus(monitorId, status);
        }

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
    }

    logger.info({ jobId: job.id, endpointId, monitorId, url, status, statusCode, responseTime, isTest: job.payload?.isTest }, `Health check complete`);
    return resultObj;
};

const handleSendEmailJob = async (job: ExecutionJob) => {
    const { to, subject, body } = job.payload || {};
    logger.info({ to, subject, body }, `[SIMULATED EMAIL DISPATCH] Sending alert email to client...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    logger.info({ to }, `[SIMULATED EMAIL DISPATCH] Email sent successfully.`);
    return true;
};

export const executeJob = async (job: ExecutionJob) => {
    logger.info({ jobId: job.id, type: job.type }, `Executing job`);

    if (job.type === 'ping_endpoint') {
        return await handlePingEndpointJob(job);
    } else if (job.type === 'send_email') {
        return await handleSendEmailJob(job);
    } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return null;
    }
};