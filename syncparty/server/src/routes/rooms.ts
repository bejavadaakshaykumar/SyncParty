import { Router } from 'express';
import { Room } from '../models/Room.js';
import { Message } from '../models/Message.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { validate, createRoomSchema } from '../middleware/validation.js';
import { createRoomCode } from '../utils/roomCode.js';

const router = Router();

// POST /api/rooms - Create new room
router.post('/', authMiddleware, validate(createRoomSchema), async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    // Generate unique room code
    let roomCode = createRoomCode();
    let attempts = 0;
    while (await Room.findOne({ roomCode }) && attempts < 10) {
      roomCode = createRoomCode();
      attempts++;
    }

    const room = new Room({
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
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/rooms/:roomCode - Get room details
router.get('/:roomCode', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const room = await Room.findOne({
      roomCode: (req.params.roomCode as string).toUpperCase(),
      isActive: true,
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Get recent messages
    const messages = await Message.find({ roomId: room._id })
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
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// POST /api/rooms/:roomCode/join - Join room
router.post('/:roomCode/join', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const room = await Room.findOne({
      roomCode: (req.params.roomCode as string).toUpperCase(),
      isActive: true,
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Check if user is already a participant
    const existingParticipant = room.participants.find(
      (p) => p.userId.toString() === req.userId
    );

    if (existingParticipant) {
      existingParticipant.isOnline = true;
    } else {
      room.participants.push({
        userId: req.userId as any,
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
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// DELETE /api/rooms/:roomCode - Delete room (host only)
router.delete('/:roomCode', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const room = await Room.findOne({
      roomCode: (req.params.roomCode as string).toUpperCase(),
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
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
