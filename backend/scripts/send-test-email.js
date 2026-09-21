#!/usr/bin/env node
/**
 * Send a test email with the SMTP settings in backend/.env.
 *   node backend/scripts/send-test-email.js you@example.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sendMail, emailConfigured } = require('../services/notifications');

const to = process.argv[2];
if (!to || !to.includes('@')) {
  console.error('Usage: node backend/scripts/send-test-email.js you@example.com');
  process.exit(1);
}
if (!emailConfigured()) {
  console.error('SMTP_USER / SMTP_PASS are not set in backend/.env');
  process.exit(1);
}

console.log(`Sending via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${process.env.MAIL_FROM || process.env.SMTP_USER} ...`);
sendMail({
  to,
  subject: 'PrimeTickets test email',
  text: 'If you can read this, PrimeTickets email is working.',
  html: '<p>If you can read this, <strong>PrimeTickets email is working</strong>.</p>',
})
  .then(() => console.log('Sent. Check the inbox (and spam folder).'))
  .catch((e) => { console.error('Failed:', e.message); process.exit(1); });
