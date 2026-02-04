import { Request, Response } from 'express';
import * as AppointmentService from '../services/appointment.service';

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await AppointmentService.getUpcomingAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
};