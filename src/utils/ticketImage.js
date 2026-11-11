import QRCode from 'qrcode';
import { checkinUrl } from '../components/tickets/TicketQR';

// Draws tickets as one PNG image and saves it to the customer's device.
// An image (rather than a PDF) opens in every phone's gallery and can be
// shown at the door without an internet connection.

const W = 800;          // image width
const H = 1340;         // height of one ticket (room for long titles and venues)
const PAD = 56;
const FONT = 'Inter, "Segoe UI", Arial, sans-serif';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return String(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Draws text wrapped to maxWidth (at most maxLines); returns the y after the last line. */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawTicket(ctx, ticket, top, index, count) {
  ctx.save();
  ctx.translate(0, top);

  // Card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Header band
  const band = ctx.createLinearGradient(0, 0, W, 150);
  band.addColorStop(0, '#1e1b4b');
  band.addColorStop(1, '#4c1d95');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, W, 150);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e2a47f';
  ctx.font = `900 40px ${FONT}`;
  ctx.fillText('PRIME TICKETS', PAD, 92);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `600 20px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(count > 1 ? `E-TICKET ${index + 1} OF ${count}` : 'E-TICKET', W - PAD, 90);
  ctx.textAlign = 'left';

  // Event title
  ctx.fillStyle = '#111827';
  ctx.font = `800 42px ${FONT}`;
  let y = wrapText(ctx, ticket.eventTitle, PAD, 222, W - PAD * 2, 50, 2);

  // Details
  const rows = [
    ['DATE', [formatDate(ticket.eventDate), ticket.eventTime].filter(Boolean).join(' · ')],
    ['VENUE', ticket.venue],
    ['TICKET', `${String(ticket.ticketType || 'regular').toUpperCase()} · admits ${ticket.quantity} ${ticket.quantity === 1 ? 'person' : 'people'}`],
    ...(ticket.customerName ? [['NAME', ticket.customerName]] : []),
  ];
  y += 8;
  for (const [label, value] of rows) {
    if (!value) continue;
    ctx.fillStyle = '#9ca3af';
    ctx.font = `700 17px ${FONT}`;
    ctx.fillText(label, PAD, y + 18);
    ctx.fillStyle = '#1f2937';
    ctx.font = `600 25px ${FONT}`;
    y = wrapText(ctx, value, PAD + 120, y + 20, W - PAD * 2 - 120, 32, 2) + 14;
  }

  // Tear line
  const tearY = Math.max(y + 10, 520);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(PAD, tearY);
  ctx.lineTo(W - PAD, tearY);
  ctx.stroke();
  ctx.setLineDash([]);

  // QR code
  const qrSize = 380;
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, checkinUrl(ticket.ticketCode), { width: qrSize, margin: 1, errorCorrectionLevel: 'M' });
  const qrX = (W - qrSize) / 2;
  const qrY = tearY + 40;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 20);
  ctx.stroke();
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  // Codes + note
  ctx.textAlign = 'center';
  ctx.fillStyle = '#111827';
  ctx.font = `700 24px "Courier New", monospace`;
  ctx.fillText(ticket.ticketCode, W / 2, qrY + qrSize + 66);
  ctx.fillStyle = '#6b7280';
  ctx.font = `500 19px ${FONT}`;
  if (ticket.orderRef) ctx.fillText(`Order ref: ${ticket.orderRef}`, W / 2, qrY + qrSize + 102);
  ctx.fillStyle = '#9ca3af';
  ctx.font = `500 17px ${FONT}`;
  ctx.fillText('Show this QR code at the entrance. It can only be scanned in once — do not share it.', W / 2, qrY + qrSize + 150);
  ctx.textAlign = 'left';

  // Separator between stacked tickets
  if (index < count - 1) {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, H - 4, W, 4);
  }
  ctx.restore();
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Draws the tickets, stacked, onto a new canvas. */
export async function renderTickets(tickets) {
  const list = (tickets || []).filter((t) => t && t.ticketCode);
  if (!list.length) throw new Error('No tickets to download');

  // Make sure the web font is ready, or the first download falls back to Arial
  try { await document.fonts?.ready; } catch {}

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H * list.length;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < list.length; i++) {
    await drawTicket(ctx, list[i], i * H, i, list.length);
  }

  return canvas;
}

/**
 * Saves the given tickets as a single PNG. Each ticket needs at least
 * { ticketCode, eventTitle }. Throws if the image cannot be produced.
 */
export async function downloadTickets(tickets) {
  const canvas = await renderTickets(tickets);
  const list = tickets.filter((t) => t && t.ticketCode);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create the ticket image');

  const ref = list[0].orderRef || list[0].ticketCode;
  saveBlob(blob, `PrimeTickets-${String(ref).replace(/[^\w-]/g, '')}.png`);
}
