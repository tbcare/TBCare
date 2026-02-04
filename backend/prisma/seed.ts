import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { parse, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Use the specific password you want for testing
  const plainPassword = 'demo1234';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  console.log('🌱 Seed started: Refreshing clinical logic and credentials...');

  // 1. Upsert a Facility
  const facility = await prisma.facility.upsert({
    where: { id: 'facility-1' },
    update: { name: 'Central TB Clinic' },
    create: {
      id: 'facility-1',
      name: 'Central TB Clinic',
    },
  });

  // 2. Upsert the Staff (FORCING the password to update)
  const staff = await prisma.dotsStaff.upsert({
    where: { email: 'demo@tbcare.com' },
    update: { 
      password: hashedPassword, // This ensures 'demo1234' works even if the user existed
      role: 'admin' 
    },
    create: {
      id: 'staff-1',
      name: 'Demo Staff',
      email: 'demo@tbcare.com',
      password: hashedPassword,
      role: 'admin',
      facilityId: facility.id
    },
  });

  // 3. Define Treatment Logic (Jan 28, 2026)
  const startDateStr = '28-01-2026'; 
  const treatmentStart = parse(startDateStr, 'dd-MM-yyyy', new Date());
  const nextRefill = addDays(treatmentStart, 27); // Standard 28-day cycle logic

  // 4. Upsert a Patient
  const patient = await prisma.patient.upsert({
    where: { phone: '+1234567890' },
    update: {
      treatmentStartDate: treatmentStart,
      nextRefillDate: nextRefill,
      status: 'ACTIVE',
    },
    create: {
      id: 'patient-demo-1',
      name: 'John Doe',
      phone: '+1234567890',
      age: 45,
      sex: 'Male',
      address: '123 Health Street',
      diagnosis: 'Pulmonary TB',
      hasWhatsApp: true,
      treatmentStartDate: treatmentStart,
      nextRefillDate: nextRefill,
      status: 'ACTIVE',
      staffId: staff.id,
      facilityId: facility.id
    },
  });

  // 5. Create/Update Initial Appointment
  await prisma.appointment.upsert({
    where: { id: 'initial-appt-1' },
    update: {
      scheduledAt: nextRefill,
      status: 'scheduled'
    },
    create: {
      id: 'initial-appt-1',
      patientId: patient.id,
      staffId: staff.id,
      scheduledAt: nextRefill,
      type: 'REFILL',
      status: 'scheduled'
    }
  });

  console.log('-----------------------------------------------');
  console.log('✅ SEED SUCCESSFUL');
  console.log(`📧 Email: demo@tbcare.com`);
  console.log(`🔑 Password: ${plainPassword}`);
  console.log('-----------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });