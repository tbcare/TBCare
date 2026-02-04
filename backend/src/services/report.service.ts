import prisma from '../config/db';

export const getClinicStats = async () => {
  // 1. Get total active patients
  const totalActive = await prisma.patient.count({
    where: { status: 'ACTIVE' }
  });

  // 2. Calculate Adherence Rate
  // Look at appointments from the last 30 days
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 30);

  const totalAppointments = await prisma.appointment.count({
    where: {
      scheduledAt: { gte: lastMonth },
      type: 'REFILL'
    }
  });

  const completedAppointments = await prisma.appointment.count({
    where: {
      scheduledAt: { gte: lastMonth },
      type: 'REFILL',
      status: 'completed'
    }
  });

  // Avoid division by zero
  const adherenceRate = totalAppointments > 0 
    ? (completedAppointments / totalAppointments) * 100 
    : 100;

  return {
    totalActive,
    adherenceRate: Math.round(adherenceRate),
    completedAppointments,
    missedAppointments: totalAppointments - completedAppointments
  };
};

export const getStaffPerformance = async () => {
  // Returns patient load per staff member
  return await prisma.dotsStaff.findMany({
    select: {
      name: true,
      _count: {
        select: { patients: true }
      }
    }
  });
};