import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { 
  registerPatient, 
  getAllPatients, 
  getPatientById,    // Add this
  updatePatient,     // Add this
  deletePatient      // Add this
} from '../controllers/patient.controller';
import { validatePatient } from '../middleware/validate.middleware';

const router = Router();

// 1. GET ALL: /api/patients
router.get('/', authenticateJWT, getAllPatients);

// 2. GET SINGLE: /api/patients/:id
// This is the route your PatientProfile component is looking for!
router.get('/:id', authenticateJWT, getPatientById);

// 3. POST: /api/patients
router.post('/', authenticateJWT, validatePatient, registerPatient);

// 4. PUT: /api/patients/:id
// Used for saving edits and logging refills
router.put('/:id', authenticateJWT, updatePatient);

// 5. DELETE: /api/patients/:id
router.delete('/:id', authenticateJWT, deletePatient);

export default router;