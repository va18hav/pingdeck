import { prisma } from 'db';

export const createProject = async (data: { name: string; description?: string; userId: string }) => {
    return await prisma.project.create({
        data,
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true
        }
    });
};

export const findProjectsByUser = async (userId: string) => {
    return await prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
};

export const findProjectById = async (id: string) => {
    return await prisma.project.findUnique({
        where: { id }
    });
};

export const deleteProject = async (id: string) => {
    return await prisma.project.delete({
        where: { id }
    });
};
