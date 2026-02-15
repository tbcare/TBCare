const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'dev_fallback_secret_key';
console.log('JWT_SECRET from env:', JSON.stringify(process.env.JWT_SECRET));
console.log('Secret being used:', JSON.stringify(secret));
console.log('Secret length:', secret.length);
console.log('Secret bytes:', Buffer.from(secret).toString('hex'));

// Create a test token
const testToken = jwt.sign({ id: 'test-user' }, secret, { expiresIn: '1d' });
console.log('\nGenerated token:', testToken);

// Try to verify it
jwt.verify(testToken, secret, (err, decoded) => {
  if (err) {
    console.log('❌ Verification FAILED:', err.message);
  } else {
    console.log('✅ Verification SUCCESS:', decoded);
  }
});

// Show what the token looks like when decoded
const parts = testToken.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log('\nToken payload:', payload);
