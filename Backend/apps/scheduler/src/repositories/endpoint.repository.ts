import { prisma } from 'db';

export const createEndpoint = async (data: {
    name: string;
    url: string;
    projectId: string;
    folderId?: string | null;
    method?: string;
    headers?: any;
    body?: string | null;
    queryParams?: any;
    auth?: any;
    sslVerification?: boolean;
}) => {
    return await prisma.endpoint.create({
        data: {
            ...data,
            folderId: data.folderId ?? undefined,
            headers: data.headers ?? undefined,
            queryParams: data.queryParams ?? undefined,
            auth: data.auth ?? undefined,
            body: data.body ?? undefined
        },
        select: {
            id: true,
            name: true,
            url: true,
            method: true,
            projectId: true,
            createdAt: true,
            headers: true,
            body: true,
            queryParams: true,
            auth: true,
            sslVerification: true,
        }
    });
};

export const findEndpointsByProject = async (projectId: string) => {
    return await prisma.endpoint.findMany({
        where: { projectId },
        include: {
            monitors: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
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
            },
            monitors: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        }
    });
};

export const deleteEndpoint = async (id: string) => {
    return await prisma.endpoint.delete({
        where: { id }
    });
};

export const updateEndpoint = async (id: string, data: {
    name?: string;
    url?: string;
    method?: string;
    folderId?: string | null;
    headers?: any;
    body?: string | null;
    queryParams?: any;
    auth?: any;
    sslVerification?: boolean;
}) => {
    return await prisma.endpoint.update({
        where: { id },
        data: {
            name: data.name,
            url: data.url,
            method: data.method,
            folderId: data.folderId,
            headers: data.headers ?? undefined,
            queryParams: data.queryParams ?? undefined,
            auth: data.auth ?? undefined,
            body: data.body ?? undefined,
            sslVerification: data.sslVerification
        }
    });
};



export const findEndpointResponses = async (endpointId: string, take: number = 50) => {
    return await prisma.response.findMany({
        where: { endpointId },
        orderBy: { createdAt: 'desc' },
        take
    });
};
