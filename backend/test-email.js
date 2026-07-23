require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/\s/g, '');

  console.log('Testing with User:', user);
  console.log('Pass length:', pass.length);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.verify();
    console.log('SUCCESS: Authenticated!');
  } catch (error) {
    console.error('FAILED TO AUTHENTICATE:', error.message);
  }
}
testEmail();
