import { Router } from 'express';
import { getAppointments } from '../controllers/appointment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getAppointments);

export default router;