import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';

import { corsOrigin } from '../config/cors';

let io: SocketIOServer | null = null;

/**
 * Set up Socket.io on the HTTP server
 */
export function setupSocketIO(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Extract userId from auth token or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    let userId: string | null = null;

    if (token && typeof token === 'string') {
      try {
        // Decode JWT to get userId (same approach as auth middleware)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          userId = payload.sub || null;
        }
      } catch {
        console.warn('Failed to decode socket auth token');
      }
    }

    if (userId) {
      // Join user-specific room
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined room user:${userId}`);
    } else {
      console.warn(`⚠️ Socket ${socket.id} connected without valid auth`);
    }

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('🔌 Socket.io initialized');

  return io;
}

/**
 * Get the Socket.io server instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized. Call setupSocketIO first.');
  }
  return io;
}

/**
 * Emit an event to a specific user's room
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  const socketIO = getIO();
  socketIO.to(`user:${userId}`).emit(event, data);
}
