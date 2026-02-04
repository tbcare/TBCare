import prisma from '../config/db';

export const getUpcomingAppointments = async () => {
  return await prisma.appointment.findMany({
    // 1. Your schema default status is lowercase 'scheduled'
    where: { status: 'scheduled' },
    include: { patient: true },
    // 2. Changed 'appointmentDate' to 'scheduledAt'
    orderBy: { scheduledAt: 'asc' }
  });
};

export const markAsCompleted = async (id: string) => {
  return await prisma.appointment.update({
    where: { id },
    // 3. Your schema uses lowercase status strings
    data: { status: 'completed' }
  });
};