import { prisma } from 'db';

export const createResponse = async (data: {
    endpointId: string;
    monitorId?: string | null;
    statusCode?: number | null;
    responseTime?: number | null;
    status: 'UP' | 'DOWN';
    responseBody?: string | null;
    responseHeaders?: any;
    error?: string | null;
}) => {
    return await prisma.response.create({
        data: {
            endpoint: { connect: { id: data.endpointId } },
            monitor: data.monitorId ? { connect: { id: data.monitorId } } : undefined,
            statusCode: data.statusCode,
            responseTime: data.responseTime,
            status: data.status,
            responseBody: data.responseBody,
            responseHeaders: data.responseHeaders ?? undefined,
            error: data.error
        }
    });
};
