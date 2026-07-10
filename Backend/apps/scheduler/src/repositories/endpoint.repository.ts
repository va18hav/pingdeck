import { prisma } from 'db';

export const createEndpoint = async (data: {
    name: string;
    url: string;
    interval: number;
    projectId: string;
}) => {
    return await prisma.endpoint.create({
        data,
        select: {
            id: true,
            name: true,
            url: true,
            method: true,
            interval: true,
            status: true,
            projectId: true,
            createdAt: true
        }
    });
};

export const findEndpointsByProject = async (projectId: string) => {
    return await prisma.endpoint.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });
};

export const findEndpointById = async (id: string) => {
    return await prisma.endpoint.findUnique({
        where: { id },
        include: {
            project: {
                select: {
                    userId: true
                }
            }
        }
    });
};

export const deleteEndpoint = async (id: string) => {
    return await prisma.endpoint.delete({
        where: { id }
    });
};

export const updateEndpointStatus = async (id: string, status: string) => {
    return await prisma.endpoint.update({
        where: { id },
        data: { status }
    });
};

export const updateEndpointRepeatKey = async (id: string, repeatJobKey: string | null) => {
    return await prisma.endpoint.update({
        where: { id },
        data: { repeatJobKey }
    });
};
