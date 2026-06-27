import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { Playlist } from '../models/Playlist.js';

const router = Router();

// Middleware to ensure user is authenticated
router.use(authMiddleware as RequestHandler);

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
});

const addTrackSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(1),
  thumbnail: z.string().min(1),
  channelTitle: z.string().min(1),
  duration: z.number().min(0),
});

// Get user's playlists
router.get('/', async (req: any, res) => {
  try {
    const playlists = await Playlist.find({ ownerId: req.userId }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    console.error('Fetch playlists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new playlist
router.post('/', validate(createPlaylistSchema), async (req: any, res) => {
  try {
    const playlist = new Playlist({
      name: req.body.name,
      ownerId: req.userId,
      tracks: [],
    });
    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add track to playlist
router.post('/:id/tracks', validate(addTrackSchema), async (req: any, res: any) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    playlist.tracks.push(req.body);
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Add track error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove track from playlist
router.delete('/:id/tracks/:trackId', async (req: any, res: any) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Filter track out
    playlist.tracks = playlist.tracks.filter((t: any) => t._id?.toString() !== req.params.trackId);
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Remove track error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete playlist
router.delete('/:id', async (req: any, res: any) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
