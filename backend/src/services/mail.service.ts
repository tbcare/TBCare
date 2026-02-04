import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: `"TB Care System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to TB Care Team',
    html: `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Hello, ${name}!</h2>
        <p>You have been added as a <strong>DOTS Staff</strong> member on the TB Care platform.</p>
        <p>You can now log in to manage patients and track adherence rates.</p>
        <a href="http://localhost:3000/login" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
        <br/><br/>
        <p>Best regards,<br/>The TB Care Admin Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// ADD THIS NEW EXPORT TO FIX THE "HAS NO EXPORTED MEMBER" ERROR
export const sendStaffRefillSummary = async (email: string, name: string, patients: any[]) => {
  const patientListHtml = patients
    .map(p => `<li><strong>${p.name}</strong> - ${p.phone}</li>`)
    .join('');

  const mailOptions = {
    from: `"TB Care System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Daily Action Plan: Patients due for Refill Tomorrow`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Good Morning, ${name}</h2>
        <p>The following patients are scheduled for medication refills tomorrow. Please ensure supplies are ready:</p>
        <ul>
          ${patientListHtml}
        </ul>
        <p><a href="http://localhost:3000/appointments" style="color: #2563eb;">View Full Clinic Schedule</a></p>
        <br/>
        <p>Best regards,<br/>TB Care Automated Alert</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};