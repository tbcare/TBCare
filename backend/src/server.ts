import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import staffRoutes from './routes/staff.routes';
import reportRoutes from './routes/report.routes';
import appointmentRoutes from './routes/appointment.routes';
import { authenticateJWT } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

// --- NEW UPDATE: GLOBAL REQUEST LOGGER ---
// This will tell us if the request is even reaching the server
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// --- DEBUG SECTION ---
console.log('--- Checking for "Undefined" Ghost Imports ---');
console.log('1. authRoutes:', typeof authRoutes);
console.log('2. patientRoutes:', typeof patientRoutes);
console.log('3. staffRoutes:', typeof staffRoutes);
console.log('4. appointmentRoutes:', typeof appointmentRoutes);
console.log('5. reportRoutes:', typeof reportRoutes);
console.log('6. authenticateJWT:', typeof authenticateJWT);
console.log('7. errorHandler:', typeof errorHandler);

// --- NEW UPDATE: ENV VERIFICATION ---
console.log('--- Environment Check ---');
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL Defined:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET Defined:', !!process.env.JWT_SECRET);
console.log('-------------------------------------------');

app.use(cors());
app.use(express.json());

// Public
app.use('/api/auth', authRoutes);

// Protected
app.use('/api/patients', authenticateJWT, patientRoutes);
app.use('/api/staff', authenticateJWT, staffRoutes);
app.use('/api/appointments', authenticateJWT, appointmentRoutes);
app.use('/api/reports', authenticateJWT, reportRoutes);

app.get('/', (req, res) => res.send('API Running'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Connected to Neon Database`); 
});