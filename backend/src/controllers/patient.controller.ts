import { Response, Request } from 'express';
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
      message: "Patient registered successfully",
      patient: newPatient
    });
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating patient.' });
  }
};

export const getAllPatients = async (req: AuthRequest, res: Response) => {
  try {
    const patients = await prisma.patient.findMany({
      include: { 
        facility: true, 
        appointments: { 
          // FIX: Removed 'date'/'scheduledDate' and used 'createdAt' 
          // to stop the "property does not exist" error.
          orderBy: { createdAt: 'desc' }, 
          take: 1 
        } 
      }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients' });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    // FIX: String casting to solve "string | string[]" error
    const id = req.params.id as string;
    
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { facility: true, appointments: true }
    });

    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient details' });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // FIX: Destructure to ensure we don't try to update the ID itself
    const { id: _, facility, appointments, ...updateData } = req.body;

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating patient record' });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Note: This assumes you have cascade delete set up in Prisma
    await prisma.patient.delete({ where: { id } });
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting patient record' });
  }
};