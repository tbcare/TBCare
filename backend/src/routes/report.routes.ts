import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { getClinicStats, getStaffPerformance } from '../services/report.service';

const router = Router();

router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    const stats = await getClinicStats();
    const staffLoad = await getStaffPerformance();
    
    res.json({
      summary: stats,
      staffPerformance: staffLoad
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;