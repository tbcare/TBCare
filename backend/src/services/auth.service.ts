import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. Ensure JWT_SECRET exists, otherwise provide a fallback for dev only
const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_key';

/**
 * Generates a JWT token for the authenticated staff member
 */
export const generateToken = (userId: string): string => {
  // Signs the token with the staff ID and 24-hour expiration
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Compares plain text password with the hashed version in the database
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) return false;
  
  // Uses bcryptjs to securely compare the strings
  return await bcrypt.compare(password, hash);
};