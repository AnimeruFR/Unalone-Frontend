import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketUrl(): string {
  // 1) Priorité à REACT_APP_SOCKET_URL
  const explicit = process.env.REACT_APP_SOCKET_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, '');
  }

  // 2) Sinon, dériver depuis REACT_APP_API_URL en retirant "/api"
  const apiUrl = process.env.REACT_APP_API_URL || '';
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[parts.length - 1] === 'api') parts.pop();
      url.pathname = parts.length > 0 ? `/${parts.join('/')}` : '/';
      return url.toString().replace(/\/$/, '');
    } catch (_e) {
      // ignore
    }
  }

  // 3) Fallback dev
  return 'https://unalone-backend-05eo.onrender.com:5000';
}

export const socketService = {
  connect: (token?: string) => {
    if (socket && socket.connected) return socket;

    const url = getSocketUrl();
    socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      auth: token ? { token } : undefined,
    });

    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('🔌 Socket connecté', socket?.id);
    });

    socket.on('connect_error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Erreur connexion socket:', err.message);
    });

    socket.on('disconnect', (reason) => {
      // eslint-disable-next-line no-console
      console.log('Socket déconnecté:', reason);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on: (event: string, handler: (...args: any[]) => void) => {
    socket?.on(event, handler);
  },

  off: (event: string, handler?: (...args: any[]) => void) => {
    if (!socket) return;
    if (handler) socket.off(event, handler);
    else socket.off(event);
  },

  emit: (event: string, payload?: any) => {
    socket?.emit(event, payload);
  },

  get instance() {
    return socket;
  }
};
