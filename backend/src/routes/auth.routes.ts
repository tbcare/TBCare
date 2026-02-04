import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

// Only defining the endpoint and the function to call
router.post('/login', login);

export default router;