import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { Playlist } from '../models/Playlist.js';

const router = Router();

const createPlaylistSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  }),
});

const addTrackSchema = z.object({
  body: z.object({
    videoId: z.string().min(1),
    title: z.string().min(1),
    thumbnail: z.string().min(1),
    channelTitle: z.string().min(1),
    duration: z.number().min(0),
  }),
});

// Get user's playlists
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const playlists = await Playlist.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    console.error('Fetch playlists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new playlist
router.post('/', requireAuth, validateRequest(createPlaylistSchema), async (req: any, res) => {
  try {
    const playlist = new Playlist({
      name: req.body.name,
      ownerId: req.user.id,
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
router.post('/:id/tracks', requireAuth, validateRequest(addTrackSchema), async (req: any, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, ownerId: req.user.id });
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
router.delete('/:id/tracks/:trackId', requireAuth, async (req: any, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Pull track by its specific _id in the tracks array
    playlist.tracks.pull({ _id: req.params.trackId });
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Remove track error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete playlist
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
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
