import { prisma } from 'db';

export const updateMonitorStatus = async (id: string, status: string) => {
    return await prisma.monitor.update({
        where: { id },
        data: { status }
    });
};
