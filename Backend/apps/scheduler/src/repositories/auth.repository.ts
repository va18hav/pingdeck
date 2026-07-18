import { prisma } from 'db';

export const findUserByEmail = async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id: string) => {
    return await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, isVerified: true, createdAt: true }
    });
};

export const createUser = async (email: string, passwordHash: string) => {
    return await prisma.user.create({
        data: {
            email,
            password: passwordHash
        },
        select: {
            id: true,
            email: true,
            isVerified: true,
            createdAt: true
        }
    });
};

export const verifyUser = async (id: string) => {
    return await prisma.user.update({
        where: { id },
        data: { isVerified: true },
        select: {
            id: true,
            email: true,
            isVerified: true,
            createdAt: true
        }
    });
};

export const updatePassword = async (id: string, passwordHash: string) => {
    return await prisma.user.update({
        where: { id },
        data: { password: passwordHash }
    });
};
