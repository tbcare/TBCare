import { Request, Response, NextFunction } from 'express';

export const validatePatient = (req: Request, res: Response, next: NextFunction) => {
  const { name, phone, age, treatmentStartDate, facilityId } = req.body;

  console.log('Validating patient data:', {
    name: name ? 'provided' : 'MISSING',
    phone: phone ? 'provided' : 'MISSING',
    age: age ? 'provided' : 'MISSING',
    treatmentStartDate: treatmentStartDate ? 'provided' : 'MISSING',
    facilityId: facilityId ? 'provided' : 'MISSING',
    allData: req.body
  });

  if (!name || !phone || !age || !treatmentStartDate || !facilityId) {
    return res.status(400).json({ 
      message: "Missing required fields: name, phone, age, treatmentStartDate, and facilityId are required." 
    });
  }

  next(); // Success: move to the controller
};