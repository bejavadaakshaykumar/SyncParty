import type { Server, Socket } from 'socket.io';
import { Room } from '../models/Room.js';
import { socketUserMap } from './index.js';

export function setupQueueHandlers(io: Server, socket: Socket): void {
  const userId = (socket as any).userId as string;
  const username = (socket as any).username as string;

  // Add track to queue
  socket.on('queue:add', async ({ track }: { track: any }) => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.roomCode) return;

      const room = await Room.findOne({ roomCode: userData.roomCode, isActive: true });
      if (!room) return;

      if (room.queue.length >= room.settings.maxQueueSize) {
        socket.emit('queue:error', { message: 'Queue is full' });
        return;
      }

      room.queue.push({
        videoId: track.videoId,
        title: track.title,
        thumbnail: track.thumbnail,
        channelTitle: track.channelTitle,
        duration: track.duration,
        addedBy: userId as any,
        addedByUsername: username,
        votes: 0,
        skipVotes: [],
      });

      await room.save();

      io.to(userData.roomCode).emit('queue:update', { queue: room.queue });

      // If nothing is playing, auto-play the first track
      if (!room.currentTrack && room.queue.length === 1) {
        const firstTrack = room.queue.shift()!;
        room.currentTrack = {
          videoId: firstTrack.videoId,
          title: firstTrack.title,
          thumbnail: firstTrack.thumbnail,
          channelTitle: firstTrack.channelTitle,
          duration: firstTrack.duration,
          startedAt: Date.now(),
          isPlaying: true,
        };

        room.history.push({
          videoId: firstTrack.videoId,
          title: firstTrack.title,
          thumbnail: firstTrack.thumbnail,
          channelTitle: firstTrack.channelTitle,
          playedAt: new Date(),
        });

        await room.save();

        const { buildSyncState } = await import('../utils/syncEngine.js');
        io.to(userData.roomCode).emit('player:sync', buildSyncState(room.currentTrack));
        io.to(userData.roomCode).emit('queue:update', { queue: room.queue });
      }
    } catch (error) {
      console.error('Queue add error:', error);
    }
  });

  // Remove track from queue
  socket.on('queue:remove', async ({ index }: { index: number }) => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.roomCode) return;

      const room = await Room.findOne({ roomCode: userData.roomCode, isActive: true });
      if (!room) return;

      // Only host or the person who added can remove
      const track = room.queue[index];
      if (!track) return;

      if (room.hostId.toString() !== userId && track.addedBy.toString() !== userId) {
        socket.emit('queue:error', { message: 'Permission denied' });
        return;
      }

      room.queue.splice(index, 1);
      await room.save();

      io.to(userData.roomCode).emit('queue:update', { queue: room.queue });
    } catch (error) {
      console.error('Queue remove error:', error);
    }
  });

  // Reorder queue (drag-and-drop)
  socket.on('queue:reorder', async ({ from, to }: { from: number; to: number }) => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.roomCode) return;

      const room = await Room.findOne({ roomCode: userData.roomCode, isActive: true });
      if (!room) return;

      // Only host can reorder
      if (room.hostId.toString() !== userId) {
        socket.emit('queue:error', { message: 'Only the host can reorder the queue' });
        return;
      }

      if (from < 0 || from >= room.queue.length || to < 0 || to >= room.queue.length) return;

      const [item] = room.queue.splice(from, 1);
      room.queue.splice(to, 0, item);
      await room.save();

      io.to(userData.roomCode).emit('queue:update', { queue: room.queue });
    } catch (error) {
      console.error('Queue reorder error:', error);
    }
  });

  // Vote to skip current track
  socket.on('queue:skip-vote', async () => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.roomCode) return;

      const room = await Room.findOne({ roomCode: userData.roomCode, isActive: true });
      if (!room || !room.currentTrack) return;

      // Host can skip immediately
      if (room.hostId.toString() === userId) {
        socket.emit('player:ended');
        return;
      }

      // Find current queue item to track votes (using a temp mechanism)
      const onlineCount = room.participants.filter((p) => p.isOnline).length;
      const threshold = Math.ceil(onlineCount * room.settings.voteToSkipThreshold);

      // Emit skip vote notification
      io.to(userData.roomCode).emit('queue:skip-vote-update', {
        userId,
        username,
        threshold,
        onlineCount,
      });
    } catch (error) {
      console.error('Skip vote error:', error);
    }
  });
}
