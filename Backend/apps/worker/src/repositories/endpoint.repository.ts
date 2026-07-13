import { prisma } from 'db';

export const getEndpointForPing = async (id: string) => {
    return await prisma.endpoint.findUnique({
        where: { id },
        include: {
            project: {
                include: {
                    user: true
                }
            }
        }
    });
};

export const updateEndpointStatus = async (id: string, status: string) => {
    return await prisma.endpoint.update({
        where: { id },
        data: { status }
    });
};
