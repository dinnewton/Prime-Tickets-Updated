const axios = require('axios');

const BASE_URL =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

/**
 * Get OAuth access token from Daraja
 */
async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );
  return res.data.access_token;
}

/**
 * Generate Lipa Na M-Pesa password and timestamp
 */
function generatePassword() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  return { password, timestamp };
}

/**
 * Format phone number to 254XXXXXXXXX format
 */
function formatPhone(phone) {
  let p = phone.toString().replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;
  return p;
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 * @param {string} phone - customer phone number (07xx)
 * @param {number} amount - amount in KES
 * @param {string} accountRef - order/ticket reference
 * @param {string} description - payment description
 */
async function stkPush(phone, amount, accountRef, description) {
  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();
  const formattedPhone = formatPhone(phone);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount), // M-Pesa requires integer
    PartyA: formattedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountRef.slice(0, 12), // max 12 chars
    TransactionDesc: description.slice(0, 13), // max 13 chars
  };

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.data;
  // Response includes: MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription
}

/**
 * Query STK Push status
 * @param {string} checkoutRequestId
 */
async function stkQuery(checkoutRequestId) {
  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.data;
  // ResultCode: 0 = success, 1032 = cancelled, 1037 = timeout
}

module.exports = { stkPush, stkQuery, formatPhone };
