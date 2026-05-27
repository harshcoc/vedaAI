import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    const rawSocketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
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
