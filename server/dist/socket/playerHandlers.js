"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPlayerHandlers = setupPlayerHandlers;
const Room_js_1 = require("../models/Room.js");
const index_js_1 = require("./index.js");
const syncEngine_js_1 = require("../utils/syncEngine.js");
// Store heartbeat intervals per room
const roomHeartbeats = new Map();
function startHeartbeat(io, roomCode) {
    // Clear existing heartbeat if any
    stopHeartbeat(roomCode);
    const interval = setInterval(async () => {
        try {
            const room = await Room_js_1.Room.findOne({ roomCode, isActive: true });
            if (!room || !room.currentTrack?.isPlaying) {
                return;
            }
            const syncState = (0, syncEngine_js_1.buildSyncState)(room.currentTrack);
            io.to(roomCode).emit('player:heartbeat', syncState);
        }
        catch (error) {
            console.error('Heartbeat error:', error);
        }
    }, 2000); // Every 2 seconds
    roomHeartbeats.set(roomCode, interval);
}
function stopHeartbeat(roomCode) {
    const interval = roomHeartbeats.get(roomCode);
    if (interval) {
        clearInterval(interval);
        roomHeartbeats.delete(roomCode);
    }
}
function setupPlayerHandlers(io, socket) {
    const userId = socket.userId;
    // Play a track
    socket.on('player:play', async ({ videoId, time, title, thumbnail, channelTitle, duration }) => {
        try {
            const userData = index_js_1.socketUserMap.get(socket.id);
            if (!userData?.roomCode)
                return;
            const room = await Room_js_1.Room.findOne({ roomCode: userData.roomCode, isActive: true });
            if (!room)
                return;
            // Only host or allowed guests can control playback
            if (room.hostId.toString() !== userId && !room.settings?.allowGuestControl) {
                socket.emit('player:error', { message: 'Only the host can control playback' });
                return;
            }
            // If resuming current track
            if (room.currentTrack && room.currentTrack.videoId === videoId && !room.currentTrack.isPlaying) {
                const resumeAt = room.currentTrack.pausedAt || 0;
                room.currentTrack.isPlaying = true;
                room.currentTrack.startedAt = Date.now() - resumeAt * 1000;
                room.currentTrack.pausedAt = undefined;
            }
            else {
                // Playing a new track
                room.currentTrack = {
                    videoId,
                    title: title || `Video ${videoId}`,
                    thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                    channelTitle: channelTitle || 'Unknown',
                    duration: duration || 0,
                    startedAt: Date.now() - (time || 0) * 1000,
                    isPlaying: true,
                };
                // Add to history
                room.history.push({
                    videoId,
                    title: title || `Video ${videoId}`,
                    thumbnail: thumbnail || '',
                    channelTitle: channelTitle || 'Unknown',
                    playedAt: new Date(),
                });
                // Keep history to last 50
                if (room.history.length > 50) {
                    room.history = room.history.slice(-50);
                }
            }
            await room.save();
            const syncState = (0, syncEngine_js_1.buildSyncState)(room.currentTrack);
            io.to(userData.roomCode).emit('player:sync', syncState);
            startHeartbeat(io, userData.roomCode);
        }
        catch (error) {
            console.error('Player play error:', error);
        }
    });
    // Pause playback
    socket.on('player:pause', async ({ time }) => {
        try {
            const userData = index_js_1.socketUserMap.get(socket.id);
            if (!userData?.roomCode)
                return;
            const room = await Room_js_1.Room.findOne({ roomCode: userData.roomCode, isActive: true });
            if (!room || !room.currentTrack)
                return;
            if (room.hostId.toString() !== userId && !room.settings?.allowGuestControl) {
                socket.emit('player:error', { message: 'Only the host can control playback' });
                return;
            }
            room.currentTrack.isPlaying = false;
            room.currentTrack.pausedAt = time;
            await room.save();
            io.to(userData.roomCode).emit('player:sync', (0, syncEngine_js_1.buildSyncState)(room.currentTrack));
            stopHeartbeat(userData.roomCode);
        }
        catch (error) {
            console.error('Player pause error:', error);
        }
    });
    // Seek to time
    socket.on('player:seek', async ({ time }) => {
        try {
            const userData = index_js_1.socketUserMap.get(socket.id);
            if (!userData?.roomCode)
                return;
            const room = await Room_js_1.Room.findOne({ roomCode: userData.roomCode, isActive: true });
            if (!room || !room.currentTrack)
                return;
            if (room.hostId.toString() !== userId && !room.settings?.allowGuestControl) {
                socket.emit('player:error', { message: 'Only the host can control playback' });
                return;
            }
            if (room.currentTrack.isPlaying) {
                room.currentTrack.startedAt = Date.now() - time * 1000;
            }
            else {
                room.currentTrack.pausedAt = time;
            }
            await room.save();
            io.to(userData.roomCode).emit('player:sync', (0, syncEngine_js_1.buildSyncState)(room.currentTrack));
        }
        catch (error) {
            console.error('Player seek error:', error);
        }
    });
    // Track ended - play next in queue
    socket.on('player:ended', async () => {
        try {
            const userData = index_js_1.socketUserMap.get(socket.id);
            if (!userData?.roomCode)
                return;
            const room = await Room_js_1.Room.findOne({ roomCode: userData.roomCode, isActive: true });
            if (!room)
                return;
            // Process if host or guest control is allowed
            if (room.hostId.toString() !== userId && !room.settings?.allowGuestControl)
                return;
            if (room.queue.length > 0) {
                // Play next track
                const nextTrack = room.queue.shift();
                room.currentTrack = {
                    videoId: nextTrack.videoId,
                    title: nextTrack.title,
                    thumbnail: nextTrack.thumbnail,
                    channelTitle: nextTrack.channelTitle,
                    duration: nextTrack.duration,
                    startedAt: Date.now(),
                    isPlaying: true,
                };
                room.history.push({
                    videoId: nextTrack.videoId,
                    title: nextTrack.title,
                    thumbnail: nextTrack.thumbnail,
                    channelTitle: nextTrack.channelTitle,
                    playedAt: new Date(),
                });
                await room.save();
                io.to(userData.roomCode).emit('player:sync', (0, syncEngine_js_1.buildSyncState)(room.currentTrack));
                io.to(userData.roomCode).emit('queue:update', { queue: room.queue });
                startHeartbeat(io, userData.roomCode);
            }
            else {
                // No more tracks
                room.currentTrack = null;
                await room.save();
                io.to(userData.roomCode).emit('player:sync', { videoId: null, time: 0, isPlaying: false });
                stopHeartbeat(userData.roomCode);
            }
        }
        catch (error) {
            console.error('Player ended error:', error);
        }
    });
}
//# sourceMappingURL=playerHandlers.js.map