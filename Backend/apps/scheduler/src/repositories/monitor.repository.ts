import { prisma } from 'db';

export const createMonitor = async (data: { endpointId: string; interval: number }) => {
    return await prisma.monitor.create({
        data,
        select: {
            id: true,
            interval: true,
            status: true,
            endpointId: true,
            createdAt: true,
            repeatJobKey: true
        }
    });
};

export const findMonitorsByEndpoint = async (endpointId: string) => {
    return await prisma.monitor.findMany({
        where: { endpointId },
        orderBy: { createdAt: 'desc' }
    });
};

export const findMonitorById = async (id: string) => {
    return await prisma.monitor.findUnique({
        where: { id },
        include: {
            endpoint: {
                select: {
                    project: { select: { userId: true } }
                }
            }
        }
    });
};

export const deleteMonitor = async (id: string) => {
    return await prisma.monitor.delete({
        where: { id }
    });
};

export const updateMonitorStatus = async (id: string, status: string) => {
    return await prisma.monitor.update({
        where: { id },
        data: { status }
    });
};

export const updateMonitorRepeatKey = async (id: string, repeatJobKey: string | null) => {
    return await prisma.monitor.update({
        where: { id },
        data: { repeatJobKey }
    });
};
