import type { Server, Socket } from 'socket.io';
import { Room } from '../models/Room.js';
import { socketUserMap } from './index.js';
import { buildSyncState } from '../utils/syncEngine.js';

export function setupRoomHandlers(io: Server, socket: Socket): void {
  const userId = (socket as any).userId as string;
  const username = (socket as any).username as string;

  // Join a room
  socket.on('room:join', async ({ roomCode }: { roomCode: string }) => {
    try {
      const code = roomCode.toUpperCase();
      const room = await Room.findOne({ roomCode: code, isActive: true });

      if (!room) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      // Join Socket.IO room
      socket.join(code);

      // Update socket-user mapping
      const userData = socketUserMap.get(socket.id);
      if (userData) {
        userData.roomCode = code;
      }

      // Update participant status
      const participant = room.participants.find((p) => p.userId.toString() === userId);
      if (participant) {
        participant.isOnline = true;
      } else {
        room.participants.push({
          userId: userId as any,
          username,
          avatarColor: '#8B5CF6',
          joinedAt: new Date(),
          isOnline: true,
        });
      }
      await room.save();

      // Send full room state to joining user
      socket.emit('room:state', {
        roomCode: room.roomCode,
        name: room.name,
        hostId: room.hostId.toString(),
        participants: room.participants,
        currentTrack: room.currentTrack ? buildSyncState(room.currentTrack) : null,
        queue: room.queue,
        history: room.history.slice(-20),
        settings: room.settings,
      });

      // Notify other users
      socket.to(code).emit('room:user-joined', {
        userId,
        username,
        avatarColor: participant?.avatarColor || '#8B5CF6',
      });

      console.log(`👤 ${username} joined room ${code}`);
    } catch (error) {
      console.error('Room join error:', error);
      socket.emit('room:error', { message: 'Failed to join room' });
    }
  });

  // Leave a room
  socket.on('room:leave', async ({ roomCode }: { roomCode: string }) => {
    try {
      const code = roomCode.toUpperCase();
      socket.leave(code);

      const userData = socketUserMap.get(socket.id);
      if (userData) {
        userData.roomCode = null;
      }

      const room = await Room.findOne({ roomCode: code });
      if (room) {
        const participant = room.participants.find((p) => p.userId.toString() === userId);
        if (participant) {
          participant.isOnline = false;
        }
        await room.save();
      }

      socket.to(code).emit('room:user-left', {
        userId,
        username,
      });

      console.log(`👤 ${username} left room ${code}`);
    } catch (error) {
      console.error('Room leave error:', error);
    }
  });

  // Update room settings
  socket.on('room:update-settings', async ({ settings }: { settings: any }) => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.roomCode) return;

      const room = await Room.findOne({ roomCode: userData.roomCode, isActive: true });
      if (!room) return;

      // Only host can update settings
      if (room.hostId.toString() !== userId) {
        socket.emit('room:error', { message: 'Only the host can update room settings' });
        return;
      }

      room.settings = { ...room.settings, ...settings };
      await room.save();

      // Broadcast new settings to room
      io.to(userData.roomCode).emit('room:settings-updated', { settings: room.settings });
    } catch (error) {
      console.error('Update settings error:', error);
    }
  });
}
