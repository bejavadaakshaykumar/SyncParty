"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const Playlist_js_1 = require("../models/Playlist.js");
const router = (0, express_1.Router)();
// Middleware to ensure user is authenticated
router.use(auth_js_1.authMiddleware);
const createPlaylistSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(50, 'Name too long'),
});
const addTrackSchema = zod_1.z.object({
    videoId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    thumbnail: zod_1.z.string().min(1),
    channelTitle: zod_1.z.string().min(1),
    duration: zod_1.z.number().min(0),
});
// Get user's playlists
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlist_js_1.Playlist.find({ ownerId: req.userId }).sort({ createdAt: -1 });
        res.json(playlists);
    }
    catch (error) {
        console.error('Fetch playlists error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Create a new playlist
router.post('/', (0, validation_js_1.validate)(createPlaylistSchema), async (req, res) => {
    try {
        const playlist = new Playlist_js_1.Playlist({
            name: req.body.name,
            ownerId: req.userId,
            tracks: [],
        });
        await playlist.save();
        res.status(201).json(playlist);
    }
    catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Add track to playlist
router.post('/:id/tracks', (0, validation_js_1.validate)(addTrackSchema), async (req, res) => {
    try {
        const playlist = await Playlist_js_1.Playlist.findOne({ _id: req.params.id, ownerId: req.userId });
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        playlist.tracks.push(req.body);
        await playlist.save();
        res.json(playlist);
    }
    catch (error) {
        console.error('Add track error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Remove track from playlist
router.delete('/:id/tracks/:trackId', async (req, res) => {
    try {
        const playlist = await Playlist_js_1.Playlist.findOne({ _id: req.params.id, ownerId: req.userId });
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        // Filter track out
        playlist.tracks = playlist.tracks.filter((t) => t._id?.toString() !== req.params.trackId);
        await playlist.save();
        res.json(playlist);
    }
    catch (error) {
        console.error('Remove track error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Delete playlist
router.delete('/:id', async (req, res) => {
    try {
        const playlist = await Playlist_js_1.Playlist.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        res.json({ message: 'Playlist deleted' });
    }
    catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=playlists.js.map