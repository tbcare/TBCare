import cron from 'node-cron';
import prisma from '../config/db';
import { sendStaffRefillSummary } from '../services/mail.service';
import { sendAdherenceReminder } from '../services/notification';

// Import the auto-generated types from Prisma to fix the "Property does not exist" errors
import { Patient, DotsStaff } from '@prisma/client';

// Define a local type for Staff that includes their Patients
type StaffWithPatients = DotsStaff & {
  patients: Patient[];
};

export const initCronJobs = () => {
  // --- 🌅 6:00 AM: SAME-DAY PATIENT REMINDERS ---
  cron.schedule('0 6 * * *', async () => {
    console.log('⏰ 6:00 AM: Running daily patient adherence reminders...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tonight = new Date(today);
      tonight.setHours(23, 59, 59, 999);

      // We explicitly cast the result so TS recognizes 'nextRefillDate' and 'status'
      const patientsDueToday = await prisma.patient.findMany({
        where: {
          nextRefillDate: {
            gte: today,
            lte: tonight
          },
          status: "ACTIVE" 
        }
      });

      for (const patient of patientsDueToday) {
        await sendAdherenceReminder(patient.phone, patient.name, patient.hasWhatsApp);
      }
      console.log(`✅ Sent ${patientsDueToday.length} patient reminders.`);
    } catch (error) {
      console.error('❌ Patient Reminder Job Error:', error);
    }
  });

  // --- 📋 8:00 AM: STAFF SUMMARY FOR TOMORROW'S REFILLS ---
  cron.schedule('0 8 * * *', async () => {
    console.log('🔍 8:00 AM: Checking for patients due for refills tomorrow...');

    try {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Explicitly include patients and cast the array to our custom type
      const staffList = (await prisma.dotsStaff.findMany({
        include: {
          patients: {
            where: {
              nextRefillDate: {
                gte: tomorrowStart,
                lte: tomorrowEnd
              },
              status: "ACTIVE"
            }
          }
        }
      })) as StaffWithPatients[];

      for (const staff of staffList) {
        if (staff.patients && staff.patients.length > 0) {
          await sendStaffRefillSummary(staff.email, staff.name, staff.patients);
          console.log(`📧 Pre-appointment alert sent to ${staff.name} (${staff.patients.length} patients).`);
        }
      }
    } catch (error) {
      console.error('❌ Staff Reminder Job Error:', error);
    }
  });

  console.log('📅 All Cron Jobs initialized (6:00 AM Patients / 8:00 AM Staff).');
};