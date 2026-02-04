export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff'; // Matches role in your DotsStaff model
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  treatmentStartDate: string;
  nextRefillDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED'; // Matches your Prisma enum
}