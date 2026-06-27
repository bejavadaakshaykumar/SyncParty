import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { setupRoomHandlers, handleUserLeftRoom } from './roomHandlers.js';
import { setupPlayerHandlers } from './playerHandlers.js';
import { setupQueueHandlers } from './queueHandlers.js';
import { setupChatHandlers } from './chatHandlers.js';

// Track socket -> user mapping
export const socketUserMap = new Map<string, { userId: string; username: string; roomCode: string | null }>();

export function setupSocketIO(io: Server): void {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        username: string;
      };
      (socket as any).userId = decoded.userId;
      (socket as any).username = decoded.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const username = (socket as any).username as string;

    console.log(`🔌 User connected: ${username} (${socket.id})`);

    socketUserMap.set(socket.id, { userId, username, roomCode: null });

    // Set up all event handlers
    setupRoomHandlers(io, socket);
    setupPlayerHandlers(io, socket);
    setupQueueHandlers(io, socket);
    setupChatHandlers(io, socket);

    // Handle disconnect
    socket.on('disconnect', async () => {
      const userData = socketUserMap.get(socket.id);
      if (userData?.roomCode) {
        await handleUserLeftRoom(io, socket, userData.roomCode, userData.userId, userData.username);
      }
      socketUserMap.delete(socket.id);
      console.log(`🔌 User disconnected: ${username} (${socket.id})`);
    });
  });
}
