import { Request, Response, NextFunction } from 'express';

// Ensure 'export' is written before 'const'
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Logged Error:', err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};