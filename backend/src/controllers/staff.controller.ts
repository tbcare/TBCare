import { Request, Response } from 'express';
import prisma from '../config/db';

export const getAllStaff = async (req: Request, res: Response) => {
  try {
    // 1. Change 'user' to 'dotsStaff' to match your schema model
    const staff = await prisma.dotsStaff.findMany({
      // 2. Note: your schema default role is lowercase "staff"
      where: { role: 'staff' }, 
      // 3. Update 'username' to 'name' and 'email' as per your schema
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        facilityId: true,
        createdAt: true 
      }
    });
    
    res.json(staff);
  } catch (error) {
    console.error('Fetch Staff Error:', error);
    res.status(500).json({ message: 'Error fetching staff members' });
  }
};