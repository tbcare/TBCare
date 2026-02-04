import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { createPatientWithRefill } from '../services/patient.service';
import prisma from '../config/db';

export const registerPatient = async (req: AuthRequest, res: Response) => {
  try {
    const newPatient = await createPatientWithRefill({
      name: req.body.name,
      phone: req.body.phone,
      age: parseInt(req.body.age),
      sex: req.body.sex,
      address: req.body.address,
      diagnosis: req.body.diagnosis,
      treatmentStartDate: req.body.treatmentStartDate,
      facilityId: req.body.facilityId,
      staffId: req.user?.id 
    });

    res.status(201).json({
      message: "Patient registered and first refill scheduled for Day 28",
      patient: newPatient
    });
  } catch (error: any) {
    res.status(400).json({ 
      message: 'Error creating patient. Phone might exist or data is invalid.' 
    });
  }
};

export const getAllPatients = async (req: AuthRequest, res: Response) => {
  try {
    const patients = await prisma.patient.findMany({
      include: { facility: true, appointments: { take: 1 } }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients' });
  }
};