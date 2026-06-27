import { Router } from 'express';
import { User } from '../models/User.js';
import { generateToken, authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { validate, guestLoginSchema } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/guest - Create guest user
router.post('/guest', authLimiter, validate(guestLoginSchema), async (req, res) => {
  try {
    const { username } = req.body;

    const user = new User({
      username,
      isGuest: true,
    });

    await user.save();
    const token = generateToken(user._id.toString(), user.username);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
        isGuest: user.isGuest,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user._id,
      username: user.username,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
      favorites: user.favorites,
      recentlyPlayed: user.recentlyPlayed.slice(-20),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT /api/auth/profile - Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { username, avatarUrl } = req.body;
    const update: Record<string, string> = {};

    if (username) update.username = username.trim().slice(0, 30);
    if (avatarUrl) update.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user._id,
      username: user.username,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
