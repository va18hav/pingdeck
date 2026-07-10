import { prisma } from 'db';

export const createResponse = async (data: {
    endpointId: string;
    statusCode?: number | null;
    responseTime?: number | null;
    status: 'UP' | 'DOWN';
    error?: string | null;
}) => {
    return await prisma.response.create({
        data: {
            endpoint: { connect: { id: data.endpointId } },
            statusCode: data.statusCode,
            responseTime: data.responseTime,
            status: data.status,
            error: data.error
        }
    });
};
