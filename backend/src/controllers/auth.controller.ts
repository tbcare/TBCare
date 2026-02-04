import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateToken, verifyPassword } from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
  try {
    // 1. Destructure email and password from request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Fetch the staff member using the correct model name
    const user = await prisma.dotsStaff.findUnique({ 
      where: { email: email.toLowerCase() } // Normalize email to handle case-sensitivity
    });

    // 3. Perform a strict check. verifyPassword must use bcrypt.compare
    if (!user) {
      console.log(`Auth Failed: No staff found with email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      console.log(`Auth Failed: Incorrect password for ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Successful login: Generate token and return clinical user context
    const token = generateToken(user.id);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        facilityId: user.facilityId // Added for clinical routing context
      } 
    });
  } catch (error) {
    // Log the specific error to your backend terminal for debugging
    console.error('Login Error:', error); 
    res.status(500).json({ message: 'Internal server error during login' });
  }
};