/**
 * Ticket confirmation notifications — Email, WhatsApp, SMS
 * All channels are optional: missing credentials are logged but never crash the app.
 */
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const SITE_URL = process.env.SITE_URL || 'https://primeticketsoko.com';

// ─── Email ────────────────────────────────────────────────────────────────────

// Names and titles come from user input — never put them in HTML unescaped
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// One block per booking with its QR (an inline attachment — Gmail blocks data: images)
function buildTicketsHtml(tickets) {
  if (!tickets.length) return '';
  return `
        <tr><td style="padding:0 40px 8px">
          <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:15px">Your entry QR code${tickets.length > 1 ? 's' : ''}</h3>
          ${tickets.map((t) => `
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;margin-bottom:12px">
            <tr><td style="padding:16px;text-align:center">
              <strong style="color:#1a1a2e">${esc(t.eventTitle)}</strong><br>
              <span style="color:#666;font-size:13px">${esc(t.ticketType?.toUpperCase())} · admits ${t.quantity} ${t.quantity === 1 ? 'person' : 'people'}</span><br>
              <img src="cid:${t.cid}" width="200" height="200" alt="Ticket QR code" style="margin:12px auto;display:block">
              <span style="color:#999;font-size:11px;word-break:break-all">Code: ${esc(t.ticketCode)}</span>
            </td></tr>
          </table>`).join('')}
        </td></tr>`;
}

function buildEmailHtml({ customerName, orderRef, mpesaCode, amount, cart, tickets = [] }) {
  const rows = cart
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0">
          <strong>${esc(item.eventTitle)}</strong><br>
          <span style="color:#666;font-size:13px">${esc(item.ticketType?.toUpperCase())} · ${item.quantity} ticket${item.quantity > 1 ? 's' : ''}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">
          Ksh ${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr><td style="background:#1f2328;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#e2a47f;font-size:28px;font-weight:900;letter-spacing:2px">PRIME</h1>
          <p style="margin:2px 0 0;color:#e2a47f;font-size:11px;letter-spacing:6px">TICKETS</p>
          <p style="margin:14px 0 0;color:rgba(255,255,255,.8);font-size:14px">Your booking is confirmed!</p>
        </td></tr>

        <!-- Success badge -->
        <tr><td style="padding:32px 40px 0;text-align:center">
          <div style="display:inline-block;background:#ecfdf5;border:2px solid #10b981;border-radius:50px;padding:10px 24px">
            <span style="color:#10b981;font-weight:700;font-size:15px">✓ Payment Successful</span>
          </div>
          <h2 style="margin:20px 0 4px;color:#1a1a2e;font-size:22px">Hi ${esc(customerName || 'there')}!</h2>
          <p style="color:#666;margin:0 0 8px">Your tickets are confirmed and ready.</p>
        </td></tr>

        <!-- Order details -->
        <tr><td style="padding:24px 40px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf5f1;border-radius:8px;padding:20px;margin-bottom:24px">
            <tr>
              <td style="color:#666;font-size:13px">Booking Reference</td>
              <td style="text-align:right;font-weight:700;color:#9a5332;font-size:16px;letter-spacing:1px">${esc(orderRef)}</td>
            </tr>
            ${mpesaCode ? `<tr><td style="color:#666;font-size:13px;padding-top:8px">M-Pesa Code</td><td style="text-align:right;font-weight:600;padding-top:8px">${esc(mpesaCode)}</td></tr>` : ''}
            <tr>
              <td style="color:#666;font-size:13px;padding-top:8px">Total Paid</td>
              <td style="text-align:right;font-weight:700;font-size:18px;color:#1a1a2e;padding-top:8px">Ksh ${Number(amount).toFixed(2)}</td>
            </tr>
          </table>

          <!-- Ticket items -->
          <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:15px">Your Tickets</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${rows}
          </table>
        </td></tr>

        ${buildTicketsHtml(tickets)}

        <!-- Instructions -->
        <tr><td style="padding:0 40px 24px">
          <div style="background:#fffbeb;border-left:4px solid #F59E0B;padding:16px;border-radius:0 8px 8px 0">
            <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6">
              <strong>What to bring:</strong> ${tickets.length ? 'Show the QR code above' : `Show this email or your booking reference <strong>${esc(orderRef)}</strong>`} at the venue entrance.
              Each code can only be scanned in once — don't share it or post screenshots. Arrive 30 minutes before the event starts.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="margin:0;color:#999;font-size:12px">
            PrimeTickets · Questions? Email us at support@primeticketsoko.com<br>
            <a href="https://primeticketsoko.com" style="color:#9a5332;text-decoration:none">primeticketsoko.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const emailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Send one email from the site's no-reply address.
 * MAIL_FROM is the sender (e.g. noreply@primeticketsoko.com). With Gmail it
 * can be left unset — Gmail only sends as the account itself (SMTP_USER).
 */
async function sendMail({ to, subject, html, text, attachments }) {
  if (!emailConfigured()) {
    console.log(`[Notifications] Email to ${to} skipped — SMTP_USER / SMTP_PASS not configured`);
    return false;
  }
  const fromName = process.env.MAIL_FROM_NAME || 'PrimeTickets';
  const fromAddr = process.env.MAIL_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to,
    subject,
    html,
    text,
    attachments,
    ...(process.env.MAIL_REPLY_TO && { replyTo: process.env.MAIL_REPLY_TO }),
  });
  console.log(`[Notifications] Email "${subject}" sent to ${to}`);
  return true;
}

async function sendEmail({ customerEmail, customerName, orderRef, mpesaCode, amount, cart, bookings = [] }) {
  // Same check-in link as the QR in My Tickets
  const tickets = await Promise.all(
    bookings.filter((b) => b.ticketCode).map(async (b, i) => ({
      ...b,
      cid: `ticket-qr-${i}@primetickets`,
      png: await QRCode.toBuffer(`${SITE_URL}/checkin?code=${encodeURIComponent(b.ticketCode)}`, { width: 400, margin: 1 }),
    }))
  );
  await sendMail({
    to: customerEmail,
    subject: `Your tickets are confirmed — ${orderRef}`,
    html: buildEmailHtml({ customerName, orderRef, mpesaCode, amount, cart, tickets }),
    text: buildSmsText({ customerName, orderRef, mpesaCode, amount, cart }),
    attachments: tickets.map((t, i) => ({ filename: `ticket-${orderRef}-${i + 1}.png`, content: t.png, cid: t.cid })),
  });
}

// ─── WhatsApp & SMS via Twilio ────────────────────────────────────────────────

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  // Lazy-require so missing package doesn't crash the server
  try {
    const twilio = require('twilio');
    return twilio(sid, token);
  } catch {
    console.warn('[Notifications] twilio package not installed — run: npm install twilio');
    return null;
  }
}

function buildSmsText({ customerName, orderRef, mpesaCode, amount, cart }) {
  const eventNames = [...new Set(cart.map((i) => i.eventTitle))].join(', ');
  return (
    `PrimeTickets ✓ Booking confirmed!\n` +
    `Ref: ${orderRef}\n` +
    `${mpesaCode ? `M-Pesa: ${mpesaCode}\n` : ''}` +
    `Events: ${eventNames}\n` +
    `Total: Ksh ${Number(amount).toFixed(2)}\n` +
    `Show this message at the gate. Enjoy!`
  );
}

async function sendWhatsApp({ phone, customerName, orderRef, mpesaCode, amount, cart }) {
  if (!process.env.TWILIO_WHATSAPP_FROM) {
    console.log('[Notifications] WhatsApp skipped — TWILIO_WHATSAPP_FROM not configured');
    return;
  }

  const client = getTwilioClient();
  if (!client) return;

  // Normalise phone: strip leading 0, add country code if missing
  const e164 = normalisePhone(phone);
  if (!e164) {
    console.warn(`[Notifications] WhatsApp — invalid phone: ${phone}`);
    return;
  }

  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${e164}`,
    body: buildSmsText({ customerName, orderRef, mpesaCode, amount, cart }),
  });

  console.log(`[Notifications] WhatsApp sent to ${e164}`);
}

async function sendSms({ phone, customerName, orderRef, mpesaCode, amount, cart }) {
  if (!process.env.TWILIO_SMS_FROM) {
    console.log('[Notifications] SMS skipped — TWILIO_SMS_FROM not configured');
    return;
  }

  const client = getTwilioClient();
  if (!client) return;

  const e164 = normalisePhone(phone);
  if (!e164) {
    console.warn(`[Notifications] SMS — invalid phone: ${phone}`);
    return;
  }

  await client.messages.create({
    from: process.env.TWILIO_SMS_FROM,
    to: e164,
    body: buildSmsText({ customerName, orderRef, mpesaCode, amount, cart }),
  });

  console.log(`[Notifications] SMS sent to ${e164}`);
}

// Accepts: 0712345678 → +27712345678, +27... → unchanged
function normalisePhone(raw) {
  if (!raw) return null;
  let p = String(raw).replace(/\s+/g, '');
  if (p.startsWith('+')) return p;
  const country = process.env.PHONE_COUNTRY_CODE || '254'; // Kenya default; set 27 for SA
  if (p.startsWith('0')) p = p.slice(1);
  return `+${country}${p}`;
}

// ─── Main entry: fire all channels in parallel ────────────────────────────────

async function sendTicketConfirmation(payment) {
  const { customerEmail, customerName, phone, orderRef, mpesaCode, amount, cart, bookings } = payment;

  const tasks = [];

  if (customerEmail) {
    tasks.push(
      sendEmail({ customerEmail, customerName, orderRef, mpesaCode, amount, cart, bookings }).catch((e) =>
        console.error('[Notifications] Email error:', e.message)
      )
    );
  }

  if (phone) {
    tasks.push(
      sendWhatsApp({ phone, customerName, orderRef, mpesaCode, amount, cart }).catch((e) =>
        console.error('[Notifications] WhatsApp error:', e.message)
      )
    );
    tasks.push(
      sendSms({ phone, customerName, orderRef, mpesaCode, amount, cart }).catch((e) =>
        console.error('[Notifications] SMS error:', e.message)
      )
    );
  }

  await Promise.all(tasks);
}

module.exports = { sendTicketConfirmation, sendMail, emailConfigured };
