import { prisma } from 'db';

export const countProjectsByUser = async (userId: string) => {
    return await prisma.project.count({ where: { userId } });
};

export const countEndpointsByUser = async (userId: string) => {
    return await prisma.endpoint.count({ where: { project: { userId } } });
};

export const countResponsesByUser = async (userId: string) => {
    return await prisma.response.count({ where: { endpoint: { project: { userId } } } });
};

export const countFailedResponsesByUser = async (userId: string) => {
    return await prisma.response.count({
        where: {
            status: 'DOWN',
            endpoint: { project: { userId } }
        }
    });
};

export const getRecentEndpointsByUser = async (userId: string, take: number = 5) => {
    return await prisma.endpoint.findMany({
        where: { project: { userId } },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            name: true,
            url: true,
            method: true,
            project: { select: { name: true } }
        }
    });
};
