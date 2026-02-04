import { Router } from 'express';
import { getAllStaff } from '../controllers/staff.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getAllStaff);

export default router;