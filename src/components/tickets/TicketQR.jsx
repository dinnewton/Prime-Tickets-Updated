import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// The QR holds a check-in link, so door staff can scan it with the in-app
// scanner or any phone camera (they must be logged in as the event's vendor).
export function checkinUrl(ticketCode) {
  return `${window.location.origin}/checkin?code=${encodeURIComponent(ticketCode)}`;
}

export default function TicketQR({ ticketCode, size = 240 }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(checkinUrl(ticketCode), { width: size * 2, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [ticketCode, size]);

  if (!src) return <div style={{ width: size, height: size }} className="bg-gray-100 rounded-xl animate-pulse" />;
  return <img src={src} width={size} height={size} alt="Ticket QR code" className="rounded-xl" />;
}
