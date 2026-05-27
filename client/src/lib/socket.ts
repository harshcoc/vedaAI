import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    let rawSocketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    
    // Defensively prepend protocol if omitted to prevent relative socket matching
    if (!rawSocketURL.startsWith('http://') && !rawSocketURL.startsWith('https://')) {
      if (rawSocketURL.includes('localhost') || rawSocketURL.includes('127.0.0.1')) {
        rawSocketURL = `http://${rawSocketURL}`;
      } else {
        rawSocketURL = `https://${rawSocketURL}`;
      }
    }
    
    const socketURL = rawSocketURL.endsWith('/') ? rawSocketURL.slice(0, -1) : rawSocketURL;
    socket = io(socketURL, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
