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

// 1. Dynamic CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('github.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Enhanced Request Logger
// Check your terminal: If you see "POST /auth/login" without "/api", that is the problem.
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// 3. API Routes (All prefixed with /api)
app.use('/api/auth', authRoutes);
app.use('/api/patients', authenticateJWT, patientRoutes);
app.use('/api/staff', authenticateJWT, staffRoutes);
app.use('/api/appointments', authenticateJWT, appointmentRoutes);
app.use('/api/reports', authenticateJWT, reportRoutes);

// 4. Root/Health Check
app.get('/', (req, res) => res.json({ message: 'TB Care API is Running' }));

// 5. Catch-all for 404s (Helps debug "Not Found" errors)
app.use((req: Request, res: Response) => {
  console.log(`❌ 404 Error: User tried to access ${req.url}`);
  res.status(404).json({ 
    message: `Route ${req.url} not found. Did you forget the /api prefix?` 
  });
});

// 6. Global Error Handler
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('--- TB Care Server Environment ---');
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET === 'tbcare_2026' ? 'VALID' : 'INVALID'}`);
  console.log(`📁 DB Connected: ${!!process.env.DATABASE_URL}`);
  console.log('---------------------------------');
});