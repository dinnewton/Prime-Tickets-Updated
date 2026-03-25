import { io } from 'socket.io-client';

// Use same origin in production (Express serves the frontend),
// fall back to localhost:5000 in dev (Vite proxy doesn't cover WebSockets)
const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';

// Persist visitor session across page reloads
function getSessionId() {
  let id = localStorage.getItem('pt-chat-session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('pt-chat-session', id);
  }
  return id;
}

function getVisitorName() {
  try {
    const raw = localStorage.getItem('prime-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.user?.name || 'Visitor';
    }
  } catch {}
  return 'Visitor';
}

let visitorSocket = null;
let adminSocket = null;

export function getVisitorSocket() {
  if (!visitorSocket || visitorSocket.disconnected) {
    visitorSocket = io(SOCKET_URL, {
      auth: {
        sessionId: getSessionId(),
        visitorName: getVisitorName(),
        role: 'visitor',
      },
      autoConnect: true,
    });
  }
  return visitorSocket;
}

export function getAdminSocket(token) {
  if (!adminSocket || adminSocket.disconnected) {
    adminSocket = io(SOCKET_URL, {
      auth: { role: 'admin', token },
      autoConnect: true,
    });
  }
  return adminSocket;
}

export function disconnectVisitorSocket() {
  if (visitorSocket) {
    visitorSocket.disconnect();
    visitorSocket = null;
  }
}

export { getSessionId };
