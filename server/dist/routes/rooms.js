"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Room_js_1 = require("../models/Room.js");
const Message_js_1 = require("../models/Message.js");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const roomCode_js_1 = require("../utils/roomCode.js");
const router = (0, express_1.Router)();
// POST /api/rooms - Create new room
router.post('/', auth_js_1.authMiddleware, (0, validation_js_1.validate)(validation_js_1.createRoomSchema), async (req, res) => {
    try {
        const { name } = req.body;
        // Check if the user already has an active room as a host
        const existingRoom = await Room_js_1.Room.findOne({ hostId: req.userId, isActive: true });
        if (existingRoom) {
            return res.status(200).json({
                roomCode: existingRoom.roomCode,
                name: existingRoom.name,
                hostId: existingRoom.hostId,
                participants: existingRoom.participants,
                isActive: existingRoom.isActive,
            });
        }
        // Generate unique room code based on username
        const baseCode = (req.username || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 8);
        let roomCode = (baseCode.length >= 3) ? baseCode : (0, roomCode_js_1.createRoomCode)();
        let attempts = 0;
        while (await Room_js_1.Room.findOne({ roomCode }) && attempts < 10) {
            roomCode = (0, roomCode_js_1.createRoomCode)();
            attempts++;
        }
        const room = new Room_js_1.Room({
            roomCode,
            name,
            hostId: req.userId,
            participants: [
                {
                    userId: req.userId,
                    username: req.username,
                    avatarColor: '#8B5CF6',
                    isOnline: true,
                },
            ],
        });
        await room.save();
        res.status(201).json({
            roomCode: room.roomCode,
            name: room.name,
            hostId: room.hostId,
            participants: room.participants,
            isActive: room.isActive,
        });
    }
    catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});
// GET /api/rooms/:roomCode - Get room details
router.get('/:roomCode', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const room = await Room_js_1.Room.findOne({
            roomCode: req.params.roomCode.toUpperCase(),
            isActive: true,
        });
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }
        // Get recent messages
        const messages = await Message_js_1.Message.find({ roomId: room._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({
            roomCode: room.roomCode,
            name: room.name,
            hostId: room.hostId,
            participants: room.participants,
            currentTrack: room.currentTrack,
            queue: room.queue,
            history: room.history.slice(-20),
            settings: room.settings,
            messages: messages.reverse(),
        });
    }
    catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ error: 'Failed to get room' });
    }
});
// POST /api/rooms/:roomCode/join - Join room
router.post('/:roomCode/join', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const room = await Room_js_1.Room.findOne({
            roomCode: req.params.roomCode.toUpperCase(),
            isActive: true,
        });
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }
        // Check if user is already a participant
        const existingParticipant = room.participants.find((p) => p.userId.toString() === req.userId);
        if (existingParticipant) {
            existingParticipant.isOnline = true;
        }
        else {
            room.participants.push({
                userId: req.userId,
                username: req.username || 'Guest',
                avatarColor: '#8B5CF6',
                joinedAt: new Date(),
                isOnline: true,
            });
        }
        await room.save();
        res.json({
            roomCode: room.roomCode,
            name: room.name,
            hostId: room.hostId,
            joined: true,
        });
    }
    catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});
// DELETE /api/rooms/:roomCode - Delete room (host only)
router.delete('/:roomCode', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const room = await Room_js_1.Room.findOne({
            roomCode: req.params.roomCode.toUpperCase(),
        });
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }
        if (room.hostId.toString() !== req.userId) {
            res.status(403).json({ error: 'Only the host can delete the room' });
            return;
        }
        room.isActive = false;
        await room.save();
        res.json({ deleted: true });
    }
    catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});
exports.default = router;
//# sourceMappingURL=rooms.js.map