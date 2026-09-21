import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import jsQR from 'jsqr';
import { Camera, CameraOff, CheckCircle2, XCircle, Loader2, ArrowLeft, ScanLine } from 'lucide-react';
import Logo from '../../components/common/Logo';
import useAuthStore from '../../store/authStore';
import { checkinApi } from '../../services/api';

// A QR holds a check-in link (…/checkin?code=XYZ); staff may also type the bare code
function extractCode(text) {
  const trimmed = String(text || '').trim();
  try { return new URL(trimmed).searchParams.get('code') || ''; } catch { return trimmed; }
}

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }) : '');

export default function CheckIn() {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const [manual, setManual] = useState('');
  const [code, setCode] = useState(null);
  const [result, setResult] = useState(null);   // { ok, ticket, error, admitted }
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  const lookup = useCallback(async (raw) => {
    const c = extractCode(raw);
    if (!c) return;
    setCode(c);
    setBusy(true);
    setResult(null);
    try {
      const ticket = await checkinApi.lookup(c);
      setResult({ ok: ticket.valid, ticket, error: ticket.reason });
    } catch (e) {
      setResult({ ok: false, ticket: e.data?.eventTitle ? e.data : null, error: e.message });
    } finally {
      setBusy(false);
      navigator.vibrate?.(80);
    }
  }, []);

  async function admit(count) {
    setBusy(true);
    try {
      const ticket = await checkinApi.admit(code, count);
      setResult({ ok: true, ticket, admitted: ticket.admitted });
      navigator.vibrate?.([60, 40, 60]);
    } catch (e) {
      setResult({ ok: false, ticket: e.data?.eventTitle ? e.data : result?.ticket, error: e.data?.reason || e.message });
      navigator.vibrate?.(300);
    } finally {
      setBusy(false);
    }
  }

  // ─── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (qr?.data) {
        stopCamera();
        lookup(qr.data);
        return;
      }
    }
    frameRef.current = requestAnimationFrame(tick);
  }, [lookup, stopCamera]);

  async function startCamera() {
    setCameraError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError('Could not open the camera. Allow camera access for this site, or type the code below.');
    }
  }

  useEffect(() => stopCamera, [stopCamera]);

  // Opened from a ticket QR with the phone's own camera app
  useEffect(() => {
    const fromLink = params.get('code');
    if (fromLink) {
      lookup(fromLink);
      setParams({}, { replace: true });
    }
  }, [params, setParams, lookup]);

  function scanNext() {
    setResult(null);
    setCode(null);
    setManual('');
    startCamera();
  }

  const t = result?.ticket;
  const home = user?.role === 'admin' ? '/admin' : '/vendor';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Link to={home} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <Logo size="sm" onDark subtitle="Door check-in" />
        <span className="w-12" />
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Camera — hidden (not unmounted) while a result shows, so the result is on screen */}
        <div className={`relative aspect-square bg-black rounded-2xl overflow-hidden border border-white/10 ${result ? 'hidden' : ''}`}>
          <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${scanning ? '' : 'hidden'}`} />
          <canvas ref={canvasRef} className="hidden" />
          {scanning ? (
            <div className="absolute inset-8 border-2 border-white/70 rounded-2xl pointer-events-none" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <ScanLine className="w-14 h-14 text-gray-600" />
              <button onClick={startCamera} className="flex items-center gap-2 bg-white text-gray-900 font-semibold px-5 py-3 rounded-xl">
                <Camera className="w-5 h-5" /> Start scanning
              </button>
              {cameraError && <p className="text-sm text-red-400">{cameraError}</p>}
            </div>
          )}
          {scanning && (
            <button onClick={stopCamera} className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-lg" aria-label="Stop camera">
              <CameraOff className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Manual entry */}
        <form onSubmit={(e) => { e.preventDefault(); stopCamera(); lookup(manual); }} className={`flex gap-2 ${result ? 'hidden' : ''}`}>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Or type / paste the ticket code"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-white/30"
          />
          <button type="submit" disabled={!manual.trim() || busy} className="bg-white/10 hover:bg-white/20 disabled:opacity-40 px-4 rounded-xl text-sm font-semibold">
            Check
          </button>
        </form>

        {busy && !result && (
          <div className="flex justify-center py-6"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-2xl overflow-hidden border ${result.ok ? 'border-green-500/40' : 'border-red-500/40'}`}>
            <div className={`flex items-center gap-3 px-5 py-4 ${result.ok ? 'bg-green-600' : 'bg-red-600'}`}>
              {result.ok ? <CheckCircle2 className="w-9 h-9 shrink-0" /> : <XCircle className="w-9 h-9 shrink-0" />}
              <div>
                <p className="text-xl font-black leading-tight">
                  {result.admitted ? `ADMITTED ${result.admitted}` : result.ok ? 'VALID TICKET' : 'NOT VALID'}
                </p>
                <p className="text-sm text-white/90">
                  {result.admitted
                    ? (t.remaining > 0 ? `${t.remaining} more can still enter on this ticket` : 'Ticket fully used')
                    : result.ok ? `${t.remaining} of ${t.quantity} to admit` : result.error}
                </p>
              </div>
            </div>

            {t && (
              <div className="bg-white/5 px-5 py-4 space-y-1 text-sm">
                {t.byOrderRef && (
                  <p className="mb-2 bg-amber-500/15 text-amber-300 rounded-lg px-3 py-2 font-medium">
                    Found by order reference, not QR — check the name against the guest's ID.
                  </p>
                )}
                <p className="font-bold text-base">{t.eventTitle}</p>
                <p className="text-gray-400">{[fmtDate(t.eventDate), t.eventTime, t.venue].filter(Boolean).join(' · ')}</p>
                <p><span className="text-gray-400">Name:</span> {t.customerName || '—'}</p>
                <p><span className="text-gray-400">Ticket:</span> {t.ticketType?.toUpperCase()} × {t.quantity}{t.orderRef && <span className="text-gray-500"> · {t.orderRef}</span>}</p>
                {t.checkIns?.length > 0 && (
                  <p className="text-gray-400 pt-1">
                    Checked in: {t.checkIns.map((c) => `${c.count} at ${fmtTime(c.at)}`).join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="bg-white/5 px-5 pb-5 flex flex-col gap-2">
              {result.ok && !result.admitted && (
                <>
                  <button onClick={() => admit()} disabled={busy} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 font-bold py-3.5 rounded-xl text-lg">
                    {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Admit ${t.remaining === 1 ? '1 person' : `all ${t.remaining}`}`}
                  </button>
                  {t.remaining > 1 && (
                    <button onClick={() => admit(1)} disabled={busy} className="w-full bg-white/10 hover:bg-white/20 font-semibold py-3 rounded-xl">
                      Admit 1 only
                    </button>
                  )}
                </>
              )}
              <button onClick={scanNext} className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" /> Scan next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
