import { prisma } from 'db';

export const createFolder = async (data: { name: string; projectId: string; parentId?: string | null }) => {
    return await prisma.folder.create({
        data: {
            name: data.name,
            project: { connect: { id: data.projectId } },
            parent: data.parentId ? { connect: { id: data.parentId } } : undefined
        }
    });
};

export const getFoldersByProject = async (projectId: string) => {
    return await prisma.folder.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });
};

export const findFolderById = async (id: string) => {
    return await prisma.folder.findUnique({
        where: { id },
        include: { project: true }
    });
};

export const updateFolder = async (id: string, data: { name?: string; parentId?: string | null }) => {
    return await prisma.folder.update({
        where: { id },
        data: {
            name: data.name,
            parent: data.parentId !== undefined ? (data.parentId ? { connect: { id: data.parentId } } : { disconnect: true }) : undefined
        }
    });
};

export const deleteFolder = async (id: string) => {
    return await prisma.folder.delete({
        where: { id }
    });
};
