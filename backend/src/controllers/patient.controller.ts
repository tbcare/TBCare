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
    console.error('Patient registration error:', error);
    
    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Phone number already exists in the system.' });
    }
    
    res.status(400).json({ message: error.message || 'Error creating patient.' });
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
    
    if (!id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Only allow specific fields to be updated
    const allowedFields = ['name', 'phone', 'age', 'sex', 'address', 'diagnosis', 'status', 'nextRefillDate'];
    const updateData: any = {};
    
    // Get current patient to check for phone uniqueness
    const currentPatient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!currentPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    allowedFields.forEach(field => {
      if (field in req.body) {
        // Skip phone if it hasn't changed (to avoid unique constraint error)
        if (field === 'phone' && req.body[field] === currentPatient.phone) {
          return;
        }
        
        // Convert nextRefillDate to Date if it's a string
        if (field === 'nextRefillDate' && req.body[field]) {
          updateData[field] = new Date(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: { facility: true, appointments: true }
    });

    res.json({
      message: 'Patient updated successfully',
      patient: updatedPatient
    });
  } catch (error: any) {
    console.error('Update patient error:', error?.message || error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Phone number already exists for another patient' });
    }
    res.status(500).json({ 
      message: 'Error updating patient record',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    if (!id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Delete related appointments first (since they have foreign key to patient)
    await prisma.appointment.deleteMany({
      where: { patientId: id }
    });

    // Then delete the patient
    await prisma.patient.delete({ 
      where: { id } 
    });
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Delete patient error:', error?.message || error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.status(500).json({ 
      message: 'Error deleting patient record',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};