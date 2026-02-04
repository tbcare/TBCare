/**
 * NOTIFICATION SERVICE (DORMANT)
 * To activate: Replace the console.log with your chosen Provider SDK (Twilio, Vonage, etc.)
 */

export const sendAdherenceReminder = async (
  phone: string, 
  name: string, 
  useWhatsApp: boolean
) => {
  const messageBody = `REMINDER: Hello ${name}, please take your TB medication.`;

  try {
    // --- INACTIVE MODE: LOGS TO TERMINAL ONLY ---
    console.log('--- 📨 OUTGOING NOTIFICATION (SIMULATED) ---');
    console.log(`TO: ${phone}`);
    console.log(`VIA: ${useWhatsApp ? 'WhatsApp' : 'SMS'}`);
    console.log(`BODY: ${messageBody}`);
    console.log('-------------------------------------------');

    // Return a "Mock" success response
    return { success: true, sid: "mock_id_" + Math.random().toString(36).substr(2, 9) };

    /* FUTURE ACTIVATION CODE:
    const message = await providerClient.messages.create({ ... });
    return message;
    */
  } catch (error) {
    console.error(`❌ Notification Service Error:`, error);
    throw error;
  }
};