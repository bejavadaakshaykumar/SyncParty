"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_js_1 = require("../models/User.js");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const rateLimiter_js_1 = require("../middleware/rateLimiter.js");
const router = (0, express_1.Router)();
// POST /api/auth/guest - Create guest user
router.post('/guest', rateLimiter_js_1.authLimiter, (0, validation_js_1.validate)(validation_js_1.guestLoginSchema), async (req, res) => {
    try {
        const { username } = req.body;
        const user = new User_js_1.User({
            username,
            isGuest: true,
        });
        await user.save();
        const token = (0, auth_js_1.generateToken)(user._id.toString(), user.username);
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
    }
    catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ error: 'Failed to create guest user' });
    }
});
// GET /api/auth/me - Get current user
router.get('/me', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const user = await User_js_1.User.findById(req.userId);
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
// PUT /api/auth/profile - Update profile
router.put('/profile', auth_js_1.authMiddleware, async (req, res) => {
    try {
        const { username, avatarUrl } = req.body;
        const update = {};
        if (username)
            update.username = username.trim().slice(0, 30);
        if (avatarUrl)
            update.avatarUrl = avatarUrl;
        const user = await User_js_1.User.findByIdAndUpdate(req.userId, update, { new: true });
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
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map