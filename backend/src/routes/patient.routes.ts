import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { registerPatient, getAllPatients } from '../controllers/patient.controller';
import { validatePatient } from '../middleware/validate.middleware';

const router = Router();

// --- DEBUG LOGS (Delete these after it works) ---
console.log('Is registerPatient a function?', typeof registerPatient);
console.log('Is validatePatient a function?', typeof validatePatient);
console.log('Is authenticateJWT a function?', typeof authenticateJWT);

// GET: /api/patients
router.get('/', authenticateJWT, getAllPatients);

// POST: /api/patients
// The order MUST be: 1. Auth -> 2. Validate -> 3. Controller
router.post('/', authenticateJWT, validatePatient, registerPatient);

export default router;