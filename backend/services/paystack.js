/**
 * Paystack payments (card, M-Pesa, bank — whatever the account supports).
 * Flow: initialize → customer pays on Paystack → webhook and/or verify.
 * PAYSTACK_BASE_URL exists so tests can point at a local stub.
 */
const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
const CURRENCY = process.env.PAYSTACK_CURRENCY || 'KES';

const secretKey = () => process.env.PAYSTACK_SECRET_KEY || '';
const isConfigured = () => !!secretKey();
const isLiveMode = () => secretKey().startsWith('sk_live');

function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json' },
    timeout: 20000,
  });
}

/** Paystack works in minor units (cents), so Ksh 1,500 is 150000 */
const toMinorUnits = (amount) => Math.round(Number(amount) * 100);
const fromMinorUnits = (amount) => Number(amount) / 100;

/**
 * Start a payment. Returns { authorization_url, access_code, reference }.
 * `reference` is our own order reference, so we can match it later.
 */
async function initializeTransaction({ email, amount, reference, callbackUrl, metadata }) {
  const { data } = await client().post('/transaction/initialize', {
    email,
    amount: toMinorUnits(amount),
    currency: CURRENCY,
    reference,
    callback_url: callbackUrl,
    metadata,
  });
  if (!data?.status) throw new Error(data?.message || 'Paystack could not start this payment');
  return data.data;
}

/** Ask Paystack what actually happened. Never trust the browser for this. */
async function verifyTransaction(reference) {
  const { data } = await client().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!data?.status) throw new Error(data?.message || 'Could not verify this payment');
  const tx = data.data;
  return {
    status: tx.status,                       // success | failed | abandoned | ongoing | pending
    reference: tx.reference,
    amount: fromMinorUnits(tx.amount),
    currency: tx.currency,
    paidAt: tx.paid_at,
    channel: tx.channel,                     // card | mobile_money | bank | ...
    receipt: tx.receipt_number || tx.reference,
    customerEmail: tx.customer?.email,
    metadata: tx.metadata,
    gatewayResponse: tx.gateway_response,
    raw: tx,
  };
}

/** Webhook bodies are signed with the secret key; compare against the raw body */
function isValidWebhookSignature(rawBody, signature) {
  if (!signature || !isConfigured()) return false;
  const expected = crypto.createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  isValidWebhookSignature,
  isConfigured,
  isLiveMode,
  CURRENCY,
};
