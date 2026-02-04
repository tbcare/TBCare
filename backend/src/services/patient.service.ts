import prisma from '../config/db';
import { addDays, parseISO, startOfDay } from 'date-fns';

export const createPatientWithRefill = async (data: any) => {
  const startDate = startOfDay(
    typeof data.treatmentStartDate === 'string' 
      ? parseISO(data.treatmentStartDate) 
      : data.treatmentStartDate
  );

  const nextRefill = addDays(startDate, 27);

  return await prisma.$transaction(async (tx) => {
    // 1. Create the Patient
    const patient = await tx.patient.create({
      data: {
        name: data.name,
        phone: data.phone,
        age: parseInt(data.age.toString()), 
        sex: data.sex,
        address: data.address,
        diagnosis: data.diagnosis,
        extrapulmonarySite: data.diagnosis === 'Extra-pulmonary' ? data.extrapulmonarySite : null,
        patientType: data.patientType, // Ensure frontend sends 'NEW' or 'RETREATMENT'
        treatmentStartDate: startDate,
        nextRefillDate: nextRefill,
        facilityId: data.facilityId,
        staffId: data.staffId,
        status: 'ACTIVE',
      },
    });

    // 2. Initial Visit
    await tx.appointment.create({
      data: {
        patientId: patient.id,
        staffId: data.staffId,
        scheduledAt: startDate,
        type: 'INITIATION',
        status: 'completed', 
      },
    });

    // 3. Day 28 Refill
    await tx.appointment.create({
      data: {
        patientId: patient.id,
        staffId: data.staffId,
        scheduledAt: nextRefill,
        type: 'REFILL',
        status: 'scheduled',
      },
    });

    return patient; // This returned object contains the 'name'
  });
};