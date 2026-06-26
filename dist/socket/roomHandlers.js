"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUserLeftRoom = handleUserLeftRoom;
exports.setupRoomHandlers = setupRoomHandlers;
const Room_js_1 = require("../models/Room.js");
const index_js_1 = require("./index.js");
const syncEngine_js_1 = require("../utils/syncEngine.js");
async function handleUserLeftRoom(io, socket, roomCode, userId, username) {
    try {
        const code = roomCode.toUpperCase();
        socket.leave(code);
        const userData = index_js_1.socketUserMap.get(socket.id);
        if (userData) {
            userData.roomCode = null;
        }
        const room = await Room_js_1.Room.findOne({ roomCode: code, isActive: true });
        if (room) {
            const participant = room.participants.find((p) => p.userId.toString() === userId);
            if (participant) {
                participant.isOnline = false;
            }
            // HOST MIGRATION LOGIC
            if (room.hostId.toString() === userId) {
                const nextHost = room.participants.find((p) => p.isOnline && p.userId.toString() !== userId);
                if (nextHost) {
                    room.hostId = nextHost.userId;
                    console.log(`👑 Host migrated to ${nextHost.username} in room ${code}`);
                    io.to(code).emit('room:host-migrated', { newHostId: nextHost.userId.toString() });
                }
            }
            await room.save();
        }
        socket.to(code).emit('room:user-left', {
            userId,
            username,
        });
        console.log(`👤 ${username} left room ${code}`);
    }
    catch (error) {
        console.error('Room leave error:', error);
    }
}
function setupRoomHandlers(io, socket) {
    const userId = socket.userId;
    const username = socket.username;
    // Join a room
    socket.on('room:join', async ({ roomCode }) => {
        try {
            const code = roomCode.toUpperCase();
            const room = await Room_js_1.Room.findOne({ roomCode: code, isActive: true });
            if (!room) {
                socket.emit('room:error', { message: 'Room not found' });
                return;
            }
            // Join Socket.IO room
            socket.join(code);
            // Update socket-user mapping
            const userData = index_js_1.socketUserMap.get(socket.id);
            if (userData) {
                userData.roomCode = code;
            }
            // Update participant status
            const participant = room.participants.find((p) => p.userId.toString() === userId);
            if (participant) {
                participant.isOnline = true;
            }
            else {
                room.participants.push({
                    userId: userId,
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
                currentTrack: room.currentTrack ? (0, syncEngine_js_1.buildSyncState)(room.currentTrack) : null,
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
        }
        catch (error) {
            console.error('Room join error:', error);
            socket.emit('room:error', { message: 'Failed to join room' });
        }
    });
    // Leave a room
    socket.on('room:leave', async ({ roomCode }) => {
        await handleUserLeftRoom(io, socket, roomCode, userId, username);
    });
    // Update room settings
    socket.on('room:update-settings', async ({ settings }) => {
        try {
            const userData = index_js_1.socketUserMap.get(socket.id);
            if (!userData?.roomCode)
                return;
            const room = await Room_js_1.Room.findOne({ roomCode: userData.roomCode, isActive: true });
            if (!room)
                return;
            // Only host can update settings
            if (room.hostId.toString() !== userId) {
                socket.emit('room:error', { message: 'Only the host can update room settings' });
                return;
            }
            room.settings = { ...room.settings, ...settings };
            await room.save();
            // Broadcast new settings to room
            io.to(userData.roomCode).emit('room:settings-updated', { settings: room.settings });
        }
        catch (error) {
            console.error('Update settings error:', error);
        }
    });
}
//# sourceMappingURL=roomHandlers.js.map